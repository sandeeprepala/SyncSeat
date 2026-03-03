
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_AUTH_SERVICE,
  withCredentials: true,
});

export default function SeatLayout() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSeats();
  }, [showId]);

  const fetchSeats = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/homepage/seats/${showId}`);
      console.log("seats response:", res.data); // ← add this
      setSeats(res.data);
    } catch (err) {
      console.error("Error fetching seats:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSeat = (seat) => {
    if (seat.status !== "AVAILABLE") return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(seat.seat_id) ? next.delete(seat.seat_id) : next.add(seat.seat_id);
      return next;
    });
  };

  // Group seats by row, sorted
  const rows = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    return acc;
  }, {});

  const sortedRows = Object.keys(rows).sort();
  const selectedSeats = seats.filter((s) => selected.has(s.seat_id));
  const totalPrice = selectedSeats.length * 300; // replace with actual price if available

  if (loading) {
    return (
      <div className="sl-loader-screen">
        <div className="sl-loader-ring" />
      </div>
    );
  }

  return (
    <main className="sl-root">
      {/* BG blobs */}
      <div className="sl-blob sl-blob-1" />
      <div className="sl-blob sl-blob-2" />

      {/* Header */}
      <header className="sl-header">
        <button className="sl-back-btn" onClick={() => navigate(-1)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back
        </button>
        <div className="sl-header-title">
          <span className="sl-header-logo">Sync<span>Seat</span></span>
          <p className="sl-header-sub">Select your seats</p>
        </div>
        <div style={{ width: 80 }} />
      </header>

      {/* Screen */}
      <div className="sl-screen-wrap">
        <div className="sl-screen">
          <span>SCREEN</span>
        </div>
        <div className="sl-screen-glow" />
      </div>

      {/* Seat Grid */}
      <div className="sl-grid-wrap">
        {sortedRows.map((row) => (
          <div key={row} className="sl-row">
            <span className="sl-row-label">{row}</span>
            <div className="sl-row-seats">
              {rows[row]
                .sort((a, b) => a.number - b.number)
                .map((seat) => {
                  const isSelected = selected.has(seat.seat_id);
                  const isUnavailable = seat.status !== "AVAILABLE";
                  let seatClass = "sl-seat";
                  if (isUnavailable) seatClass += " sl-seat-blocked";
                  else if (isSelected) seatClass += " sl-seat-selected";
                  else seatClass += " sl-seat-available";

                  return (
                    <button
                      key={seat.seat_id}
                      className={seatClass}
                      onClick={() => toggleSeat(seat)}
                      disabled={isUnavailable}
                      title={`${seat.row}${seat.number} — ${seat.status}`}
                    >
                      {seat.number}
                    </button>
                  );
                })}
            </div>
            <span className="sl-row-label">{row}</span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="sl-legend">
        <div className="sl-legend-item">
          <div className="sl-legend-dot sl-dot-available" />
          <span>Available</span>
        </div>
        <div className="sl-legend-item">
          <div className="sl-legend-dot sl-dot-selected" />
          <span>Selected</span>
        </div>
        <div className="sl-legend-item">
          <div className="sl-legend-dot sl-dot-blocked" />
          <span>Unavailable</span>
        </div>
      </div>

      {/* Booking Bar */}
      {selected.size > 0 && (
        <div className="sl-booking-bar">
          <div className="sl-booking-info">
            <div className="sl-booking-seats">
              {selectedSeats.map((s) => (
                <span key={s.seat_id} className="sl-seat-tag">
                  {s.row}{s.number}
                  <button
                    className="sl-seat-tag-remove"
                    onClick={() => toggleSeat(s)}
                  >×</button>
                </span>
              ))}
            </div>
            <div className="sl-booking-total">
              <span className="sl-total-label">{selected.size} seat{selected.size > 1 ? "s" : ""}</span>
              <span className="sl-total-price">₹{totalPrice}</span>
            </div>
          </div>
            <button
  className="sl-confirm-btn"
  onClick={async () => {
    try {
      // Lock the seats first
      await API.post("/booking/lock-seat", {
        showId,
        seatIds: [...selected],
      });

      // Then navigate to confirm page
      navigate("/confirm-booking", {
        state: {
          showId,
          seatIds: [...selected],
          selectedSeats,
          totalPrice,
        },
      });
    } catch (err) {
      console.error("Failed to lock seats:", err.response?.data || err.message);
      alert("Could not lock seats. Please try again.");
    }
  }}
>
  Book Seats →
</button>
        </div>
      )}

      <style>{`
.sl-root * {
  box-sizing: border-box;
}

        .sl-root {
          font-family: 'Segoe UI', system-ui, sans-serif;
          min-height: 100vh;
          background: linear-gradient(160deg, #fff 0%, #fff5f5 60%, #fef2f2 100%);
          color: #111;
          overflow-x: hidden;
          padding-bottom: 120px;
          position: relative;
        }

        /* BG BLOBS */
        .sl-blob {
          position: fixed; border-radius: 50%;
          filter: blur(90px); pointer-events: none; z-index: 0;
        }
        .sl-blob-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, #fca5a522, transparent 70%);
          top: -120px; right: -100px;
          animation: sl-drift 12s ease-in-out infinite alternate;
        }
        .sl-blob-2 {
          width: 320px; height: 320px;
          background: radial-gradient(circle, #fecaca33, transparent 70%);
          bottom: 100px; left: -80px;
          animation: sl-drift 16s ease-in-out infinite alternate-reverse;
        }
        @keyframes sl-drift {
          from { transform: translate(0,0); }
          to   { transform: translate(20px, 14px); }
        }

        /* LOADER */
        .sl-loader-screen {
          min-height: 100vh; background: #fff;
          display: flex; align-items: center; justify-content: center;
        }
        .sl-loader-ring {
          width: 44px; height: 44px;
          border: 3px solid #fee2e2; border-top-color: #dc2626;
          border-radius: 50%; animation: sl-spin 0.8s linear infinite;
        }
        @keyframes sl-spin { to { transform: rotate(360deg); } }

        /* HEADER */
        .sl-header {
          position: relative; z-index: 10;
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 40px;
          background: rgba(255,255,255,0.8);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid #f3f4f6;
        }
        .sl-back-btn {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 600;
          letter-spacing: 0.05em; text-transform: uppercase;
          color: #9ca3af; background: none; border: 1px solid #e5e7eb;
          padding: 8px 16px; border-radius: 100px; cursor: pointer;
          transition: all 0.2s;
        }
        .sl-back-btn:hover { border-color: #fca5a5; color: #dc2626; background: #fef2f2; }
        .sl-header-title { text-align: center; }
        .sl-header-logo { font-size: 18px; font-weight: 900; color: #111; }
        .sl-header-logo span { color: #ef4444; }
        .sl-header-sub { font-size: 11px; color: #9ca3af; font-weight: 500; margin-top: 2px; letter-spacing: 0.04em; }

        /* SCREEN */
        .sl-screen-wrap {
          position: relative; z-index: 1;
          display: flex; flex-direction: column; align-items: center;
          padding: 48px 40px 8px;
        }
        .sl-screen {
          width: min(600px, 90%);
          height: 10px;
          background: linear-gradient(90deg, transparent, #dc2626, #f87171, #dc2626, transparent);
          border-radius: 50%;
          display: flex; align-items: flex-end; justify-content: center;
          padding-bottom: 16px;
          position: relative;
        }
        .sl-screen span {
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: #dc2626; position: absolute; bottom: -20px;
        }
        .sl-screen-glow {
          width: min(500px, 80%);
          height: 40px;
          background: radial-gradient(ellipse, #fca5a544 0%, transparent 70%);
          margin-top: 4px;
        }

        /* GRID */
        .sl-grid-wrap {
          position: relative; z-index: 1;
          display: flex; flex-direction: column; align-items: center;
          gap: 8px;
          padding: 40px 24px 24px;
        }
        .sl-row {
          display: flex; align-items: center; gap: 12px;
        }
        .sl-row-label {
          font-size: 11px; font-weight: 700;
          color: #d1d5db; letter-spacing: 0.08em;
          width: 16px; text-align: center;
          user-select: none;
        }
        .sl-row-seats {
          display: flex; gap: 6px; flex-wrap: wrap; justify-content: center;
        }

        /* SEAT */
        .sl-seat {
          width: 34px; height: 34px;
          border-radius: 6px 6px 4px 4px;
          font-size: 9px; font-weight: 700;
          border: none; cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
          position: relative;
          display: flex; align-items: center; justify-content: center;
        }
        /* seat top curve like a cinema seat */
        .sl-seat::before {
          content: '';
          position: absolute; top: -3px; left: 4px; right: 4px;
          height: 4px; border-radius: 4px 4px 0 0;
          background: inherit; filter: brightness(0.85);
        }

        .sl-seat-available {
          background: #f3f4f6; color: #6b7280;
          box-shadow: 0 2px 0 #d1d5db;
        }
        .sl-seat-available:hover {
          background: #fef2f2; color: #dc2626;
          box-shadow: 0 2px 0 #fca5a5;
          transform: translateY(-2px);
        }

        .sl-seat-selected {
          background: #dc2626; color: #fff;
          box-shadow: 0 2px 0 #991b1b;
          transform: translateY(-2px);
          animation: sl-pop 0.2s cubic-bezier(.22,.68,0,1.4);
        }
        @keyframes sl-pop {
          from { transform: translateY(0) scale(0.9); }
          to   { transform: translateY(-2px) scale(1); }
        }

        .sl-seat-blocked {
          background: #e5e7eb; color: #d1d5db;
          box-shadow: 0 2px 0 #d1d5db;
          cursor: not-allowed; opacity: 0.6;
        }

        /* LEGEND */
        .sl-legend {
          position: relative; z-index: 1;
          display: flex; justify-content: center; gap: 24px;
          padding: 8px 24px 32px;
          flex-wrap: wrap;
        }
        .sl-legend-item {
          display: flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 500; color: #9ca3af;
          letter-spacing: 0.04em;
        }
        .sl-legend-dot {
          width: 16px; height: 16px; border-radius: 4px;
        }
        .sl-dot-available { background: #f3f4f6; border: 1px solid #e5e7eb; }
        .sl-dot-selected  { background: #dc2626; }
        .sl-dot-blocked   { background: #e5e7eb; opacity: 0.6; }

        /* BOOKING BAR */
        .sl-booking-bar {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(20px);
          border-top: 1px solid #f3f4f6;
          padding: 16px 40px;
          display: flex; align-items: center;
          justify-content: space-between; gap: 16px;
          flex-wrap: wrap;
          box-shadow: 0 -8px 32px rgba(220,38,38,0.08);
          animation: sl-slide-up 0.3s cubic-bezier(.22,.68,0,1.2);
        }
        @keyframes sl-slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }

        .sl-booking-info {
          display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
        }
        .sl-booking-seats {
          display: flex; gap: 6px; flex-wrap: wrap;
        }
        .sl-seat-tag {
          display: inline-flex; align-items: center; gap: 4px;
          background: #fef2f2; border: 1px solid #fecaca;
          color: #dc2626; font-size: 11px; font-weight: 700;
          padding: 4px 10px; border-radius: 100px;
          animation: sl-pop 0.2s cubic-bezier(.22,.68,0,1.4);
        }
        .sl-seat-tag-remove {
          background: none; border: none; cursor: pointer;
          color: #fca5a5; font-size: 14px; line-height: 1;
          padding: 0; transition: color 0.15s;
        }
        .sl-seat-tag-remove:hover { color: #dc2626; }

        .sl-booking-total {
          display: flex; flex-direction: column;
        }
        .sl-total-label {
          font-size: 10px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;
        }
        .sl-total-price {
          font-size: 22px; font-weight: 900;
          color: #dc2626; letter-spacing: -0.02em;
        }

        .sl-confirm-btn {
          font-size: 12px; font-weight: 800;
          letter-spacing: 0.07em; text-transform: uppercase;
          padding: 14px 32px; border-radius: 100px; border: none;
          background: #dc2626; color: #fff; cursor: pointer;
          box-shadow: 0 4px 16px rgba(220,38,38,0.3);
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          white-space: nowrap;
        }
        .sl-confirm-btn:hover {
          background: #b91c1c;
          box-shadow: 0 6px 24px rgba(220,38,38,0.4);
        }
        .sl-confirm-btn:active { transform: scale(0.97); }

        @media (max-width: 640px) {
          .sl-header { padding: 16px 20px; }
          .sl-seat { width: 28px; height: 28px; font-size: 8px; }
          .sl-row-seats { gap: 4px; }
          .sl-booking-bar { padding: 14px 20px; }
          .sl-confirm-btn { padding: 12px 24px; }
        }
      `}</style>
    </main>
  );
}