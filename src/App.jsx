import { useState } from "react";
import "./App.css";
import LoginPage from "./pages/LoginPage";
import { Routes, Route, Navigate } from "react-router-dom";
import SideNav from "./components/SideNev";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Authentication handlers
  const handleLogin = () => {
    setIsAuthenticated(true);
  };
  
  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  // Protected route wrapper component
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    
    return (
      <div className="app-container">
        <SideNav onLogout={handleLogout} />
        <div className="content-area">
          {children}
        </div>
      </div>
    );
  };

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? 
          <Navigate to="/" /> : 
          <LoginPage onLoginSuccess={handleLogin} />
      } />
      
      <Route path="/register" element={
        isAuthenticated ? 
          <Navigate to="/" /> : 
          <RegisterPage onRegisterSuccess={handleLogin} />
      } />
      
      <Route path="/" element={
        <ProtectedRoute>
          <HomePage />
        </ProtectedRoute>
      } />
      
      {/* Add more protected routes as needed */}
      <Route path="/posts" element={
        <ProtectedRoute>
          <div>Posts Page</div>
        </ProtectedRoute>
      } />

      <Route path="/albums" element={
        <ProtectedRoute>
          <div>Albums Page</div>
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
    </Routes>
  );
}

export default App;