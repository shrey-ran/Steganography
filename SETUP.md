# 🚀 Setup Instructions for Steganography Research Platform

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Git

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

### 2. Environment Configuration

#### Backend Environment Variables

Create `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
# SECURITY & ETHICS
ALLOW_TRAINING=false  # Set to 'true' ONLY after supervisor/IRB approval

# SERVER CONFIGURATION
NODE_ENV=development
PORT=8000
LOG_LEVEL=info

# DATABASE
DB_PATH=./scripts/output/db.sqlite

# API KEYS (Add when needed)
# OPENAI_API_KEY=your_key_here
# AWS_ACCESS_KEY_ID=your_key_here
# AWS_SECRET_ACCESS_KEY=your_secret_here
```

#### Frontend Environment Variables

Create `frontend/.env` file:

```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENV=development
REACT_APP_DEBUG=false
```

### 3. Install Dependencies

#### Root Dependencies
```bash
npm install
```

#### Backend Dependencies
```bash
cd backend
npm install
cd ..
```

#### Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### 4. Start the Application

#### Option 1: Start Both Servers Together
```bash
./start-all.sh
```

#### Option 2: Start Individually

**Backend:**
```bash
cd backend
node index.js
```

**Frontend:**
```bash
cd frontend
npm start
```

### 5. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Status:** http://localhost:8000/status

---

## 🔒 Security Notes

### Important: `.env` Files

- **NEVER commit `.env` files to GitHub**
- `.env` is already in `.gitignore`
- Only commit `.env.example` files
- Share sensitive credentials securely (not via GitHub)

### Verify Before Pushing

```bash
# Check what files will be committed
git status

# Verify .env files are NOT listed
git ls-files | grep "\.env$"
# This should return nothing
```

---

## 📤 Pushing to GitHub

### First Time Setup

1. **Create GitHub Repository**
   - Go to https://github.com/new
   - Create a new repository (don't initialize with README)

2. **Add Remote and Push**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

### Subsequent Pushes

```bash
git add .
git commit -m "Your commit message"
git push
```

---

## ⚠️ Ethics & Compliance

This project is for **research purposes only** and requires:

- ✅ Institutional Review Board (IRB) approval
- ✅ Research supervisor authorization
- ✅ Ethics committee review
- ✅ Data privacy compliance

**Before enabling training (`ALLOW_TRAINING=true`):**
1. Obtain written supervisor approval
2. Verify IRB protocol coverage
3. Document security measures
4. Review data handling agreements

---

## 🔧 Troubleshooting

### Backend Not Starting
```bash
# Check if port 8000 is available
lsof -i :8000

# Kill existing process if needed
kill -9 $(lsof -t -i:8000)
```

### Frontend Not Starting
```bash
# Check if port 3000 is available
lsof -i :3000

# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Environment Variables Not Working
```bash
# Restart servers after changing .env
# For React, you MUST restart for changes to take effect
```

---

## 📝 Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   ```bash
   # Edit files
   git add .
   git commit -m "Description of changes"
   ```

3. **Push Branch**
   ```bash
   git push -u origin feature/your-feature-name
   ```

4. **Create Pull Request on GitHub**

---

## 🛠️ Useful Commands

```bash
# Check git status
git status

# View commit history
git log --oneline

# Check ignored files
git check-ignore -v .env

# List all tracked files
git ls-files

# Stop all servers
./stop-all.sh
```

---

## 📚 Additional Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [Git Documentation](https://git-scm.com/doc)

---

## 🆘 Support

For issues or questions:
1. Check existing documentation in `docs/`
2. Review error logs in `logs/`
3. Contact your research supervisor
4. Open an issue on GitHub (no sensitive data)

---

**Remember: This is a research platform. Always follow institutional guidelines and ethics requirements.**
