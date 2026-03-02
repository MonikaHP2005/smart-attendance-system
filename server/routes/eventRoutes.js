import express from 'express';
import { getAllEvents, generateQR, markAttendance, getStudentStats } from '../controllers/eventController.js';

const router = express.Router();

// GET request to fetch all NGO activities
// URL: http://localhost:5000/api/events
router.get('/', getAllEvents);

// POST request to turn on the QR code and set the GPS location
// URL: http://localhost:5000/api/events/:id/generate-qr
router.post('/:id/generate-qr', generateQR);

// POST request for a student to scan and check in
// URL: http://localhost:5000/api/events/attend
router.post('/attend', markAttendance);

// GET request to fetch a student's attendance percentage and history
// URL: http://localhost:5000/api/events/student-stats/1
router.get('/student-stats/:studentId', getStudentStats);


export default router;