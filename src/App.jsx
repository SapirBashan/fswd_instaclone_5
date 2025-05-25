import { useState, useEffect } from "react";
import "./App.css";
import LoginPage from "./pages/LoginPage";
import { Routes, Route, Navigate } from "react-router-dom";
import SideNav from "./components/SideNev";
import RegisterPage from "./pages/RegisterPage";
import ProfileCompletionPage from "./pages/ProfileCompletionPage";
import HomePage from "./pages/HomePage";
import MyPostsPage from "./pages/MyPostsPage";
import { UserStorage } from "./utils/LocalStorage";
import AlbumPage from "./pages/AlbumPage";
import TodoPage from "./pages/TodoPage";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing user session on app load
  useEffect(() => {
    const checkAuth = () => {
      const isLoggedIn = UserStorage.isLoggedIn();
      setIsAuthenticated(isLoggedIn);
    };

    checkAuth();
  }, []);

  // Authentication handlers
  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    UserStorage.logout(); // Clear user data
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
        <div className="content-area">{children}</div>
      </div>
    );
  };

  // Special route for profile completion - no sidebar needed
  const ProfileCompletionRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    return children;
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/home" />
          ) : (
            <LoginPage onLoginSuccess={handleLogin} />
          )
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <Navigate to="/home" />
          ) : (
            <RegisterPage onRegisterSuccess={handleLogin} />
          )
        }
      />

      <Route
        path="/complete-profile/:userId"
        element={
          <ProfileCompletionRoute>
            <ProfileCompletionPage />
          </ProfileCompletionRoute>
        }
      />

      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-posts"
        element={
          <ProtectedRoute>
            <MyPostsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/albums/:albumId?"
        element={
          <ProtectedRoute>
            <AlbumPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/TODO"
        element={
          <ProtectedRoute>
            <TodoPage />
            {/* <div>TodoPage</div> */}
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? "/home" : "/login"} />}
      />
    </Routes>
  );
}

export default App;
