import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserAPI } from "../../../../utils/ServerDB";
import { UserStorage } from "../../../../utils/LocalStorage";

const Register = ({ onRegisterSuccess }) => {
  const navigate = useNavigate();

  // State
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const requiredFields = ["username", "email", "password", "confirmPassword"];
    const missingFields = requiredFields.filter(
      (field) => !formData[field].trim()
    );

    if (missingFields.length > 0) {
      return "All fields except Name are required";
    }

    if (formData.password !== formData.confirmPassword) {
      return "Passwords don't match";
    }

    // Email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formData.email)) {
      return "Please enter a valid email address";
    }

    // Password strength check
    if (formData.password.length < 6) {
      return "Password must be at least 6 characters long";
    }

    return null; // No validation errors
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      // Check if username exists
      const existingUser = await UserAPI.checkExists(formData.username);
      if (existingUser) {
        setError("Username already taken");
        setIsLoading(false);
        return;
      }

      // Create user with full structure but minimal data
      const newUser = await UserAPI.create({
        username: formData.username,
        email: formData.email,
        website: formData.password, // Store password in website field (temporary)
        name: formData.name || formData.username,
        address: {
          street: "",
          suite: "",
          city: "",
          zipcode: "",
          geo: {
            lat: "",
            lng: "",
          },
        },
        phone: "",
        company: {
          name: "",
          catchPhrase: "",
          bs: "",
        },
      });

      // Save user to localStorage
      UserStorage.saveUser(
        {
          id: newUser.id,
          username: newUser.username,
          name: newUser.name,
          email: newUser.email,
        },
        true
      );

      // Call the success handler first to update authentication state
      onRegisterSuccess();

      // Then navigate to profile completion
      setTimeout(() => {
        navigate(`/complete-profile/${newUser.id}`);
      }, 100);
    } catch (error) {
      console.error("Registration error:", error);
      setError("Error creating account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    error,
    isLoading,
    handleChange,
    handleSubmit,
  };
};

export default Register;
