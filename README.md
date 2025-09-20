# Vision Media Hub

A comprehensive media streaming and management platform optimized for TV browsers (Roku, Samsung Smart TVs, etc.) with support for photos, videos, and movies. Built with Node.js backend and Nuxt.js frontend.

## 🚀 Features

### Core Features
- **Media Gallery**: Browse photos and videos with slideshow functionality
- **Movie Streaming**: Dedicated movies section with streaming capabilities
- **Folder Management**: Organize media files in custom folders
- **File Upload**: Drag-and-drop file uploads with progress tracking
- **User Authentication**: Secure login system with JWT tokens
- **Admin Panel**: User management and system overview

### TV Browser Optimization
- **Remote-Friendly Navigation**: Optimized for TV remote controls
- **Large Touch Targets**: UI elements sized for TV interaction
- **Spatial Navigation**: Arrow key navigation between elements
- **Keyboard Shortcuts**: Quick actions via remote control
- **Focus Indicators**: Clear visual feedback for focused elements
- **Responsive Design**: Adapts to various TV screen sizes

### Media Features
- **Image Support**: JPEG, PNG, GIF, WebP formats
- **Video Support**: MP4, AVI, MKV, MOV formats
- **Thumbnail Generation**: Automatic thumbnails for videos
- **Metadata Extraction**: File information and EXIF data
- **Slideshow Mode**: Full-screen photo slideshow
- **Video Streaming**: Progressive video streaming

## 📋 Prerequisites

- Node.js 18+ and npm
- SQLite (included with Node.js)
- Modern web browser or TV browser

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd vision-dataaccess
```

### 2. Install Backend Dependencies
```bash
cd server
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../client
npm install
```

### 4. Environment Configuration

Create `.env` file in the `server` directory:
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=./database.sqlite

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=500MB
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/gif,image/webp
ALLOWED_VIDEO_TYPES=video/mp4,video/avi,video/mkv,video/mov

# Admin User (created on first run)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

Create `.env` file in the `client` directory:
```env
# API Configuration
API_BASE_URL=http://localhost:3001
```

## 🚀 Running the Application

### Development Mode

1. **Start the Backend Server**:
```bash
cd server
npm run dev
```
The server will start on http://localhost:3001

2. **Start the Frontend Development Server**:
```bash
cd client
npm run dev
```
The client will start on http://localhost:3000

### Production Mode

1. **Build the Frontend**:
```bash
cd client
npm run build
```

2. **Start the Production Server**:
```bash
cd server
npm start
```

## 📁 Project Structure

```
vision-dataaccess/
├── server/                 # Backend Node.js application
│   ├── config/            # Configuration files
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Express middleware
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   ├── uploads/          # File upload directory
│   └── app.js            # Main server file
├── client/               # Frontend Nuxt.js application
│   ├── assets/           # Static assets and styles
│   ├── components/       # Vue components
│   ├── layouts/          # Page layouts
│   ├── middleware/       # Route middleware
│   ├── pages/            # Application pages
│   ├── plugins/          # Nuxt plugins
│   ├── stores/           # Pinia stores
│   └── nuxt.config.ts    # Nuxt configuration
└── README.md
```

## 🎮 TV Remote Controls

### Navigation
- **Arrow Keys**: Navigate between elements
- **Enter**: Select/activate element
- **Escape**: Go back or close modal
- **H**: Go to home page

### Media Controls
- **Space**: Play/pause media
- **← →**: Skip backward/forward (10 seconds)
- **↑ ↓**: Volume up/down (with Ctrl/Alt)

### Quick Actions
- **S**: Focus search input
- **U**: Open upload modal
- **N**: Create new folder
- **V**: Toggle view mode
- **F5**: Start slideshow
- **?**: Show/hide help guide

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh JWT token

### Users
- `GET /api/users` - List users (admin only)
- `POST /api/users` - Create user (admin only)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)

### Folders
- `GET /api/folders` - List folders
- `POST /api/folders` - Create folder
- `GET /api/folders/:id` - Get folder details
- `PUT /api/folders/:id` - Update folder
- `DELETE /api/folders/:id` - Delete folder

### Media
- `GET /api/media` - List media files
- `POST /api/media/upload` - Upload media files
- `GET /api/media/:id` - Get media details
- `GET /api/media/:id/stream` - Stream media file
- `PUT /api/media/:id` - Update media metadata
- `DELETE /api/media/:id` - Delete media file

### Movies
- `GET /api/movies` - List movies
- `POST /api/movies` - Add new movie
- `GET /api/movies/:id` - Get movie details
- `GET /api/movies/:id/stream` - Stream movie
- `PUT /api/movies/:id` - Update movie
- `DELETE /api/movies/:id` - Delete movie

## 🎨 Customization

### Themes
The application uses Tailwind CSS with a dark theme optimized for TV viewing. You can customize colors in `client/tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#3b82f6', // Change primary color
          600: '#2563eb',
          700: '#1d4ed8'
        }
      }
    }
  }
}
```

### TV Optimization
TV-specific styles are in `client/assets/css/tv-optimized.css`. Adjust:
- Font sizes for different screen sizes
- Focus indicator styles
- Button sizes and spacing
- Grid layouts for media items

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- File type validation
- File size limits
- SQL injection prevention
- XSS protection
- CORS configuration
- Rate limiting

## 📱 Browser Compatibility

### Supported TV Browsers
- Roku Browser
- Samsung Smart TV Browser
- LG webOS Browser
- Android TV Browser
- Apple TV Browser

### Desktop Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🐛 Troubleshooting

### Common Issues

**1. Database Connection Error**
```bash
# Delete existing database and restart
rm server/database.sqlite
cd server && npm run dev
```

**2. File Upload Issues**
- Check `UPLOAD_DIR` permissions
- Verify `MAX_FILE_SIZE` setting
- Ensure disk space is available

**3. TV Remote Not Working**
- Ensure JavaScript is enabled
- Check browser console for errors
- Try refreshing the page

**4. Video Streaming Issues**
- Verify video file format is supported
- Check network connection
- Ensure sufficient bandwidth

### Performance Optimization

**For Large Media Libraries**:
1. Enable database indexing
2. Implement pagination
3. Use CDN for static assets
4. Enable gzip compression

**For TV Browsers**:
1. Reduce image sizes
2. Limit concurrent uploads
3. Use video compression
4. Enable caching

## 🔄 Updates and Maintenance

### Database Migrations
```bash
cd server
npm run migrate
```

### Backup Data
```bash
# Backup database
cp server/database.sqlite server/database.backup.sqlite

# Backup uploads
tar -czf uploads-backup.tar.gz server/uploads/
```

### Log Files
Logs are stored in `server/logs/` directory:
- `access.log` - HTTP access logs
- `error.log` - Application errors
- `debug.log` - Debug information

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check browser console for errors
4. Create an issue on GitHub

## 🔮 Future Features

- Web scraping integration for movie metadata
- Subtitle support for videos
- Multi-user playlists
- Mobile app companion
- Cloud storage integration
- Advanced search and filtering
- Social features and sharing