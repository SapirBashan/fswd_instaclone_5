import React, { useState, useEffect } from "react";
import { UserAPI } from "../../../../utils/ServerDB";
import { UserStorage } from "../../../../utils/LocalStorage";

const Login = ({ onLoginSuccess }) => {
  // State
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Security-related state
  const [lockedAccounts, setLockedAccounts] = useState({});
  const [remainingTimes, setRemainingTimes] = useState({});

  // Check account locks on mount
  useEffect(() => {
    checkAccountLocks();
    cleanupExpiredAttempts(); // Clean expired attempts on mount
  }, []);

  // Timer for locked accounts and cleanup
  useEffect(() => {
    const timer = setupLockCountdownTimer();
    const cleanupTimer = setupCleanupTimer();

    return () => {
      if (timer) clearInterval(timer);
      if (cleanupTimer) clearInterval(cleanupTimer);
    };
  }, [lockedAccounts, remainingTimes, formData.username]);

  // Setup cleanup timer for expired attempts (runs every minute)
  const setupCleanupTimer = () => {
    return setInterval(() => {
      cleanupExpiredAttempts();
    }, 60000); // Check every minute
  };

  // Clean up expired login attempts (older than 5 minutes)
  const cleanupExpiredAttempts = () => {
    try {
      const attemptsData = localStorage.getItem("loginAttempts");
      if (!attemptsData) return;

      const attempts = JSON.parse(attemptsData);
      const now = Date.now();
      const fiveMinutesInMs = 5 * 60 * 1000;
      let hasChanges = false;

      // Create new attempts object without expired entries
      const cleanedAttempts = {};

      Object.keys(attempts).forEach((username) => {
        const attemptData = attempts[username];

        // Handle old format (just numbers) by converting to new format
        if (typeof attemptData === "number") {
          // If it's just a number, it's old data - remove it
          hasChanges = true;
          return;
        }

        // Handle new format with timestamp
        if (attemptData && attemptData.timestamp) {
          if (now - attemptData.timestamp < fiveMinutesInMs) {
            // Keep non-expired attempts
            cleanedAttempts[username] = attemptData;
          } else {
            // This attempt has expired
            hasChanges = true;
          }
        }
      });

      if (hasChanges) {
        if (Object.keys(cleanedAttempts).length > 0) {
          localStorage.setItem(
            "loginAttempts",
            JSON.stringify(cleanedAttempts)
          );
        } else {
          localStorage.removeItem("loginAttempts");
        }
      }
    } catch (e) {
      console.error("Error cleaning up expired attempts:", e);
      localStorage.removeItem("loginAttempts");
    }
  };

  // Check if current username is locked
  const isCurrentUserLocked = () => {
    return !!lockedAccounts[formData.username];
  };

  const getCurrentUserRemainingTime = () => {
    return remainingTimes[formData.username] || 0;
  };

  const setupLockCountdownTimer = () => {
    const lockedUsernames = Object.keys(lockedAccounts);
    if (lockedUsernames.length === 0) return null;

    return setInterval(() => {
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

          if (username === formData.username) {
            setError(""); // Clear error if this was the current username
          }
        }
      });

      if (needsUpdate) {
        setLockedAccounts(updatedLockedAccounts);
        setRemainingTimes(updatedRemainingTimes);

        // Update localStorage
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
  };

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
    } catch (e) {
      console.error("Error parsing account locks data:", e);
      localStorage.removeItem("accountLocks");
    }
  };

  // Security functions with improved timestamp tracking
  const getFailedAttempts = (username) => {
    try {
      const attemptsData = localStorage.getItem("loginAttempts");
      if (!attemptsData) return 0;

      const attempts = JSON.parse(attemptsData);
      const attemptData = attempts[username];

      if (!attemptData) return 0;

      // Handle old format (just numbers)
      if (typeof attemptData === "number") {
        return attemptData;
      }

      // Handle new format with timestamp
      if (attemptData.timestamp && attemptData.count) {
        const now = Date.now();
        const fiveMinutesInMs = 5 * 60 * 1000;

        // Check if attempts have expired
        if (now - attemptData.timestamp > fiveMinutesInMs) {
          // Expired, remove this entry
          delete attempts[username];
          localStorage.setItem("loginAttempts", JSON.stringify(attempts));
          return 0;
        }

        return attemptData.count;
      }

      return 0;
    } catch (e) {
      console.error("Error getting failed attempts:", e);
      return 0;
    }
  };

  const recordFailedAttempt = (username) => {
    try {
      const attemptsData = localStorage.getItem("loginAttempts");
      const attempts = attemptsData ? JSON.parse(attemptsData) : {};
      const now = Date.now();

      // Get current attempts (with expiration check)
      const currentAttempts = getFailedAttempts(username);
      const newCount = Math.min(currentAttempts + 1, 5); // Cap at 5 attempts max

      // Store with timestamp
      attempts[username] = {
        count: newCount,
        timestamp: now,
      };

      localStorage.setItem("loginAttempts", JSON.stringify(attempts));
      return newCount;
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

          if (Object.keys(attempts).length > 0) {
            localStorage.setItem("loginAttempts", JSON.stringify(attempts));
          } else {
            localStorage.removeItem("loginAttempts");
          }
        }
      }
    } catch (e) {
      console.error("Error resetting failed attempts:", e);
    }
  };

  const lockAccount = (username, minutes) => {
    try {
      const lockTime = Date.now() + minutes * 60 * 1000;
      setLockedAccounts((prev) => ({ ...prev, [username]: lockTime }));
      setRemainingTimes((prev) => ({ ...prev, [username]: minutes * 60 }));

      // Update localStorage
      const locksData = localStorage.getItem("accountLocks");
      const locks = locksData ? JSON.parse(locksData) : {};
      locks[username] = lockTime;
      localStorage.setItem("accountLocks", JSON.stringify(locks));

      setError(
        `Too many failed attempts. Account "${username}" locked for ${minutes} minutes.`
      );
    } catch (e) {
      console.error("Error locking account:", e);
    }
  };

  const handleFailedLoginAttempt = (username) => {
    const attempts = recordFailedAttempt(username);
    if (attempts >= 5) {
      lockAccount(username, 5);
    } else if (attempts >= 3) {
      setError(
        `Warning: ${attempts} failed login attempts. Account will be locked after 5 attempts.`
      );
    } else {
      setError("Invalid username or password");
    }
  };

  // Form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Check if changing to a locked username
    if (name === "username" && value && lockedAccounts[value]) {
      setError(
        `Account "${value}" is locked. Try again in ${remainingTimes[value]} seconds or use another account.`
      );
    } else if (name === "username") {
      setError(""); // Clear error when username changes
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.username.trim() || !formData.password.trim()) {
      setError("Username and password are required");
      return;
    }

    if (isCurrentUserLocked()) {
      setError(
        `Account "${
          formData.username
        }" is locked. Try again in ${getCurrentUserRemainingTime()} seconds or use another account.`
      );
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      const result = await UserAPI.login(formData.username, formData.password);

      if (result.success) {
        // Success: Reset failed attempts for this user
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
        onLoginSuccess();
      } else {
        handleFailedLoginAttempt(formData.username);
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Error during login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Dynamic button text
  const getButtonText = () => {
    if (isLoading) return "Logging in...";
    if (isCurrentUserLocked()) return "Account Locked";
    return "Log In";
  };

  return {
    formData,
    error,
    isLoading,
    rememberMe,
    isCurrentUserLocked,
    handleChange,
    handleSubmit,
    setRememberMe,
    getButtonText,
  };
};

export default Login;
