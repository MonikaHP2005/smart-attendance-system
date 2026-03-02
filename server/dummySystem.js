import db from './config/db.js';

const seedDummyData = async () => {
    try {
        console.log("Connecting to DB to seed NGO activities...");

        // 1. Get the Admin ID we created earlier
        // We need this so the database knows WHO is managing these events
        const [admins] = await db.query("SELECT id FROM users WHERE email = 'monikahp005@gmail.com'");
        if (admins.length === 0) {
            console.log("⚠️ Error: Admin not found. Did you run createAdmin.js?");
            process.exit(1);
        }
        const adminId = admins[0].id;

        // 2. Clear out any old test data for a fresh start
        await db.query("SET FOREIGN_KEY_CHECKS = 0;");
        await db.query("TRUNCATE TABLE attendance;");
        await db.query("TRUNCATE TABLE events;");
        await db.query("SET FOREIGN_KEY_CHECKS = 1;");

        // 3. Define our NGO Activities (Classes, Events, and Outbound)
        const activities = [
            {
                external_event_id: 'NGO-CLS-001',
                activity_code: 'DSA-101',
                activity_type: 'CLASS',
                title: 'DSA',
                instructor_name: 'Dr. Smith ',
                managed_by_admin_id: adminId,
                start_time: '2026-03-02 10:00:00', // Today
                end_time: '2026-03-02 12:00:00'
            },
            {
                external_event_id: 'NGO-EVT-002',
                activity_code: 'Evt-102',
                activity_type: 'EVENT',
                title: 'Cultural Fest',
                instructor_name: 'FCI_team',
                managed_by_admin_id: adminId,
                start_time: '2026-03-03 09:00:00', // Tomorrow
                end_time: '2026-03-03 17:00:00'
            },
            {
                external_event_id: 'NGO-OUT-003',
                activity_code: 'FIELD-TRIP',
                activity_type: 'OUTBOUND',
                title: 'Wonderla Industrial Visit',
                instructor_name: 'Ranger Dave',
                managed_by_admin_id: adminId,
                start_time: '2026-03-05 08:00:00', // Next Week
                end_time: '2026-03-05 15:00:00'
            }
        ];

        // 4. Insert them into your MySQL Database
        for (let act of activities) {
            await db.execute(
                `INSERT INTO events (external_event_id, activity_code, activity_type, title, instructor_name, managed_by_admin_id, start_time, end_time)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [act.external_event_id, act.activity_code, act.activity_type, act.title, act.instructor_name, act.managed_by_admin_id, act.start_time, act.end_time]
            );
        }

        console.log("✅ Dummy NGO Activities seeded successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding data:", error);
        process.exit(1);
    }
};

seedDummyData();