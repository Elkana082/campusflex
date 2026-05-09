import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [currentCampus, setCurrentCampus] = useState(null);
  const [darkMode, setDarkMode]       = useState(false);

  useEffect(() => {
    // Load saved user from localStorage on app start
    const savedUser  = localStorage.getItem("cf_user");
    const savedTheme = localStorage.getItem("cf_dark");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      setCurrentCampus(parsed.campus);
    }
    if (savedTheme === "true") {
      setDarkMode(true);
      document.documentElement.setAttribute("data-theme", "dark");
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("cf_token", token);
    localStorage.setItem("cf_user", JSON.stringify(userData));
    setUser(userData);
    setCurrentCampus(userData.campus);
  };

  const logout = () => {
    localStorage.removeItem("cf_token");
    localStorage.removeItem("cf_user");
    setUser(null);
    setCurrentCampus(null);
  };

  const updateUser = (updatedData) => {
    const merged = { ...user, ...updatedData };
    setUser(merged);
    localStorage.setItem("cf_user", JSON.stringify(merged));
  };

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("cf_dark", String(next));
  };

  const switchCampus = (campusId) => setCurrentCampus(campusId);

  const isAdmin      = user?.role === "admin" || user?.role === "superadmin";
  const isSuperAdmin = user?.role === "superadmin";

  return (
    <AuthContext.Provider value={{
      user, loading, login, logout, updateUser,
      currentCampus, switchCampus,
      darkMode, toggleDarkMode,
      isAdmin, isSuperAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);