import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Toast } from "../Components/Toast";

type UserRole = "user" | "admin";
type User = {
  email: string;
  id: string;
  fullName: string;
  role: UserRole;
};

type AuthContextType = {
  user: User | null;
  token: string;
  login: (credentials: {
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
  }, []);

  const login = async (credentials: {
    email: string;
    password: string;
  }) => {
    const urlParams = new URLSearchParams(window.location.search);
    const adminKey = urlParams.get("adminKey");
  
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}login${adminKey ? `?adminKey=${adminKey}` : ""}`,
      credentials
    );
  
    const data = await response.data;
  
    if (response.status && data.token && data.user) {
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      Toast.fire({
        icon: "success",
        title: "Login successful",
      });
  
      // Redirect based on role
      if (data.user.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    } else {
      throw new Error(data.message || "Login failed");
    }
  };
  
  const logout = () => {
    setUser(null);
    setToken("");
    Toast.fire({
      icon: "success",
      title: "Logout successful",
    });
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    localStorage.removeItem("time_Id");
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { useAuth };
