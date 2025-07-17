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
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    function scheduleNotification(hour: number, minute: number, message: string) {
      const now = new Date();
      const target = new Date();
      target.setHours(hour, minute, 0, 0);
      if (now > target) {
        target.setDate(target.getDate() + 1);
      }
      const timeout = target.getTime() - now.getTime();
      setTimeout(() => {
        if (Notification.permission === "granted") {
          new Notification(message);
        }
      }, timeout);
    }

    scheduleNotification(13, 0, "It's 1:00 PM! Time for your lunch break.");
    scheduleNotification(14, 0, "It's 2:00 PM! Please resume your work.");

  }, []);

  return (
    <div>
      <Navbar />
      <Routers />
    </div>
  );
};

export default App;
