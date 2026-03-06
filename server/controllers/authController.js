import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js'; // Ensure this matches your import style

// ==========================================
// 1. STUDENT SPECIFIC LOGIN
// ==========================================
export const studentLogin = async (req, res) => {
    try {
        const { studentId, password } = req.body;

        // 1. Check if user exists
        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [studentId]);
        
        if (users.length === 0) {
            return res.status(404).json({ message: "Student ID not found. Please register first." });
        }

        const user = users[0];

        // 2. Role Validation: Prevent Admins from using Student Login
        if (user.role !== 'student') {
            return res.status(403).json({ message: "This ID is registered as an Admin. Please use the Admin Login page." });
        }

        // 3. Password Check
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect password for this Student ID." });
        }

        // 4. Token Generation
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });

        res.status(200).json({
            token,
            user: { id: user.id, name: user.name, role: user.role, batch: user.batch }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error during student login." });
    }
};

// ==========================================
// 2. ADMIN SPECIFIC LOGIN
// ==========================================
export const adminLogin = async (req, res) => {
    try {
        const { adminId, password } = req.body; // Frontend should send 'adminId'

        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [adminId]);
        
        if (users.length === 0) {
            return res.status(404).json({ message: "Admin ID not recognized." });
        }

        const user = users[0];

        // Role Validation: Prevent Students from accessing Admin Dashboard
        if (user.role !== 'admin' && user.role !== 'teacher') {
            return res.status(403).json({ message: "Access Denied. This login is for Faculty/Admin only." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid Admin password." });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });

        res.status(200).json({
            token,
            user: { id: user.id, name: user.name, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error during admin login." });
    }
};


// ==========================================
// 3. REGISTER NEW STUDENT
// ==========================================
export const register = async (req, res) => {
    try {
        const { studentId, name, email, password, batch } = req.body;

        // 1. Validation: Ensure all fields are present
        if (!studentId || !name || !email || !password || !batch) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // 2. Check for duplicates
        const [existingUsers] = await db.query(
            'SELECT * FROM users WHERE id = ? OR email = ?', 
            [studentId, email]
        );
        
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: "Student ID or Email already exists." });
        }

        // 3. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Insert with 'student' role
        await db.execute(
            'INSERT INTO users (id, name, email, password, role, batch) VALUES (?, ?, ?, ?, ?, ?)',
            [studentId, name, email, hashedPassword, 'student', batch]
        );

        res.status(201).json({ message: "Registration successful! You can now log in." });
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ message: "Server error during registration." });
    }
};