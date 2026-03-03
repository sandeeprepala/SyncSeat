import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add("revealed"); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

const TEAM = [
  {
    name: "Aryan Mehta",
    role: "Founder & CEO",
    bio: "Former SDE at Flipkart. Loves live music and hates FOMO.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face&q=80",
  },
  {
    name: "Priya Nair",
    role: "Head of Design",
    bio: "Ex-Google designer. Makes boring things look beautiful.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face&q=80",
  },
  {
    name: "Rahul Gupta",
    role: "Lead Engineer",
    bio: "Backend wizard. Writes code that doesn't crash at 3am.",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face&q=80",
  },
  {
    name: "Sara Khan",
    role: "Growth & Marketing",
    bio: "Grew 3 startups from 0 to 1. SyncSeat is next.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face&q=80",
  },
];

const VALUES = [
  { icon: "⚡", title: "Instant Booking", desc: "Zero friction from browsing to seat confirmation." },
  { icon: "🛡️", title: "Secure Payments", desc: "Bank-grade encryption on every transaction." },
  { icon: "🎯", title: "Smart Picks", desc: "Personalized event suggestions tailored for you." },
  { icon: "💬", title: "Real Support", desc: "Humans available 24/7 — not just bots." },
];

const TIMELINE = [
  { year: "2022", event: "SyncSeat founded in a Mumbai apartment." },
  { year: "2023", event: "First 10,000 tickets sold across 5 cities." },
  { year: "2024", event: "Expanded to 150+ cities. Series A raised." },
  { year: "2025", event: "2M+ tickets. The journey continues." },
];

export default function About() {
  const heroRef = useReveal();
  const valuesRef = useReveal();
  const teamRef = useReveal();
  const timelineRef = useReveal();

  return (
    <main className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center px-6 pt-28 pb-16 bg-gradient-to-br from-white via-red-50/30 to-rose-100/40">
        <div className="absolute top-20 right-0 w-80 h-80 bg-red-100 rounded-full blur-3xl opacity-40 -z-10" />
        <div
          ref={heroRef}
          className="max-w-3xl mx-auto text-center"
          style={{ opacity: 1, transform: "translateY(0)", transition: "none" }}
        >
          <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-4">
            — Who We Are
          </p>
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 leading-tight mb-6">
            We Sync You <br />
            <span className="text-red-600">to the Moment</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
            SyncSeat was built for people who know that the best memories aren't planned — they're booked. We make getting there effortless.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-2 text-center">
            — What Drives Us
          </p>
          <h2 className="text-4xl font-black text-gray-900 text-center mb-14">
            Our Principles
          </h2>
          <div
            ref={valuesRef}
            className="reveal-section grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            {VALUES.map(({ icon, title, desc }) => (
              <div
                key={title}
                className="group flex gap-5 p-6 rounded-2xl border border-gray-100 hover:border-red-200 hover:shadow-lg hover:shadow-red-50 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:bg-red-100 transition-colors">
                  {icon}
                </div>
                <div>
                  <h3 className="font-black text-gray-900 mb-1">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 px-6 bg-gray-950">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-2 text-center">
            — Our Journey
          </p>
          <h2 className="text-4xl font-black text-white text-center mb-14">
            The Story So Far
          </h2>
          <div ref={timelineRef} className="reveal-section relative pl-8">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-red-900" />
            <div className="flex flex-col gap-10">
              {TIMELINE.map(({ year, event }) => (
                <div key={year} className="relative">
                  <div className="absolute -left-8 top-1 w-3.5 h-3.5 rounded-full bg-red-600 ring-4 ring-red-900/40" />
                  <p className="text-xs font-black text-red-500 uppercase tracking-widest mb-1">
                    {year}
                  </p>
                  <p className="text-gray-300 text-base leading-relaxed">{event}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-2 text-center">
            — The People
          </p>
          <h2 className="text-4xl font-black text-gray-900 text-center mb-14">
            Meet the Team
          </h2>
          <div
            ref={teamRef}
            className="reveal-section grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {TEAM.map(({ name, role, image, bio }) => (
  <div
    key={name}
    className="group text-center p-6 rounded-2xl border border-gray-100 hover:border-red-200 hover:shadow-lg hover:shadow-red-50 transition-all duration-300"
  >
    <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 ring-4 ring-red-50 group-hover:ring-red-200 transition-all duration-300">
      <img
        src={image}
        alt={name}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        onError={(e) => {
          e.target.style.display = "none";
          e.target.parentElement.classList.add("bg-red-50", "flex", "items-center", "justify-center", "text-2xl");
          e.target.parentElement.innerHTML = "👤";
        }}
      />
    </div>
    <h3 className="font-black text-gray-900 text-base">{name}</h3>
    <p className="text-xs text-red-500 font-semibold mb-3">{role}</p>
    <p className="text-xs text-gray-500 leading-relaxed">{bio}</p>
  </div>
))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-red-600 text-center">
        <h2 className="text-4xl font-black text-white mb-4">
          Ready to Sync Up?
        </h2>
        <p className="text-red-100 text-lg mb-8 max-w-md mx-auto">
          Thousands of events. One tap away.
        </p>
        <Link
          to="/"
          className="inline-block bg-white text-red-600 font-black px-10 py-4 rounded-full hover:bg-red-50 active:scale-95 transition-all duration-200 shadow-xl text-base"
        >
          Browse Events →
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-10 px-6 text-center text-sm">
        <p className="mb-2">
          <span className="text-white font-black">Sync<span className="text-red-500">Seat</span></span>
        </p>
        <p>© 2025 SyncSeat. All rights reserved.</p>
      </footer>

      <style>{`
        .reveal-section {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .revealed {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `}</style>
    </main>
  );
}