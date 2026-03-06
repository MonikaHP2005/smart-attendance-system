import express from 'express';
import { getAllEvents, generateQR, markAttendance, getStudentStats, closeEvent, getEventAttendance } from '../controllers/eventController.js';
import { verifyToken } from '../middleware/authMiddleware.js'; // 🔥 Import the Bouncer!

const router = express.Router();

// Get all events for the dashboard
router.get('/', verifyToken, getAllEvents);

// Get student statistics
router.get('/student-stats/:studentId', verifyToken, getStudentStats);

// Generate QR code for an event
router.post('/:id/generate-qr', verifyToken, generateQR);

// Mark attendance (Student scans QR)
router.post('/attend', verifyToken, markAttendance);

// Close event and auto-checkout
router.post('/:id/close', verifyToken, closeEvent);

//Fetch the attendance list for the Admin dashboard
router.get('/:id/attendance', verifyToken, getEventAttendance);

export default router;