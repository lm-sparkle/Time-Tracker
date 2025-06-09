import express from "express";
import morgan from "morgan";
import cors from "cors";
import { Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();

import connectDB from "./libs/connectDB";
import registerRouter from "./routers/register.route";
import loginRouter from "./routers/login.route";
import userRouter from "./routers/user.route";
import timeRouter from "./routers/time.route";
import statusRouter from "./routers/status.route";

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: ["http://192.168.1.27:5173", "http://localhost:5173", "http://localhost:4173", "https://time-tracker-sparkle.vercel.app", "https://laughing-couscous-x54vr5jxq4x6c9g6r-5173.app.github.dev"],
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.static("public"));
app.use(morgan("dev"));

const PORT = process.env.PORT;

const mongoUri = process.env.MONGO_URI || "";

if (!mongoUri) {
  throw new Error("MONGO_URI is not defined in the environment variables");
}

connectDB(mongoUri);

app.get("/", (req: Request, res: Response) => {
  res.send(
    "Welcome to the Time Tracker API Server! Your backend is running smoothly. Access the API endpoints at /api."
  );
});
app.use("/api", registerRouter);
app.use("/api", loginRouter);
app.use("/api/users", userRouter);
app.use("/api/time", timeRouter);
app.use("/api/status", statusRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
