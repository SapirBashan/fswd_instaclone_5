import React from "react";
import { Link } from "react-router-dom";
import Login from "../../../components/forms/auth/Login/Login";
import styles from "./LoginPage.module.css";

const LoginPage = ({ onLoginSuccess }) => {
  const {
    formData,
    error,
    isLoading,
    rememberMe,
    isCurrentUserLocked,
    handleChange,
    handleSubmit,
    setRememberMe,
    getButtonText,
  } = Login({ onLoginSuccess });

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginForm}>
        <h2 className={styles.heading}>Instagram Clone</h2>

        {error && (
          <p
            className={`${styles.errorMessage} ${
              isCurrentUserLocked() ? styles.lockError : ""
            }`}
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              className={styles.input}
              disabled={isLoading}
            />
          </div>

          <div className={styles.formGroup}>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className={styles.input}
              disabled={isLoading || isCurrentUserLocked()}
            />
          </div>

          <div className={styles.rememberMeContainer}>
            <label className={styles.rememberMeLabel}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className={styles.rememberMeCheckbox}
              />
              Remember me
            </label>
          </div>

          <button
            type="submit"
            className={styles.loginButton}
            disabled={isLoading || isCurrentUserLocked()}
          >
            {getButtonText()}
          </button>
        </form>

        <div className={styles.registerLink}>
          Don't have an account? <Link to="/register">Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
