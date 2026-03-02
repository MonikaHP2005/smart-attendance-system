import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import eventRoutes from "./routes/eventRoutes.js";
import authRoutes from "./routes/authRoutes.js"; 

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/events", eventRoutes); // Adjusted slightly for cleanliness
app.use("/api/auth", authRoutes);    // 2. CONNECT YOUR LOGIN SYSTEM HERE

app.get("/", (req, res) => {
    res.send("Smart Attendance Server is running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});