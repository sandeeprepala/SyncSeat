
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";


const API = axios.create({
  baseURL: import.meta.env.VITE_AUTH_SERVICE,
  withCredentials: true,
});

/* =========================
   Reveal Hook
========================= */
function useReveal() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.classList.add("revealed");
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}

const FILTERS = ["All", "Now Showing", "Coming Soon", "Exclusive"];

/* =========================
   Movies Component
========================= */
export default function Movies() {
  
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const heroRef = useRef(null);


  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const res = await API.get("/homepage/movies");
      setMovies(res.data);
    } catch (err) {
      console.error("Error fetching movies:", err.response?.data || err.message);
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
    <main className="movies-root">

      {/* HERO */}
      <section className="hero">
        <div className="hero-blob blob-1" />
        <div className="hero-blob blob-2" />

        <div className="hero-inner">
          <div className="badge">
            <span className="badge-dot" />
            <span>{movies.length} Movies Available</span>
          </div>

          <h1 className="hero-title">
            Book Your<br />
            <span className="accent">Movie.</span>
          </h1>

          <p className="hero-sub">
            From blockbusters to indie gems — grab your seats for the latest releases.
          </p>

          <div className="hero-meta">
            {["4K Screens", "Dolby Atmos", "Instant Booking"].map((s) => (
              <span key={s} className="meta-chip">{s}</span>
            ))}
          </div>
        </div>

        <div className="ticket-stub">
          <div className="stub-holes">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="stub-hole" />
            ))}
          </div>
        </div>
      </section>

      {/* FILTER BAR */}
      <section className="filter-bar">
        <div className="filter-inner">
          <div className="pills">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setSelectedFilter(f)}
                className={`pill ${selectedFilter === f ? "pill-active" : ""}`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="search-wrap">
            <input type="text" placeholder="Search movies…" className="search-input" />
          </div>
        </div>
      </section>

      {/* GRID */}
      <section className="grid-section">
        <div className="grid-header">
          <p className="grid-eyebrow">— Now Playing</p>
          <h2 className="grid-title">Hot Releases</h2>
        </div>

        <div className="movies-grid">
          {movies.map((movie, i) => (
            <MovieCard key={movie.id} movie={movie} delay={i * 60} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="cta-blob" />
        <div className="cta-inner">
          <h2 className="cta-title">Never Miss a Release</h2>
          <p className="cta-sub">
            Get early access to new drops and exclusive previews.
          </p>
          <div className="cta-form">
            <input type="email" placeholder="your@email.com" className="cta-input" />
            <button className="cta-btn">Notify Me</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <span className="footer-logo">
          Sync<span>Seat</span>
        </span>
        <p>© 2025 SyncSeat. All rights reserved.</p>
      </footer>

      <style>{`
        /* scope resets to this component to avoid affecting global layout (navbar, etc.) */
        .movies-root, .movies-root * , .movies-root *::before, .movies-root *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .movies-root {
          font-family: 'Segoe UI', system-ui, sans-serif;
          background: #fff; color: #111; overflow-x: hidden;
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

        /* HERO */
        .hero {
          position: relative; min-height: 88vh;
          display: flex; align-items: center;
          padding: 120px 48px 100px;
          background: linear-gradient(
  135deg,
  #fff1f2 0%,
  #fecaca 50%,
  #fca5a5 100%
);
          overflow: hidden;
        }
        .hero-blob { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; }
        .blob-1 {
          width: 480px; height: 480px;
          background: radial-gradient(circle, #fca5a533, transparent 70%);
          top: -100px; right: -80px;
          animation: drift 10s ease-in-out infinite alternate;
        }
        .blob-2 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, #fecaca44, transparent 70%);
          bottom: -60px; left: -60px;
          animation: drift 14s ease-in-out infinite alternate-reverse;
        }
        @keyframes drift {
          from { transform: translate(0,0); } to { transform: translate(24px,16px); }
        }

        .hero-inner { position: relative; z-index: 2; max-width: 680px; }

        .badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: #fef2f2; border: 1px solid #fecaca;
          padding: 6px 14px; border-radius: 100px;
          font-size: 11px; font-weight: 600; color: #dc2626;
          letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 28px;
        }
        .badge-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #ef4444;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.4;transform:scale(0.8);} }

        .hero-title {
          font-size: clamp(52px, 9vw, 96px); font-weight: 900;
          line-height: 1.0; letter-spacing: -0.03em;
          color: #111; margin-bottom: 20px;
        }
        .accent { color: #dc2626; position: relative; }
        .accent::after {
          content: ''; position: absolute;
          bottom: 4px; left: 0; right: 0; height: 4px; border-radius: 2px;
          background: linear-gradient(90deg, #dc2626, #f87171);
          transform-origin: left;
          animation: underline-in 0.8s 0.4s cubic-bezier(.22,.68,0,1.2) both;
        }
        @keyframes underline-in { from{transform:scaleX(0);} to{transform:scaleX(1);} }

        .hero-sub {
          font-size: 17px; color: #6b7280; font-weight: 400;
          line-height: 1.7; margin-bottom: 32px; max-width: 460px;
        }
        .hero-meta { display: flex; gap: 10px; flex-wrap: wrap; }
        .meta-chip {
          font-size: 11px; font-weight: 600; color: #9ca3af;
          letter-spacing: 0.06em; padding: 7px 16px; border-radius: 100px;
          border: 1px solid #e5e7eb; background: #fff; text-transform: uppercase;
        }

        .ticket-stub { position: absolute; right: 60px; bottom: 40px; opacity: 0.06; pointer-events: none; }
        .stub-holes { display: flex; flex-direction: column; gap: 14px; }
        .stub-hole { width: 22px; height: 22px; border-radius: 50%; border: 3px solid #dc2626; }

        /* FILTER BAR */
        .filter-bar {
          position: sticky; top: 0; z-index: 10;
          background: rgba(255,255,255,0.85); backdrop-filter: blur(16px);
          border-bottom: 1px solid #f3f4f6; padding: 12px 48px;
        }
        .filter-inner {
          max-width: 1200px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; flex-wrap: wrap;
        }
        .pills { display: flex; gap: 6px; flex-wrap: wrap; }
        .pill {
          font-size: 11px; font-weight: 600; letter-spacing: 0.06em;
          text-transform: uppercase; padding: 7px 18px; border-radius: 100px;
          border: 1px solid #e5e7eb; background: transparent;
          color: #9ca3af; cursor: pointer; transition: all 0.2s;
        }
        .pill:hover { border-color: #fca5a5; color: #dc2626; background: #fef2f2; }
        .pill-active { background: #dc2626 !important; border-color: #dc2626 !important; color: #fff !important; }

        .search-wrap { position: relative; display: flex; align-items: center; }
        .search-input {
          font-size: 13px; padding: 8px 16px;
          border-radius: 100px; border: 1px solid #e5e7eb;
          background: #f9fafb; color: #374151; width: 220px; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .search-input::placeholder { color: #d1d5db; }
        .search-input:focus { border-color: #fca5a5; box-shadow: 0 0 0 3px #fef2f2; }

        /* GRID */
        .grid-section { padding: 72px 48px 60px; max-width: 1200px; margin: 0 auto; }
        .grid-header { margin-bottom: 40px; }
        .grid-eyebrow {
          font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.14em;
          color: #ef4444; margin-bottom: 8px;
        }
        .grid-title { font-size: 36px; font-weight: 900; letter-spacing: -0.02em; color: #111; }
        .movies-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
          gap: 22px;
        }

        /* CARD */
        .movie-card {
          border-radius: 16px; overflow: hidden;
          background: #fff; border: 1px solid #f3f4f6;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          cursor: pointer;
          transition: transform 0.3s cubic-bezier(.22,.68,0,1.2), box-shadow 0.3s, border-color 0.3s;
        }
        .movie-card:hover {
          transform: translateY(-6px);
          border-color: #fecaca;
          box-shadow: 0 16px 40px rgba(220,38,38,0.1);
        }
        .card-img {
          position: relative; height: 260px; overflow: hidden;
          background: linear-gradient(135deg, #fef2f2, #fce7e7);
        }
        .card-img img {
          width: 100%; height: 100%; object-fit: cover;
          transition: transform 0.5s cubic-bezier(.22,.68,0,1.2);
          filter: saturate(0.9);
        }
        .movie-card:hover .card-img img { transform: scale(1.07); filter: saturate(1.1); }
        .img-fallback { width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:42px; }
        .img-overlay { position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.45) 0%,transparent 55%); }
        .card-format {
          position: absolute; top: 10px; left: 10px;
          font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
          background: #dc2626; color: #fff; padding: 4px 10px; border-radius: 6px;
        }
        .card-rating {
          position: absolute; top: 10px; right: 10px;
          font-size: 10px; font-weight: 700;
          background: rgba(0,0,0,0.55); backdrop-filter: blur(8px);
          color: #fff; padding: 4px 9px; border-radius: 6px;
        }
        .card-lang {
          position: absolute; bottom: 10px; left: 10px;
          font-size: 9px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.75);
        }
        .card-body { padding: 14px 16px 16px; }
        .card-duration { font-size:10px;font-weight:500;color:#d1d5db;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:4px; }
        .card-title {
          font-size: 15px; font-weight: 800; color: #111;
          line-height: 1.25; margin-bottom: 14px;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
        }
        .card-footer { display:flex;align-items:center;justify-content:space-between; }
        .price-label { font-size:9px;color:#d1d5db;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:2px; }
        .price-value { font-size:18px;font-weight:900;color:#dc2626; }
        .book-btn {
          font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
          padding: 9px 18px; border-radius: 100px; border: none;
          background: #dc2626; color: #fff; cursor: pointer;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 12px rgba(220,38,38,0.25);
        }
        .book-btn:hover { background: #b91c1c; box-shadow: 0 6px 20px rgba(220,38,38,0.35); }
        .book-btn:active { transform: scale(0.95); }

        /* CTA */
        .cta {
          margin: 0 40px 60px; border-radius: 24px;
          padding: 72px 48px; background: #dc2626;
          position: relative; overflow: hidden; text-align: center;
        }
        .cta-blob {
          position: absolute; top: -80px; right: -80px;
          width: 300px; height: 300px; border-radius: 50%;
          background: rgba(255,255,255,0.08); pointer-events: none;
        }
        .cta-inner { position: relative; z-index: 1; }
        .cta-title { font-size: clamp(32px,5vw,52px); font-weight:900; letter-spacing:-0.02em; color:#fff; margin-bottom:12px; }
        .cta-sub { font-size:15px; color:#fca5a5; margin-bottom:36px; line-height:1.6; }
        .cta-form { display:flex;gap:10px;max-width:400px;margin:0 auto;flex-wrap:wrap;justify-content:center; }
        .cta-input {
          flex:1; min-width:200px; font-size:13px; padding:14px 20px;
          border-radius:100px; border:1px solid rgba(255,255,255,0.3);
          background:rgba(255,255,255,0.15); color:#fff; outline:none;
          transition: border-color 0.2s;
        }
        .cta-input::placeholder { color:#fca5a5; }
        .cta-input:focus { border-color:rgba(255,255,255,0.7); }
        .cta-btn {
          font-size:13px; font-weight:800; padding:14px 28px; border-radius:100px;
          border:none; background:#fff; color:#dc2626; cursor:pointer; white-space:nowrap;
          transition: background 0.2s, transform 0.15s;
        }
        .cta-btn:hover { background:#fef2f2; }
        .cta-btn:active { transform:scale(0.97); }

        /* FOOTER */
        .footer {
          background: #030712; color: #6b7280;
          padding: 40px 24px; text-align: center;
          display:flex; flex-direction:column; align-items:center; gap:8px;
        }
        .footer-logo { font-size:20px; font-weight:900; color:#fff; }
        .footer-logo span { color:#ef4444; }
        .footer p { font-size:12px; }

        /* REVEAL */
        .reveal-up { opacity:0; transform:translateY(28px); transition:opacity 0.8s ease,transform 0.8s ease; }
        .reveal-up.revealed { opacity:1; transform:translateY(0); }
        .reveal-card { opacity:0; transform:translateY(20px); transition:opacity 0.6s ease,transform 0.6s ease; }
        .reveal-card.revealed { opacity:1; transform:translateY(0); }

        @media (max-width:640px) {
          .hero { padding:100px 24px 80px; }
          .filter-bar { padding:12px 24px; }
          .grid-section { padding:52px 24px 40px; }
          .cta { margin:0 20px 40px; padding:52px 28px; }
        }
      `}</style>

    </main>
  );
}

/* =========================
   Movie Card
========================= */
function MovieCard({ movie, delay }) {
  const ref = useReveal();
  const [imgError, setImgError] = useState(false);
  const navigate = useNavigate();

  const d = {
    language: movie.language || "Hindi",
    duration: movie.duration || "2h 30m",
    rating: movie.rating || "8.5",
    format: movie.format || "2D",
    poster_url:
      movie.poster_url ||
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80",
  };

  return (
    <div
      ref={ref}
      className="movie-card reveal-card"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="card-img">
        {!imgError
          ? <img src={d.poster_url} alt={movie.title} onError={() => setImgError(true)} />
          : <div className="img-fallback">🎬</div>}
        <div className="img-overlay" />
        <span className="card-format">{d.format}</span>
        <span className="card-rating">⭐ {d.rating}</span>
        <span className="card-lang">{d.language}</span>
      </div>

      <div className="card-body">
        <p className="card-duration">{d.duration}</p>
        <h3 className="card-title">{movie.title}</h3>
        <div className="card-footer">
          <div>
            <p className="price-label">From</p>
            <p className="price-value">₹{movie.price || "300"}</p>
          </div>
          <button
            className="book-btn"
            onClick={() => navigate(`/shows/${movie.id}`)}
            
          >Book Now</button>
        </div>
      </div>
    </div>
  );
}