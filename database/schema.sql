-- Vision Media Hub Database Schema
-- PostgreSQL Database Schema for Media Streaming and File Management

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User permissions table
CREATE TABLE user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50), -- 'folder', 'media', 'admin', etc.
    resource_id UUID, -- specific resource ID if applicable
    granted_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, permission, resource_type, resource_id)
);

-- Folders table for organizing media
CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT false,
    folder_type VARCHAR(20) DEFAULT 'general' CHECK (folder_type IN ('general', 'photos', 'videos', 'movies')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Media files table
CREATE TABLE media_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video', 'movie')),
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Media metadata
    width INTEGER,
    height INTEGER,
    duration INTEGER, -- in seconds for videos
    thumbnail_path VARCHAR(500),
    
    -- Movie-specific fields
    title VARCHAR(255),
    description TEXT,
    genre VARCHAR(100),
    release_year INTEGER,
    rating DECIMAL(3,1), -- e.g., 8.5
    imdb_id VARCHAR(20),
    
    -- File processing status
    processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Media tags for better organization
CREATE TABLE media_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6', -- hex color
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Junction table for media-tag relationships
CREATE TABLE media_file_tags (
    media_file_id UUID NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES media_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (media_file_id, tag_id)
);

-- Playlists/Collections for slideshow and movie collections
CREATE TABLE playlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    playlist_type VARCHAR(20) NOT NULL CHECK (playlist_type IN ('slideshow', 'movie_collection', 'mixed')),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT false,
    auto_play BOOLEAN DEFAULT false,
    slide_duration INTEGER DEFAULT 5, -- seconds for slideshow
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Playlist items
CREATE TABLE playlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    media_file_id UUID NOT NULL REFERENCES media_files(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(playlist_id, position)
);

-- User sessions for tracking active sessions
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    device_info TEXT,
    ip_address INET,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Activity logs for admin monitoring
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System settings
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_media_files_folder_id ON media_files(folder_id);
CREATE INDEX idx_media_files_uploaded_by ON media_files(uploaded_by);
CREATE INDEX idx_media_files_media_type ON media_files(media_type);
CREATE INDEX idx_media_files_created_at ON media_files(created_at);
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
CREATE INDEX idx_folders_owner_id ON folders(owner_id);
CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX idx_playlist_items_playlist_id ON playlist_items(playlist_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON folders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_media_files_updated_at BEFORE UPDATE ON media_files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_playlists_updated_at BEFORE UPDATE ON playlists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('max_file_size', '500000000', 'number', 'Maximum file size in bytes'),
('allowed_image_types', 'jpg,jpeg,png,gif,webp', 'string', 'Allowed image file extensions'),
('allowed_video_types', 'mp4,avi,mkv,mov,wmv,flv,webm', 'string', 'Allowed video file extensions'),
('default_slideshow_duration', '5', 'number', 'Default slideshow duration in seconds'),
('enable_public_access', 'false', 'boolean', 'Allow public access to media files'),
('site_title', 'Vision Media Hub', 'string', 'Site title displayed in browser'),
('maintenance_mode', 'false', 'boolean', 'Enable maintenance mode');

-- Insert default media tags
INSERT INTO media_tags (name, color) VALUES
('Family', '#10B981'),
('Vacation', '#F59E0B'),
('Holiday', '#EF4444'),
('Work', '#6366F1'),
('Friends', '#8B5CF6'),
('Nature', '#059669'),
('Action', '#DC2626'),
('Comedy', '#F59E0B'),
('Drama', '#6B7280'),
('Documentary', '#374151');

COMMENT ON TABLE users IS 'User accounts with role-based access control';
COMMENT ON TABLE user_permissions IS 'Granular permissions for users on specific resources';
COMMENT ON TABLE folders IS 'Hierarchical folder structure for organizing media';
COMMENT ON TABLE media_files IS 'All uploaded media files with metadata';
COMMENT ON TABLE media_tags IS 'Tags for categorizing media files';
COMMENT ON TABLE playlists IS 'Collections of media for slideshows and movie lists';
COMMENT ON TABLE activity_logs IS 'System activity logging for admin monitoring';
COMMENT ON TABLE system_settings IS 'Configurable system settings';