# 🚀 How to Use Your Steganography Research Platform

## 📋 Overview

You've built a complete **Steganography Research Platform** with two separate web applications for conducting and managing steganography experiments.

---

## 🏗️ What You Have

### **1. Backend API Server** (Port 8000)
- **URL**: `http://localhost:8000`
- Handles all experiment data and processing
- REST API for creating, running, and managing experiments
- SQLite database for storage
- Currently in **DRY-RUN MODE** (safe, no actual training)

### **2. Main Research Dashboard** (Port 3000)
- **URL**: `http://localhost:3000`
- View all experiments
- Dashboard with statistics
- Run experiments (dry-run mode)
- Complete documentation with:
  - Getting Started Guide
  - API Reference
  - Ethics Guidelines
  - Transform Reference

### **3. Experiment Builder** (Port 3001)
- **URL**: `http://localhost:3001`
- **Standalone application** for creating experiments
- 5-step wizard interface:
  1. Basic Info (name your experiment)
  2. Dataset Selection (choose image dataset)
  3. Parameters (batch size & epochs)
  4. Transforms (JPEG, resize, noise)
  5. Review & Create

---

## 🎯 How to Use the Platform

### **Step 1: Start All Services**

```bash
# Terminal 1: Start Backend (Port 8000)
cd /Users/apple/Desktop/Stegnography
node backend/index.js

# Terminal 2: Start Main App (Port 3000)
cd /Users/apple/Desktop/Stegnography/frontend
npm start

# Terminal 3: Start Builder (Port 3001)
cd /Users/apple/Desktop/Stegnography/builder
npm start
```

**Or use the quick start script:**
```bash
cd /Users/apple/Desktop/Stegnography
./start-all.sh
```

---

### **Step 2: Create Your First Experiment**

#### **Option A: Using the Experiment Builder (Recommended for beginners)**

1. Open `http://localhost:3001` in your browser
2. **Step 1 - Basic Info:**
   - Enter a descriptive name (e.g., "JPEG-Compression-Test-2025-12-08")
   - Click "Next: Choose Dataset"

3. **Step 2 - Dataset:**
   - Select a dataset (start with "Sample Images")
   - Click "Next: Configure Parameters"

4. **Step 3 - Parameters:**
   - Set Batch Size (4-8 for testing)
   - Set Epochs (1-5 for quick tests)
   - Click "Next: Add Transforms"

5. **Step 4 - Transforms (Optional):**
   - Select transform type (JPEG, Resize, or Gaussian Noise)
   - Adjust parameters with sliders
   - Click "Add Transform" to add it
   - Can add multiple transforms
   - Click "Next: Review & Create"

6. **Step 5 - Review:**
   - Verify all settings
   - Click "🚀 Create Experiment"
   - Note the Experiment ID shown on success

#### **Option B: Using the Main Dashboard**

1. Open `http://localhost:3000`
2. Click "➕ New Experiment" in the sidebar
3. Fill in the form in the modal
4. Click "Create Experiment"

---

### **Step 3: View Your Experiments**

1. Go to `http://localhost:3000`
2. Click "🧪 Experiments" in the sidebar
3. See all your created experiments with:
   - Name and status badges
   - Configuration details (batch size, epochs)
   - Transforms applied
   - Created date

---

### **Step 4: Run an Experiment (Dry-Run)**

1. On the Experiments page, find your experiment
2. Click "🏃 Run Dry-Run" button
3. This will:
   - Validate your configuration
   - Check if transforms are valid
   - Simulate the experiment process
   - **No actual training happens** (safe mode)
4. Check the backend terminal for logs

---

### **Step 5: Explore Documentation**

1. Go to `http://localhost:3000`
2. Click "📚 Documentation" in the sidebar
3. Browse through:
   - **📋 Getting Started** - Step-by-step guide
   - **🔧 API Reference** - REST API documentation
   - **⚖️ Ethics Guidelines** - Research compliance requirements
   - **🧪 Transform Reference** - Available image transformations

---

## 🔧 API Endpoints (For Advanced Users)

### Check API Status
```bash
curl http://localhost:8000/status
```

### List All Experiments
```bash
curl http://localhost:8000/experiments
```

### Create Experiment via API
```bash
curl -X POST http://localhost:8000/experiments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Test Experiment",
    "dataset": "sample_images",
    "batchSize": 4,
    "epochs": 1,
    "transforms": [
      {"name": "jpeg", "quality": 80}
    ]
  }'
```

### Run Experiment
```bash
curl -X POST http://localhost:8000/experiments/{EXPERIMENT_ID}/run \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}'
```

---

## 📊 Example Experiment Configurations

### 1. **JPEG Compression Test**
- **Goal**: Test how steganography survives JPEG compression
- **Dataset**: Sample Images
- **Batch Size**: 4
- **Epochs**: 1
- **Transforms**: 
  - JPEG compression with quality 80

### 2. **Multi-Transform Robustness**
- **Goal**: Test against multiple manipulations
- **Dataset**: COCO Subset
- **Batch Size**: 8
- **Epochs**: 5
- **Transforms**:
  1. Resize to 512x512
  2. JPEG compression quality 85
  3. Gaussian noise (sigma: 0.02)

### 3. **Noise Resilience Test**
- **Goal**: Test resistance to random noise
- **Dataset**: Sample Images
- **Batch Size**: 4
- **Epochs**: 3
- **Transforms**:
  - Gaussian noise with varying sigma (0.05, 0.1)

---

## ⚠️ Important Notes

### **Training Mode is DISABLED**
- Currently in `ALLOW_TRAINING=false` mode
- All runs are **dry-runs** (simulations only)
- No actual model training occurs
- Safe for testing and learning

### **To Enable Real Training** (Requires Approval)
1. Get written approval from research supervisor
2. Verify IRB/ethics approval
3. Update `.env` file:
   ```
   ALLOW_TRAINING=true
   ```
4. Restart backend server
5. **WARNING**: Only do this if you understand the implications

### **Research Ethics**
- This is for **research and educational purposes only**
- Do NOT use for malicious purposes
- Do NOT bypass content moderation systems
- Do NOT share without supervisor approval
- Read ethics guidelines in the documentation tab

---

## 🗂️ Project Structure

```
/Users/apple/Desktop/Stegnography/
├── backend/              # API server (Port 8000)
│   └── index.js         # Main server file
├── frontend/            # Main Dashboard (Port 3000)
│   ├── src/
│   │   ├── App.js      # Main application
│   │   └── App.css     # Light theme styles
│   └── package.json
├── builder/             # Experiment Builder (Port 3001)
│   ├── src/
│   │   ├── App.js      # Builder wizard
│   │   └── App.css     # Builder styles
│   └── package.json
├── data/                # SQLite database & experiments
├── scripts/             # Utility scripts
├── tests/               # Test files
├── .env                 # Environment configuration
└── package.json         # Root dependencies
```

---

## 🎓 Learning Path

### **Beginner Level**
1. ✅ Create your first experiment using the Builder
2. ✅ Run a dry-run and check the logs
3. ✅ Read the Getting Started documentation
4. ✅ Try different transform combinations
5. ✅ View experiment statistics on dashboard

### **Intermediate Level**
1. Use the API directly with curl/Postman
2. Understand how transforms affect images
3. Read the Transform Reference documentation
4. Create experiments with multiple transforms
5. Analyze dry-run results

### **Advanced Level**
1. Review the backend code in `backend/index.js`
2. Understand the experiment execution flow
3. Read Ethics Guidelines thoroughly
4. Prepare for enabling training mode (with approval)
5. Plan research methodology and experiments

---

## 🐛 Troubleshooting

### **Port Already in Use**
```bash
# Kill processes on specific ports
lsof -ti:8000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### **Backend Not Responding**
```bash
# Check if backend is running
curl http://localhost:8000/status

# Restart backend
cd /Users/apple/Desktop/Stegnography
node backend/index.js
```

### **Frontend Shows Old Data**
```bash
# Clear browser cache and refresh
# Or restart the React dev server
cd frontend  # or builder
npm start
```

### **Database Issues**
```bash
# Database is at data/experiments.db
# View with SQLite browser or command line
sqlite3 data/experiments.db "SELECT * FROM experiments;"
```

---

## 📞 Next Steps

### **For Research**
1. Define your research questions
2. Plan experiment configurations
3. Get necessary approvals (IRB, supervisor)
4. Create and run experiments systematically
5. Document results thoroughly

### **For Development**
1. Review the codebase
2. Add custom transforms
3. Extend the API
4. Improve the UI/UX
5. Write additional tests

### **For Learning**
1. Study steganography concepts
2. Understand image transformations
3. Learn about robustness testing
4. Read research papers
5. Experiment with different configurations

---

## 🎉 You're Ready!

Your platform is fully functional and ready to use. Start by:
1. Opening `http://localhost:3001` (Experiment Builder)
2. Creating your first experiment
3. Viewing it at `http://localhost:3000` (Main Dashboard)
4. Running a dry-run to see how it works

**Happy Researching! 🔬**

---

*Last Updated: December 8, 2025*
*Platform Version: 1.0*
