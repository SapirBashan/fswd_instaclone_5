import React from "react";
import Auth from "../components/Auth";

const LoginPage = ({ onLoginSuccess }) => {
  // Define all props in a single object for cleaner code
  const authProps = {
    mode: "login",
    onSuccess: onLoginSuccess,
    title: "Instagram Clone",
    redirectLabel: "Don't have an account?",
    redirectLinkText: "Sign up",
    redirectPath: "/register"
  };

  // Clean, concise return
  return <Auth {...authProps} />;
};

export default LoginPage;