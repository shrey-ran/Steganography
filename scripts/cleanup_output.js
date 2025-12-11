#!/usr/bin/env node

/**
 * scripts/cleanup_output.js
 * 
 * Safely deletes experiment output files with interactive confirmation.
 * Useful for resetting dry-run outputs and clearing old experiment results.
 * 
 * Usage:
 *   node scripts/cleanup_output.js
 *   node scripts/cleanup_output.js --force  (skip confirmation)
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

const OUTPUT_DIR = path.join(__dirname, '../scripts/output');

/**
 * Prompt user for confirmation
 * @param {string} question - Question to ask
 * @returns {Promise<boolean>} True if user confirms
 */
function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Get directory size recursively
 * @param {string} dirPath - Directory path
 * @returns {Promise<number>} Size in bytes
 */
async function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        totalSize += await getDirectorySize(fullPath);
      } else {
        const stats = await fs.stat(fullPath);
        totalSize += stats.size;
      }
    }
  } catch (error) {
    // Directory doesn't exist or not accessible
    return 0;
  }
  
  return totalSize;
}

/**
 * Count files recursively
 * @param {string} dirPath - Directory path
 * @returns {Promise<number>} Number of files
 */
async function countFiles(dirPath) {
  let count = 0;
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        count += await countFiles(fullPath);
      } else {
        count++;
      }
    }
  } catch (error) {
    return 0;
  }
  
  return count;
}

/**
 * Format bytes to human-readable size
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Delete directory contents recursively
 * @param {string} dirPath - Directory path
 * @returns {Promise<void>}
 */
async function deleteDirectoryContents(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        await fs.rm(fullPath, { recursive: true, force: true });
      } else {
        await fs.unlink(fullPath);
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * Main cleanup function
 */
async function cleanupOutput() {
  const forceMode = process.argv.includes('--force') || process.argv.includes('-f');
  
  console.log('[Cleanup] Output directory cleanup utility\n');

  try {
    // Check if output directory exists
    try {
      await fs.access(OUTPUT_DIR);
    } catch (error) {
      console.log('[Cleanup] ℹ️  Output directory does not exist: ' + OUTPUT_DIR);
      console.log('[Cleanup] Nothing to clean up.');
      return;
    }

    // Get statistics
    const fileCount = await countFiles(OUTPUT_DIR);
    const totalSize = await getDirectorySize(OUTPUT_DIR);

    if (fileCount === 0) {
      console.log('[Cleanup] ℹ️  Output directory is already empty.');
      console.log('[Cleanup] Nothing to clean up.');
      return;
    }

    // Display what will be deleted
    console.log('[Cleanup] 📊 Current output directory stats:');
    console.log(`  Location: ${OUTPUT_DIR}`);
    console.log(`  Files:    ${fileCount}`);
    console.log(`  Size:     ${formatBytes(totalSize)}`);
    console.log();

    // List subdirectories
    const entries = await fs.readdir(OUTPUT_DIR, { withFileTypes: true });
    const subdirs = entries.filter(e => e.isDirectory()).map(e => e.name);
    
    if (subdirs.length > 0) {
      console.log('[Cleanup] 📁 Subdirectories to be deleted:');
      for (const subdir of subdirs) {
        const subdirPath = path.join(OUTPUT_DIR, subdir);
        const subdirFiles = await countFiles(subdirPath);
        const subdirSize = await getDirectorySize(subdirPath);
        console.log(`  - ${subdir}/ (${subdirFiles} files, ${formatBytes(subdirSize)})`);
      }
      console.log();
    }

    // Confirm deletion unless force mode
    if (!forceMode) {
      console.log('[Cleanup] ⚠️  This will permanently delete all files in scripts/output/');
      console.log('[Cleanup] This action cannot be undone.\n');
      
      const confirmed = await askConfirmation('[Cleanup] Are you sure you want to continue? (y/N): ');
      
      if (!confirmed) {
        console.log('[Cleanup] ❌ Cleanup cancelled by user.');
        return;
      }
      console.log();
    }

    // Perform deletion
    console.log('[Cleanup] 🗑️  Deleting files...');
    await deleteDirectoryContents(OUTPUT_DIR);

    // Verify deletion
    const remainingFiles = await countFiles(OUTPUT_DIR);
    
    if (remainingFiles === 0) {
      console.log('[Cleanup] ✅ Successfully deleted all output files!');
      console.log(`[Cleanup] Freed: ${formatBytes(totalSize)}`);
      console.log('[Cleanup] Output directory is now empty.');
    } else {
      console.log('[Cleanup] ⚠️  Warning: Some files may not have been deleted.');
      console.log(`[Cleanup] Remaining files: ${remainingFiles}`);
    }

  } catch (error) {
    console.error('[Cleanup] ❌ Error during cleanup:', error.message);
    console.error('[Cleanup] Details:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  cleanupOutput().catch(error => {
    console.error('[Cleanup] Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { cleanupOutput };
