import db from '../config/db.js';
import crypto from 'crypto'; // Built into Node.js, used for making secure random tokens

// ==========================================
// 1. FETCH ALL EVENTS FOR THE DASHBOARD
// ==========================================
export const getAllEvents = async (req, res) => {
    try {
        // Fetch all activities and order them by date
        const [events] = await db.query('SELECT * FROM events ORDER BY start_time ASC');
        res.status(200).json(events);
    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// ==========================================
// 2. GENERATE QR CODE & SET GEOFENCE
// ==========================================
export const generateQR = async (req, res) => {
    try {
        const { id } = req.params; 
        const { latitude, longitude } = req.body; 

        const [events] = await db.query('SELECT * FROM events WHERE id = ?', [id]);
        if (events.length === 0) return res.status(404).json({ message: "Event not found." });

        const event = events[0];

        // 🚨 NEW FIX: Prevent generating if the event time has already passed!
        if (new Date() > new Date(event.end_time)) {
            return res.status(403).json({ 
                message: "This event has already ended. You cannot generate a QR code for it." 
            });
        }

        if (!event.is_active && event.qr_token) {
            return res.status(403).json({ 
                message: "This event has already been completed. You cannot generate a new QR code." 
            });
        }

        const crypto = await import('crypto');
        const secureToken = crypto.randomBytes(16).toString('hex');

        await db.query(
            `UPDATE events SET qr_token = ?, latitude = ?, longitude = ?, is_active = TRUE WHERE id = ?`,
            [secureToken, latitude, longitude, id]
        );

        res.status(200).json({ message: "QR Code Generated!", qrToken: secureToken });

    } catch (error) {
        console.error("Error generating QR:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// ==========================================
// HELPER FUNCTION: CALCULATE GPS DISTANCE
// ==========================================
// This calculates the distance in meters between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
};

// ==========================================
// 3. STUDENT SCAN (CHECK-IN & CHECK-OUT LOGIC)
// ==========================================
export const markAttendance = async (req, res) => {
    try {
        console.log("\n==============================");
        console.log("📸 NEW QR SCAN DETECTED!");
        console.log("Data received from phone:", req.body);

        const { eventId, qrToken, studentLat, studentLon, studentId } = req.body;

        if (!studentId) {
            console.log("❌ ERROR: studentId is missing!");
            return res.status(400).json({ message: "Student ID missing. Please log out and log back in." });
        }

        // 1. Validate Event
        const [events] = await db.query('SELECT * FROM events WHERE id = ? AND is_active = TRUE', [eventId]);
        if (events.length === 0) return res.status(400).json({ message: "This QR code is no longer active." });
        
        const event = events[0];
        if (event.qr_token !== qrToken) return res.status(403).json({ message: "Invalid or expired QR Token!" });

        // 2. Check-In vs Check-Out Logic
        const [existing] = await db.query(
            'SELECT * FROM attendance WHERE student_id = ? AND event_id = ?',
            [studentId, eventId]
        );

        console.log("🔍 Did we find them in the database?", existing.length > 0 ? "YES" : "NO");

        if (existing.length === 0) {
            console.log("➡️ SCENARIO A: Database is empty for this student. Checking them IN.");
            await db.execute(
                `INSERT INTO attendance (student_id, event_id, check_in_time, status) 
                 VALUES (?, ?, NOW(), 'PRESENT')`,
                [studentId, eventId]
            );
            return res.status(200).json({ action: "CHECK_IN", message: "Checked In Successfully!" });
            
        } else {
            const record = existing[0];
            console.log("📊 Existing Record Details:", record);
            
            if (record.check_out_time === null) {
                // Time-lock check
                const [timeCheck] = await db.query(
                    `SELECT TIMESTAMPDIFF(SECOND, check_in_time, NOW()) as seconds_passed FROM attendance WHERE id = ?`,
                    [record.id]
                );
                
                const secondsPassed = timeCheck[0].seconds_passed;
                console.log(`⏱️ Seconds since check-in: ${secondsPassed}`);

                if (secondsPassed < 60) {
                    console.log("⚠️ Camera double-fired within 60s. Ignoring safely.");
                    return res.status(200).json({ action: "CHECK_IN", message: "Checked In Successfully!" });
                }

                console.log("⬅️ SCENARIO B: Time passed. Checking them OUT.");
                await db.execute(
                    `UPDATE attendance 
                     SET check_out_time = NOW(), duration_minutes = TIMESTAMPDIFF(MINUTE, check_in_time, NOW())
                     WHERE id = ?`,
                    [record.id]
                );
                return res.status(200).json({ action: "CHECK_OUT", message: "Checked Out Successfully!" });
                
            } else {
                console.log("🛑 SCENARIO C: They already have a checkout time!");
                return res.status(400).json({ message: "You have already checked out of this event." });
            }
        }

    } catch (error) {
        console.error("🔥 CRITICAL BACKEND ERROR:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// ==========================================
// 4. GET STUDENT ATTENDANCE STATS
// ==========================================
export const getStudentStats = async (req, res) => {
    try {
        const { studentId } = req.params;

        // 1. Get total events the NGO has ever held
        const [totalEvents] = await db.query('SELECT COUNT(*) as count FROM events');
        const total = totalEvents[0].count;

        // 2. Get total events this specific student attended
        const [attendedEvents] = await db.query(
            'SELECT COUNT(*) as count FROM attendance WHERE student_id = ? AND status = "PRESENT"', 
            [studentId]
        );
        const attended = attendedEvents[0].count;

        // 3. Calculate Percentage
        const percentage = total === 0 ? 0 : Math.round((attended / total) * 100);

        // 4. Get their specific attendance history details
        const [history] = await db.query(`
            SELECT e.title, e.activity_type, a.check_in_time, a.status 
            FROM attendance a
            JOIN events e ON a.event_id = e.id
            WHERE a.student_id = ?
            ORDER BY a.check_in_time DESC
        `, [studentId]);

        res.status(200).json({ total, attended, percentage, history });

    } catch (error) {
        console.error("Error fetching student stats:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


// ==========================================
// 5. CLOSE EVENT & AUTO-CHECKOUT
// ==========================================
export const closeEvent = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Turn off the QR code
        await db.query('UPDATE events SET is_active = FALSE WHERE id = ?', [id]);

        // 2. Fetch the end time manually to avoid the MySQL "UPDATE JOIN" deadlock bug
        const [eventData] = await db.query('SELECT end_time FROM events WHERE id = ?', [id]);
        
        if (eventData.length > 0) {
            const endTime = eventData[0].end_time;

            // 3. Safely update all missing checkouts using standard SQL
            await db.query(
                `UPDATE attendance 
                 SET check_out_time = ?, 
                     duration_minutes = TIMESTAMPDIFF(MINUTE, check_in_time, ?)
                 WHERE event_id = ? AND check_out_time IS NULL`,
                [endTime, endTime, id]
            );
        }

        res.status(200).json({ message: "Event closed and attendance finalized!" });
    } catch (error) {
        console.error("🔥 Error closing event:", error);
        res.status(500).json({ message: "Database Error while closing event" });
    }
};


// ==========================================
// 6. GET ATTENDANCE FOR A SPECIFIC EVENT
// ==========================================
export const getEventAttendance = async (req, res) => {
    try {
        const { id } = req.params;

        const [records] = await db.query(`
            SELECT a.id, a.check_in_time, a.check_out_time, a.duration_minutes, a.status, 
                   u.name, u.id as student_id
            FROM attendance a
            JOIN users u ON a.student_id = u.id
            WHERE a.event_id = ?
            ORDER BY a.check_in_time DESC
        `, [id]);

        res.status(200).json(records);
    } catch (error) {
        console.error("Error fetching event attendance:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};