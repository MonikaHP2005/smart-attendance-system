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
        const { id } = req.params; // The ID of the event in the URL
        const { latitude, longitude } = req.body; // The Admin's GPS location sent from React

        // 1. Create a secure, random 32-character token
        const secureToken = crypto.randomBytes(16).toString('hex');

        // 2. Update the event in the database with the token and the GPS location
        // We also set is_active = TRUE so students can now scan it
        const [result] = await db.execute(
            `UPDATE events 
             SET qr_token = ?, latitude = ?, longitude = ?, is_active = TRUE 
             WHERE id = ?`,
            [secureToken, latitude, longitude, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Event not found." });
        }

        // 3. Send the token back to React so it can draw the QR code on the screen
        res.status(200).json({ 
            message: "QR Code Generated & Geofence Locked!", 
            qrToken: secureToken 
        });

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
// 3. STUDENT SCAN & ATTENDANCE LOGIC
// ==========================================
// ==========================================
// 3. STUDENT SCAN (CHECK-IN & CHECK-OUT LOGIC)
// ==========================================
export const markAttendance = async (req, res) => {
    try {
        const { eventId, qrToken, studentLat, studentLon, studentId } = req.body;

        // 1. Validate Event & Token
        const [events] = await db.query('SELECT * FROM events WHERE id = ? AND is_active = TRUE', [eventId]);
        if (events.length === 0) return res.status(400).json({ message: "This QR code is no longer active." });
        
        const event = events[0];
        if (event.qr_token !== qrToken) return res.status(403).json({ message: "Invalid or expired QR Token!" });

        // 2. Geofence Validation
        const distance = calculateDistance(event.latitude, event.longitude, studentLat, studentLon);
        if (distance > event.radius) {
            return res.status(403).json({ 
                message: `You are ${Math.round(distance)} meters away. You must be within ${event.radius} meters of the classroom.` 
            });
        }

        // 3. Check-In vs Check-Out Logic
        const [existing] = await db.query(
            'SELECT * FROM attendance WHERE student_id = ? AND event_id = ?',
            [studentId, eventId]
        );

        if (existing.length === 0) {
            // SCENARIO A: First time scanning -> CHECK IN
            await db.execute(
                `INSERT INTO attendance (student_id, event_id, check_in_time, status) 
                 VALUES (?, ?, NOW(), 'PRESENT')`,
                [studentId, eventId]
            );
            return res.status(200).json({ action: "CHECK_IN", message: "Checked In Successfully!" });
            
        } else {
            const record = existing[0];
            
            if (record.check_out_time === null) {
                // SCENARIO B: Scanned again -> CHECK OUT
                await db.execute(
                    `UPDATE attendance 
                     SET check_out_time = NOW(), 
                         duration_minutes = TIMESTAMPDIFF(MINUTE, check_in_time, NOW())
                     WHERE id = ?`,
                    [record.id]
                );
                return res.status(200).json({ action: "CHECK_OUT", message: "Checked Out Successfully!" });
                
            } else {
                // SCENARIO C: Already checked out
                return res.status(400).json({ message: "You have already checked out of this event." });
            }
        }

    } catch (error) {
        console.error("Error marking attendance:", error);
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