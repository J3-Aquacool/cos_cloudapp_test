import React from "react";
import { useNavigate } from "react-router-dom";

const LogoutPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear local storage or session data
    localStorage.clear();
    alert("You have been logged out successfully!");

    // Navigate to login page
    navigate("/", { replace: true });
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Thank you for your participation in the Survey!</h2>
      <button
        onClick={handleLogout}
        style={{
          padding: "10px 20px",
          backgroundColor: "#007BFF",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default LogoutPage;
