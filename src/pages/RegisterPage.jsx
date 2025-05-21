import React from "react";
import Auth from "../components/Auth";

const RegisterPage = ({ onRegisterSuccess }) => {
  // Define all props in a single object for cleaner code
  const authProps = {
    mode: "register",
    onSuccess: onRegisterSuccess,
    title: "Create an Account",
    redirectLabel: "Already have an account?",
    redirectLinkText: "Log in",
    redirectPath: "/login",
  };

  // Clean, concise return
  return <Auth {...authProps} />;
};

export default RegisterPage;
