import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const EVENTS = [
  {
    id: 1,
    title: "Coldplay: Music of the Spheres",
    category: "Concert",
    date: "Mar 15, 2025",
    venue: "DY Patil Stadium, Mumbai",
    price: "₹3,500",
    seats: 142,
    image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=80",
    tag: "Trending",
  },
  {
    id: 2,
    title: "IPL 2025: MI vs CSK",
    category: "Sports",
    date: "Apr 02, 2025",
    venue: "Wankhede Stadium, Mumbai",
    price: "₹1,200",
    seats: 380,
    image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600&q=80",
    tag: "Hot",
  },
  {
    id: 3,
    title: "Arijit Singh Live",
    category: "Concert",
    date: "Apr 10, 2025",
    venue: "NSCI Dome, Mumbai",
    price: "₹2,000",
    seats: 55,
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80",
    tag: "Almost Full",
  },
  {
    id: 4,
    title: "Hamlet – The Play",
    category: "Theatre",
    date: "Mar 22, 2025",
    venue: "NCPA, Mumbai",
    price: "₹800",
    seats: 210,
    image: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600&q=80",
    tag: "New",
  },
  {
    id: 5,
    title: "India vs Australia ODI",
    category: "Sports",
    date: "May 01, 2025",
    venue: "Eden Gardens, Kolkata",
    price: "₹950",
    seats: 900,
    image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&q=80",
    tag: "Trending",
  },
  {
    id: 6,
    title: "Techno Rave Night",
    category: "Club",
    date: "Mar 29, 2025",
    venue: "Kitty Su, Delhi",
    price: "₹1,500",
    seats: 30,
    image: "https://images.unsplash.com/photo-1571266028243-d220c6a7f2b0?w=600&q=80",
    tag: "Almost Full",
  },
];
const STATS = [
  { value: "2M+", label: "Tickets Sold" },
  { value: "500+", label: "Live Events" },
  { value: "150+", label: "Cities" },
  { value: "99%", label: "Happy Fans" },
];

const CATEGORIES = ["All", "Concert", "Sports", "Theatre", "Club"];

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

function EventCard({ event, delay = 0 }) {
  const ref = useReveal();
  const [imgError, setImgError] = useState(false);

  const tagColor =
    event.tag === "Almost Full"
      ? "bg-orange-100 text-orange-600"
      : event.tag === "Hot"
      ? "bg-red-100 text-red-600"
      : event.tag === "New"
      ? "bg-emerald-100 text-emerald-600"
      : "bg-red-50 text-red-500";

  return (
    <div
      ref={ref}
      className="reveal-card group bg-white rounded-2xl border border-gray-100 hover:border-red-200 shadow-sm hover:shadow-xl hover:shadow-red-50 transition-all duration-400 overflow-hidden cursor-pointer"
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Event Image */}
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-red-50 to-rose-100">
        {!imgError ? (
          <img
            src={event.image}
            alt={event.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🎟️</div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <span className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm ${tagColor}`}>
          {event.tag}
        </span>
        <span className="absolute bottom-3 left-3 text-white text-xs font-semibold bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
          {event.category}
        </span>
      </div>

      <div className="p-5">
        <h3 className="font-black text-gray-900 text-base mb-3 leading-snug">
          {event.title}
        </h3>
        <div className="flex flex-col gap-1 text-xs text-gray-500 mb-4">
          <span>📅 {event.date}</span>
          <span>📍 {event.venue}</span>
          <span className={`font-medium ${event.seats < 60 ? "text-orange-500" : "text-gray-400"}`}>
            {event.seats} seats left
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-red-600 font-black text-lg">{event.price}</span>
          <button className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-red-700 active:scale-95 transition-all duration-200">
            Book →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const heroRef = useReveal();
  const statsRef = useReveal();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleExplore = () => {
    if (user) navigate("/movies");
    else navigate("/login");
  };

  return (
    <main className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-0 pb-16">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-white-200 to-red-30 -z-10" />
        <div className="absolute top-32 -right-32 w-96 h-96 bg-red-100 rounded-full blur-3xl opacity-40 -z-10" />
        <div className="absolute bottom-0 -left-32 w-72 h-72 bg-rose-200 rounded-full blur-3xl opacity-30 -z-10" />

        <div ref={heroRef} className="reveal-hero max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-100 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-semibold text-red-600 tracking-wide">
              500+ Events Live Now
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-tight mb-6 tracking-tight">
            Your Seat.
            <br />
            <span className="text-red-600 relative">
              Your Moment.
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 300 12"
                fill="none"
              >
                <path
                  d="M2 8 Q75 2 150 8 Q225 14 298 8"
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
            Book tickets for concerts, sports, theatre, and more — instantly, seamlessly, and with zero hassle.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleExplore}
              className="bg-red-600 text-white font-bold px-8 py-4 rounded-full hover:bg-red-700 active:scale-95 transition-all duration-200 shadow-lg shadow-red-200 text-base"
            >
              Explore Events
            </button>
            <Link
  to="/about"
  className="bg-white text-gray-800 font-bold px-8 py-4 rounded-full 
             border border-gray-200 
             hover:bg-red-50 hover:text-red-600 hover:border-red-300 
             transition-all duration-200 text-base shadow-sm"
>
  Learn More
</Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gray-950">
        <div
          ref={statsRef}
          className="reveal-stats max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <p className="text-4xl font-black text-red-500 mb-1">{value}</p>
              <p className="text-sm text-gray-400 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Events */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <p className="text-sm text-red-500 font-bold uppercase tracking-widest mb-2">
                — Upcoming
              </p>
              <h2 className="text-4xl font-black text-gray-900">
                Hot Events
              </h2>
            </div>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className="text-xs font-semibold px-4 py-2 rounded-full border border-gray-200 hover:border-red-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {EVENTS.map((event, i) => (
              <EventCard key={event.id} event={event} delay={i * 60} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24 px-6 bg-red-600 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-red-500 rounded-full opacity-40" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-red-700 rounded-full opacity-40" />
        <div className="max-w-2xl mx-auto text-center relative">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Never Miss a Moment
          </h2>
          <p className="text-red-100 text-lg mb-8">
            Get early access to the hottest events before they sell out.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-5 py-3.5 rounded-full bg-white/15 border border-white/30 text-white placeholder-red-200 backdrop-blur-sm outline-none focus:border-white transition-colors text-sm"
            />
            <button className="bg-white text-red-600 font-black px-6 py-3.5 rounded-full hover:bg-red-50 active:scale-95 transition-all duration-200 text-sm whitespace-nowrap">
              Notify Me
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-10 px-6 text-center text-sm">
        <p className="mb-2">
          <span className="text-white font-black">Sync<span className="text-red-500">Seat</span></span>
        </p>
        <p>© 2025 SyncSeat. All rights reserved.</p>
      </footer>

      {/* Reveal Animations */}
      <style>{`
        .reveal-hero, .reveal-stats, .reveal-card {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .reveal-hero { opacity: 1; transform: translateY(0); transition-delay: 0.1s; }
        .revealed {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `}</style>
    </main>
  );
}