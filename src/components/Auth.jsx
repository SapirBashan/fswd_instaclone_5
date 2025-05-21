import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { UserAPI } from "../utils/ServerDB";
import { UserStorage } from "../utils/LocalStorage";
import styles from "./Auth.module.css";

const Auth = ({
  mode = "login", // "login" or "register"
  onSuccess,
  title,
  redirectLabel,
  redirectLinkText,
  redirectPath,
}) => {
  // Initialize form data based on mode
  const [formData, setFormData] = useState(
    mode === "login"
      ? { username: "", password: "" }
      : {
          username: "",
          email: "",
          password: "",
          confirmPassword: "",
          name: "",
        }
  );

  // General state
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Security-related state
  const [isAccountLocked, setIsAccountLocked] = useState(false);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);

  // Check account lock status when component mounts or username changes
  useEffect(() => {
    if (mode === "login" && formData.username.trim()) {
      checkAccountLock(formData.username);
    }
  }, [mode, formData.username]);

  // Manage countdown timer for locked accounts
  useEffect(() => {
    let timer;
    if (isAccountLocked && remainingTime > 0) {
      timer = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsAccountLocked(false);
            localStorage.removeItem("accountLock");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAccountLocked, remainingTime]);

  // Form event handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form before submission
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      if (mode === "login") {
        await handleLogin();
      } else {
        await handleRegistration();
      }
    } catch (error) {
      console.error(`${mode} error:`, error);
      setError(`Error during ${mode}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Form validation
  const validateForm = () => {
    if (mode === "login") {
      if (!formData.username.trim() || !formData.password.trim()) {
        return "All fields are required";
      }

      if (isAccountLocked) {
        return `Account is locked. Try again in ${remainingTime} seconds.`;
      }
    } else {
      // Registration validation
      const requiredFields = [
        "username",
        "email",
        "password",
        "confirmPassword",
      ];
      const missingFields = requiredFields.filter(
        (field) => !formData[field].trim()
      );

      if (missingFields.length > 0) {
        return "All fields except Name are required";
      }

      if (formData.password !== formData.confirmPassword) {
        return "Passwords don't match";
      }

      // Add more validation as needed (password strength, email format, etc.)
    }

    return null; // No validation errors
  };

  // Login handler
  const handleLogin = async () => {
    const result = await UserAPI.login(formData.username, formData.password);

    if (result.success) {
      // Successful login - reset any failed attempts
      resetFailedAttempts(formData.username);

      UserStorage.saveUser(
        {
          id: result.user.id,
          username: result.user.username,
          name: result.user.name,
          email: result.user.email,
        },
        rememberMe
      );

      onSuccess();
    } else {
      // Count failed attempts and handle security measures
      handleFailedLoginAttempt(formData.username);
    }
  };

  // Registration handler
  const handleRegistration = async () => {
    // Check if username already exists
    const existingUser = await UserAPI.getByUsername(formData.username);

    if (existingUser) {
      setError("Username already taken");
      return;
    }

    // Create new user
    const newUser = await UserAPI.create({
      username: formData.username,
      email: formData.email,
      website: formData.password, // Using website field to store password
      name: formData.name || formData.username,
    });

    // Save new user to local storage
    UserStorage.saveUser(
      {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
      },
      true // Always remember new registrations
    );

    // Complete registration
    onSuccess();
  };

  // Security related utility functions
  const checkAccountLock = (username) => {
    const lockData = localStorage.getItem("accountLock");

    if (!lockData) return;

    try {
      const { username: lockedUser, until } = JSON.parse(lockData);
      const currentTime = Date.now();

      if (username === lockedUser && until > currentTime) {
        setIsAccountLocked(true);
        setLockedUntil(until);
        setRemainingTime(Math.ceil((until - currentTime) / 1000));
      } else if (until < currentTime && username === lockedUser) {
        // Lock expired, clear it
        localStorage.removeItem("accountLock");
        setIsAccountLocked(false);
      }
    } catch (e) {
      console.error("Error parsing account lock data:", e);
      localStorage.removeItem("accountLock"); // Clear potentially corrupted data
    }
  };

  const getFailedAttempts = (username) => {
    try {
      const attemptsData = localStorage.getItem("loginAttempts");
      if (!attemptsData) return 0;

      const attempts = JSON.parse(attemptsData);
      return attempts[username] || 0;
    } catch (e) {
      console.error("Error getting failed attempts:", e);
      return 0;
    }
  };

  const recordFailedAttempt = (username) => {
    try {
      const attemptsData = localStorage.getItem("loginAttempts");
      const attempts = attemptsData ? JSON.parse(attemptsData) : {};

      // Increment attempts for this username
      attempts[username] = (attempts[username] || 0) + 1;
      localStorage.setItem("loginAttempts", JSON.stringify(attempts));

      return attempts[username];
    } catch (e) {
      console.error("Error recording failed attempt:", e);
      return 1;
    }
  };

  const resetFailedAttempts = (username) => {
    try {
      const attemptsData = localStorage.getItem("loginAttempts");
      if (attemptsData) {
        const attempts = JSON.parse(attemptsData);
        if (attempts[username]) {
          delete attempts[username];
          localStorage.setItem("loginAttempts", JSON.stringify(attempts));
        }
      }
    } catch (e) {
      console.error("Error resetting failed attempts:", e);
    }
  };

  const lockAccount = (username, minutes) => {
    try {
      const until = Date.now() + minutes * 60 * 1000;
      localStorage.setItem(
        "accountLock",
        JSON.stringify({
          username,
          until,
        })
      );
      setIsAccountLocked(true);
      setLockedUntil(until);
      setRemainingTime(minutes * 60);
    } catch (e) {
      console.error("Error locking account:", e);
    }
  };

  const handleFailedLoginAttempt = (username) => {
    // Record the failed attempt and get the total count
    const attempts = recordFailedAttempt(username);

    // Apply progressive security measures based on attempt count
    if (attempts >= 5) {
      // Lock account for 5 minutes after 5 failed attempts
      lockAccount(username, 5);
      setError("Too many failed attempts. Account locked for 5 minutes.");
    } else if (attempts >= 3) {
      // Warning after 3 failed attempts
      setError(
        `Warning: ${attempts} failed login attempts. Account will be locked after 5 attempts.`
      );
    } else {
      // Standard error for initial failures
      setError("Invalid username or password");
    }
  };

  // Pre-defined JSX elements for cleaner return statement
  const errorElement = error && (
    <p
      className={`${styles.errorMessage} ${
        isAccountLocked ? styles.lockError : ""
      }`}
    >
      {error}
    </p>
  );

  // Form fields based on authentication mode
  const formFields =
    mode === "login" ? (
      // Login form fields
      <>
        <div className={styles.formGroup}>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            className={styles.input}
            disabled={isLoading || isAccountLocked}
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
            disabled={isLoading || isAccountLocked}
          />
        </div>
      </>
    ) : (
      // Registration form fields
      <>
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
            type="text"
            name="name"
            placeholder="Full Name (optional)"
            value={formData.name}
            onChange={handleChange}
            className={styles.input}
            disabled={isLoading}
          />
        </div>
        <div className={styles.formGroup}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
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
            disabled={isLoading}
          />
        </div>
        <div className={styles.formGroup}>
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={styles.input}
            disabled={isLoading}
          />
        </div>
      </>
    );

  // Remember me checkbox (only for login)
  const rememberMeElement = mode === "login" && (
    <div className={styles.rememberMeContainer}>
      <label className={styles.rememberMeLabel}>
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className={styles.rememberMeCheckbox}
          disabled={isAccountLocked}
        />
        Remember me
      </label>
    </div>
  );

  // Dynamic submit button text based on state
  const getButtonText = () => {
    if (isLoading) {
      return mode === "login" ? "Logging in..." : "Creating Account...";
    }
    if (isAccountLocked) {
      return "Account Locked";
    }
    return mode === "login" ? "Log In" : "Sign Up";
  };

  // Submit button
  const submitButton = (
    <button
      type="submit"
      className={styles.submitButton}
      disabled={isLoading || isAccountLocked}
    >
      {getButtonText()}
    </button>
  );

  // Redirect link to alternate auth mode
  const redirectElement = (
    <div className={styles.redirectLink}>
      {redirectLabel} <Link to={redirectPath}>{redirectLinkText}</Link>
    </div>
  );

  // Return clean, structured JSX
  return (
    <div className={styles.authContainer}>
      <div className={styles.authForm}>
        <h2 className={styles.heading}>{title}</h2>
        {errorElement}

        <form onSubmit={handleSubmit}>
          {formFields}
          {rememberMeElement}
          {submitButton}
        </form>

        {redirectElement}
      </div>
    </div>
  );
};

export default Auth;
