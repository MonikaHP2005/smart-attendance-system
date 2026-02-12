const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/test', require('./routes/testRoute'));

// Test Route
app.get('/', (req, res) => res.send('Backend is running!'));

// Test DB Connection
app.get('/test-db', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS result');
        res.json({ message: 'Database Connected!', result: rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));