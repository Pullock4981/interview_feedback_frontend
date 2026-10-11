"use client";

import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user] = useState({
    name: "Instructor",
    email: "instructor@nexview.local",
    role: "instructor"
  });

  return (
    <AuthContext.Provider value={{ user, token: null, loading: false, login: () => {}, logout: () => {} }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  return context || {
    user: { name: "Instructor", email: "instructor@nexview.local", role: "instructor" },
    token: null,
    loading: false,
    login: () => {},
    logout: () => {},
  };
}
