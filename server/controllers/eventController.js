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
// HELPER: Calculate GPS Distance (Haversine Formula)
// ==========================================
// This calculates the distance in meters between the Admin and the Student
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const toRadians = (degree) => degree * (Math.PI / 180);
    
    const phi1 = toRadians(lat1);
    const phi2 = toRadians(lat2);
    const deltaPhi = toRadians(lat2 - lat1);
    const deltaLambda = toRadians(lon2 - lon1);

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Returns distance in meters
};

// ==========================================
// MAIN: Process QR Scan Attendance
// ==========================================
export const markAttendance = async (req, res) => {
    try {
        const { eventId, qrToken, studentLat, studentLon, studentId } = req.body;

        // 1. VERIFY EVENT, GET BATCH & ADMIN LOCATION
        const [events] = await db.query(
            'SELECT batch, qr_token, is_active, latitude, longitude FROM events WHERE id = ?', 
            [eventId]
        );
        
        if (events.length === 0) {
            return res.status(404).json({ message: "Event not found." });
        }
        
        const event = events[0];

        // Basic Security Checks
        if (!event.is_active) {
            return res.status(400).json({ message: "This session is currently closed." });
        }
        if (event.qr_token !== qrToken) {
            return res.status(400).json({ message: "Invalid or expired QR Code." });
        }

        // 2. GET STUDENT'S BATCH
        const [students] = await db.query(
            'SELECT batch FROM users WHERE id = ?', 
            [studentId]
        );
        
        if (students.length === 0) {
            return res.status(404).json({ message: "Student not found in database." });
        }
        
        const student = students[0];

        // 🔥 3. THE BOUNCER: COMPARE BATCHES
        if (event.batch !== student.batch) {
            return res.status(403).json({ 
                message: `Access Denied: This session is for ${event.batch}. You belong to ${student.batch}.` 
            });
        }

        // 📍 4. GPS GEOFENCE CHECK
        // Check if the Admin saved their location when generating the QR code
        if (event.latitude && event.longitude && studentLat && studentLon) {
            const distance = calculateDistance(
                event.latitude, 
                event.longitude, 
                studentLat, 
                studentLon
            );

            // If the student is further than 50 meters away, reject them!
            if (distance > 100) {
                return res.status(403).json({ 
                    message: `Location Error: You are too far away. Get closer to the classroom. (Distance: ${Math.round(distance)}m)` 
                });
            }
        } else if (!studentLat || !studentLon) {
             return res.status(400).json({ message: "GPS Location is required to mark attendance." });
        }

        // 5. PROCESS ATTENDANCE (Check-in vs Check-out)
        const [existingRecord] = await db.query(
            'SELECT id, check_out_time FROM attendance WHERE event_id = ? AND student_id = ?',
            [eventId, studentId]
        );

        if (existingRecord.length > 0) {
            const record = existingRecord[0];
            
            // If they have a record but haven't checked out yet -> Check Out
            if (!record.check_out_time) {
                await db.query(
                    'UPDATE attendance SET check_out_time = NOW() WHERE id = ?', 
                    [record.id]
                );
                return res.status(200).json({ action: "CHECK_OUT", message: "Checked out successfully!" });
            } else {
                return res.status(400).json({ message: "You have already completed attendance for this session." });
            }
        }

        // No existing record -> Check In
        await db.query(
            'INSERT INTO attendance (event_id, student_id, check_in_time) VALUES (?, ?, NOW())',
            [eventId, studentId]
        );

        res.status(200).json({ action: "CHECK_IN", message: "Checked in successfully!" });

    } catch (error) {
        console.error("Attendance Error:", error);
        res.status(500).json({ message: "Server error processing attendance." });
    }
};

// ==========================================
// 4. GET STUDENT ATTENDANCE STATS
// ==========================================
// ==========================================
// FETCH STUDENT DASHBOARD STATS
// ==========================================
export const getStudentStats = async (req, res) => {
    try {
        const { studentId } = req.params;

        // 1. Get the student's assigned batch first
        const [users] = await db.query('SELECT batch FROM users WHERE id = ?', [studentId]);
        
        if (users.length === 0) {
            return res.status(404).json({ message: "Student not found" });
        }
        
        const studentBatch = users[0].batch;

        // 🔥 2. COUNT TOTAL VALID CLASSES
        // Rule 1: Must be for their batch.
        // Rule 2: start_time <= NOW() means the class has already started or finished.
        const [totalResult] = await db.query(
            'SELECT COUNT(*) as total FROM events WHERE batch = ? AND start_time <= NOW()',
            [studentBatch]
        );
        const totalClasses = totalResult[0].total || 0;

        // 🔥 3. COUNT CLASSES ATTENDED BY STUDENT
        // We JOIN the tables so we can check that the event belongs to their batch and is in the past
        const [attendedResult] = await db.query(`
            SELECT COUNT(DISTINCT a.event_id) as attended 
            FROM attendance a 
            JOIN events e ON a.event_id = e.id 
            WHERE a.student_id = ? 
              AND e.batch = ? 
              AND e.start_time <= NOW()
        `, [studentId, studentBatch]);
        
        const attendedClasses = attendedResult[0].attended || 0;

        // 4. CALCULATE THE TRUE PERCENTAGE
        let percentage = 0;
        if (totalClasses > 0) {
            percentage = Math.round((attendedClasses / totalClasses) * 100);
        }

        // 5. FETCH RECENT HISTORY (For the bottom table on the dashboard)
        const [history] = await db.query(`
            SELECT e.title, a.check_in_time, 
                   IF(a.check_out_time IS NOT NULL, 'PRESENT', 'IN SESSION') as status 
            FROM attendance a 
            JOIN events e ON a.event_id = e.id 
            WHERE a.student_id = ? 
            ORDER BY a.check_in_time DESC 
            LIMIT 5
        `, [studentId]);

        // 6. SEND IT ALL TO THE FRONTEND
        res.status(200).json({
            percentage: percentage,
            attended: attendedClasses,
            total: totalClasses,
            history: history
        });

    } catch (error) {
        console.error("Stats Error:", error);
        res.status(500).json({ message: "Server error calculating stats." });
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