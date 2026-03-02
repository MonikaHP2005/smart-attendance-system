import db from '../config/db.js'; // Notice the .js extension! It is required for ES modules

const User = {
    // 1. Find a user by email
    findByEmail: async (email) => {
        try {
            const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    },

    // 2. Create a new student (Admins are added manually by you in the DB)
    create: async (userData) => {
        try {
            const { name, email, password } = userData;
            // Hardcoding 'STUDENT' here enforces Option C (No one can sign up as Admin)
            const [result] = await db.execute(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                [name, email, password, 'STUDENT']
            );
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }
};

export default User;