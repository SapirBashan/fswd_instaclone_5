import React, { useState } from "react";
import { Link } from "react-router-dom";
import style from "./LoginPage.module.css";

const LoginPage = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate inputs
    if (!username.trim() || !password.trim()) {
      setError("All fields are required");
      return;
    }

    try {
      // Set loading state if needed
      setError("");

      // Fetch users from your local JSON server
      const response = await fetch("http://localhost:3000/users");

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const users = await response.json();

      // Find user with matching username and password
      const user = users.find(
        (user) => user.username === username && user.website === password
      );

      if (user) {
        // User found, login successful
        console.log("Login successful", user);

        // Store user data in localStorage if needed
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: user.id,
            username: user.username,
            // Don't store password in localStorage!
          })
        );

        // Call the login success handler passed from parent
        onLoginSuccess();
      } else {
        // No matching user found
        setError("Invalid username or password");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Error connecting to the server. Please try again.");
    }
  };

  return (
    <div className={style.loginContainer}>
      <div className={style.loginForm}>
        <h2 className={style.heading}>Instagram Clone</h2>
        {error && <p className={style.errorMessage}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className={style.formGroup}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={style.input}
            />
          </div>

          <div className={style.formGroup}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={style.input}
            />
          </div>

          <button type="submit" className={style.loginButton}>
            Log In
          </button>
        </form>

        <div className={style.registerLink}>
          Don't have an account? <Link to="/register">Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
