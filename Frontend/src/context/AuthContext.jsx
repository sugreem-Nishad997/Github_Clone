import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("apnagit_token") || null);
  const [loading, setLoading] = useState(true);

  // Load user data on startup if token exists
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const storedToken = localStorage.getItem("apnagit_token");
      const storedUserId = localStorage.getItem("apnagit_user_id");

      if (storedToken && storedUserId) {
        try {
          const res = await authApi.getUserProfile(storedUserId);
          setUser(res.data);
        } catch (error) {
          console.error("Failed to fetch current user profile:", error);
          logout();
        }
      }
      setLoading(false);
    };

    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await authApi.login({ email, password });
      const { token: receivedToken, userId } = res.data;

      localStorage.setItem("apnagit_token", receivedToken);
      localStorage.setItem("apnagit_user_id", userId);
      setToken(receivedToken);

      // Fetch user profile
      const userRes = await authApi.getUserProfile(userId);
      setUser(userRes.data);
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to log in",
      };
    }
  };

  const signup = async (username, email, password) => {
    try {
      const res = await authApi.signup({ username, email, password });
      const { token: receivedToken, userId } = res.data;

      localStorage.setItem("apnagit_token", receivedToken);
      localStorage.setItem("apnagit_user_id", userId);
      setToken(receivedToken);

      const userRes = await authApi.getUserProfile(userId);
      setUser(userRes.data);
      return { success: true };
    } catch (error) {
      console.error("Signup error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to sign up",
      };
    }
  };

  const sendVerificationOtp = async (username, email) => {
    try {
      const res = await authApi.sendOtp({ username, email });
      return { success: true, message: res.data?.message };
    } catch (error) {
      console.error("Send OTP error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to send verification code",
      };
    }
  };

  const resendVerificationOtp = async (email, username) => {
    try {
      const res = await authApi.resendOtp({ email, username });
      return { success: true, message: res.data?.message };
    } catch (error) {
      console.error("Resend OTP error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to resend verification code",
      };
    }
  };

  const verifyAndSignup = async (username, email, password, otp) => {
    try {
      const res = await authApi.verifyOtp({ username, email, password, otp });
      const { token: receivedToken, userId } = res.data;

      localStorage.setItem("apnagit_token", receivedToken);
      localStorage.setItem("apnagit_user_id", userId);
      setToken(receivedToken);

      const userRes = await authApi.getUserProfile(userId);
      setUser(userRes.data);
      return { success: true, message: res.data?.message };
    } catch (error) {
      console.error("Verify OTP & signup error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to verify OTP",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("apnagit_token");
    localStorage.removeItem("apnagit_user_id");
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const storedUserId = localStorage.getItem("apnagit_user_id");
    if (storedUserId) {
      try {
        const res = await authApi.getUserProfile(storedUserId);
        setUser(res.data);
      } catch (err) {
        console.error("Refresh user error:", err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        signup,
        sendVerificationOtp,
        resendVerificationOtp,
        verifyAndSignup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
