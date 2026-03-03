
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_AUTH_SERVICE,
  withCredentials: true,
});

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add("revealed"); },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

export default function Shows() {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [theatreGroups, setTheatreGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const headerRef = useRef(null);

  useEffect(() => {
    if (headerRef.current) headerRef.current.classList.add("revealed");
    fetchAndGroup();
  }, [movieId]);

  const fetchAndGroup = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Get all shows for this movie
      const { data: shows } = await API.get(`/homepage/shows/${movieId}`);

      if (!shows || shows.length === 0) {
        setTheatreGroups([]);
        return;
      }

      // 2. Get unique screen_ids
      const screenIds = [...new Set(shows.map((s) => s.screen_id))];

      // 3. Fetch all screens (to get theatre_id)
      const { data: screens } = await API.get(`/homepage/screens`, {
        params: { ids: screenIds.join(",") },
      });

      // 4. Get unique theatre_ids
      const theatreIds = [...new Set(screens.map((sc) => sc.theatre_id))];

      // 5. Fetch all theatres
      const { data: theatres } = await API.get(`/homepage/theatres`, {
        params: { ids: theatreIds.join(",") },
      });

      // 6. Build lookup maps
      const screenMap = {};
      screens.forEach((sc) => { screenMap[sc.id] = sc; });

      const theatreMap = {};
      theatres.forEach((t) => { theatreMap[t.id] = t; });

      // 7. Group shows by theatre
      const grouped = {};
      shows.forEach((show) => {
        const screen = screenMap[show.screen_id];
        if (!screen) return;
        const theatre = theatreMap[screen.theatre_id];
        if (!theatre) return;

        const tid = theatre.id;
        if (!grouped[tid]) {
          grouped[tid] = {
            theatre_id: tid,
            theatre_name: theatre.name,
            theatre_location: theatre.location || theatre.address || "",
            shows: [],
          };
        }
        grouped[tid].shows.push({
          ...show,
          screen_name: screen.name,
        });
      });

      setTheatreGroups(Object.values(grouped));
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to load shows. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loader-screen">
        <div className="loader-ring" />
      </div>
    );
  }

  return (
    <main className="shows-root">

      {/* PAGE HEADER */}
      <section className="page-header">
        <div className="header-blob blob-1" />
        <div className="header-blob blob-2" />

        <div ref={headerRef} className="header-inner reveal-up">
          {/* <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back to Movies
          </button> */}

          <div className="badge">
            <span className="badge-dot" />
            <span>{theatreGroups.length} Theatre{theatreGroups.length !== 1 ? "s" : ""} Available</span>
          </div>

          <h1 className="page-title">
            Select a <span className="accent">Theatre</span>
          </h1>
          <p className="page-sub">
            Choose your preferred theatre and show time below.
          </p>
        </div>
      </section>

      {/* THEATRES LIST */}
      <section className="theatres-section">
        {error && <p className="error-msg">{error}</p>}

        {!error && theatreGroups.length === 0 && (
          <div className="empty-state">
            <span>🎭</span>
            <p>No shows available for this movie right now.</p>
          </div>
        )}

        {theatreGroups.map((group, i) => (
          <TheatreCard
            key={group.theatre_id}
            group={group}
            delay={i * 80}
            onShowClick={(showId) => navigate(`/seatlayout/${showId}`)}
          />
        ))}
      </section>

      <footer className="footer">
        <span className="footer-logo">Sync<span>Seat</span></span>
        <p>© 2025 SyncSeat. All rights reserved.</p>
      </footer>

      <style>{`
        /* scope resets to this component to avoid affecting global layout (navbar, etc.) */
        .shows-root *, .shows-root *::before, .shows-root *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .shows-root {
          font-family: 'Segoe UI', system-ui, sans-serif;
          background: #fff; color: #111; min-height: 100vh; overflow-x: hidden;
        }

        /* LOADER */
        .loader-screen {
          min-height: 100vh; background: #fff;
          display: flex; align-items: center; justify-content: center;
        }
        .loader-ring {
          width: 44px; height: 44px;
          border: 3px solid #fee2e2; border-top-color: #dc2626;
          border-radius: 50%; animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* HEADER */
        .page-header {
          position: relative;
          margin-top: 70px;
          padding: 120px 48px 80px;
          background: linear-gradient(135deg, #fff 0%, #fff5f5 50%, #fef2f2 100%);
          overflow: hidden;
          border-bottom: 1px solid #f3f4f6;
        }
        .header-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
}
        .blob-1 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, #fca5a533, transparent 70%);
          top: -120px; right: -60px;
          animation: drift 10s ease-in-out infinite alternate;
        }
        .blob-2 {
          width: 260px; height: 260px;
          background: radial-gradient(circle, #fecaca44, transparent 70%);
          bottom: -60px; left: -40px;
          animation: drift 14s ease-in-out infinite alternate-reverse;
        }
        @keyframes drift {
          from { transform: translate(0,0); } to { transform: translate(20px,14px); }
        }

        .header-inner { position: relative; z-index: 2; max-width: 860px; padding: 0; }

        .back-btn {
          font-size: 13px; font-weight: 600; color: #6b7280;
          background: none; border: none; cursor: pointer;
          letter-spacing: 0.04em; margin-bottom: 24px;
          display: inline-block; transition: color 0.2s; padding: 0;
        }
        .back-btn:hover { color: #dc2626; }

        .badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: #fef2f2; border: 1px solid #fecaca;
          padding: 6px 16px; border-radius: 100px;
          font-size: 11px; font-weight: 600; color: #dc2626;
          letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 28px;
        }
        .badge-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #ef4444;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.4;transform:scale(0.8);} }

        .page-title {
          font-size: clamp(40px, 7vw, 72px); font-weight: 900;
          letter-spacing: -0.02em; line-height: 1.1; color: #000 !important; margin-bottom: 16px;
        }
        .accent { color: #dc2626 !important; }
        .page-sub { font-size: 16px; color: #6b7280 !important; font-weight: 400; line-height: 1.6; }

        /* THEATRES SECTION */
        .theatres-section {
          max-width: 900px; margin: 0 auto;
          padding: 48px 48px 60px;
          display: flex; flex-direction: column; gap: 18px;
        }

        /* THEATRE CARD */
        .theatre-card {
          border-radius: 16px;
          border: 1px solid #f3f4f6;
          background: #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          overflow: hidden;
          transition: border-color 0.25s, box-shadow 0.25s;
        }
        .theatre-card:hover {
          border-color: #fecaca;
          box-shadow: 0 8px 28px rgba(220,38,38,0.08);
        }

        /* THEATRE HEADER ROW */
        .theatre-top {
          display: flex; align-items: center;
          justify-content: space-between; gap: 12px;
          padding: 20px 24px 16px;
          border-bottom: 1px solid #f9fafb;
          flex-wrap: wrap;
        }
        .theatre-name {
          font-size: 17px; font-weight: 800;
          color: #111; letter-spacing: -0.01em; margin-bottom: 3px;
        }
        .theatre-location {
          font-size: 12px; color: #9ca3af; font-weight: 500;
          display: flex; align-items: center; gap: 4px;
        }
        .theatre-count {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.1em; color: #dc2626;
          background: #fef2f2; border: 1px solid #fecaca;
          padding: 5px 12px; border-radius: 100px; white-space: nowrap;
          flex-shrink: 0;
        }

        /* SHOWS ROW */
        .shows-row {
          padding: 16px 24px 20px;
          display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-start;
        }
        .shows-label {
          width: 100%;
          font-size: 9px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.12em;
          color: #d1d5db; margin-bottom: 2px;
        }

        /* SHOW BUTTON */
        .show-btn {
          display: flex; flex-direction: column; align-items: flex-start;
          padding: 10px 16px; border-radius: 10px;
          border: 1.5px solid #e5e7eb; background: #fff;
          cursor: pointer; text-align: left; min-width: 90px;
          transition: all 0.2s cubic-bezier(.22,.68,0,1.2);
        }
        .show-btn:hover {
          border-color: #dc2626; background: #fef2f2;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(220,38,38,0.12);
        }
        .show-btn:active { transform: scale(0.97); }

        .show-name {
          font-size: 14px; font-weight: 800;
          color: #111; letter-spacing: -0.01em; line-height: 1; margin-bottom: 4px;
        }
        .show-btn:hover .show-name { color: #dc2626; }

        .show-screen {
          font-size: 9px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;
        }

        /* EMPTY / ERROR */
        .empty-state {
          text-align: center; padding: 80px 24px;
          display: flex; flex-direction: column; align-items: center; gap: 14px;
          font-size: 40px; color: #9ca3af;
        }
        .empty-state p { font-size: 15px; font-weight: 500; }
        .error-msg {
          text-align: center; padding: 24px;
          color: #dc2626; font-size: 14px; font-weight: 500;
          background: #fef2f2; border-radius: 12px; border: 1px solid #fecaca;
        }

        /* FOOTER */
        .footer {
          background: #030712; color: #6b7280;
          padding: 36px 24px; text-align: center;
          display: flex; flex-direction: column; align-items: center; gap: 8px;
        }
        .footer-logo { font-size: 18px; font-weight: 900; color: #fff; }
        .footer-logo span { color: #ef4444; }
        .footer p { font-size: 12px; }

        /* REVEAL */
        .reveal-up { opacity: 1; transform: translateY(0); }
        .reveal-up.revealed { opacity: 1; transform: translateY(0); }
        .reveal-card { opacity: 0; transform: translateY(18px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .reveal-card.revealed { opacity: 1; transform: translateY(0); }

        @media (max-width: 640px) {
          .page-header {
            position: relative;
            z-index: 1;
            padding: 100px 24px 60px;
          }
          .theatres-section { padding: 32px 20px 48px; }
          .theatre-top { padding: 16px 18px 14px; }
          .shows-row { padding: 14px 18px 16px; }
        }
      `}</style>
    </main>
  );
}

/* =========================
   Theatre Card Component
========================= */
function TheatreCard({ group, delay, onShowClick }) {
  const ref = useReveal();

  return (
    <div
      ref={ref}
      className="theatre-card reveal-card"
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Theatre info */}
      <div className="theatre-top">
        <div>
          <h2 className="theatre-name">{group.theatre_name}</h2>
          {group.theatre_location && (
            <p className="theatre-location">📍 {group.theatre_location}</p>
          )}
        </div>
        <span className="theatre-count">
          {group.shows.length} Show{group.shows.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Show time buttons — horizontal, wrapping */}
      <div className="shows-row">
        <span className="shows-label">Available shows</span>
        {group.shows.map((show) => (
          <button
            key={show.id}
            className="show-btn"
            onClick={() => onShowClick(show.id)}
          >
            <span className="show-name">{show.name}</span>
            {show.screen_name && (
              <span className="show-screen">{show.screen_name}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}