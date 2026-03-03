import { useState, useEffect } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();  // ← pull logout from context
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleBookNow = () => {
    if (user) navigate("/movies");
    else navigate("/login");
    setMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
    setMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-red-100"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center rotate-12 group-hover:rotate-0 transition-transform duration-300">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-9 4h2v2h-2V8zm0 4h2v2h-2v-2zM7 8h2v2H7V8zm0 4h2v2H7v-2zm-1 5l1.5-3h9L18 17H6zm11-5h-2v-2h2v2zm0-4h-2V8h2v2z" />
            </svg>
          </div>
          <span className="text-xl font-black tracking-tight text-gray-900">
            Sync<span className="text-red-600">Seat</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { to: "/", label: "Home" },
            { to: "/about", label: "About" },
          ].map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `text-sm font-semibold tracking-wide transition-colors duration-200 relative group ${
                  isActive ? "text-red-600" : "text-gray-600 hover:text-red-600"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {label}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-red-600 transition-all duration-300 ${
                      isActive ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </>
              )}
            </NavLink>
          ))}

          {/* ── Desktop: Logged In ── */}
          {user ? (
            <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
              {/* Avatar + name */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-black text-sm">
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  {user.name?.split(" ")[0] || "User"}
                </span>
              </div>

              <button
                onClick={handleBookNow}
                className="bg-red-600 text-white text-sm font-bold px-5 py-2 rounded-full hover:bg-red-700 active:scale-95 transition-all duration-200 shadow-md shadow-red-200"
              >
                Book Now
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-red-600 transition-colors duration-200"
                title="Logout"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          ) : (
            /* ── Desktop: Logged Out ── */
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-semibold text-gray-600 hover:text-red-600 transition-colors duration-200"
              >
                Sign In
              </Link>
              <button
                onClick={handleBookNow}
                className="bg-red-600 text-white text-sm font-bold px-5 py-2 rounded-full hover:bg-red-700 active:scale-95 transition-all duration-200 shadow-md shadow-red-200"
              >
                Book Now
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-1"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className={`block w-6 h-0.5 bg-gray-800 transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-6 h-0.5 bg-gray-800 transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block w-6 h-0.5 bg-gray-800 transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* ── Mobile Menu ── */}
      <div
        className={`md:hidden bg-white border-t border-red-50 overflow-hidden transition-all duration-400 ${
          menuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col px-6 py-4 gap-4">
          {[{ to: "/", label: "Home" }, { to: "/about", label: "About" }].map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `text-sm font-semibold ${isActive ? "text-red-600" : "text-gray-700"}`
              }
            >
              {label}
            </NavLink>
          ))}

          {user ? (
            <>
              {/* User info row */}
              <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-black text-xs">
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <span className="text-sm font-semibold text-gray-700 flex-1">
                  {user.name || "User"}
                </span>
              </div>

              <button
                onClick={handleBookNow}
                className="bg-red-600 text-white text-sm font-bold px-5 py-2 rounded-full text-center active:scale-95 transition-all"
              >
                Book Now
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 text-sm font-semibold text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 py-2 rounded-full transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleBookNow}
                className="bg-red-600 text-white text-sm font-bold px-5 py-2 rounded-full text-center active:scale-95 transition-all"
              >
                Book Now
              </button>
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="text-sm font-semibold text-gray-600 text-center hover:text-red-600 transition-colors"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}