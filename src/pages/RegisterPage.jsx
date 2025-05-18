import React, { useState } from "react";
import { Link } from "react-router-dom";
import { UserAPI } from "../utils/ServerDB";
import { UserStorage } from "../utils/LocalStorage";
import style from "./RegisterPage.module.css";

const RegisterPage = ({ onRegisterSuccess }) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    name: "", // Added name field for user profile
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    for (const key in formData) {
      if (key !== "name" && !formData[key].trim()) {
        // Name can be optional
        setError("All fields are required");
        return;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      // Check if username already exists
      const existingUser = await UserAPI.getByUsername(formData.username);

      if (existingUser) {
        setError("Username already taken");
        setIsLoading(false);
        return;
      }

      // Create new user with UserAPI
      const newUser = await UserAPI.create({
        username: formData.username,
        email: formData.email,
        website: formData.password, // Store password in website field for this demo
        name: formData.name || formData.username, // Use username as name if not provided
      });

      console.log("Registration successful", newUser);

      // Save user data to local storage
      UserStorage.saveUser(
        {
          id: newUser.id,
          username: newUser.username,
          name: newUser.name,
          email: newUser.email,
        },
        true
      ); // Default to "remember me" for new registrations

      // Notify parent of successful registration
      onRegisterSuccess();
    } catch (error) {
      console.error("Registration error:", error);
      setError("Error creating account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={style.registerContainer}>
      <div className={style.registerForm}>
        <h2 className={style.heading}>Create an Account</h2>
        {error && <p className={style.errorMessage}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className={style.formGroup}>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              className={style.input}
              disabled={isLoading}
            />
          </div>

          <div className={style.formGroup}>
            <input
              type="text"
              name="name"
              placeholder="Full Name (optional)"
              value={formData.name}
              onChange={handleChange}
              className={style.input}
              disabled={isLoading}
            />
          </div>

          <div className={style.formGroup}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className={style.input}
              disabled={isLoading}
            />
          </div>

          <div className={style.formGroup}>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className={style.input}
              disabled={isLoading}
            />
          </div>

          <div className={style.formGroup}>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={style.input}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className={style.registerButton}
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <div className={style.loginLink}>
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
