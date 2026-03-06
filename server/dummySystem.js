import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// 1. Direct connection to your database
const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',      
    password: '645767',      
    database: 'smart_attendance' 
});

const seedDummyEvents = async () => {
    try {
        console.log("Connecting to DB to seed NGO activities...");

        // 2. Look for the Admin who is "creating" these events
        // We search by the email you used in your earlier Admin creation
        const [admins] = await db.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
        
        if (admins.length === 0) {
            console.log("⚠️ Error: No Admin found in the 'users' table.");
            console.log("Please run your createAdmin.js script first so we have a 'creator' for these events.");
            process.exit(1);
        }
        
        const creatorId = admins[0].id; // This will be 'ADMIN-001' or similar
        console.log(`Found Creator Admin ID: ${creatorId}`);

        // 3. Clear existing events for a clean test environment
        await db.query("SET FOREIGN_KEY_CHECKS = 0;");
        await db.query("TRUNCATE TABLE attendance;");
        await db.query("TRUNCATE TABLE events;");
        await db.query("SET FOREIGN_KEY_CHECKS = 1;");

        // 4. Define the Activities
        const activities = [
            {
                title: 'Introduction to Web Dev',
                activity_type: 'CLASS',
                instructor_id: creatorId, 
                instructor_name: 'Dr. Monika',
                start_time: '2026-03-05 10:00:00', 
                end_time: '2026-03-05 12:00:00'
            },
            {
                title: 'Annual NGO Workshop',
                activity_type: 'EVENT',
                instructor_id: creatorId,
                instructor_name: 'FCI Core Team',
                start_time: '2026-03-06 09:00:00',
                end_time: '2026-03-06 17:00:00'
            },
            {
                title: 'Field Visit: Water Plant',
                activity_type: 'OUTBOUND',
                instructor_id: creatorId,
                instructor_name: 'Industrial Guide',
                start_time: '2026-03-10 08:00:00',
                end_time: '2026-03-10 15:00:00'
            }
        ];

        // 5. Insert into the 'events' table
        for (let act of activities) {
            await db.execute(
                `INSERT INTO events (title, activity_type, instructor_id, instructor_name, start_time, end_time)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [act.title, act.activity_type, act.instructor_id, act.instructor_name, act.start_time, act.end_time]
            );
        }

        console.log("✅ 3 Dummy NGO Activities seeded successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding data:", error);
        process.exit(1);
    }
};

seedDummyEvents();