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
  const [lockedAccounts, setLockedAccounts] = useState({});
  const [remainingTimes, setRemainingTimes] = useState({});

  // Check all account locks when component mounts
  useEffect(() => {
    checkAccountLocks();
  }, []);

  // Check if the current username is locked
  const isCurrentUserLocked = () => {
    return !!lockedAccounts[formData.username];
  };

  // Get the remaining time for the current user
  const getCurrentUserRemainingTime = () => {
    return remainingTimes[formData.username] || 0;
  };

  // Manage countdown timer for locked accounts
  useEffect(() => {
    let timer;
    const lockedUsernames = Object.keys(lockedAccounts);

    if (lockedUsernames.length > 0) {
      timer = setInterval(() => {
        const now = Date.now();
        const updatedLockedAccounts = { ...lockedAccounts };
        const updatedRemainingTimes = { ...remainingTimes };

        let needsUpdate = false;

        lockedUsernames.forEach((username) => {
          if (lockedAccounts[username] > now) {
            // Account still locked
            updatedRemainingTimes[username] = Math.ceil(
              (lockedAccounts[username] - now) / 1000
            );
            needsUpdate = true;
          } else {
            // Lock expired
            delete updatedLockedAccounts[username];
            delete updatedRemainingTimes[username];
            needsUpdate = true;

            // If this was the current username, clear the error
            if (username === formData.username) {
              setError("");
            }
          }
        });

        if (needsUpdate) {
          setLockedAccounts(updatedLockedAccounts);
          setRemainingTimes(updatedRemainingTimes);

          // Update localStorage to match our state
          if (Object.keys(updatedLockedAccounts).length > 0) {
            localStorage.setItem(
              "accountLocks",
              JSON.stringify(updatedLockedAccounts)
            );
          } else {
            localStorage.removeItem("accountLocks");
          }
        }
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [lockedAccounts, remainingTimes, formData.username]);

  // Form event handlers
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // If changing username, check if the new username is locked
    if (name === "username" && value && lockedAccounts[value]) {
      setError(
        `Account "${value}" is locked. Try again in ${remainingTimes[value]} seconds or use another account.`
      );
    } else if (name === "username") {
      setError(""); // Clear error when username changes to a non-locked account
    }
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

      if (isCurrentUserLocked()) {
        return `Account "${
          formData.username
        }" is locked. Try again in ${getCurrentUserRemainingTime()} seconds or use another account.`;
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

  // Registration handler - no changes needed
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

  // Security related utility functions - updated for multi-account support
  const checkAccountLocks = () => {
    const locksData = localStorage.getItem("accountLocks");

    if (!locksData) return;

    try {
      const locks = JSON.parse(locksData);
      const now = Date.now();
      const currentLocks = {};
      const currentTimes = {};

      Object.keys(locks).forEach((username) => {
        const lockTime = locks[username];

        if (lockTime > now) {
          // Account still locked
          currentLocks[username] = lockTime;
          currentTimes[username] = Math.ceil((lockTime - now) / 1000);

          // If this is the current username, show error
          if (username === formData.username) {
            setError(
              `Account "${username}" is locked. Try again in ${currentTimes[username]} seconds or use another account.`
            );
          }
        }
      });

      setLockedAccounts(currentLocks);
      setRemainingTimes(currentTimes);

      // Clean up expired locks in localStorage
      if (Object.keys(currentLocks).length !== Object.keys(locks).length) {
        if (Object.keys(currentLocks).length > 0) {
          localStorage.setItem("accountLocks", JSON.stringify(currentLocks));
        } else {
          localStorage.removeItem("accountLocks");
        }
      }
    } catch (e) {
      console.error("Error parsing account locks data:", e);
      localStorage.removeItem("accountLocks"); // Clear potentially corrupted data
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
      const lockTime = Date.now() + minutes * 60 * 1000;

      // Update our state
      setLockedAccounts((prev) => ({
        ...prev,
        [username]: lockTime,
      }));

      setRemainingTimes((prev) => ({
        ...prev,
        [username]: minutes * 60,
      }));

      // Update localStorage
      const locksData = localStorage.getItem("accountLocks");
      const locks = locksData ? JSON.parse(locksData) : {};

      locks[username] = lockTime;
      localStorage.setItem("accountLocks", JSON.stringify(locks));

      // Set error message
      setError(
        `Too many failed attempts. Account "${username}" locked for ${minutes} minutes.`
      );
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
      </>
    ) : (
      // Registration form fields - unchanged
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
    if (isCurrentUserLocked()) {
      return "Account Locked";
    }
    return mode === "login" ? "Log In" : "Sign Up";
  };

  // Submit button - now only disabled if the current username is locked
  const submitButton = (
    <button
      type="submit"
      className={styles.submitButton}
      disabled={isLoading || isCurrentUserLocked()}
    >
      {getButtonText()}
    </button>
  );

  // Redirect link to alternate auth mode - unchanged
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
