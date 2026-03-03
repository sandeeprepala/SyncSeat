
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_AUTH_SERVICE,
  withCredentials: true,
});

const COUNTDOWN_SECONDS = 600; // 10 minutes

export default function ConfirmBooking() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const { showId, seatIds, selectedSeats, totalPrice } = state || {};

  const [timeLeft, setTimeLeft] = useState(COUNTDOWN_SECONDS);
  const [lockStatus, setLockStatus] = useState(null); // null | "checking" | "locked" | "available"
  const [booking, setBooking] = useState("idle"); // "idle" | "loading" | "success" | "error"
  const timerRef = useRef(null);

  // ── Check lock on mount ──
  useEffect(() => {
    if (!showId || !seatIds?.length) {
      navigate(-1);
      return;
    }
    checkLock();
  }, []);

  // ── Countdown ──
  useEffect(() => {
    if (lockStatus !== "available") return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          navigate(-1); // expired → back to seats
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [lockStatus]);

  const checkLock = async () => {
    setLockStatus("checking");
    try {
      const res = await API.post("/booking/check-lock", { showId, seatIds });
      if (res.data.locked === true) {
        // Someone else has it — go back
        setLockStatus("locked");
        setTimeout(() => navigate(-1), 2000);
      } else {
        setLockStatus("available");
      }
    } catch (err) {
      console.error("Lock check failed:", err);
      setLockStatus("locked");
      setTimeout(() => navigate(-1), 2000);
    }
  };

  const confirmBooking = async () => {
    setBooking("loading");
    try {
      await API.post("/booking/confirm", { showId, seatIds });
      clearInterval(timerRef.current);
      setBooking("success");
      setTimeout(() => navigate("/"), 3000);
    } catch (err) {
      console.error("Booking failed:", err);
      setBooking("error");
    }
  };

  const formatTime = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const urgency = timeLeft <= 60;

  // ── CHECKING STATE ──
  if (lockStatus === "checking" || lockStatus === null) {
    return (
      <div className="cb-root">
        <div className="cb-blob cb-blob-1" />
        <div className="cb-blob cb-blob-2" />
        <div className="cb-center">
          <div className="cb-spinner" />
          <p className="cb-checking-text">Verifying your seats…</p>
        </div>
        <CbStyle />
      </div>
    );
  }

  // ── LOCKED STATE ──
  if (lockStatus === "locked") {
    return (
      <div className="cb-root">
        <div className="cb-blob cb-blob-1" />
        <div className="cb-blob cb-blob-2" />
        <div className="cb-center">
          <div className="cb-icon cb-icon-warn">⚠️</div>
          <h2 className="cb-locked-title">Seats Just Taken</h2>
          <p className="cb-locked-sub">
            Someone else grabbed these seats. Taking you back to choose different ones…
          </p>
          <div className="cb-spinner cb-spinner-sm" />
        </div>
        <CbStyle />
      </div>
    );
  }

  // ── SUCCESS STATE ──
  if (booking === "success") {
    return (
      <div className="cb-root">
        <div className="cb-blob cb-blob-1" />
        <div className="cb-blob cb-blob-2" />
        <div className="cb-center">
          <div className="cb-success-ring">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="cb-success-title">Booking Confirmed!</h2>
          <p className="cb-success-sub">
            Your seats{" "}
            {selectedSeats?.map((s) => `${s.row}${s.number}`).join(", ")}{" "}
            are booked. Enjoy the show! 🎬
          </p>
          <p className="cb-redirect-note">Redirecting to home…</p>
        </div>
        <CbStyle />
      </div>
    );
  }

  // ── MAIN CONFIRM PAGE ──
  return (
    <div className="cb-root">
      <div className="cb-blob cb-blob-1" />
      <div className="cb-blob cb-blob-2" />

      {/* Header */}
      <header className="cb-header">
        <button className="cb-back-btn" onClick={() => navigate(-1)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back
        </button>
        <span className="cb-logo">Sync<span>Seat</span></span>

        {/* Countdown */}
        <div className={`cb-timer ${urgency ? "cb-timer-urgent" : ""}`}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
          </svg>
          <span>{formatTime(timeLeft)}</span>
        </div>
      </header>

      {/* Content */}
      <div className="cb-content">
        <div className="cb-card">

          {/* Top badge */}
          <div className="cb-badge">
            <span className="cb-badge-dot" />
            <span>Seats held for {formatTime(timeLeft)}</span>
          </div>

          <h1 className="cb-title">Confirm Your<br /><span className="cb-accent">Booking.</span></h1>

          {/* Seats summary */}
          <div className="cb-section">
            <p className="cb-section-label">Selected Seats</p>
            <div className="cb-seats-grid">
              {selectedSeats?.map((s) => (
                <div key={s.seat_id} className="cb-seat-chip">
                  <span className="cb-chip-row">{s.row}</span>
                  <span className="cb-chip-num">{s.number}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="cb-divider" />

          {/* Price breakdown */}
          <div className="cb-section">
            <p className="cb-section-label">Price Breakdown</p>
            <div className="cb-price-rows">
              <div className="cb-price-row">
                <span>{selectedSeats?.length} × seat{selectedSeats?.length > 1 ? "s" : ""}</span>
                <span>₹{totalPrice}</span>
              </div>
              <div className="cb-price-row cb-price-row-fees">
                <span>Convenience fee</span>
                <span>₹{selectedSeats?.length * 20}</span>
              </div>
            </div>
            <div className="cb-price-total">
              <span>Total</span>
              <span className="cb-total-amount">₹{totalPrice + selectedSeats?.length * 20}</span>
            </div>
          </div>

          <div className="cb-divider" />

          {/* Confirm button */}
          {booking === "error" && (
            <p className="cb-error-msg">Something went wrong. Please try again.</p>
          )}

          <button
            className="cb-confirm-btn"
            onClick={confirmBooking}
            disabled={booking === "loading"}
          >
            {booking === "loading" ? (
              <span className="cb-btn-spinner" />
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" />
                  <path d="M12 6v6l4 2" />
                </svg>
                Pay & Confirm Booking
              </>
            )}
          </button>

          <p className="cb-secure-note">🔒 Secured payment · Instant confirmation</p>
        </div>
      </div>

      <CbStyle />
    </div>
  );
}

function CbStyle() {
  return (
    <style>{`
      

      .cb-root {
        font-family: 'Segoe UI', system-ui, sans-serif;
        min-height: 100vh;
        background: linear-gradient(160deg, #fff 0%, #fff5f5 60%, #fef2f2 100%);
        color: #111;
        overflow-x: hidden;
        position: relative;
      }

      /* BLOBS */
      .cb-blob { position: fixed; border-radius: 50%; filter: blur(90px); pointer-events: none; z-index: 0; }
      .cb-blob-1 {
        width: 480px; height: 480px;
        background: radial-gradient(circle, #fca5a522, transparent 70%);
        top: -120px; right: -100px;
        animation: cb-drift 12s ease-in-out infinite alternate;
      }
      .cb-blob-2 {
        width: 320px; height: 320px;
        background: radial-gradient(circle, #fecaca33, transparent 70%);
        bottom: 80px; left: -80px;
        animation: cb-drift 16s ease-in-out infinite alternate-reverse;
      }
      @keyframes cb-drift { from{transform:translate(0,0);} to{transform:translate(20px,14px);} }

      /* HEADER */
      .cb-header {
        position: sticky; top: 0; z-index: 50;
        display: flex; align-items: center; justify-content: space-between;
        padding: 18px 40px;
        background: rgba(255,255,255,0.85); backdrop-filter: blur(16px);
        border-bottom: 1px solid #f3f4f6;
      }
      .cb-back-btn {
        display: flex; align-items: center; gap: 6px;
        font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;
        color: #9ca3af; background: none; border: 1px solid #e5e7eb;
        padding: 7px 14px; border-radius: 100px; cursor: pointer; transition: all 0.2s;
      }
      .cb-back-btn:hover { border-color: #fca5a5; color: #dc2626; background: #fef2f2; }
      .cb-logo { font-size: 18px; font-weight: 900; color: #111; }
      .cb-logo span { color: #ef4444; }

      /* TIMER */
      .cb-timer {
        display: flex; align-items: center; gap: 6px;
        font-size: 13px; font-weight: 800; letter-spacing: 0.04em;
        color: #6b7280;
        background: #f9fafb; border: 1px solid #e5e7eb;
        padding: 7px 14px; border-radius: 100px;
        transition: all 0.3s;
      }
      .cb-timer-urgent {
        color: #dc2626; background: #fef2f2; border-color: #fecaca;
        animation: cb-pulse-border 1s ease-in-out infinite;
      }
      @keyframes cb-pulse-border {
        0%,100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.2); }
        50%      { box-shadow: 0 0 0 4px rgba(220,38,38,0.1); }
      }

      /* CENTER (loading/locked/success) */
      .cb-center {
        position: relative; z-index: 1;
        min-height: calc(100vh - 70px);
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        gap: 16px; padding: 40px 24px; text-align: center;
      }
      .cb-spinner {
        width: 44px; height: 44px;
        border: 3px solid #fee2e2; border-top-color: #dc2626;
        border-radius: 50%; animation: cb-spin 0.8s linear infinite;
      }
      .cb-spinner-sm {
        width: 28px; height: 28px;
        border-width: 2px;
      }
      @keyframes cb-spin { to { transform: rotate(360deg); } }

      .cb-checking-text { font-size: 14px; color: #9ca3af; font-weight: 500; }
      .cb-icon { font-size: 52px; }
      .cb-locked-title { font-size: 28px; font-weight: 900; color: #111; }
      .cb-locked-sub { font-size: 14px; color: #9ca3af; max-width: 340px; line-height: 1.6; }

      .cb-success-ring {
        width: 80px; height: 80px; border-radius: 50%;
        background: #fef2f2; border: 2px solid #fecaca;
        display: flex; align-items: center; justify-content: center;
        animation: cb-pop 0.4s cubic-bezier(.22,.68,0,1.4);
      }
      @keyframes cb-pop { from{transform:scale(0.5);opacity:0;} to{transform:scale(1);opacity:1;} }
      .cb-success-title { font-size: 32px; font-weight: 900; color: #111; letter-spacing: -0.02em; }
      .cb-success-sub { font-size: 15px; color: #6b7280; max-width: 380px; line-height: 1.6; }
      .cb-redirect-note { font-size: 11px; color: #d1d5db; letter-spacing: 0.04em; }

      /* CONTENT */
      .cb-content {
        position: relative; z-index: 1;
        display: flex; justify-content: center;
        padding: 48px 24px 80px;
      }
      .cb-card {
        background: #fff;
        border: 1px solid #f3f4f6;
        border-radius: 24px;
        padding: 40px;
        width: 100%; max-width: 480px;
        box-shadow: 0 8px 40px rgba(220,38,38,0.06);
      }

      /* BADGE */
      .cb-badge {
        display: inline-flex; align-items: center; gap: 8px;
        background: #fef2f2; border: 1px solid #fecaca;
        padding: 6px 14px; border-radius: 100px;
        font-size: 11px; font-weight: 600; color: #dc2626;
        letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 24px;
      }
      .cb-badge-dot {
        width: 6px; height: 6px; border-radius: 50%; background: #ef4444;
        animation: cb-blink 2s ease-in-out infinite;
      }
      @keyframes cb-blink { 0%,100%{opacity:1;} 50%{opacity:0.3;} }

      .cb-title {
        font-size: clamp(36px, 6vw, 52px); font-weight: 900;
        line-height: 1.0; letter-spacing: -0.03em;
        color: #111; margin-bottom: 32px;
      }
      .cb-accent { color: #dc2626; position: relative; }
      .cb-accent::after {
        content: ''; position: absolute;
        bottom: 3px; left: 0; right: 0; height: 3px; border-radius: 2px;
        background: linear-gradient(90deg, #dc2626, #f87171);
        transform-origin: left;
        animation: cb-underline 0.8s 0.2s cubic-bezier(.22,.68,0,1.2) both;
      }
      @keyframes cb-underline { from{transform:scaleX(0);} to{transform:scaleX(1);} }

      /* SECTION */
      .cb-section { margin-bottom: 20px; }
      .cb-section-label {
        font-size: 10px; font-weight: 700;
        text-transform: uppercase; letter-spacing: 0.12em;
        color: #d1d5db; margin-bottom: 12px;
      }

      /* SEAT CHIPS */
      .cb-seats-grid { display: flex; flex-wrap: wrap; gap: 8px; }
      .cb-seat-chip {
        display: flex; flex-direction: column; align-items: center;
        background: #fef2f2; border: 1px solid #fecaca;
        border-radius: 10px; padding: 8px 14px; min-width: 48px;
      }
      .cb-chip-row { font-size: 9px; font-weight: 700; color: #fca5a5; text-transform: uppercase; letter-spacing: 0.08em; }
      .cb-chip-num { font-size: 18px; font-weight: 900; color: #dc2626; line-height: 1.1; }

      /* DIVIDER */
      .cb-divider { height: 1px; background: #f3f4f6; margin: 24px 0; }

      /* PRICE */
      .cb-price-rows { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
      .cb-price-row {
        display: flex; justify-content: space-between;
        font-size: 14px; color: #374151; font-weight: 500;
      }
      .cb-price-row-fees { color: #9ca3af; font-size: 13px; }
      .cb-price-total {
        display: flex; justify-content: space-between; align-items: center;
        padding: 14px 16px; background: #f9fafb; border-radius: 12px;
      }
      .cb-price-total > span:first-child { font-size: 13px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; }
      .cb-total-amount { font-size: 24px; font-weight: 900; color: #dc2626; letter-spacing: -0.02em; }

      /* ERROR */
      .cb-error-msg {
        font-size: 12px; color: #dc2626; font-weight: 500;
        background: #fef2f2; border: 1px solid #fecaca;
        padding: 10px 14px; border-radius: 8px; margin-bottom: 16px;
        text-align: center;
      }

      /* CONFIRM BTN */
      .cb-confirm-btn {
        width: 100%; padding: 16px;
        font-size: 13px; font-weight: 800;
        letter-spacing: 0.08em; text-transform: uppercase;
        background: #dc2626; color: #fff;
        border: none; border-radius: 14px; cursor: pointer;
        display: flex; align-items: center; justify-content: center; gap: 8px;
        box-shadow: 0 4px 20px rgba(220,38,38,0.3);
        transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
        margin-bottom: 14px;
      }
      .cb-confirm-btn:hover:not(:disabled) {
        background: #b91c1c;
        box-shadow: 0 6px 28px rgba(220,38,38,0.4);
      }
      .cb-confirm-btn:active:not(:disabled) { transform: scale(0.98); }
      .cb-confirm-btn:disabled { opacity: 0.7; cursor: not-allowed; }

      .cb-btn-spinner {
        width: 20px; height: 20px;
        border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff;
        border-radius: 50%; animation: cb-spin 0.7s linear infinite;
      }

      .cb-secure-note {
        text-align: center; font-size: 11px; color: #d1d5db;
        font-weight: 500; letter-spacing: 0.03em;
      }

      @media (max-width: 640px) {
        .cb-header { padding: 14px 20px; }
        .cb-card { padding: 28px 24px; }
        .cb-content { padding: 32px 16px 60px; }
      }
    `}</style>
  );
}