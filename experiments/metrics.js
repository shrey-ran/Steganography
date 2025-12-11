/**
 * experiments/metrics.js
 * Metrics computation for steganography robustness evaluation
 * Implements PSNR, SSIM (approximate), and bit accuracy measurements
 */

const sharp = require('sharp');

// ============================================================================
// CORE METRIC FUNCTIONS
// ============================================================================

/**
 * Compute Peak Signal-to-Noise Ratio (PSNR)
 * Measures image quality between original and modified images
 * Higher is better (typically 30-50 dB for good quality)
 * 
 * @param {Buffer} bufA - Original image buffer
 * @param {Buffer} bufB - Modified image buffer
 * @returns {Promise<number>} PSNR in dB (higher is better, Infinity if identical)
 */
async function computePSNR(bufA, bufB) {
  try {
    // Ensure both images have same dimensions
    const metaA = await sharp(bufA).metadata();
    const metaB = await sharp(bufB).metadata();
    
    // Resize B to match A if needed
    let processedBufB = bufB;
    if (metaA.width !== metaB.width || metaA.height !== metaB.height) {
      console.warn(`[Metrics] Resizing image B from ${metaB.width}x${metaB.height} to ${metaA.width}x${metaA.height}`);
      processedBufB = await sharp(bufB)
        .resize(metaA.width, metaA.height, { fit: 'fill' })
        .toBuffer();
    }
    
    // Extract raw pixel data
    const { data: dataA, info: infoA } = await sharp(bufA)
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const { data: dataB } = await sharp(processedBufB)
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    // Compute Mean Squared Error (MSE)
    let mse = 0;
    const numPixels = dataA.length;
    
    for (let i = 0; i < numPixels; i++) {
      const diff = dataA[i] - dataB[i];
      mse += diff * diff;
    }
    
    mse /= numPixels;
    
    // Handle identical images
    if (mse === 0) {
      return Infinity;
    }
    
    // Compute PSNR
    const maxPixelValue = 255;
    const psnr = 10 * Math.log10((maxPixelValue * maxPixelValue) / mse);
    
    return psnr;
  } catch (error) {
    console.error(`[Metrics] computePSNR failed: ${error.message}`);
    throw error;
  }
}

/**
 * Compute Structural Similarity Index (SSIM) - Approximate Implementation
 * 
 * NOTE: This is a SIMPLIFIED approximation of SSIM for speed.
 * For production use, consider installing 'ssim.js' package for full SSIM.
 * 
 * This implementation computes:
 * - Luminance similarity
 * - Contrast similarity
 * - Structure similarity (simplified)
 * 
 * Returns value between -1 and 1 (typically 0 to 1), where 1 is identical
 * 
 * @param {Buffer} bufA - Original image buffer
 * @param {Buffer} bufB - Modified image buffer
 * @returns {Promise<number>} SSIM score (0-1, higher is better)
 */
async function computeSSIM(bufA, bufB) {
  try {
    // Ensure both images have same dimensions
    const metaA = await sharp(bufA).metadata();
    const metaB = await sharp(bufB).metadata();
    
    // Resize B to match A if needed
    let processedBufB = bufB;
    if (metaA.width !== metaB.width || metaA.height !== metaB.height) {
      processedBufB = await sharp(bufB)
        .resize(metaA.width, metaA.height, { fit: 'fill' })
        .toBuffer();
    }
    
    // Extract raw pixel data
    const { data: dataA } = await sharp(bufA)
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const { data: dataB } = await sharp(processedBufB)
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    // SSIM constants
    const C1 = (0.01 * 255) ** 2;
    const C2 = (0.03 * 255) ** 2;
    
    // Compute means
    let meanA = 0, meanB = 0;
    const n = dataA.length;
    
    for (let i = 0; i < n; i++) {
      meanA += dataA[i];
      meanB += dataB[i];
    }
    meanA /= n;
    meanB /= n;
    
    // Compute variances and covariance
    let varA = 0, varB = 0, covarAB = 0;
    
    for (let i = 0; i < n; i++) {
      const diffA = dataA[i] - meanA;
      const diffB = dataB[i] - meanB;
      varA += diffA * diffA;
      varB += diffB * diffB;
      covarAB += diffA * diffB;
    }
    varA /= n;
    varB /= n;
    covarAB /= n;
    
    // Compute SSIM (simplified single-scale)
    const numerator = (2 * meanA * meanB + C1) * (2 * covarAB + C2);
    const denominator = (meanA * meanA + meanB * meanB + C1) * (varA + varB + C2);
    
    const ssim = numerator / denominator;
    
    // Clamp to [0, 1] range
    return Math.max(0, Math.min(1, ssim));
  } catch (error) {
    console.error(`[Metrics] computeSSIM failed: ${error.message}`);
    throw error;
  }
}

/**
 * Compute Mean Squared Error (MSE)
 * Helper function for other metrics
 * 
 * @param {Buffer} bufA - Original image buffer
 * @param {Buffer} bufB - Modified image buffer
 * @returns {Promise<number>} MSE value
 */
async function computeMSE(bufA, bufB) {
  try {
    const metaA = await sharp(bufA).metadata();
    const metaB = await sharp(bufB).metadata();
    
    let processedBufB = bufB;
    if (metaA.width !== metaB.width || metaA.height !== metaB.height) {
      processedBufB = await sharp(bufB)
        .resize(metaA.width, metaA.height, { fit: 'fill' })
        .toBuffer();
    }
    
    const { data: dataA } = await sharp(bufA).raw().toBuffer({ resolveWithObject: true });
    const { data: dataB } = await sharp(processedBufB).raw().toBuffer({ resolveWithObject: true });
    
    let mse = 0;
    for (let i = 0; i < dataA.length; i++) {
      const diff = dataA[i] - dataB[i];
      mse += diff * diff;
    }
    
    return mse / dataA.length;
  } catch (error) {
    console.error(`[Metrics] computeMSE failed: ${error.message}`);
    throw error;
  }
}

/**
 * Compute bit accuracy between original and extracted bits
 * Measures steganography extraction accuracy
 * 
 * @param {Buffer|Array} origBits - Original embedded bits
 * @param {Buffer|Array} extBits - Extracted bits
 * @returns {number} Bit accuracy (0-1, where 1 is perfect)
 */
function computeBitAccuracy(origBits, extBits) {
  try {
    // Convert buffers to arrays if needed
    const arrA = Buffer.isBuffer(origBits) ? Array.from(origBits) : origBits;
    const arrB = Buffer.isBuffer(extBits) ? Array.from(extBits) : extBits;
    
    if (arrA.length !== arrB.length) {
      console.warn(`[Metrics] Bit array length mismatch: ${arrA.length} vs ${arrB.length}`);
      // Use minimum length for comparison
      const minLen = Math.min(arrA.length, arrB.length);
      return computeBitAccuracy(arrA.slice(0, minLen), arrB.slice(0, minLen));
    }
    
    if (arrA.length === 0) {
      return 1.0; // Empty arrays are considered identical
    }
    
    // Count matching bits
    let matches = 0;
    for (let i = 0; i < arrA.length; i++) {
      if (arrA[i] === arrB[i]) {
        matches++;
      }
    }
    
    const accuracy = matches / arrA.length;
    return accuracy;
  } catch (error) {
    console.error(`[Metrics] computeBitAccuracy failed: ${error.message}`);
    throw error;
  }
}

/**
 * Compute bit error rate (inverse of accuracy)
 * @param {Buffer|Array} origBits - Original bits
 * @param {Buffer|Array} extBits - Extracted bits
 * @returns {number} Bit error rate (0-1, where 0 is perfect)
 */
function computeBER(origBits, extBits) {
  return 1.0 - computeBitAccuracy(origBits, extBits);
}

/**
 * Compute all metrics for a cover/stego image pair
 * 
 * @param {Buffer} coverBuf - Original cover image buffer
 * @param {Buffer} encodedBuf - Encoded stego image buffer
 * @param {Buffer|Array} origBits - Original embedded bits (optional)
 * @param {Buffer|Array} extBits - Extracted bits (optional)
 * @returns {Promise<Object>} Complete metrics object
 */
async function computeAllMetrics(coverBuf, encodedBuf, origBits = null, extBits = null) {
  console.log('[Metrics] Computing all metrics...');
  
  const startTime = Date.now();
  
  try {
    // Compute image quality metrics
    const [psnr, ssim, mse] = await Promise.all([
      computePSNR(coverBuf, encodedBuf),
      computeSSIM(coverBuf, encodedBuf),
      computeMSE(coverBuf, encodedBuf)
    ]);
    
    // Compute bit accuracy metrics if bits provided
    let bitMetrics = null;
    if (origBits && extBits) {
      const accuracy = computeBitAccuracy(origBits, extBits);
      bitMetrics = {
        bitAccuracy: accuracy,
        bitErrorRate: 1.0 - accuracy,
        bitsCompared: Buffer.isBuffer(origBits) ? origBits.length : origBits.length
      };
    }
    
    const computationTime = Date.now() - startTime;
    
    const metrics = {
      image: {
        psnr: Number.isFinite(psnr) ? round(psnr, 4) : 'Infinity',
        ssim: round(ssim, 4),
        mse: round(mse, 4)
      },
      bits: bitMetrics,
      meta: {
        computationTime,
        timestamp: new Date().toISOString(),
        note: 'SSIM is approximate implementation for speed'
      }
    };
    
    console.log(`[Metrics] Computation complete in ${computationTime}ms`);
    console.log(`[Metrics] PSNR: ${metrics.image.psnr} dB, SSIM: ${metrics.image.ssim}`);
    
    return metrics;
  } catch (error) {
    console.error(`[Metrics] computeAllMetrics failed: ${error.message}`);
    throw error;
  }
}

// ============================================================================
// AGGREGATE METRICS (for multiple samples)
// ============================================================================

/**
 * Compute aggregate metrics from experiment samples
 * @param {Array} samples - Array of sample results
 * @returns {Object} Aggregate metrics
 */
async function computeMetrics(samples) {
  console.log(`[Metrics] Computing aggregate metrics for ${samples.length} samples`);
  
  if (samples.length === 0) {
    return {
      count: 0,
      message: 'No samples to compute metrics'
    };
  }
  
  const metrics = {
    count: samples.length,
    original: {
      psnr: { mean: 0, std: 0, min: 0, max: 0 },
      ssim: { mean: 0, std: 0, min: 0, max: 0 },
      mse: { mean: 0, std: 0, min: 0, max: 0 }
    },
    byTransform: {}
  };
  
  // Compute original metrics statistics
  const originalMetrics = samples
    .filter(s => s.originalMetrics)
    .map(s => s.originalMetrics);
  
  if (originalMetrics.length > 0) {
    metrics.original.psnr = computeStats(originalMetrics.map(m => m.psnr));
    metrics.original.ssim = computeStats(originalMetrics.map(m => m.ssim));
    metrics.original.mse = computeStats(originalMetrics.map(m => m.mse));
  }
  
  // Compute per-transform metrics
  const transformTypes = new Set();
  samples.forEach(sample => {
    if (sample.transforms) {
      sample.transforms.forEach(t => transformTypes.add(t.name || t.type));
    }
  });
  
  transformTypes.forEach(transformType => {
    const transformMetrics = [];
    const deltas = [];
    
    samples.forEach(sample => {
      if (sample.transforms) {
        const transform = sample.transforms.find(t => (t.type === transformType || t.name === transformType));
        if (transform && transform.metrics) {
          transformMetrics.push(transform.metrics);
          if (transform.deltaMetrics) {
            deltas.push(transform.deltaMetrics);
          }
        }
      }
    });
    
    // Only add metrics if we have them
    if (transformMetrics.length > 0) {
      metrics.byTransform[transformType] = {
        count: transformMetrics.length,
        psnr: computeStats(transformMetrics.map(m => m.psnr)),
        ssim: computeStats(transformMetrics.map(m => m.ssim)),
        mse: computeStats(transformMetrics.map(m => m.mse)),
        deltas: {
          psnr: computeStats(deltas.map(d => d.psnr)),
          ssim: computeStats(deltas.map(d => d.ssim))
        }
      };
    }
  });
  
  // Compute overall robustness score (0-100)
  metrics.robustnessScore = computeRobustnessScore(metrics);
  
  return metrics;
}

/**
 * Compute statistics for an array of values
 */
function computeStats(values) {
  if (values.length === 0) {
    return { mean: 0, std: 0, min: 0, max: 0 };
  }
  
  // Filter out non-finite values
  const finiteValues = values.filter(v => Number.isFinite(v));
  
  if (finiteValues.length === 0) {
    return { mean: 0, std: 0, min: 0, max: 0 };
  }
  
  const mean = finiteValues.reduce((a, b) => a + b, 0) / finiteValues.length;
  const variance = finiteValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / finiteValues.length;
  const std = Math.sqrt(variance);
  const min = Math.min(...finiteValues);
  const max = Math.max(...finiteValues);
  
  return {
    mean: round(mean, 4),
    std: round(std, 4),
    min: round(min, 4),
    max: round(max, 4)
  };
}

/**
 * Compute overall robustness score
 * Based on how well metrics hold up across transforms
 */
function computeRobustnessScore(metrics) {
  if (!metrics.byTransform || Object.keys(metrics.byTransform).length === 0) {
    return 0;
  }
  
  let totalScore = 0;
  let count = 0;
  
  Object.values(metrics.byTransform).forEach(transform => {
    // PSNR score (higher is better, normalize to 0-100)
    const psnrScore = Math.min(100, (transform.psnr.mean / 50) * 100);
    
    // SSIM score (higher is better, already 0-1, convert to 0-100)
    const ssimScore = transform.ssim.mean * 100;
    
    // Average the scores
    totalScore += (psnrScore + ssimScore) / 2;
    count++;
  });
  
  return count > 0 ? round(totalScore / count, 2) : 0;
}

/**
 * Round number to specified decimal places
 */
function round(value, decimals) {
  return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

/**
 * Compare two experiment results
 */
function compareExperiments(experiment1, experiment2) {
  const comparison = {
    experiment1: experiment1.experimentId,
    experiment2: experiment2.experimentId,
    robustnessScoreDiff: experiment1.metrics.robustnessScore - experiment2.metrics.robustnessScore,
    betterPerformer: null
  };
  
  if (comparison.robustnessScoreDiff > 0) {
    comparison.betterPerformer = experiment1.experimentId;
  } else if (comparison.robustnessScoreDiff < 0) {
    comparison.betterPerformer = experiment2.experimentId;
  }
  
  return comparison;
}

/**
 * Compute embedding capacity (theoretical)
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} channels - Number of channels
 * @param {number} bitsPerChannel - Bits to embed per channel (default 1 for LSB)
 * @returns {number} Capacity in bits
 */
function computeEmbeddingCapacity(width, height, channels = 3, bitsPerChannel = 1) {
  return width * height * channels * bitsPerChannel;
}

/**
 * Compute embedding rate
 * @param {number} payloadBits - Number of payload bits
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} channels - Number of channels
 * @returns {number} Embedding rate (bits per pixel)
 */
function computeEmbeddingRate(payloadBits, width, height, channels = 3) {
  const totalPixels = width * height;
  return payloadBits / totalPixels;
}

module.exports = {
  // Core metric functions
  computePSNR,
  computeSSIM,
  computeMSE,
  computeBitAccuracy,
  computeBER,
  
  // Aggregate functions
  computeAllMetrics,
  computeMetrics,
  
  // Helper functions
  computeStats,
  computeRobustnessScore,
  compareExperiments,
  computeEmbeddingCapacity,
  computeEmbeddingRate,
  round
};
