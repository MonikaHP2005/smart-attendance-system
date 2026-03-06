import bcrypt from 'bcryptjs';
import db from './config/db.js';

const createAdmin = async () => {
    try {
        const adminId = "ADMIN-001"; // Manual ID
        const password = "admin123";
        const email = "admin@fci.org";
        const name = "FCI Administrator";
        const batch = "STAFF"; // Added Batch

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Updated query to include 'id' and 'batch'
        const query = 'INSERT INTO users (id, name, email, password, role, batch) VALUES (?, ?, ?, ?, ?, ?)';
        
        await db.execute(query, [adminId, name, email, hashedPassword, 'admin', batch]);

        console.log("✅ Admin account created successfully!");
        process.exit();
    } catch (error) {
        console.error("❌ Error creating admin:", error);
        process.exit(1);
    }
};

createAdmin();