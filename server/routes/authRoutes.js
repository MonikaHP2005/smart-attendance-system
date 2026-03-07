import express from 'express';
import bcrypt from 'bcrypt';
// 🔥 Import all cleaned controller functions
import { 
    register, 
    studentLogin, 
    adminLogin, 
    organiserLogin, 
    registerOrganiser,
    getProfile,
    updateProfile 
} from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js'; 
import db from '../config/db.js'; 

const router = express.Router();

// ==========================================
// 🔓 PUBLIC ROUTES (Anyone can access)
// ==========================================
router.post('/register', register);
router.post('/student-login', studentLogin);
router.post('/admin-login', adminLogin);
router.post('/organiser-login', organiserLogin);

// ==========================================
// 🔒 PROTECTED ROUTES (Requires Token)
// ==========================================

// 🔥 CLEANED: Uses the function from authController
router.get('/profile/:id', verifyToken, getProfile);

// 🔥 CLEANED: Uses the function from authController
router.put('/profile/:id', verifyToken, updateProfile);

// Change Password (Keeping this here as it's a specific utility)
router.put('/change-password/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body;

        const [users] = await db.query('SELECT password FROM users WHERE id = ?', [id]);
        if (users.length === 0) return res.status(404).json({ message: "User not found" });

        const user = users[0];

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: "Incorrect current password" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);

        res.status(200).json({ message: "Password updated successfully!" });
    } catch (error) {
        console.error("Password update error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Admin only route
router.post('/register-organiser', verifyToken, registerOrganiser);

export default router;