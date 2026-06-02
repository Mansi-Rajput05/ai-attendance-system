import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";

import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";
import Attendance from "./pages/Attendance";
import Students from "./pages/Students";

function App() {

  return (
    <BrowserRouter>

      <Navbar />

      <Routes>

        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/attendance"
          element={<Attendance />}
        />

        <Route
          path="/students"
          element={<Students />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;