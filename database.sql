CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY, 
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin', 'organiser') DEFAULT 'student', 
    batch VARCHAR(50), -- Required for student filtering
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    activity_type ENUM('CLASS', 'TECH_FEST', 'OUTBOUND', 'EXTRA_CURRICULAR') NOT NULL, -- Matches our new frontend cards exactly
    batch VARCHAR(50) NOT NULL, -- Added so the Admin Dashboard can filter properly!
    instructor_id VARCHAR(50),  
    instructor_name VARCHAR(255),
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    radius INT DEFAULT 50,
    is_active BOOLEAN DEFAULT FALSE,
    qr_token VARCHAR(255),
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    event_id INT NOT NULL,
    check_in_time DATETIME,
    check_out_time DATETIME,
    duration_minutes INT,
    status VARCHAR(20),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);