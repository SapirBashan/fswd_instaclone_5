import { useState, useEffect } from "react";
import "./App.css";
import LoginPage from "./pages/LoginPage";
import { Routes, Route, Navigate } from "react-router-dom";
import SideNav from "./components/SideNev";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import MyPostsPage from "./pages/MyPostsPage";
import { UserStorage } from "./utils/LocalStorage";
import AlbumPage from "./pages/AlbumPage";
import TodoPage from "./pages/TodoPage";
import Info from "./pages/InfoPage";

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
            <TodoPage/>
            {/* <div>TodoPage</div> */}
          </ProtectedRoute>
        }
      />

      <Route
        path="/Info"
        element={
          <ProtectedRoute>
            <Info />
            {/* <div>InfoPage</div> */}
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
