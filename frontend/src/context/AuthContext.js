
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

const API_URL = "http://localhost:4000/api/auth";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  
  // CHECK EXISTING AUTHENTICATION
 

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await fetch(`${API_URL}/me`, {
          method: "GET",
          credentials: "include"
        });

        if (!response.ok) {
          setUser(null);
          return;
        }

        const data = await response.json();
        setUser(data.user || null);

      } catch (error) {
        console.error("Authentication check error:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthentication();
  }, []);

  // ------------------------------------
  // LOGIN
  // ------------------------------------

  const login = async (username, password) => {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username,
        password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed.");
    }

    setUser(data.user);

    return data;
  };

  // REGISTER USER

  const register = async (username, password) => {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username,
        password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Registration failed.");
    }

    return data;
  };

  // LOGOUT

  const logout = async () => {
    try {
      const response = await fetch(`${API_URL}/logout`, {
        method: "POST",
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Logout failed.");
      }

    } finally {
      setUser(null);
    }
  };

  // CONTEXT VALUES

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === "admin",
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// CUSTOM HOOK

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
