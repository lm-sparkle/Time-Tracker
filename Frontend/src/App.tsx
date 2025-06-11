import { useEffect } from "react";
import Navbar from "./Components/Navbar";
import Routers from "./Routers/Routers";

const App = () => {
  const LOCAL_STORAGE_KEYS = ["userId", "token", "user", "time_Id"];

  const LAST_VISIT_DATE_KEY = "lastVisitDate";
  
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const lastVisit = sessionStorage.getItem(LAST_VISIT_DATE_KEY);

    if (lastVisit !== today) {
      LOCAL_STORAGE_KEYS.forEach((key) => sessionStorage.removeItem(key));

      sessionStorage.setItem(LAST_VISIT_DATE_KEY, today);
    }
  }, []);

  return (
    <div>
      <Navbar />
      <Routers />
    </div>
  );
};

export default App;
