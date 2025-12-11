/**
 * backend/db.js
 * LowDB wrapper for experiment persistence
 * Stores data in scripts/output/db.json
 */

const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const { nanoid } = require('nanoid');
const path = require('path');
const fs = require('fs').promises;

// Database file path
const DB_FILE = path.join(__dirname, '..', 'scripts', 'output', 'db.json');

// Database instance
let db = null;

/**
 * Initialize the database
 * Creates the file and directory structure if needed
 */
async function initDatabase() {
  if (db) {
    return db;
  }

  // Ensure output directory exists
  const dbDir = path.dirname(DB_FILE);
  await fs.mkdir(dbDir, { recursive: true });

  // Initialize LowDB with JSONFile adapter
  const adapter = new JSONFile(DB_FILE);
  db = new Low(adapter, {});

  // Read existing data or initialize with defaults
  await db.read();
  
  db.data ||= {
    experiments: [],
    metadata: {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    }
  };

  await db.write();

  return db;
}

/**
 * Get the database instance
 * Initializes if not already done
 */
async function getDatabase() {
  if (!db) {
    await initDatabase();
  }
  return db;
}

/**
 * Create a new experiment
 * @param {Object} meta - Experiment metadata (name, dataset, transforms, etc.)
 * @returns {Object} Created experiment with generated ID
 */
async function createExperiment(meta) {
  const database = await getDatabase();
  await database.read();

  const experiment = {
    id: nanoid(12),
    ...meta,
    status: 'created',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  database.data.experiments.push(experiment);
  database.data.metadata.lastModified = new Date().toISOString();
  
  await database.write();

  return experiment;
}

/**
 * Update an existing experiment
 * @param {string} id - Experiment ID
 * @param {Object} patch - Fields to update
 * @returns {Object|null} Updated experiment or null if not found
 */
async function updateExperiment(id, patch) {
  const database = await getDatabase();
  await database.read();

  const index = database.data.experiments.findIndex(exp => exp.id === id);
  
  if (index === -1) {
    return null;
  }

  // Merge patch with existing data
  database.data.experiments[index] = {
    ...database.data.experiments[index],
    ...patch,
    id, // Preserve ID
    createdAt: database.data.experiments[index].createdAt, // Preserve creation time
    updatedAt: new Date().toISOString()
  };

  database.data.metadata.lastModified = new Date().toISOString();
  
  await database.write();

  return database.data.experiments[index];
}

/**
 * Get a specific experiment by ID
 * @param {string} id - Experiment ID
 * @returns {Object|null} Experiment or null if not found
 */
async function getExperiment(id) {
  const database = await getDatabase();
  await database.read();

  const experiment = database.data.experiments.find(exp => exp.id === id);
  
  return experiment || null;
}

/**
 * List all experiments with optional filtering
 * @param {Object} options - Filter options
 * @param {string} options.status - Filter by status
 * @param {number} options.limit - Limit number of results
 * @param {number} options.offset - Offset for pagination
 * @param {string} options.sortBy - Field to sort by (default: 'createdAt')
 * @param {string} options.sortOrder - Sort order 'asc' or 'desc' (default: 'desc')
 * @returns {Array} Array of experiments
 */
async function listExperiments(options = {}) {
  const database = await getDatabase();
  await database.read();

  let experiments = [...database.data.experiments];

  // Filter by status
  if (options.status) {
    experiments = experiments.filter(exp => exp.status === options.status);
  }

  // Sort
  const sortBy = options.sortBy || 'createdAt';
  const sortOrder = options.sortOrder || 'desc';
  
  experiments.sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const offset = options.offset || 0;
  const limit = options.limit || experiments.length;
  
  experiments = experiments.slice(offset, offset + limit);

  return experiments;
}

/**
 * Delete an experiment
 * @param {string} id - Experiment ID
 * @returns {boolean} True if deleted, false if not found
 */
async function deleteExperiment(id) {
  const database = await getDatabase();
  await database.read();

  const index = database.data.experiments.findIndex(exp => exp.id === id);
  
  if (index === -1) {
    return false;
  }

  database.data.experiments.splice(index, 1);
  database.data.metadata.lastModified = new Date().toISOString();
  
  await database.write();

  return true;
}

/**
 * Get database statistics
 * @returns {Object} Statistics about experiments
 */
async function getStats() {
  const database = await getDatabase();
  await database.read();

  const experiments = database.data.experiments;
  
  const stats = {
    total: experiments.length,
    byStatus: {},
    oldestExperiment: null,
    newestExperiment: null
  };

  // Count by status
  experiments.forEach(exp => {
    stats.byStatus[exp.status] = (stats.byStatus[exp.status] || 0) + 1;
  });

  // Find oldest and newest
  if (experiments.length > 0) {
    const sorted = [...experiments].sort((a, b) => 
      new Date(a.createdAt) - new Date(b.createdAt)
    );
    stats.oldestExperiment = sorted[0].createdAt;
    stats.newestExperiment = sorted[sorted.length - 1].createdAt;
  }

  return stats;
}

module.exports = {
  initDatabase,
  getDatabase,
  createExperiment,
  updateExperiment,
  getExperiment,
  listExperiments,
  deleteExperiment,
  getStats
};
