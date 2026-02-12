const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Check if API is working
router.get('/', (req, res) => {
    res.send('API is working properly!');
});

// Check if Database is connected
router.get('/db-check', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS result');
        res.json({ message: 'Database connected!', result: rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;