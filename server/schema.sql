-- Real-Time Tasks App - Database Schema
-- This schema includes:
-- 1. Users table
-- 2. Messages table
-- 3. Push Tokens table (for notifications)
-- 4. Sample data for testing


-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS push_tokens;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS users;


-- Users Table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  INDEX idx_name (name),
  INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Messages Table
CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE,
  
  -- Foreign key relationship
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Indexes for performance
  INDEX idx_created_at (created_at DESC),
  INDEX idx_user_id (user_id),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Push Tokens Table (for Expo Push Notifications)
CREATE TABLE push_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  platform ENUM('ios', 'android', 'web') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key relationship
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Indexes for performance
  INDEX idx_user_id (user_id),
  INDEX idx_token (token),
  INDEX idx_platform (platform),
  INDEX idx_last_used (last_used DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Sample Data - Users
INSERT INTO users (name) VALUES 
  ('Rashmi'),
  ('Minduli'),
  ('Rasini');


-- Sample Data - Messages
INSERT INTO messages (user_id, text) VALUES
  (1, 'Hello everyone!'),
  (2, 'Hi! How are you?'),
  (1, 'I''m doing great, thanks for asking!'),
  (3, 'Hey folks, just joined!'),
  (2, 'Welcome Rasini!'),
  (1, 'Good to see you here!');


-- Verification Queries
SELECT 'Database schema created successfully!' AS status;
SELECT COUNT(*) AS user_count FROM users;
SELECT COUNT(*) AS message_count FROM messages;
SELECT COUNT(*) AS push_token_count FROM push_tokens;

