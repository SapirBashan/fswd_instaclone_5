import React, { useState } from "react";
import { Link } from "react-router-dom";
import style from "./LoginPage.module.css"; 

const LoginPage = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!username.trim() || !password.trim()) {
      setError("All fields are required");
      return;
    }

    // In a real app, you would call an API here
    // For now, we'll simulate a successful login
    setTimeout(() => {
      onLoginSuccess();
    }, 1000);
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