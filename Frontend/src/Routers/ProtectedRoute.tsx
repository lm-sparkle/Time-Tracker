import React from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { Toast } from "../Components/Toast";

type JwtPayload = {
  role: "user" | "admin";
  exp: number;
};

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: ("user" | "admin")[];
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = ["user"],
}) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  let decoded: JwtPayload;
  try {
    decoded = jwtDecode<JwtPayload>(token);

    // Check if token is expired
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      console.warn("Token expired, redirecting to login");
      Toast.fire({
        icon: "warning",
        title: "Session expired, redirecting to login",
      });
      return <Navigate to="/" replace />;
    }

    if (!allowedRoles.includes(decoded.role)) {
      return <Navigate to="/" replace />;
    }
  } catch (err) {
    console.error("Invalid token:", err);
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
