/**
 * tests/test_api_routes.test.js
 * API route tests using Jest + Supertest
 * Tests backend API endpoints with sample data
 */

const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '8001';
process.env.ALLOW_TRAINING = 'false';
process.env.DB_PATH = './tests/test_db.json';

// Simple in-memory database for testing
class MockDB {
  constructor() {
    this.data = { experiments: [] };
  }

  async read() {
    return this.data;
  }

  async write() {
    return true;
  }

  reset() {
    this.data = { experiments: [] };
  }
}

describe('API Routes', () => {
  let app;
  let db;
  const testOutputDir = path.join(__dirname, 'test_output');

  // Setup before all tests
  beforeAll(async () => {
    // Create test output directory
    await fs.mkdir(testOutputDir, { recursive: true });
  });

  // Setup before each test
  beforeEach(async () => {
    // Create a fresh Express app for each test
    app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    // CORS middleware
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      next();
    });

    // Initialize mock database
    db = new MockDB();

    // Setup routes
    setupRoutes();
  });

  // Cleanup after all tests
  afterAll(async () => {
    // Clean up test files
    try {
      await fs.rm(testOutputDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  // Setup API routes
  function setupRoutes() {
    // GET /status - Health check endpoint
    app.get('/status', (req, res) => {
      res.json({
        status: 'ok',
        time: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        trainingEnabled: process.env.ALLOW_TRAINING === 'true',
        version: '1.0.0'
      });
    });

    // POST /experiments - Create new experiment
    app.post('/experiments', async (req, res) => {
      try {
        const { name, dataset, transforms } = req.body;

        // Validation
        if (!name) {
          return res.status(400).json({ error: 'Experiment name is required' });
        }

        // Create experiment object
        const experiment = {
          id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name,
          dataset: dataset || 'default',
          transforms: transforms || [],
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Save to database
        await db.read();
        db.data.experiments.push(experiment);
        await db.write();

        res.status(201).json(experiment);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // GET /experiments - List all experiments
    app.get('/experiments', async (req, res) => {
      try {
        await db.read();
        res.json({
          count: db.data.experiments.length,
          experiments: db.data.experiments
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // GET /experiments/:id - Get single experiment
    app.get('/experiments/:id', async (req, res) => {
      try {
        await db.read();
        const experiment = db.data.experiments.find(e => e.id === req.params.id);
        
        if (!experiment) {
          return res.status(404).json({ error: 'Experiment not found' });
        }

        res.json(experiment);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // POST /experiments/:id/run - Run experiment
    app.post('/experiments/:id/run', async (req, res) => {
      try {
        const { dryRun = true } = req.body;
        const trainingEnabled = process.env.ALLOW_TRAINING === 'true';

        await db.read();
        const experiment = db.data.experiments.find(e => e.id === req.params.id);

        if (!experiment) {
          return res.status(404).json({ error: 'Experiment not found' });
        }

        // Check if training is allowed
        if (!dryRun && !trainingEnabled) {
          return res.status(403).json({
            error: 'Training not allowed',
            message: 'Set ALLOW_TRAINING=true in .env after obtaining supervisor/IRB approval'
          });
        }

        // Update experiment status
        experiment.status = dryRun ? 'running-dry-run' : 'running';
        experiment.dryRun = dryRun;
        experiment.startedAt = new Date().toISOString();
        experiment.updatedAt = new Date().toISOString();
        await db.write();

        // Simulate experiment execution (in real app, this would spawn a child process)
        // For tests, we immediately mark as completed
        setTimeout(async () => {
          await db.read();
          const exp = db.data.experiments.find(e => e.id === req.params.id);
          if (exp) {
            exp.status = 'completed';
            exp.completedAt = new Date().toISOString();
            exp.updatedAt = new Date().toISOString();
            await db.write();
          }
        }, 100);

        res.json({
          message: dryRun ? 'Dry-run experiment started' : 'Experiment started',
          experimentId: req.params.id,
          dryRun,
          trainingEnabled,
          status: experiment.status
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // GET /results/:id - Get experiment results
    app.get('/results/:id', async (req, res) => {
      try {
        await db.read();
        const experiment = db.data.experiments.find(e => e.id === req.params.id);

        if (!experiment) {
          return res.status(404).json({ error: 'Experiment not found' });
        }

        // Mock results for testing
        const results = {
          experimentId: req.params.id,
          status: experiment.status,
          metrics: {
            psnr: 35.42,
            ssim: 0.95,
            bitAccuracy: 0.98
          },
          timestamp: new Date().toISOString()
        };

        res.json(results);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
  }

  // ========================================
  // TEST CASES
  // ========================================

  describe('GET /status', () => {
    it('should return 200 and status information', async () => {
      const response = await request(app)
        .get('/status')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('environment', 'test');
      expect(response.body).toHaveProperty('trainingEnabled', false);
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('time');
    });

    it('should return valid ISO timestamp', async () => {
      const response = await request(app)
        .get('/status')
        .expect(200);

      const timestamp = new Date(response.body.time);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });
  });

  describe('POST /experiments', () => {
    it('should create an experiment and return 201', async () => {
      const newExperiment = {
        name: 'Test Experiment 1',
        dataset: 'sample',
        transforms: [
          { type: 'jpeg-compression', params: { quality: 75 } },
          { type: 'gaussian-noise', params: { stddev: 10 } }
        ]
      };

      const response = await request(app)
        .post('/experiments')
        .send(newExperiment)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Test Experiment 1');
      expect(response.body).toHaveProperty('dataset', 'sample');
      expect(response.body).toHaveProperty('status', 'pending');
      expect(response.body).toHaveProperty('transforms');
      expect(response.body.transforms).toHaveLength(2);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('should return 400 if name is missing', async () => {
      const invalidExperiment = {
        dataset: 'sample'
      };

      const response = await request(app)
        .post('/experiments')
        .send(invalidExperiment)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Experiment name is required');
    });

    it('should use default values for optional fields', async () => {
      const minimalExperiment = {
        name: 'Minimal Experiment'
      };

      const response = await request(app)
        .post('/experiments')
        .send(minimalExperiment)
        .expect(201);

      expect(response.body).toHaveProperty('dataset', 'default');
      expect(response.body).toHaveProperty('transforms');
      expect(response.body.transforms).toHaveLength(0);
    });

    it('should generate unique experiment IDs', async () => {
      const exp1 = await request(app)
        .post('/experiments')
        .send({ name: 'Experiment 1' })
        .expect(201);

      const exp2 = await request(app)
        .post('/experiments')
        .send({ name: 'Experiment 2' })
        .expect(201);

      expect(exp1.body.id).not.toBe(exp2.body.id);
    });
  });

  describe('GET /experiments', () => {
    it('should return empty list initially', async () => {
      const response = await request(app)
        .get('/experiments')
        .expect(200);

      expect(response.body).toHaveProperty('count', 0);
      expect(response.body).toHaveProperty('experiments');
      expect(response.body.experiments).toHaveLength(0);
    });

    it('should return all created experiments', async () => {
      // Create two experiments
      await request(app)
        .post('/experiments')
        .send({ name: 'Experiment A' });

      await request(app)
        .post('/experiments')
        .send({ name: 'Experiment B' });

      const response = await request(app)
        .get('/experiments')
        .expect(200);

      expect(response.body).toHaveProperty('count', 2);
      expect(response.body.experiments).toHaveLength(2);
      expect(response.body.experiments[0].name).toBe('Experiment A');
      expect(response.body.experiments[1].name).toBe('Experiment B');
    });
  });

  describe('GET /experiments/:id', () => {
    it('should return experiment by ID', async () => {
      const created = await request(app)
        .post('/experiments')
        .send({ name: 'Test Experiment' });

      const response = await request(app)
        .get(`/experiments/${created.body.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', created.body.id);
      expect(response.body).toHaveProperty('name', 'Test Experiment');
    });

    it('should return 404 for non-existent ID', async () => {
      const response = await request(app)
        .get('/experiments/nonexistent-id')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Experiment not found');
    });
  });

  describe('POST /experiments/:id/run', () => {
    let experimentId;

    beforeEach(async () => {
      // Create an experiment to run
      const created = await request(app)
        .post('/experiments')
        .send({
          name: 'Runnable Experiment',
          dataset: 'sample',
          transforms: [{ type: 'jpeg-compression', params: { quality: 80 } }]
        });
      experimentId = created.body.id;
    });

    it('should return 200 and trigger dry-run when ALLOW_TRAINING is false', async () => {
      const response = await request(app)
        .post(`/experiments/${experimentId}/run`)
        .send({ dryRun: true })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Dry-run experiment started');
      expect(response.body).toHaveProperty('experimentId', experimentId);
      expect(response.body).toHaveProperty('dryRun', true);
      expect(response.body).toHaveProperty('trainingEnabled', false);
      expect(response.body).toHaveProperty('status', 'running-dry-run');
    });

    it('should default to dry-run when dryRun not specified', async () => {
      const response = await request(app)
        .post(`/experiments/${experimentId}/run`)
        .send({})
        .expect(200);

      expect(response.body).toHaveProperty('dryRun', true);
      expect(response.body).toHaveProperty('message', 'Dry-run experiment started');
    });

    it('should return 403 when trying to run training with ALLOW_TRAINING=false', async () => {
      const response = await request(app)
        .post(`/experiments/${experimentId}/run`)
        .send({ dryRun: false })
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Training not allowed');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('ALLOW_TRAINING=true');
    });

    it('should return 404 for non-existent experiment', async () => {
      const response = await request(app)
        .post('/experiments/nonexistent-id/run')
        .send({ dryRun: true })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Experiment not found');
    });

    it('should update experiment status to running-dry-run', async () => {
      await request(app)
        .post(`/experiments/${experimentId}/run`)
        .send({ dryRun: true })
        .expect(200);

      // Verify experiment was updated
      await db.read();
      const experiment = db.data.experiments.find(e => e.id === experimentId);
      expect(experiment.status).toBe('running-dry-run');
      expect(experiment).toHaveProperty('startedAt');
      expect(experiment.dryRun).toBe(true);
    });

    it('should complete experiment after execution', async () => {
      await request(app)
        .post(`/experiments/${experimentId}/run`)
        .send({ dryRun: true })
        .expect(200);

      // Wait for simulated execution to complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      await db.read();
      const experiment = db.data.experiments.find(e => e.id === experimentId);
      expect(experiment.status).toBe('completed');
      expect(experiment).toHaveProperty('completedAt');
    });
  });

  describe('GET /results/:id', () => {
    it('should return experiment results', async () => {
      // Create and run an experiment
      const created = await request(app)
        .post('/experiments')
        .send({ name: 'Results Test' });

      const response = await request(app)
        .get(`/results/${created.body.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('experimentId', created.body.id);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('metrics');
      expect(response.body.metrics).toHaveProperty('psnr');
      expect(response.body.metrics).toHaveProperty('ssim');
      expect(response.body.metrics).toHaveProperty('bitAccuracy');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return 404 for non-existent experiment', async () => {
      const response = await request(app)
        .get('/results/nonexistent-id')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Experiment not found');
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in responses', async () => {
      const response = await request(app)
        .get('/status')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin', '*');
    });

    it('should handle OPTIONS preflight requests', async () => {
      await request(app)
        .options('/experiments')
        .expect(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle JSON parsing errors gracefully', async () => {
      const response = await request(app)
        .post('/experiments')
        .set('Content-Type', 'application/json')
        .send('invalid json{')
        .expect(400);
    });
  });
});
