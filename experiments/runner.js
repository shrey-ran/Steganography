#!/usr/bin/env node

/**
 * experiments/runner.js
 * Experiment runner for steganography robustness testing
 * LOCAL-ONLY - Safe dry-run mode by default
 */

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const dotenv = require('dotenv');

// Load environment
dotenv.config();

// Import local modules
const { loadDataset } = require('../datasets/loader');
const { createStegoModel } = require('../models/stego_model');
const { applyTransform } = require('./transforms');
const { computeMetrics } = require('./metrics');
const { extractMessage } = require('../models/lsb_steganography');

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('config', {
    alias: 'c',
    type: 'string',
    description: 'Path to experiment config file (JSON or YAML)'
  })
  .option('id', {
    alias: 'i',
    type: 'string',
    description: 'Experiment ID',
    demandOption: true
  })
  .option('dry-run', {
    type: 'boolean',
    default: true,
    description: 'Run in dry-run mode (no actual training)'
  })
  .option('output-dir', {
    alias: 'o',
    type: 'string',
    description: 'Output directory for results'
  })
  .option('dataset', {
    alias: 'd',
    type: 'string',
    description: 'Dataset name or path'
  })
  .option('transforms', {
    alias: 't',
    type: 'string',
    description: 'JSON string of transforms to apply'
  })
  .option('message', {
    alias: 'm',
    type: 'string',
    description: 'Secret message to hide using steganography'
  })
  .help()
  .argv;

// Logger utility
const log = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`),
  error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`),
  success: (msg) => console.log(`[SUCCESS] ${new Date().toISOString()} - ${msg}`)
};

/**
 * Load experiment configuration from file or command line args
 */
async function loadConfig() {
  let config = {
    id: argv.id,
    dryRun: argv['dry-run'],
    outputDir: argv['output-dir'] || path.join(__dirname, '..', 'scripts', 'output', argv.id),
    dataset: argv.dataset || 'default',
    message: argv.message || null,
    transforms: []
  };

  // If config file provided, load it
  if (argv.config) {
    try {
      const configPath = path.resolve(argv.config);
      const configContent = await fs.readFile(configPath, 'utf-8');
      
      let fileConfig;
      if (configPath.endsWith('.yaml') || configPath.endsWith('.yml')) {
        fileConfig = yaml.load(configContent);
      } else {
        fileConfig = JSON.parse(configContent);
      }
      
      config = { ...config, ...fileConfig };
      log.info(`Loaded config from ${configPath}`);
    } catch (error) {
      log.error(`Failed to load config file: ${error.message}`);
      throw error;
    }
  }

  // Override with command line args
  if (argv.dataset) config.dataset = argv.dataset;
  if (argv.message) config.message = argv.message;
  if (argv.transforms) {
    try {
      config.transforms = JSON.parse(argv.transforms);
    } catch (error) {
      log.error(`Failed to parse transforms JSON: ${error.message}`);
      throw error;
    }
  }

  return config;
}

/**
 * Check if training is allowed
 */
function isTrainingAllowed(config) {
  const allowTraining = process.env.ALLOW_TRAINING === 'true';
  return !config.dryRun && allowTraining;
}

/**
 * Run dry-run experiment
 * Loads sample images, runs model inference stubs, applies transforms, computes metrics
 */
async function runDryRun(config) {
  log.info('='.repeat(70));
  log.info('RUNNING IN DRY-RUN MODE');
  log.info('No actual steganography or training will be performed');
  log.info('='.repeat(70));

  const results = {
    experimentId: config.id,
    mode: 'dry-run',
    startTime: new Date().toISOString(),
    config: {
      dataset: config.dataset,
      transforms: config.transforms
    },
    samples: [],
    metrics: {},
    logs: []
  };

  try {
    // Create output directory
    await fs.mkdir(config.outputDir, { recursive: true });
    results.logs.push({ time: new Date().toISOString(), message: 'Created output directory' });

    // Load sample dataset (limit to 2 samples for dry run)
    log.info(`Loading dataset: ${config.dataset}`);
    const dataset = await loadDataset(config.dataset, { limit: 2 });
    results.logs.push({ 
      time: new Date().toISOString(), 
      message: `Loaded ${dataset.images.length} sample images` 
    });

    // Create model stub
    log.info('Initializing steganography model (stub)');
    const model = await createStegoModel({ mode: 'dry-run' });
    results.logs.push({ time: new Date().toISOString(), message: 'Model initialized (stub)' });

    // Process each sample image
    for (let i = 0; i < dataset.images.length; i++) {
      const image = dataset.images[i];
      log.info(`Processing sample ${i + 1}/${dataset.images.length}: ${image.name}`);

      const sample = {
        id: `sample_${i}`,
        name: image.name,
        originalSize: image.size,
        transforms: [],
        hiddenMessage: null,
        extractedMessage: null,
        messageVerified: false
      };

      // CORRECTED ROBUSTNESS TESTING METHODOLOGY:
      // 1. Embed stego data in CLEAN image first
      // 2. Apply transformations to the STEGO image
      // 3. Test if hidden data survives each transformation

      // Create images directory
      const imagesDir = path.join(config.outputDir, 'images');
      await fs.mkdir(imagesDir, { recursive: true });

      // Step 1: Embed stego data in original clean image
      log.info(`  Embedding stego data in original clean image`);
      const stegoResult = await model.dryRun(image, config.message);
      sample.originalMetrics = stegoResult.metrics;

      // Save original clean image and initial stego image
      const originalImagePath = path.join(imagesDir, `original_${image.name}`);
      const initialStegoImagePath = path.join(imagesDir, `stego_initial_${image.name}`);
      await fs.writeFile(originalImagePath, image.buffer);
      if (stegoResult.stegoImage) {
        await fs.writeFile(initialStegoImagePath, stegoResult.stegoImage);
      }

      // Store original stego info
      if (stegoResult.originalMessage) {
        sample.hiddenMessage = stegoResult.originalMessage;
        sample.extractedMessage = stegoResult.extractedMessage;
        sample.messageVerified = stegoResult.metrics.messageVerified;
        log.info(`  ✓ Initial stego embedding successful: "${stegoResult.originalMessage.substring(0, 30)}..."`);
      }

      // Step 2: Apply transformations to the STEGO image and test robustness
      let currentStegoImage = stegoResult.stegoImage ? { ...image, buffer: stegoResult.stegoImage } : image;

      for (let i = 0; i < config.transforms.length; i++) {
        const transform = config.transforms[i];
        log.info(`  Testing robustness: Applying transform ${i + 1}/${config.transforms.length} (${transform.name}) to stego image`);

        const transformResult = await applyTransform(currentStegoImage, transform);
        const transformedBuffer = transformResult.image ? transformResult.image.buffer : transformResult;

        // Save transformed stego image
        const transformImagePath = path.join(imagesDir, `stego_after_transform_${i + 1}_${transform.name}_${image.name}`);
        await fs.writeFile(transformImagePath, transformedBuffer);
        log.info(`  💾 Saved transformed stego image: ${transformImagePath}`);

        // Test if stego data can still be extracted after transformation
        // Extract message from the transformed image (NOT embed new message)
        const transformedImage = transformResult.image || { ...currentStegoImage, buffer: transformedBuffer };
        
        try {
          // Use error-tolerant extraction for transformed images to capture partial recovery
          const extractionResult = await extractMessage(transformedBuffer, { tolerance: true });
          const { message: extractedMsg, recoveryScore = 0 } = extractionResult;
          const survived = extractedMsg === sample.hiddenMessage; // Perfect match
          const partialRecovery = extractedMsg.length > 0 && extractedMsg !== sample.hiddenMessage;
          
          log.info(`  📊 Transform ${i + 1} result: ${survived ? '✅ PERFECT' : partialRecovery ? `⚠️ PARTIAL (${(recoveryScore * 100).toFixed(0)}%)` : '❌ LOST'}`);
          if (!survived && sample.hiddenMessage) {
            log.info(`    Original: "${sample.hiddenMessage.substring(0, 30)}..."`)
            log.info(`    Extracted: "${extractedMsg?.substring(0, 30) || 'EMPTY'}..." ${partialRecovery ? `(${(recoveryScore * 100).toFixed(1)}% recovery)` : ''}`)
          }

          sample.transforms.push({
            name: transform.name,
            params: transform,
            appliedToStego: true, // This transform was applied to stego image
            extractionSuccess: survived,
            partialRecovery: partialRecovery,
            recoveryScore: recoveryScore,
            extractedMessage: extractedMsg || '(no message recovered)',
            messageIntact: survived,
            originalMessage: sample.hiddenMessage
          });
        } catch (err) {
          log.warn(`  ⚠️ Extraction error on transform ${i + 1}: ${err.message}`);
          sample.transforms.push({
            name: transform.name,
            params: transform,
            appliedToStego: true,
            extractionSuccess: false,
            partialRecovery: false,
            recoveryScore: 0,
            extractedMessage: '(extraction error)',
            messageIntact: false,
            originalMessage: sample.hiddenMessage,
            error: err.message
          });
        }

        // Update for next transform
        currentStegoImage = transformedImage;
      }

      // Step 3: Calculate final robustness metrics
      // Consider partial recovery with weighted scoring
      let totalRecoveryScore = 0;
      const successfulExtractions = sample.transforms.filter(t => t.extractionSuccess).length;
      const partialRecoveries = sample.transforms.filter(t => t.partialRecovery).length;
      
      // Weight: Perfect = 1.0, Partial = recoveryScore, Failed = 0
      for (const transform of sample.transforms) {
        if (transform.extractionSuccess) {
          totalRecoveryScore += 1.0;
        } else if (transform.partialRecovery && transform.recoveryScore > 0) {
          totalRecoveryScore += transform.recoveryScore;
        }
      }
      
      sample.robustnessScore = config.transforms.length > 0 ? totalRecoveryScore / config.transforms.length : 1.0;
      sample.finalMessageVerified = sample.transforms.length > 0 ?
        sample.transforms[sample.transforms.length - 1].extractionSuccess : true;

      // Update extracted message to reflect FINAL state (after all transforms)
      if (sample.transforms.length > 0) {
        const lastTransform = sample.transforms[sample.transforms.length - 1];
        sample.extractedMessage = lastTransform.extractedMessage;
        sample.messageVerified = lastTransform.extractionSuccess;
      }

      log.info(`  🎯 Robustness Results: ${successfulExtractions}/${config.transforms.length} transforms survived (${(sample.robustnessScore * 100).toFixed(1)}% success rate)`);

      results.samples.push(sample);
      results.logs.push({ 
        time: new Date().toISOString(), 
        message: `Completed processing ${image.name}` 
      });
    }

    // Compute aggregate metrics
    log.info('Computing aggregate metrics');
    results.metrics = await computeMetrics(results.samples);
    results.logs.push({ time: new Date().toISOString(), message: 'Computed aggregate metrics' });

    // Save results
    results.endTime = new Date().toISOString();
    results.status = 'completed';

    const metricsPath = path.join(config.outputDir, 'metrics.json');
    await fs.writeFile(metricsPath, JSON.stringify(results, null, 2));
    log.success(`Results saved to ${metricsPath}`);

    const logPath = path.join(config.outputDir, 'experiment.log');
    const logContent = results.logs.map(l => `${l.time} - ${l.message}`).join('\n');
    await fs.writeFile(logPath, logContent);
    log.success(`Logs saved to ${logPath}`);

    return results;

  } catch (error) {
    results.endTime = new Date().toISOString();
    results.status = 'failed';
    results.error = error.message;
    results.logs.push({ 
      time: new Date().toISOString(), 
      message: `Error: ${error.message}` 
    });

    // Save partial results
    try {
      const metricsPath = path.join(config.outputDir, 'metrics.json');
      await fs.writeFile(metricsPath, JSON.stringify(results, null, 2));
    } catch (saveError) {
      log.error(`Failed to save error results: ${saveError.message}`);
    }

    throw error;
  }
}

/**
 * Main runner function
 */
async function main() {
  try {
    log.info('Experiment Runner Started');
    log.info(`Experiment ID: ${argv.id}`);

    // Load configuration
    const config = await loadConfig();
    log.info(`Configuration loaded`);
    log.info(`Dataset: ${config.dataset}`);
    log.info(`Transforms: ${config.transforms.length}`);
    log.info(`Message: ${config.message ? `"${config.message.substring(0, 50)}..."` : 'NOT PROVIDED'}`);
    log.info(`Output directory: ${config.outputDir}`);

    // Check if training is allowed
    const trainingAllowed = isTrainingAllowed(config);

    if (config.dryRun || !trainingAllowed) {
      // Run in dry-run mode
      if (!trainingAllowed && !config.dryRun) {
        log.warn('ALLOW_TRAINING=false - Forcing dry-run mode');
      }
      
      const results = await runDryRun(config);
      
      log.success('Dry-run completed successfully');
      log.info(`Processed ${results.samples.length} samples`);
      log.info(`Results saved to ${config.outputDir}`);
      
    } else {
      // Training mode requested and allowed
      log.warn('='.repeat(70));
      log.warn('TRAINING MODE REQUESTED');
      log.warn('='.repeat(70));
      log.warn('');
      log.warn('TODO: Actual steganography training is NOT IMPLEMENTED');
      log.warn('');
      log.warn('This is intentionally left unimplemented for safety and ethical reasons.');
      log.warn('');
      log.warn('To implement training, you must:');
      log.warn('  1. Obtain IRB approval and supervisor authorization');
      log.warn('  2. Implement secure embedding/extraction algorithms');
      log.warn('  3. Add proper security controls and audit logging');
      log.warn('  4. Document all training procedures and safeguards');
      log.warn('  5. Ensure compliance with ethical research guidelines');
      log.warn('');
      log.warn('For now, run in dry-run mode: --dry-run');
      log.warn('');
      log.warn('='.repeat(70));
      
      // Save placeholder results
      const results = {
        experimentId: config.id,
        mode: 'training-not-implemented',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        status: 'skipped',
        message: 'Training mode not implemented - use dry-run mode',
        config
      };
      
      await fs.mkdir(config.outputDir, { recursive: true });
      const metricsPath = path.join(config.outputDir, 'metrics.json');
      await fs.writeFile(metricsPath, JSON.stringify(results, null, 2));
      
      process.exit(1);
    }

  } catch (error) {
    log.error(`Experiment failed: ${error.message}`);
    if (error.stack) {
      log.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the experiment
main();
