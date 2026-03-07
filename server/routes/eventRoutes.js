import express from 'express';
import { getAllEvents, generateQR, markAttendance, getStudentStats, closeEvent, getEventAttendance } from '../controllers/eventController.js';
// 🔥 IMPORT BOTH BOUNCERS: verifyToken (for everyone) and verifyStaff (for Admin/Organiser only)
import { verifyToken, verifyStaff } from '../middleware/authMiddleware.js'; 

const router = express.Router();

// ==========================================
// 👔 STAFF ONLY ROUTES (Admin & Organiser)
// ==========================================

// Get all events for the dashboard 
router.get('/', verifyToken, verifyStaff, getAllEvents);

// Generate QR code for an event
router.post('/:id/generate-qr', verifyToken, verifyStaff, generateQR);

// Close event and auto-checkout
router.post('/:id/close', verifyToken, verifyStaff, closeEvent);

// Fetch the attendance list for the Admin dashboard
router.get('/:id/attendance', verifyToken, verifyStaff, getEventAttendance);


// ==========================================
// 🎓 STUDENT / SHARED ROUTES
// ==========================================

// Mark attendance (Student scans QR) - NO verifyStaff here, or students get blocked!
router.post('/attend', verifyToken, markAttendance);

// Get student statistics - Kept open so students can view their own stats
router.get('/student-stats/:studentId', verifyToken, getStudentStats);

export default router;