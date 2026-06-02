import { Link } from "react-router-dom";

function Navbar() {

  return (

    <nav className="navbar">

      <div className="logo">

        AI Attendance System

      </div>

      <div className="nav-links">

        <Link to="/">
          Dashboard
        </Link>

        <Link to="/register">
          Register
        </Link>

        <Link to="/attendance">
          Attendance
        </Link>

        <Link to="/students">
          Students
        </Link>

      </div>

    </nav>

  );

}

export default Navbar;