import React from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

type JwtPayload = {
  role: "user" | "admin";
  exp: number;
};

type PublicRouteProps = {
  children: React.ReactNode;
};

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const token = sessionStorage.getItem("token");

  if (token) {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      if (decoded.exp * 1000 > Date.now()) {
        // Token is valid, redirect based on role
        if (decoded.role === "admin") {
          return <Navigate to="/admin/dashboard" replace />;
        } else if (decoded.role === "user") {
          return <Navigate to="/dashboard" replace />;
        }
      }
    } catch (err) {
      console.error("Invalid token:", err);
    }
  }

  return <>{children}</>;
};

export default PublicRoute;
