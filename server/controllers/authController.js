import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';

// ==========================================
// 1. STUDENT SPECIFIC LOGIN
// ==========================================
export const studentLogin = async (req, res) => {
    try {
        const { studentId, password } = req.body;

        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [studentId]);
        
        if (users.length === 0) {
            return res.status(404).json({ message: "Student ID not found. Please register first." });
        }

        const user = users[0];

        if (user.role !== 'student') {
            return res.status(403).json({ message: "This ID is registered as an Admin/Organiser. Please use the correct Login page." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect password for this Student ID." });
        }

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
        const { adminId, password } = req.body;

        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [adminId]);
        
        if (users.length === 0) {
            return res.status(404).json({ message: "Admin ID not recognized." });
        }

        const user = users[0];

        if (user.role !== 'admin') {
            return res.status(403).json({ message: "Access Denied. Super Admin only." });
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

        if (!studentId || !name || !email || !password || !batch) {
            return res.status(400).json({ message: "All fields are required." });
        }

        const [existingUsers] = await db.query(
            'SELECT * FROM users WHERE id = ? OR email = ?', 
            [studentId, email]
        );
        
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: "Student ID or Email already exists." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

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

// ==========================================
// 4. GET USER PROFILE
// ==========================================
export const getProfile = async (req, res) => {
    try {
        const { id } = req.params; 

        // 🔥 Fetches ID, Name, Email, Batch, and Role
        const [users] = await db.query('SELECT id, name, email, batch, role FROM users WHERE id = ?', [id]);
        
        if (users.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        res.status(200).json(users[0]);
        
    } catch (error) {
        console.error("Profile Fetch Error:", error);
        res.status(500).json({ message: "Server error fetching profile." });
    }
};

// ==========================================
// 5. UPDATE USER PROFILE (NEW - For Admin/Organiser/Student)
// ==========================================
// ==========================================
// 5. UPDATE USER PROFILE (FIXED)
// ==========================================
export const updateProfile = async (req, res) => {
    try {
        const { id } = req.params; // This is the 'ORG-001' or 'ADMIN-001'
        const { name, email } = req.body; 

        // 🔥 CRITICAL FIX: Ensure the ID is being used correctly in the WHERE clause
        const [result] = await db.query(
            'UPDATE users SET name = ?, email = ? WHERE id = ?',
            [name, email, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "No user found with that ID to update." });
        }

        res.status(200).json({ message: "Profile updated successfully!" });
    } catch (error) {
        console.error("Database Update Error:", error);
        res.status(500).json({ message: "Internal Server Error during update." });
    }
};

// ==========================================
// 6. REGISTER NEW ORGANISER (Admin Only)
// ==========================================
export const registerOrganiser = async (req, res) => {
    try {
        const { organiserId, name, email, password } = req.body;

        if (!organiserId || !name || !email || !password) {
            return res.status(400).json({ message: "All fields are required." });
        }

        const [existing] = await db.query(
            'SELECT * FROM users WHERE id = ? OR email = ?', 
            [organiserId, email]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ message: "ID or Email already in use." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await db.execute(
            'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
            [organiserId, name, email, hashedPassword, 'organiser']
        );

        res.status(201).json({ message: "Organiser registered successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Server error during organiser registration." });
    }
};

// ==========================================
// 7. ORGANISER SPECIFIC LOGIN
// ==========================================
export const organiserLogin = async (req, res) => {
    try {
        const { organiserId, password } = req.body;

        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [organiserId]);
        
        if (users.length === 0) {
            return res.status(404).json({ message: "Organiser ID not found." });
        }

        const user = users[0];

        if (user.role !== 'organiser') {
            return res.status(403).json({ message: "Access Denied. Not an Organiser account." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password." });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            process.env.JWT_SECRET || 'secret', 
            { expiresIn: '1d' }
        );

        res.status(200).json({
            token,
            user: { id: user.id, name: user.name, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error during organiser login." });
    }
};