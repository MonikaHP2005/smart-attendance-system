CREATE DATABASE IF NOT EXISTS smart_attendance;
USE smart_attendance;

-- Users: Admins, Teachers, Students
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'student') DEFAULT 'student'
);

-- Events: The classes/workshops
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    date DATE NOT NULL,
    qr_code VARCHAR(255) UNIQUE
);

-- Attendance: Who showed up
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT,
    student_id INT,
    status ENUM('present', 'absent') DEFAULT 'present',
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (student_id) REFERENCES users(id)
);