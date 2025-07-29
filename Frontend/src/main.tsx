import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./Auth/AuthContext.tsx";
import "./index.css";

// Remove 'hidden' attribute from <html> when DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  document.documentElement.removeAttribute("hidden");
});

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);
