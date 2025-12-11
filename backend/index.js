#!/usr/bin/env node

/**
 * backend/index.js
 * Main Express server for stego-robustness-js-local
 * LOCAL-ONLY - Ethics/IRB compliance required
 */

const express = require('express');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const pino = require('pino');
const dotenv = require('dotenv');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');

// Load environment variables
dotenv.config();

// Initialize logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  }
});

// Configuration
const PORT = process.env.PORT || 8000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const ALLOW_TRAINING = process.env.ALLOW_TRAINING === 'true';
const DB_PATH = process.env.DB_PATH || './scripts/output/db.sqlite';

// Initialize Express app
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS for local development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Request logging
app.use((req, res, next) => {
  logger.info({ method: req.method, path: req.path, query: req.query }, 'Incoming request');
  next();
});

// Initialize LowDB
let db;
const initDatabase = async () => {
  const dbDir = path.dirname('./data/db.json');
  await fs.mkdir(dbDir, { recursive: true });
  
  const adapter = new JSONFile('./data/db.json');
  db = new Low(adapter, null);  // Don't set defaults here
  
  await db.read();
  
  // Only set defaults if file was empty
  if (!db.data) {
    db.data = { experiments: [], results: [] };
    await db.write();
  }
  
  logger.info({ experimentCount: db.data.experiments?.length || 0 }, 'LowDB initialized');
};

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /status
 * Health check endpoint
 */
app.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    environment: NODE_ENV,
    trainingEnabled: ALLOW_TRAINING,
    version: '1.0.0'
  });
});

/**
 * POST /experiments
 * Create a new experiment
 * Body: { name, message, dataset, transforms, batchSize, epochs }
 */
app.post('/experiments', async (req, res) => {
  try {
    const { name, message, dataset, transforms, batchSize, epochs } = req.body;
    
    if (!name || !dataset || !transforms) {
      return res.status(400).json({
        error: 'Missing required fields: name, dataset, transforms'
      });
    }
    
    await db.read();
    
    const experiment = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      message: message || '', // Include message field
      dataset,
      batchSize: batchSize || 4,
      epochs: epochs || 1,
      transforms: Array.isArray(transforms) ? transforms : [transforms],
      status: 'created',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    db.data.experiments.push(experiment);
    await db.write();
    
    logger.info({ experimentId: experiment.id, message: message ? 'yes' : 'no' }, 'Experiment created');
    
    res.status(201).json(experiment);
  } catch (error) {
    logger.error({ error: error.message }, 'Error creating experiment');
    res.status(500).json({ error: 'Failed to create experiment' });
  }
});

/**
 * GET /experiments
 * List all experiments
 */
app.get('/experiments', async (req, res) => {
  try {
    await db.read();
    
    logger.info({ dbData: db.data }, 'Database contents');
    
    const experiments = db.data.experiments || [];
    
    logger.info({ count: experiments.length }, 'Returning experiments');
    
    res.json({
      count: experiments.length,
      experiments
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Error listing experiments');
    res.status(500).json({ error: 'Failed to list experiments' });
  }
});

/**
 * GET /experiments/:id
 * Get a specific experiment
 */
app.get('/experiments/:id', async (req, res) => {
  try {
    await db.read();
    
    const experiment = db.data.experiments.find(exp => exp.id === req.params.id);
    
    if (!experiment) {
      return res.status(404).json({ error: 'Experiment not found' });
    }
    
    res.json(experiment);
  } catch (error) {
    logger.error({ error: error.message }, 'Error fetching experiment');
    res.status(500).json({ error: 'Failed to fetch experiment' });
  }
});

/**
 * GET /experiments/:id/metrics
 * Get metrics for a completed experiment
 */
app.get('/experiments/:id/metrics', async (req, res) => {
  try {
    const outputDir = path.join(__dirname, '..', 'scripts', 'output', req.params.id);
    const metricsPath = path.join(outputDir, 'metrics.json');
    
    try {
      const metricsData = await fs.readFile(metricsPath, 'utf8');
      const metrics = JSON.parse(metricsData);
      res.json(metrics);
    } catch (fileErr) {
      return res.status(404).json({ error: 'Metrics not found' });
    }
  } catch (error) {
    logger.error({ error: error.message }, 'Error fetching metrics');
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

/**
 * GET /experiments/:id/images/:filename
 * Serve experiment images (original and stego)
 */
app.get('/experiments/:id/images/:filename', async (req, res) => {
  try {
    const outputDir = path.join(__dirname, '..', 'scripts', 'output', req.params.id);
    const imagesDir = path.join(outputDir, 'images');
    const imagePath = path.join(imagesDir, req.params.filename);
    
    // Check if file exists
    try {
      await fs.access(imagePath);
    } catch (fileErr) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Set appropriate headers for image serving
    const ext = path.extname(req.params.filename).toLowerCase();
    const contentType = ext === '.png' ? 'image/png' : 
                       ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 
                       'application/octet-stream';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Stream the image file
    const imageStream = require('fs').createReadStream(imagePath);
    imageStream.pipe(res);
    
  } catch (error) {
    logger.error({ error: error.message }, 'Error serving image');
    res.status(500).json({ error: 'Failed to serve image' });
  }
});

/**
 * POST /experiments/:id/run
 * Run an experiment
 * Spawns experiments/runner.js as child process
 * Checks ALLOW_TRAINING flag - if false, performs dry-run only
 */
app.post('/experiments/:id/run', async (req, res) => {
  try {
    await db.read();
    
    const experiment = db.data.experiments.find(exp => exp.id === req.params.id);
    
    if (!experiment) {
      return res.status(404).json({ error: 'Experiment not found' });
    }
    
    if (experiment.status === 'running') {
      return res.status(409).json({ error: 'Experiment is already running' });
    }
    
    // Check training permission
    const isDryRun = !ALLOW_TRAINING;
    
    if (isDryRun) {
      logger.warn({ experimentId: experiment.id }, 
        'ALLOW_TRAINING=false - Running in DRY-RUN mode (no actual training)');
    }
    
    // Update experiment status
    experiment.status = 'running';
    experiment.updatedAt = new Date().toISOString();
    experiment.startedAt = new Date().toISOString();
    experiment.dryRun = isDryRun;
    await db.write();
    
    // Spawn runner process
    const runnerPath = path.join(__dirname, '..', 'experiments', 'runner.js');
    const outputDir = path.join(__dirname, '..', 'scripts', 'output', experiment.id);
    
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });
    
    const args = [
      runnerPath,
      '--id', experiment.id,
      '--output-dir', outputDir,
      '--dataset', experiment.dataset,
      '--transforms', JSON.stringify(experiment.transforms)
    ];
    
    // Add message if provided
    if (experiment.message) {
      args.push('--message', experiment.message);
    }
    
    if (isDryRun) {
      args.push('--dry-run');
    }
    
    logger.info({ 
      experimentId: experiment.id, 
      dryRun: isDryRun,
      hasMessage: !!experiment.message,
      command: `node ${args.join(' ')}`
    }, 'Spawning experiment runner');
    
    const child = spawn('node', args, {
      detached: false,
      stdio: 'pipe'
    });
    
    // Log stdout/stderr
    child.stdout.on('data', (data) => {
      logger.info({ experimentId: experiment.id }, `Runner: ${data.toString().trim()}`);
    });
    
    child.stderr.on('data', (data) => {
      logger.error({ experimentId: experiment.id }, `Runner error: ${data.toString().trim()}`);
    });
    
    child.on('close', async (code) => {
      await db.read();
      const exp = db.data.experiments.find(e => e.id === experiment.id);
      if (exp) {
        exp.status = code === 0 ? 'completed' : 'failed';
        exp.exitCode = code;
        exp.completedAt = new Date().toISOString();
        exp.updatedAt = new Date().toISOString();
        await db.write();
      }
      logger.info({ experimentId: experiment.id, exitCode: code }, 'Experiment completed');
    });
    
    res.json({
      message: isDryRun ? 'Experiment started in DRY-RUN mode' : 'Experiment started',
      experiment,
      warning: isDryRun ? 'ALLOW_TRAINING=false - No actual training will occur' : null
    });
    
  } catch (error) {
    logger.error({ error: error.message }, 'Error running experiment');
    res.status(500).json({ error: 'Failed to run experiment' });
  }
});

/**
 * GET /results/:id
 * Get results for an experiment
 * Reads from scripts/output/<id>/metrics.json
 */
app.get('/results/:id', async (req, res) => {
  try {
    const experimentId = req.params.id;
    const metricsPath = path.join(__dirname, '..', 'scripts', 'output', experimentId, 'metrics.json');
    
    try {
      const metricsData = await fs.readFile(metricsPath, 'utf-8');
      const metrics = JSON.parse(metricsData);
      
      res.json({
        experimentId,
        metrics,
        retrievedAt: new Date().toISOString()
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({ 
          error: 'Results not found',
          message: 'Experiment may not have completed yet or metrics file does not exist'
        });
      }
      throw error;
    }
  } catch (error) {
    logger.error({ error: error.message }, 'Error fetching results');
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

/**
 * GET /analytics/stats
 * Get analytics and statistics about all experiments
 */
app.get('/analytics/stats', async (req, res) => {
  try {
    await db.read();
    const experiments = db.data.experiments || [];
    
    // Initialize stats
    const stats = {
      totalExperiments: experiments.length,
      completedExperiments: 0,
      runningExperiments: 0,
      createdExperiments: 0,
      failedExperiments: 0,
      totalRetrievals: 0,
      successfulRetrievals: 0,
      perfectRetrievals: 0,
      partialRetrievals: 0,
      failedRetrievals: 0,
      successRate: 0,
      avgRobustness: 0,
      robustnessRanges: [
        { label: '0-20%', count: 0, min: 0, max: 0.2 },
        { label: '20-40%', count: 0, min: 0.2, max: 0.4 },
        { label: '40-60%', count: 0, min: 0.4, max: 0.6 },
        { label: '60-80%', count: 0, min: 0.6, max: 0.8 },
        { label: '80-100%', count: 0, min: 0.8, max: 1.0 }
      ],
      transformImpact: {},
      datasetPerformance: {},
      messageLengthRanges: [
        { label: '1-10 chars', min: 1, max: 10, successful: 0, total: 0 },
        { label: '11-20 chars', min: 11, max: 20, successful: 0, total: 0 },
        { label: '21-30 chars', min: 21, max: 30, successful: 0, total: 0 },
        { label: '31-50 chars', min: 31, max: 50, successful: 0, total: 0 },
        { label: '50+ chars', min: 50, max: Infinity, successful: 0, total: 0 }
      ],
      mostUsedDataset: 'N/A',
      mostUsedTransform: 'N/A'
    };

    // Process each experiment
    let totalRobustness = 0;
    let robustnessCount = 0;
    const datasetCounts = {};
    const transformCounts = {};
    
    for (const exp of experiments) {
      // Count by status
      if (exp.status === 'completed') stats.completedExperiments++;
      else if (exp.status === 'running') stats.runningExperiments++;
      else if (exp.status === 'created') stats.createdExperiments++;
      else if (exp.status === 'failed') stats.failedExperiments++;

      // Process message length
      if (exp.message) {
        const msgLen = exp.message.length;
        for (const range of stats.messageLengthRanges) {
          if (msgLen >= range.min && msgLen < range.max) {
            range.total++;
            break;
          }
        }
      }

      // Count datasets
      if (exp.dataset) {
        datasetCounts[exp.dataset] = (datasetCounts[exp.dataset] || 0) + 1;
      }

      // Count transforms
      if (exp.transforms && Array.isArray(exp.transforms)) {
        for (const t of exp.transforms) {
          const tName = t.name || 'unknown';
          transformCounts[tName] = (transformCounts[tName] || 0) + 1;
        }
      }

      // Try to load metrics for this experiment
      try {
        const outputDir = path.join(__dirname, '..', 'scripts', 'output', exp.id);
        const metricsPath = path.join(outputDir, 'metrics.json');
        const metricsContent = await fs.readFile(metricsPath, 'utf-8');
        const metrics = JSON.parse(metricsContent);

        if (metrics.samples && Array.isArray(metrics.samples)) {
          for (const sample of metrics.samples) {
            stats.totalRetrievals++;
            
            // Count by robustness score
            const robustness = sample.robustnessScore || 0;
            totalRobustness += robustness;
            robustnessCount++;

            // Categorize robustness
            if (robustness >= 0.99) stats.perfectRetrievals++;
            else if (robustness > 0) stats.partialRetrievals++;
            else stats.failedRetrievals++;

            // Distribution ranges
            for (const range of stats.robustnessRanges) {
              if (robustness >= range.min && robustness <= range.max) {
                range.count++;
                break;
              }
            }

            // Message length success tracking
            if (exp.message) {
              const msgLen = exp.message.length;
              for (const range of stats.messageLengthRanges) {
                if (msgLen >= range.min && msgLen < range.max) {
                  if (robustness > 0) range.successful++;
                  break;
                }
              }
            }

            // Successful extraction tracking
            if (sample.messageVerified || robustness > 0) {
              stats.successfulRetrievals++;
            }
          }
        }

        // Track transform impact
        if (metrics.config && metrics.config.transforms) {
          for (const transform of metrics.config.transforms) {
            const tName = transform.name || 'unknown';
            if (!stats.transformImpact[tName]) {
              stats.transformImpact[tName] = { count: 0, totalRobustness: 0 };
            }
            stats.transformImpact[tName].count++;
            
            // Add robustness from samples
            if (metrics.samples) {
              const avgSampleRobustness = metrics.samples.reduce((sum, s) => sum + (s.robustnessScore || 0), 0) / Math.max(metrics.samples.length, 1);
              stats.transformImpact[tName].totalRobustness += avgSampleRobustness;
            }
          }
        }

        // Track dataset performance
        const dataset = exp.dataset || 'unknown';
        if (!stats.datasetPerformance[dataset]) {
          stats.datasetPerformance[dataset] = {
            count: 0,
            successCount: 0,
            totalRobustness: 0
          };
        }
        stats.datasetPerformance[dataset].count++;
        
        if (metrics.samples) {
          const successCount = metrics.samples.filter(s => (s.robustnessScore || 0) > 0).length;
          stats.datasetPerformance[dataset].successCount += successCount;
          const avgRobustness = metrics.samples.reduce((sum, s) => sum + (s.robustnessScore || 0), 0) / Math.max(metrics.samples.length, 1);
          stats.datasetPerformance[dataset].totalRobustness += avgRobustness;
        }
      } catch (err) {
        // Metrics file may not exist yet
      }
    }

    // Calculate averages
    stats.avgRobustness = robustnessCount > 0 ? (totalRobustness / robustnessCount) * 100 : 0;
    stats.successRate = stats.totalRetrievals > 0 ? (stats.successfulRetrievals / stats.totalRetrievals) * 100 : 0;

    // Convert transformImpact to array with averages
    stats.transformImpact = Object.entries(stats.transformImpact).map(([name, data]) => ({
      name,
      count: data.count,
      avgRobustness: (data.totalRobustness / Math.max(data.count, 1)) * 100
    })).sort((a, b) => b.count - a.count).slice(0, 5);

    // Convert datasetPerformance to array
    stats.datasetPerformance = Object.entries(stats.datasetPerformance).map(([name, data]) => ({
      name,
      successRate: (data.successCount / Math.max(data.count, 1)) * 100,
      avgRobustness: (data.totalRobustness / Math.max(data.count, 1)) * 100,
      count: data.count
    })).sort((a, b) => b.count - a.count);

    // Find most used
    const datasetEntries = Object.entries(datasetCounts);
    if (datasetEntries.length > 0) {
      stats.mostUsedDataset = datasetEntries.sort((a, b) => b[1] - a[1])[0][0];
    }

    const transformEntries = Object.entries(transformCounts);
    if (transformEntries.length > 0) {
      stats.mostUsedTransform = transformEntries.sort((a, b) => b[1] - a[1])[0][0];
    }

    res.json(stats);
  } catch (error) {
    logger.error({ error: error.message }, 'Error computing analytics');
    res.status(500).json({ error: 'Failed to compute analytics' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error({ error: err.message, stack: err.stack }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================================
// STARTUP
// ============================================================================

const startServer = async () => {
  try {
    // Print ethics banner unless bypassed
    const bypassBanner = process.argv.includes('--bypass');
    
    if (!bypassBanner) {
      try {
        const bannerScript = path.join(__dirname, '..', 'scripts', 'print_ethics_banner.js');
        const { execSync } = require('child_process');
        execSync(`node "${bannerScript}"`, { stdio: 'inherit' });
      } catch (error) {
        logger.warn('Could not load ethics banner script');
      }
    }
    
    // Initialize database
    await initDatabase();
    
    // Create output directory
    const outputDir = path.join(__dirname, '..', 'scripts', 'output');
    await fs.mkdir(outputDir, { recursive: true });
    
    // Start server
    app.listen(PORT, () => {
      logger.info({
        port: PORT,
        environment: NODE_ENV,
        trainingEnabled: ALLOW_TRAINING
      }, '🚀 Server started');
      
      if (!ALLOW_TRAINING) {
        logger.warn('⚠️  ALLOW_TRAINING=false - Running in DRY-RUN mode');
        logger.warn('⚠️  Set ALLOW_TRAINING=true in .env after supervisor/IRB approval');
      }
      
      console.log(`\n✅ Server running at http://localhost:${PORT}`);
      console.log(`📊 API endpoints available at http://localhost:${PORT}/status\n`);
    });
    
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to start server');
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();
