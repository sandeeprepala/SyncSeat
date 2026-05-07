# SyncSeat Interview Notes

## Project introduction

SyncSeat is a movie ticket booking system built with a microservice-style backend and a React frontend. The backend is split into an API gateway, a booking service, a mail service, and supporting services for homepage/media. The system uses Supabase/PostgreSQL for persistent seat and user data, Redis/Upstash for distributed queueing and seat locks, and BullMQ for asynchronous job processing.

---

## 1) Architecture of the project

- `Frontend/`: React + Vite client. It calls the API gateway and authenticates with JWT stored in cookies.
- `Backend/api-gateway/`: central gateway that routes requests to backend services, verifies JWT, and adds retry/backoff logic.
- `Backend/booking/`: booking service that accepts lock requests, confirms bookings, and coordinates with Redis and Supabase.
- `Backend/mail/`: mail service that receives requests to send confirmation emails and processes them asynchronously with a worker.
- Persistence:
  - Supabase/PostgreSQL stores users, shows, seats, tickets, mail logs.
  - Redis/Upstash stores BullMQ queue state and seat lock state.

Key files:
- `Backend/api-gateway/index.js`
- `Backend/booking/controllers/bookingController.js`
- `Backend/booking/worker/bookingWorker.js`
- `Backend/mail/worker/mailWorker.js`

---

## 2) Clear flow of the backend

1. User selects seats and submits a booking request.
2. Frontend sends the request to API gateway `/booking/lock-seat`.
3. API gateway forwards it to the booking service and attaches the authenticated `userId`.
4. Booking service adds a job to `bookingQueue` for seat locking.
5. `bookingWorker` processes the queue:
   - reads seat status from Supabase,
   - verifies there is no existing Redis lock,
   - sets Redis locks,
   - updates seats to `LOCKED` with `locked_until`.
6. Frontend can poll `/booking/check-lock` to confirm lock state.
7. After payment, frontend calls `/booking/confirm`.
8. Booking service verifies the Redis lock owner, updates seats to `BOOKED`, deletes the Redis locks, and requests the mail service.
9. Mail service enqueues a `mailQueue` job and its worker sends the email and logs it.

---

## 3) What happens if two users try booking the same seat simultaneously?

The system avoids double-booking with both DB and Redis checks.

- `bookingWorker` first verifies the seat row in Supabase is `AVAILABLE`.
- It then checks Redis for a lock key like `lock:${showId}:${seatId}`.
- If a lock exists or the row is not `AVAILABLE`, the job aborts.
- The first worker job to complete the lock step wins.

This makes seat allocation essentially first-come, first-served.

---

## 4) What is FCFS seat allocation and how did you implement it?

FCFS means First-Come, First-Served.

Implementation:
- Booking requests are enqueued in a BullMQ queue (`Backend/booking/queue/bookingQueue.js`).
- The worker processes jobs in FIFO order.
- Each job checks seat availability and lock state before reserving.
- The first successful job gets the seat; later requests see the seat already locked/booked.

In effect, the system processes seat requests in arrival order and locks the first valid request.

---

## 5) What happens if a service crashes after locking a seat?

For Redis locks:
- lock keys are set with `EX 600` (10 minutes), so they expire automatically.

For the DB:
- the seat row is updated to `LOCKED` with `locked_until` set.
- there is currently a missing cleanup watcher in the code, so a crash can leave stale `LOCKED` rows.

If the service crashes before completing the DB update, the current 2PC-style rollback attempts to delete created Redis locks on retry. If it crashes after the DB update, then the seat may remain locked until the timeout or a cleanup job releases it.

---

## 6) Did you use transactions in PostgreSQL?

No. There is no explicit PostgreSQL transaction block in the current implementation.

The booking flow relies on:
- conditional Supabase updates (`eq("status", "AVAILABLE")`),
- Redis lock creation,
- application-level rollback logic.

It is a strong consistency pattern, but not a true database transaction spanning Redis and PostgreSQL.

---

## 7) What happens if payment succeeds but ticket creation fails?

In the current flow, payment is assumed to happen before `/booking/confirm`.

If `confirmBooking()` succeeds in booking seats but the mail service call or email enqueue fails:
- seats remain booked,
- the user may not receive a confirmation email,
- there is no automatic rollback of seat booking.

This means the system is resilient enough to keep the booking, but it does not recover automatically from email failures.

---

## 8) What are the bottlenecks in your architecture?

Main bottlenecks:
- **API gateway** is a single entry point and can become a choke point.
- **Single booking worker** capacity limits booking throughput.
- **Redis** handles both lock state and BullMQ queue state, creating concentration risk.
- **Supabase/PostgreSQL** can become a contention point for seat status checks and updates.
- **No real distributed transaction** between Redis and DB, so failure recovery depends on application logic.
- **Absent cleanup** for stale locked seats increases risk of false contention.

---

## 9) How would you scale the booking service?

To scale booking:
- run multiple booking service instances behind load balancers.
- run multiple `bookingWorker` consumers for `bookingQueue`.
- use Redis clustering or managed Redis for resilience.
- partition requests by show or screen to reduce contention.
- cache read-only seat maps in Redis for faster availability checks.
- add rate limiting at the gateway to protect workers under flash traffic.
- implement a lock cleanup job that clears expired locks and stale DB state.

---

## 10) How did services communicate with each other?

Communication is mostly HTTP plus asynchronous queueing.

- Frontend → API gateway: HTTP requests.
- API gateway → booking service: HTTP proxying with `axios`.
- Booking service → mail service: HTTP request to `/mail/ticket`.
- Booking service and mail service also use BullMQ queues for async processing.
- Supabase is shared by services for persistent data.

---

## 11) Why did you use asynchronous processing for emails?

Email sending is slow and may fail due to external SMTP or network issues.

So the system:
- enqueues a mail job quickly,
- returns booking confirmation faster,
- avoids blocking the booking flow on email delivery,
- enables retries and failure handling in a dedicated worker.

This keeps the booking path responsive while still ensuring confirmation emails are sent.

---

## 12) What queue mechanism did you use?

The project uses `bullmq` with Redis as the backend.

Queues:
- `bookingQueue` in `Backend/booking/queue/bookingQueue.js`
- `mailQueue` in `Backend/mail/queue/mailQueue.js`

Workers:
- `Backend/booking/worker/bookingWorker.js`
- `Backend/mail/worker/mailWorker.js`

---

## 13) How would you implement seat timeout/temporary reservation?

Current design:
- Redis locks use a 10-minute TTL,
- DB rows set `locked_until` to 10 minutes later.

A complete implementation should add a cleanup process that:
- finds `show_seats` where `status = LOCKED` and `locked_until < now`,
- sets those rows back to `AVAILABLE`,
- removes stale Redis lock keys if still present.

This would enforce a temporary hold and automatically release seats after expiration.

---

## 14) Why did you choose Redis for locking?

Redis is ideal for distributed locking because it is:
- fast,
- shared across multiple processes,
- easy to set TTLs on keys,
- lightweight compared to DB locks.

The project uses string keys like `lock:${showId}:${seatId}` and stores the `userId` as the value.

---

## 15) How did you ensure database consistency?

Consistency is enforced by:
- checking the DB seat state before locking,
- using conditional updates (`status = AVAILABLE`),
- storing lock state in Redis and DB together,
- rolling back on partial failures.

This is not a fully ACID distributed transaction, but the code uses an application-level consistency protocol to avoid double-booking.

---

## 16) How would you handle flash traffic during big movie releases?

To handle flash traffic:
- add rate limiting at the API gateway,
- horizontally scale booking service and workers,
- use Redis-backed request throttling or token bucket limits,
- partition by show or screen to reduce lock contention,
- add caching for static seat maps,
- rely on queue-based backpressure instead of direct synchronous writes,
- monitor Redis and DB load and use managed autoscaling where possible.

---

## Notes for interview discussion

- This system is designed around a central gateway and service separation.
- The booking logic uses a Redis + Supabase locking pattern to avoid double-booking.
- Mail delivery is asynchronous to keep booking fast.
- The current code is stronger than a naive implementation, but it can still be improved with true distributed transactions and cleanup jobs.
