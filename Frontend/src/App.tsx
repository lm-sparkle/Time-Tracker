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


  useEffect(() => {
    // Request notification permission on load
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }


    // TEST: Schedule a notification every 1 minute for 3 times
    for (let i = 1; i <= 3; i++) {
      setTimeout(() => {
        if (Notification.permission === "granted") {
          new Notification(`Test notification ${i} of 3`);
        }
      }, i * 60 * 1000); // 1, 2, 3 minutes
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
