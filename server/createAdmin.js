import bcrypt from 'bcrypt';
import db from './config/db.js'; // Uses your existing database connection!

const setupDatabase = async () => {
    try {
        console.log("Connecting to the database...");

        // 1. Create the Users table if it doesn't exist yet
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role ENUM('ADMIN', 'STUDENT') DEFAULT 'STUDENT',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log("✅ Users table is ready.");

        // 2. Define your Admin credentials
        const adminName = "Monika HP";
        const adminEmail = "monikahp005@gmail.com";
        const plainTextPassword = "Monika@123";

        // 3. Check if this admin already exists to prevent duplicates
        const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [adminEmail]);
        if (existing.length > 0) {
            console.log("⚠️ Admin user already exists!");
            process.exit(0);
        }

        // 4. Encrypt the password using bcrypt
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(plainTextPassword, salt);

        // 5. Insert the encrypted Admin into the database
        await db.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [adminName, adminEmail, hashedPassword, 'ADMIN']
        );

        console.log(`✅ Success! Admin created.`);
        console.log(`📧 Email: ${adminEmail}`);
        console.log(`🔑 Password: ${plainTextPassword}`);
        
        // Close the connection
        process.exit(0);
    } catch (error) {
        console.error("❌ Error setting up database:", error);
        process.exit(1);
    }
};

setupDatabase();