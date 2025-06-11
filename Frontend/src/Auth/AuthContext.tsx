import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { Toast } from "../Components/Toast";
import api from "../utils/api";

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
    const savedUser = sessionStorage.getItem("user");
    const savedToken = sessionStorage.getItem("token");

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
  
    const response = await api.post(
      `${import.meta.env.VITE_API_URL}login${adminKey ? `?adminKey=${adminKey}` : ""}`,
      credentials
    );
  
    const data = await response.data;
  
    if (response.status && data.token && data.user) {
      setUser(data.user);
      setToken(data.token);
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("user", JSON.stringify(data.user));
      sessionStorage.setItem("lastVisitDate",new Date().toISOString().split("T")[0])
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
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("time_Id");
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
