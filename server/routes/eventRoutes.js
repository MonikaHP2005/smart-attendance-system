import express from "express";
import db from "../config/db.js";

const router = express.Router();

/* ==============================
   CREATE EVENT
   POST /api/events
============================== */
router.post("/events", async(req, res) => {
    const { name, date, description } = req.body;

    try {
        const [result] = await db.execute(
            "INSERT INTO events (name, date, description) VALUES (?, ?, ?)", [name, date, description]
        );

        res.status(201).json({
            message: "Event created successfully",
            eventId: result.insertId,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database error" });
    }
});

/* ==============================
   GET ALL EVENTS
   GET /api/events
============================== */
router.get("/events", async(req, res) => {
    try {
        const [rows] = await db.execute(
            "SELECT * FROM events ORDER BY created_at DESC"
        );

        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database error" });
    }
});

/* ==============================
   DELETE EVENT
   DELETE /api/events/:id
============================== */
router.delete("/events/:id", async(req, res) => {
    const { id } = req.params;

    try {
        await db.execute("DELETE FROM events WHERE id = ?", [id]);
        res.json({ message: "Event deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database error" });
    }
});

export default router;