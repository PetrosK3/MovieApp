
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      alert("Unable to logout. Please try again.");
    }
  };

  return (
    <nav className="navbar">

      <Link to="/" className="navbar-brand">
        🎬 Movie App
      </Link>

      <div className="navbar-links">

        <Link to="/" className="navbar-link">
          Home
        </Link>

        {isAuthenticated ? (
          <>
            <span className="navbar-user">
              Welcome, {user.username}
              {isAdmin && " (Admin)"}
            </span>

            <button
              className="navbar-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="navbar-link">
              Login
            </Link>

            <Link to="/register" className="navbar-register">
              Register
            </Link>
          </>
        )}

      </div>

    </nav>
  );
}

export default Navbar;
