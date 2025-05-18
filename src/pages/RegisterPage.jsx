import React, { useState } from "react";
import { Link } from "react-router-dom";
import style from "./RegisterPage.module.css";

const RegisterPage = ({ onRegisterSuccess }) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    for (const key in formData) {
      if (!formData[key].trim()) {
        setError("All fields are required");
        return;
      }
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    // In a real app, you would call an API here
    // For now, we'll simulate a successful registration
    setTimeout(() => {
      onRegisterSuccess();
    }, 1000);
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
            />
          </div>
          
          <button type="submit" className={style.registerButton}>
            Sign Up
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