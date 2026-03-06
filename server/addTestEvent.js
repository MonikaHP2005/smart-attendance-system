import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',      
    password: '645767',      
    database: 'smart_attendance' 
});

// Helper function to format date to MySQL format (YYYY-MM-DD HH:MM:SS)
const formatMySQLDate = (date) => {
    const pad = (num) => num.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
           `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const addLiveTestEvent = async () => {
    try {
        // 1. Get your Admin ID
        const [admins] = await db.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
        
        if (admins.length === 0) {
            console.log("⚠️ No Admin found. Run createAdmin.js first.");
            process.exit(1);
        }
        
        const creatorId = admins[0].id;

        // 2. Set times based on your ACTUAL local system time
        const now = new Date();
        const later = new Date();
        later.setHours(now.getHours() + 4); // Active for the next 4 hours

        const startTime = formatMySQLDate(now);
        const endTime = formatMySQLDate(later);

        // 3. Insert the Live Test Event
        await db.execute(
            `INSERT INTO events (title, activity_type, instructor_id, instructor_name, start_time, end_time)
             VALUES (?, ?, ?, ?, ?, ?)`,
            ['Local Time Test Session', 'CLASS', creatorId, 'Monika (Admin)', startTime, endTime]
        );

        console.log("✅ Live Test Event created with Local Time!");
        console.log(`System Time Now: ${now.toString()}`);
        console.log(`Inserted Start: ${startTime}`);
        console.log(`Inserted End:   ${endTime}`);
        
        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
};

addLiveTestEvent();