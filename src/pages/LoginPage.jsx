import React, { useState } from "react";
import { Link } from "react-router-dom";
import { UserAPI } from "../utils/ServerDB";
import { UserStorage } from "../utils/LocalStorage";
import style from "./LoginPage.module.css";

const LoginPage = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate inputs
    if (!username.trim() || !password.trim()) {
      setError("All fields are required");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      // Use the UserAPI login method from ServerDB utility
      const result = await UserAPI.login(username, password);

      if (result.success) {
        // Login successful
        console.log("Login successful", result.user);

        // Use UserStorage utility to save user data
        UserStorage.saveUser({
          id: result.user.id,
          username: result.user.username,
          name: result.user.name,
          email: result.user.email,
        }, rememberMe); // Pass rememberMe option

        // Call the login success handler passed from parent
        onLoginSuccess();
      } else {
        // Authentication failed
        setError(result.message || "Invalid username or password");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Error connecting to the server. Please try again.");
    } finally {
      setIsLoading(false);
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
              disabled={isLoading}
            />
          </div>

          <div className={style.formGroup}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={style.input}
              disabled={isLoading}
            />
          </div>
          
          <div className={style.rememberMeContainer}>
            <label className={style.rememberMeLabel}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className={style.rememberMeCheckbox}
              />
              Remember me
            </label>
          </div>

          <button 
            type="submit" 
            className={style.loginButton}
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Log In"}
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