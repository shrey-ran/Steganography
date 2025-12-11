# Contributing to Stegnography (Local Development)

## Overview

Thank you for your interest in contributing to this steganography research project. This guide covers local development setup, testing procedures, and contribution guidelines.

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git for version control
- Basic knowledge of JavaScript, React, and Express.js

### Initial Setup

1. **Clone and Install Dependencies**

```bash
cd /Users/apple/Desktop/Stegnography

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

2. **Verify Installation**

```bash
# Run tests to ensure everything works
npm test

# Should see: 62/62 tests passing
```

## Running the Application

### Quick Start (Recommended)

Use the automated start/stop scripts:

```bash
# Start both backend and frontend
./start-all.sh

# Stop all servers
./stop-all.sh
```

The scripts will:
- Start backend on `http://localhost:8000`
- Start frontend on `http://localhost:3000`
- Check for port conflicts
- Run health checks
- Display status and logs

### Manual Start

If you prefer manual control:

**Backend:**
```bash
# From project root
npm start

# Or with pretty logging
npm run dev
```

**Frontend:**
```bash
# From frontend directory
cd frontend
npm start
```

### Verify Services

- Backend API: http://localhost:8000/status
- Frontend UI: http://localhost:3000
- API health check should return: `{"status":"ok","timestamp":"..."}`

## Running Tests

### Run All Tests

```bash
npm test
```

Expected output:
```
Test Suites: 2 passed, 2 total
Tests:       62 passed, 62 total
```

### Run Specific Test Suites

```bash
# API route tests only
npm test -- tests/test_api_routes.test.js

# Transform tests only
npm test -- tests/test_transforms.test.js
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

### Test Coverage

```bash
npm test -- --coverage
```

### Writing Tests

All tests should follow the existing patterns:

**Location:** `tests/test_*.test.js`

**Example test structure:**
```javascript
const request = require('supertest');

describe('Feature Name', () => {
  beforeAll(async () => {
    // Setup
  });

  afterAll(async () => {
    // Cleanup
  });

  it('should do something specific', async () => {
    // Test implementation
    expect(result).toBe(expected);
  });
});
```

**Test Requirements:**
- All new features must include tests
- Maintain 100% pass rate (62/62 tests)
- Use descriptive test names
- Include edge cases and error scenarios
- Mock external dependencies appropriately

## Development Workflow

### 1. Create a Branch

```bash
# IMPORTANT: Do NOT push to remote without approval
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Follow existing code style and conventions
- Add comments for complex logic
- Update documentation if needed
- Test incrementally as you develop

### 3. Run Tests

```bash
# Before committing, ensure all tests pass
npm test

# Check for linting issues (if configured)
npm run lint
```

### 4. Commit Changes

```bash
git add .
git commit -m "Description of changes"
```

### 5. Local Review

**Before any push, complete this checklist:**

- [ ] All tests passing (62/62)
- [ ] Code follows project conventions
- [ ] Documentation updated if needed
- [ ] No sensitive data in commits
- [ ] License compliance verified
- [ ] Dataset usage authorized
- [ ] Ethics guidelines followed
- [ ] Supervisor approval obtained

## Project Structure

```
Stegnography/
├── backend/
│   ├── server.js          # Express API server
│   └── db/                # LowDB persistence
├── frontend/
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   ├── App.css        # Styling
│   │   └── index.js       # Entry point
│   └── public/
├── experiments/
│   ├── transforms.js      # Image transformations
│   └── runner.js          # Experiment execution
├── tests/
│   ├── test_api_routes.test.js    # API tests
│   └── test_transforms.test.js    # Transform tests
├── config/
│   └── sample_experiment.json     # Example config
├── docs/
│   ├── IMPLEMENTATION_GUIDELINES_LOCAL.md
│   └── CONTRIBUTING_LOCAL.md
├── start-all.sh           # Startup script
├── stop-all.sh            # Shutdown script
└── package.json
```

## Code Style Guidelines

### JavaScript/Node.js

- Use ES6+ features (async/await, arrow functions, const/let)
- Prefer `const` over `let`, avoid `var`
- Use descriptive variable names
- Add JSDoc comments for functions
- Handle errors appropriately with try-catch

**Example:**
```javascript
/**
 * Apply JPEG compression to image
 * @param {Buffer} buffer - Input image buffer
 * @param {number} quality - JPEG quality (0-100)
 * @returns {Promise<Buffer>} Compressed image buffer
 */
async function applyJpeg(buffer, quality = 80) {
  try {
    // Implementation
    return compressed;
  } catch (error) {
    console.error(`JPEG compression failed: ${error.message}`);
    throw error;
  }
}
```

### React/Frontend

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use meaningful component and variable names
- Follow existing CSS conventions

### Logging

Use consistent logging levels:
```javascript
console.log('[Module] Info message');
console.warn('[Module] Warning message');
console.error('[Module] Error message');
```

## Common Development Tasks

### Adding a New API Route

1. Add route in `backend/server.js`
2. Implement handler function
3. Add tests in `tests/test_api_routes.test.js`
4. Update API documentation
5. Run tests to verify

### Adding a New Image Transform

1. Add function in `experiments/transforms.js`
2. Follow existing function signature patterns
3. Add tests in `tests/test_transforms.test.js`
4. Document parameters and behavior
5. Verify with sample images

### Modifying the Database Schema

1. Update schema in `backend/server.js`
2. Handle migration for existing data
3. Update related API endpoints
4. Add/update tests
5. Document schema changes

## Debugging

### Backend Debugging

```bash
# Enable detailed logging
DEBUG=* npm start

# Or use Node.js inspector
node --inspect backend/server.js
```

### Frontend Debugging

- Use React DevTools browser extension
- Check browser console for errors
- Use `console.log` for quick debugging
- Use breakpoints in browser DevTools

### Common Issues

**Port already in use:**
```bash
# Kill processes on ports
lsof -ti:8000 | xargs kill -9
lsof -ti:3000 | xargs kill -9

# Or use stop script
./stop-all.sh
```

**Tests failing:**
```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# Clear Jest cache
npm test -- --clearCache
```

**Frontend not connecting to backend:**
- Verify backend is running on port 8000
- Check CORS configuration in `backend/server.js`
- Verify proxy settings in `frontend/package.json`

## 🚨 STRICT RULES - READ CAREFULLY

### ⛔ NO REMOTE PUSHES WITHOUT APPROVAL

**YOU MUST NOT push to any remote repository without explicit supervisor approval.**

```bash
# ❌ NEVER do this without approval:
git push origin main
git push origin feature-branch

# ✅ ONLY push after approval:
# 1. Complete all checks below
# 2. Get written supervisor approval
# 3. Then push with supervisor present
```

### 📋 Pre-Push Checklist

Before requesting push approval, verify:

#### Code Quality
- [ ] All tests pass (62/62)
- [ ] No console errors or warnings
- [ ] Code reviewed by at least one peer
- [ ] Documentation updated
- [ ] No commented-out code or debug statements

#### Security & Privacy
- [ ] No hardcoded credentials or API keys
- [ ] No personal information in code or commits
- [ ] No sensitive file paths exposed
- [ ] `.gitignore` properly configured
- [ ] No large binary files added unnecessarily

#### License Compliance
- [ ] All dependencies have compatible licenses
- [ ] No GPL code in permissive-licensed project
- [ ] License headers added to new files if required
- [ ] Third-party code properly attributed
- [ ] Check `npm ls --production` for license conflicts

#### Dataset & Data Usage
- [ ] Dataset usage authorized and documented
- [ ] Dataset not committed to repository (use .gitignore)
- [ ] Data sources cited properly
- [ ] No copyrighted images without permission
- [ ] Privacy-sensitive data anonymized or removed
- [ ] Dataset location in `.env` or config, not hardcoded

#### Ethics & Compliance
- [ ] Ethics checklist completed (see IMPLEMENTATION_GUIDELINES_LOCAL.md)
- [ ] No malicious functionality added
- [ ] Intended use cases documented
- [ ] Potential misuse scenarios considered
- [ ] Safeguards implemented where needed

### 🔒 License Verification Commands

Before pushing, run:

```bash
# Check all dependency licenses
npm ls --production --parseable | while read line; do
  if [ -f "$line/package.json" ]; then
    echo "$line: $(cat $line/package.json | grep '"license"' | head -1)"
  fi
done

# Or use license-checker if installed
npx license-checker --summary
```

**Acceptable licenses for this project:**
- MIT
- Apache-2.0
- BSD (2-Clause, 3-Clause)
- ISC
- CC0-1.0

**Require review:**
- LGPL (may be acceptable)
- MPL-2.0 (may be acceptable)

**Not acceptable:**
- GPL, AGPL (copyleft conflict)
- Proprietary/Commercial
- No license specified

### 📁 Dataset Guidelines

**Datasets must:**
- Be stored outside repository (use `datasets/` in `.gitignore`)
- Have documented source and license
- Not contain copyrighted material without permission
- Not contain personal/sensitive information
- Be accessed via configuration, not hardcoded paths

**Example configuration:**
```json
{
  "dataset": "sample_images",
  "datasetPath": "./datasets/sample_images",
  "datasetLicense": "CC0-1.0",
  "datasetSource": "https://example.com/dataset"
}
```

## Getting Help

### Internal Resources

- Check existing documentation in `docs/`
- Review test files for usage examples
- Read inline code comments
- Check git history for context

### Before Asking

1. Search existing issues/documentation
2. Try debugging with console.log or debugger
3. Verify tests are passing
4. Check if recent changes caused the issue

### Asking for Help

When requesting assistance:
- Describe what you're trying to achieve
- Show what you've tried
- Include error messages (full stack trace)
- Share relevant code snippets
- Mention your environment (OS, Node version, etc.)

## Approval Process

### To Request Push Approval:

1. **Complete all checklists** in this document
2. **Generate a pre-push report:**

```bash
# Run this before requesting approval
cat << EOF > pre-push-report.txt
=== Pre-Push Report ===
Date: $(date)
Branch: $(git branch --show-current)
Commit: $(git rev-parse HEAD)

=== Test Results ===
$(npm test 2>&1 | tail -20)

=== License Check ===
$(npx license-checker --summary)

=== Modified Files ===
$(git diff --name-only origin/main)

=== Commit Messages ===
$(git log origin/main..HEAD --oneline)
EOF

cat pre-push-report.txt
```

3. **Send report to supervisor** with:
   - Purpose of changes
   - Testing performed
   - Risk assessment
   - License compliance confirmation
   - Dataset authorization confirmation

4. **Wait for explicit written approval** before pushing

5. **After approval:**
```bash
# With supervisor's permission
git push origin your-branch-name
```

## Thank You

Your contributions help advance steganography research responsibly. By following these guidelines, you ensure the project remains ethical, legal, and high-quality.

---

**Questions?** Contact your project supervisor before proceeding with any changes.
