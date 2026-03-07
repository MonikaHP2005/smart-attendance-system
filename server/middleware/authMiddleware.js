import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    // 1. Grab the token from the request header (Format: "Bearer <token>")
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];

    // 2. If there is no token, reject the request immediately
    if (!token) {
        return res.status(401).json({ message: "Access Denied. No token provided." });
    }

    try {
        // 3. Verify the token using your secret key
        // NOTE: In production, ALWAYS use process.env.JWT_SECRET. 
        // Replace 'your_super_secret_key' with whatever string you used during the login generation!
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_key');
        
        // 4. Attach the decoded user payload to the request so the next function can use it
        req.user = verified; 
        
        // 5. Let them pass!
        next(); 
    } catch (error) {
        return res.status(403).json({ message: "Invalid or Expired Token." });
    }
};

// 🔥 NEW: Allows both Admins and Organisers to pass
export const verifyStaff = (req, res, next) => {
    // req.user is set by your verifyToken function
    if (req.user.role === 'admin' || req.user.role === 'organiser') {
        next(); // They are allowed, let them through!
    } else {
        return res.status(403).json({ message: "Access Denied. Faculty and Staff only." });
    }
};

// If you have an isAdmin middleware, keep it! It protects your "Add Organiser" route.
export const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access Denied. Super Admin only." });
    }
    next();
};