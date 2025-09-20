# Quick Setup Guide

This guide will help you get Vision Media Hub running quickly on your system.

## 🚀 Quick Start (5 minutes)

### Step 1: Prerequisites Check
```bash
# Check Node.js version (should be 18+)
node --version

# Check npm version
npm --version
```

If Node.js is not installed, download from [nodejs.org](https://nodejs.org/)

### Step 2: Download and Setup
```bash
# Clone or download the project
cd vision-dataaccess

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Step 3: Basic Configuration
Create `server/.env`:
```env
PORT=3001
JWT_SECRET=change-this-secret-key-in-production
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

### Step 4: Start the Application
```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
cd client
npm run dev
```

### Step 5: Access the Application
- Open your browser to: http://localhost:3000
- Login with: admin@example.com / admin123

## 📺 TV Browser Setup

### For Smart TVs
1. Open your TV's web browser
2. Navigate to: `http://[YOUR_COMPUTER_IP]:3000`
3. Use your TV remote to navigate

### Find Your Computer's IP Address
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
# or
ip addr show
```

## 🔧 Production Setup

### Step 1: Environment Variables
Update `server/.env` for production:
```env
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secure-secret-key-here
ADMIN_EMAIL=your-admin@email.com
ADMIN_PASSWORD=your-secure-password
```

### Step 2: Build and Deploy
```bash
# Build frontend
cd client
npm run build

# Start production server
cd ../server
npm start
```

### Step 3: Process Management (Optional)
```bash
# Install PM2 for process management
npm install -g pm2

# Start with PM2
cd server
pm2 start app.js --name "vision-media-hub"

# Save PM2 configuration
pm2 save
pm2 startup
```

## 🐳 Docker Setup (Alternative)

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  vision-media-hub:
    build: .
    ports:
      - "3000:3000"
      - "3001:3001"
    volumes:
      - ./uploads:/app/server/uploads
      - ./database:/app/server/database
    environment:
      - NODE_ENV=production
      - JWT_SECRET=your-secret-key
```

Run with Docker:
```bash
docker-compose up -d
```

## 🔒 Security Checklist

- [ ] Change default admin password
- [ ] Update JWT_SECRET
- [ ] Configure firewall rules
- [ ] Enable HTTPS (for production)
- [ ] Set up regular backups
- [ ] Update file upload limits

## 📱 Mobile Access

The application is responsive and works on mobile devices:
- iOS Safari
- Android Chrome
- Mobile browsers

## 🎮 TV Remote Testing

Test these key combinations:
- Arrow keys for navigation
- Enter to select
- Escape to go back
- Space for play/pause
- ? for help

## 🆘 Quick Troubleshooting

### Application Won't Start
```bash
# Check if ports are in use
lsof -i :3000
lsof -i :3001

# Kill processes if needed
kill -9 [PID]
```

### Database Issues
```bash
# Reset database
rm server/database.sqlite
# Restart server to recreate
```

### File Upload Problems
```bash
# Check upload directory permissions
ls -la server/uploads/
chmod 755 server/uploads/
```

### TV Browser Issues
- Ensure JavaScript is enabled
- Clear browser cache
- Check network connectivity
- Try different browser if available

## 📞 Getting Help

1. Check the main README.md for detailed documentation
2. Look at browser console for error messages
3. Check server logs in `server/logs/`
4. Verify network connectivity between devices

## 🎯 Next Steps

After setup:
1. Upload some test media files
2. Create folders to organize content
3. Test slideshow functionality
4. Try movie streaming features
5. Explore admin panel features

## 🔄 Updates

To update the application:
```bash
# Pull latest changes
git pull origin main

# Update dependencies
cd server && npm install
cd ../client && npm install

# Rebuild frontend
cd client && npm run build

# Restart services
```

## 📊 Performance Tips

### For Better TV Experience
- Use wired network connection
- Ensure good WiFi signal strength
- Close other applications on TV
- Use supported video formats (MP4, H.264)

### For Large Media Libraries
- Organize files in folders
- Use appropriate file sizes
- Consider video compression
- Regular database maintenance

---

**Need more help?** Check the full README.md or create an issue on GitHub.