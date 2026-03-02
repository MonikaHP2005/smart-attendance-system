import express from 'express';
import { register, login } from '../controllers/authController.js';

const router = express.Router();

// POST request to /api/auth/register
router.post('/register', register);

// POST request to /api/auth/login
router.post('/login', login);

export default router;