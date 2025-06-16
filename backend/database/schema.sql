-- Posts table: stores user posts and AI analysis results
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(50) NOT NULL DEFAULT 'text', -- 'text' or 'image'
    image_url VARCHAR(500),
    manga_title VARCHAR(255),
    episode_number INTEGER,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'approved', 'pending', 'rejected'
    ai_score REAL DEFAULT 0.0, -- AI risk score (0.0 - 1.0)
    ai_analysis TEXT, -- JSON string of AI analysis results
    detected_risks TEXT, -- JSON array of detected risk types
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_by VARCHAR(255),
    reviewed_at DATETIME
);

-- Moderation logs table: tracks all moderation actions
CREATE TABLE IF NOT EXISTS moderation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'approve', 'reject', 'auto_approve', 'auto_reject'
    moderator_id VARCHAR(255),
    reason VARCHAR(255),
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_ai_score ON posts(ai_score);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_post_id ON moderation_logs(post_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created_at ON moderation_logs(created_at);