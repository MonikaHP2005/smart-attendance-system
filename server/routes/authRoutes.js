import express from 'express';
import bcrypt from 'bcrypt';
import { register, studentLogin, adminLogin } from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js'; // 🔥 Import the Bouncer!
import db from '../config/db.js'; // 🔥 Make sure DB is imported for your inline queries!

const router = express.Router();

// ==========================================
// 🔓 PUBLIC ROUTES (Anyone can access these)
// ==========================================
router.post('/register', register);
router.post('/student-login', studentLogin);
router.post('/admin-login', adminLogin);


// ==========================================
// 🔒 PROTECTED ROUTES (Must have a valid token)
// ==========================================

// Fetch user profile details (Real name and email)
router.get('/profile/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Fetch the user's real name and email from the DB
        const [users] = await db.query('SELECT name, email FROM users WHERE id = ?', [id]);
        
        if (users.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(users[0]);
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Update Profile
router.put('/profile/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email } = req.body; 

        // Update the user in the database
        await db.query(
            'UPDATE users SET name = ?, email = ? WHERE id = ?',
            [name, email, id]
        );

        res.status(200).json({ message: "Profile updated successfully!" });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Failed to update profile" });
    }
});

// Change Password
router.put('/change-password/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body;

        // 1. Fetch the user's current password from the database
        const [users] = await db.query('SELECT password FROM users WHERE id = ?', [id]);
        if (users.length === 0) return res.status(404).json({ message: "User not found" });

        const user = users[0];

        // 2. Verify the current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: "Incorrect current password" });

        // 3. Hash the new password and update the database
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);

        res.status(200).json({ message: "Password updated successfully!" });
    } catch (error) {
        console.error("Password update error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;