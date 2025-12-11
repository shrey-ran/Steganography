# stego-robustness-js-local

**⚠️ LOCAL-ONLY PROJECT - DO NOT PUSH TO REMOTE REPOSITORIES WITHOUT SUPERVISOR APPROVAL ⚠️**

A JavaScript-first steganography research project for local development and testing. Built with Node.js/Express backend, React PWA frontend, and TensorFlow.js stubs.

## ⚠️ Important Notice

This project is intended for **local research purposes only** and must comply with ethical guidelines and IRB requirements. Do not share, publish, or push to any remote repository (GitHub, GitLab, etc.) without explicit approval from your research supervisor.

## Tech Stack

- **Backend**: Node.js + Express + SQLite3
- **Frontend**: React (PWA) + Create React App
- **ML**: TensorFlow.js (@tensorflow/tfjs-node)
- **Image Processing**: Sharp, Jimp
- **Logging**: Pino
- **Database**: SQLite3 + LowDB

## Quick Start

```bash
# Install root dependencies
npm install

# Start backend in development mode (with auto-restart)
npm run dev

# In a new terminal, start React frontend
cd frontend
npm start
```

The backend will run on `http://localhost:3000` (or configured port) and the frontend on `http://localhost:3000` (React dev server).

## Folder Layout

```
stego-robustness-js-local/
├── backend/           # Express server, API routes, stego logic
├── frontend/          # React PWA frontend
├── scripts/           # Utility scripts (init_local_git.sh, etc.)
├── data/              # Local databases, test images (gitignored)
├── models/            # TF.js model files (gitignored)
├── tests/             # Jest test files
├── .env               # Environment variables (gitignored)
├── package.json       # Root dependencies & scripts
└── README.md          # This file
```

## Scripts

- `npm start` - Run backend server (production)
- `npm run dev` - Run backend with nodemon (development)
- `npm test` - Run Jest tests
- `npm run init-local` - Initialize local git repository

## Development Notes

- All sensitive data stays local
- Use `.env` for configuration (never commit)
- Test images and models are gitignored by default
- Follow ethical guidelines for steganography research
- Document all experiments locally

## Ethics & Compliance

This project must adhere to:
- Institutional Review Board (IRB) requirements
- Ethical use guidelines for steganography research
- Data privacy and security protocols
- Supervisor approval before any external sharing

---

**Remember: This is a LOCAL-ONLY project. Do not push to remote repositories.**
