import { Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Movies from "./pages/Movies";
import Shows from "./pages/Shows";
import SeatLayout from "./pages/SeatLayout";
import ConfirmBooking from "./pages/ConfirmBooking";

function Layout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Routes WITH navbar */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/shows/:movieId" element={<Shows />} />
          <Route path="/seatlayout/:showId" element={<SeatLayout />} />
          <Route path="/confirm-booking" element={<ConfirmBooking />} />
        </Route>

        {/* Auth pages — NO navbar */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </AuthProvider>
  );
}