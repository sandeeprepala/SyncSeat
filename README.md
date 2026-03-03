## SyncSeat — Backend Architecture

A concise overview of the backend architecture, how we handle concurrency with Redis locks and async queues, and a short note about the frontend's Context API usage.

---

**Overview**

- **Purpose:** microservice-style backend serving a ticket booking platform: API gateway, booking service, homepage/media service, and mail service.
- **Queues & Workers:** asynchronous job processing via BullMQ + Redis (Upstash in production).
- **Locking:** ephemeral Redis locks to coordinate seat reservation (prevent double-booking) with a 10-minute TTL (600 seconds).

---

**High-level Components**

- **API Gateway (`api-gateway`)**: routes requests to microservices and centralizes auth.
- **Booking Service (`booking`)**: handles seat reservations and booking flow; creates locks in Redis and pushes jobs to the booking queue.
- **Lock Cleanup Worker (`booking/worker/lockCleanupWorker.js`)**: periodically releases expired locks and reconciles DB state.
- **Mail Service (`mail`)**: processes `mailQueue` jobs to send booking confirmation emails asynchronously.
- **Homepage (`homepage`)**: handles media/uploads and public pages.

---

**Async Queues & Workers**

- We use `bullmq` for queueing jobs. Workers run independently and consume queues like `bookingQueue` and `mailQueue`.
- Job flow example (booking):
  1. Request to book → API enqueues a `booking` job with `{ showId, seatIds, userId }`.
  2. `bookingWorker` runs: verifies DB state, creates Redis locks, updates DB to `LOCKED`, and returns.
  3. `mailWorker` sends confirmation email as separate job after booking completes.

**Advantages:**

- Separates synchronous API responsiveness from longer-running tasks.
- Retries, delayed jobs and concurrency configuration are managed by BullMQ.

---

**Redis Locking & Concurrency Control**

- Strategy: optimistic DB check + Redis locks.

- Steps taken for each seat during booking:
  1. Read DB: confirm each seat status is `AVAILABLE`.
  2. Check Redis: look up `lock:${showId}:${seatId}`. If present, abort — another process has the lock.
  3. Create Redis lock keys (e.g. `lock:123:456`) with `EX 600` (10 minutes) to reserve the seat.
  4. Update DB row to `LOCKED` and set `locked_until` to now + 10 minutes.

- Why both Redis and DB?

- Redis locks are lightweight and fast for cross-process coordination (workers, multiple web instances).
- The DB update enforces durable state so that the canonical seat state remains authoritative.

- Lock TTL (10 minutes):

- Chosen to allow users enough time to complete checkout while bounding reserved seats.
- A cleanup worker (`lockCleanupWorker`) scans `show_seats` for `LOCKED` rows where `locked_until < now` and releases them.

---

**Keeping Workers Alive on Free Hosts (Render/Free Hosting)**

- Free hosting plans often idle apps with low external traffic. A simple keep-alive helper was added at `Backend/utils/keepAlive.js`.
- Configure an environment variable:

```
KEEP_ALIVE_URL=https://your-app.onrender.com
KEEP_ALIVE_INTERVAL_MS=300000   # 5 minutes (optional)
ENABLE_KEEP_ALIVE=true
```

- The helper will periodically ping the configured URL so the host receives inbound traffic and stays active.

---

**Environment Variables (important ones)**

- `UPSTASH_REDIS_URL` — Redis URL used by BullMQ and locks.
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — DB access for workers.
- `KEEP_ALIVE_URL` — URL to ping to prevent idling.
- `KEEP_ALIVE_INTERVAL_MS` — override default ping interval.

---

**Running Locally**

Start a worker (example from `booking`):

```bash
cd Backend/booking/worker
node bookingWorker.js
```

Start lock cleanup worker:

```bash
node lockCleanupWorker.js
```

Start mail worker:

```bash
cd Backend/mail/worker
node mailWorker.js
```

Set env vars locally (example):

```bash
export UPSTASH_REDIS_URL="redis://..."
export SUPABASE_URL="https://..."
export SUPABASE_SERVICE_ROLE_KEY="..."
export KEEP_ALIVE_URL="http://localhost:5173"   # or your deployed app
```

---

**Frontend: Context API**

- The frontend uses React `Context API` (see `Frontend/src/context/AuthContext.jsx`) to hold auth state (user object, login, logout, token management).
- `useAuth()` is consumed by components like the navbar and `Home.jsx` to gate navigation and show user metadata.

---

**Operational Notes & Tips**

- Keep Redis and Supabase credentials secure. Use service role keys only in server-side workers.
- Ensure `locked_until` and Redis TTLs stay in sync (both currently 600s). If you change one, change the other.
- For render: you may want to place a health endpoint (`/health`) on the API gateway and set `KEEP_ALIVE_URL` to that endpoint.

---

If you want, I can:

- add a short ASCII architecture diagram to this README,
- add a `docker-compose` example for local Redis + worker testing,
- add a `health` route to the API gateway and link `KEEP_ALIVE_URL` to it.
