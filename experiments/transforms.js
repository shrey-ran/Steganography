/**
 * experiments/transforms.js
 * Image transformation functions for robustness testing
 * Implements real transformations using Sharp and Jimp
 */

const sharp = require('sharp');
const Jimp = require('jimp');
const tf = require('@tensorflow/tfjs-node');

// ============================================================================
// CORE TRANSFORMATION FUNCTIONS
// ============================================================================

/**
 * Apply JPEG compression to image buffer
 * @param {Buffer} buffer - Input image buffer
 * @param {number} quality - JPEG quality (1-100, default 75)
 * @returns {Promise<Buffer>} Compressed image buffer
 */
async function applyJpeg(buffer, quality = 75) {
  if (quality < 1 || quality > 100) {
    throw new Error('JPEG quality must be between 1 and 100');
  }
  
  console.log(`[Transform] Applying JPEG compression (quality: ${quality})`);
  
  try {
    const compressed = await sharp(buffer)
      .jpeg({ quality, force: true })
      .toBuffer();
    
    console.log(`[Transform] JPEG compression complete (${buffer.length} -> ${compressed.length} bytes)`);
    return compressed;
  } catch (error) {
    console.error(`[Transform] JPEG compression failed: ${error.message}`);
    throw error;
  }
}

/**
 * Resize image to specified dimensions
 * @param {Buffer} buffer - Input image buffer
 * @param {number} width - Target width
 * @param {number} height - Target height (optional, maintains aspect ratio if null)
 * @param {Object} options - Resize options
 * @returns {Promise<Buffer>} Resized image buffer
 */
async function applyResize(buffer, width, height = null, options = {}) {
  console.log(`[Transform] Resizing to ${width}x${height || 'auto'}`);
  
  try {
    const resizeOptions = {
      fit: options.fit || 'fill',
      kernel: options.kernel || 'lanczos3',
      withoutEnlargement: options.withoutEnlargement || false
    };
    
    let transformer = sharp(buffer);
    
    if (height) {
      transformer = transformer.resize(width, height, resizeOptions);
    } else {
      transformer = transformer.resize(width, null, resizeOptions);
    }
    
    const resized = await transformer.toBuffer();
    
    console.log(`[Transform] Resize complete (${buffer.length} -> ${resized.length} bytes)`);
    return resized;
  } catch (error) {
    console.error(`[Transform] Resize failed: ${error.message}`);
    throw error;
  }
}

/**
 * Apply Gaussian noise to image
 * Converts to pixel array, adds noise, and reconstructs image
 * @param {Buffer} buffer - Input image buffer
 * @param {number} sigma - Noise standard deviation (0-1, default 0.05)
 * @returns {Promise<Buffer>} Noisy image buffer
 */
async function applyGaussianNoise(buffer, sigma = 0.05) {
  if (sigma < 0 || sigma > 1) {
    throw new Error('Sigma must be between 0 and 1');
  }
  
  console.log(`[Transform] Applying Gaussian noise (sigma: ${sigma})`);
  
  try {
    // Use Sharp instead of Jimp for compatibility
    const image = sharp(buffer);
    const metadata = await image.metadata();
    const { width, height, channels } = metadata;
    
    // Get raw pixel data
    const { data } = await image.raw().toBuffer({ resolveWithObject: true });
    
    // Generate Gaussian noise using Box-Muller transform
    const generateNoise = () => {
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      return z0 * sigma * 255; // Scale to 0-255 range
    };
    
    // Add noise to each pixel
    const noisyData = Buffer.from(data);
    for (let i = 0; i < data.length; i += channels) {
      // Add noise to RGB channels
      noisyData[i] = Math.max(0, Math.min(255, data[i] + generateNoise()));
      noisyData[i + 1] = Math.max(0, Math.min(255, data[i + 1] + generateNoise()));
      noisyData[i + 2] = Math.max(0, Math.min(255, data[i + 2] + generateNoise()));
      // Keep alpha channel unchanged if it exists
      if (channels === 4) {
        noisyData[i + 3] = data[i + 3];
      }
    }
    
    // Convert back to image buffer
    const noisyBuffer = await sharp(noisyData, {
      raw: {
        width,
        height,
        channels
      }
    })
      .png()
      .toBuffer();
    
    console.log(`[Transform] Gaussian noise applied`);
    return noisyBuffer;
  } catch (error) {
    console.error(`[Transform] Gaussian noise failed: ${error.message}`);
    throw error;
  }
}

/**
 * Apply controlled bit corruption for testing partial message recovery
 * Simulates LSB degradation by flipping bits in the pixel data
 * @param {Buffer} buffer - Input image buffer  
 * @param {number} corruptionRate - Fraction of LSBs to corrupt (0.0-1.0)
 * @returns {Promise<Buffer>} Corrupted image buffer
 */
async function applyBitCorruption(buffer, corruptionRate = 0.3) {
  console.log(`[Transform] Applying controlled bit corruption (${(corruptionRate * 100).toFixed(1)}%)`);
  
  try {
    // Decode image to raw pixel data
    const image = sharp(buffer);
    const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    
    // Apply corruption to raw pixel bytes
    const bytesToCorrupt = Math.ceil(data.length * corruptionRate);
    for (let i = 0; i < bytesToCorrupt; i++) {
      const randomByte = Math.floor(Math.random() * data.length);
      const randomBit = Math.floor(Math.random() * 8);
      data[randomByte] ^= (1 << randomBit); // Flip a random bit
    }
    
    // Re-encode as PNG to maintain image format
    const corrupted = await sharp(data, { raw: info })
      .png()
      .toBuffer();
    
    console.log(`[Transform] Flipped ${bytesToCorrupt} bits (${(bytesToCorrupt / data.length * 100).toFixed(2)}%)`);
    return corrupted;
  } catch (error) {
    console.error(`[Transform] Bit corruption failed: ${error.message}`);
    throw error;
  }
}

/**
 * Apply Gaussian blur to image
 * @param {Buffer} buffer - Input image buffer
 * @param {number} sigma - Blur sigma (default 3.0)
 * @returns {Promise<Buffer>} Blurred image buffer
 */
async function applyBlur(buffer, sigma = 3.0) {
  if (sigma < 0.3 || sigma > 1000) {
    throw new Error('Sigma must be between 0.3 and 1000');
  }
  
  console.log(`[Transform] Applying Gaussian blur (sigma: ${sigma})`);
  
  try {
    const blurred = await sharp(buffer)
      .blur(sigma)
      .toBuffer();
    
    console.log(`[Transform] Blur applied`);
    return blurred;
  } catch (error) {
    console.error(`[Transform] Blur failed: ${error.message}`);
    throw error;
  }
}

/**
 * Apply rotation to image
 * @param {Buffer} buffer - Input image buffer
 * @param {number} angle - Rotation angle in degrees
 * @param {Object} options - Rotation options
 * @returns {Promise<Buffer>} Rotated image buffer
 */
async function applyRotation(buffer, angle, options = {}) {
  console.log(`[Transform] Rotating by ${angle} degrees`);
  
  try {
    const rotated = await sharp(buffer)
      .rotate(angle, {
        background: options.background || { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .toBuffer();
    
    console.log(`[Transform] Rotation applied`);
    return rotated;
  } catch (error) {
    console.error(`[Transform] Rotation failed: ${error.message}`);
    throw error;
  }
}

/**
 * Apply crop to image
 * @param {Buffer} buffer - Input image buffer
 * @param {number} ratio - Crop ratio (0-1, e.g., 0.8 for 80%)
 * @returns {Promise<Buffer>} Cropped image buffer
 */
async function applyCrop(buffer, ratio = 0.8) {
  if (ratio <= 0 || ratio > 1) {
    throw new Error('Crop ratio must be between 0 and 1');
  }
  
  console.log(`[Transform] Cropping to ${ratio * 100}%`);
  
  try {
    const metadata = await sharp(buffer).metadata();
    const newWidth = Math.floor(metadata.width * ratio);
    const newHeight = Math.floor(metadata.height * ratio);
    const left = Math.floor((metadata.width - newWidth) / 2);
    const top = Math.floor((metadata.height - newHeight) / 2);
    
    const cropped = await sharp(buffer)
      .extract({ left, top, width: newWidth, height: newHeight })
      .toBuffer();
    
    console.log(`[Transform] Crop applied (${metadata.width}x${metadata.height} -> ${newWidth}x${newHeight})`);
    return cropped;
  } catch (error) {
    console.error(`[Transform] Crop failed: ${error.message}`);
    throw error;
  }
}

// ============================================================================
// TENSOR CONVERSION HELPERS
// ============================================================================

/**
 * Convert image buffer to TensorFlow.js tensor
 * @param {Buffer} buffer - Input image buffer
 * @param {Object} options - Conversion options
 * @returns {Promise<tf.Tensor>} Image tensor [height, width, channels]
 */
async function bufferToTensor(buffer, options = {}) {
  try {
    // Get image metadata
    const image = sharp(buffer);
    const metadata = await image.metadata();
    
    // Normalize options
    const normalize = options.normalize !== false;
    const channels = options.channels || 3;
    
    // Extract raw pixel data
    const { data, info } = await image
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    // Create tensor from raw data
    let tensor = tf.tensor3d(
      new Uint8Array(data),
      [info.height, info.width, info.channels]
    );
    
    // Convert to float and normalize if requested
    if (normalize) {
      tensor = tensor.toFloat().div(255.0);
    } else {
      tensor = tensor.toFloat();
    }
    
    // Handle channel conversion if needed
    if (channels !== info.channels) {
      if (channels === 1 && info.channels === 3) {
        // RGB to grayscale
        const weights = tf.tensor1d([0.299, 0.587, 0.114]);
        tensor = tensor.mul(weights).sum(-1).expandDims(-1);
      } else if (channels === 3 && info.channels === 1) {
        // Grayscale to RGB
        tensor = tensor.tile([1, 1, 3]);
      }
    }
    
    return tensor;
  } catch (error) {
    console.error(`[Transform] bufferToTensor failed: ${error.message}`);
    throw error;
  }
}

/**
 * Convert TensorFlow.js tensor to image buffer
 * @param {tf.Tensor} tensor - Input tensor [height, width, channels] or [batch, height, width, channels]
 * @param {Object} options - Conversion options
 * @returns {Promise<Buffer>} Image buffer (PNG format)
 */
async function tensorToBuffer(tensor, options = {}) {
  try {
    // Handle batch dimension
    let imageTensor = tensor;
    if (tensor.shape.length === 4) {
      // Take first image from batch
      imageTensor = tensor.slice([0, 0, 0, 0], [1, -1, -1, -1]).squeeze([0]);
    }
    
    if (imageTensor.shape.length !== 3) {
      throw new Error(`Expected 3D tensor [H,W,C], got shape ${imageTensor.shape}`);
    }
    
    const [height, width, channels] = imageTensor.shape;
    
    // Denormalize if needed
    let pixelTensor = imageTensor;
    const tensorData = await imageTensor.data();
    const isNormalized = Math.max(...Array.from(tensorData)) <= 1.0;
    
    if (isNormalized) {
      pixelTensor = imageTensor.mul(255.0);
    }
    
    // Convert to uint8
    pixelTensor = pixelTensor.clipByValue(0, 255).cast('int32');
    
    // Get pixel data
    const pixelData = await pixelTensor.data();
    const uint8Data = new Uint8Array(pixelData);
    
    // Create buffer using Sharp
    const buffer = await sharp(uint8Data, {
      raw: {
        width,
        height,
        channels
      }
    })
    .png()
    .toBuffer();
    
    // Cleanup
    if (pixelTensor !== imageTensor) {
      pixelTensor.dispose();
    }
    
    return buffer;
  } catch (error) {
    console.error(`[Transform] tensorToBuffer failed: ${error.message}`);
    throw error;
  }
}

/**
 * Convert buffer to tensor batch (adds batch dimension)
 * @param {Buffer} buffer - Input image buffer
 * @param {Object} options - Conversion options
 * @returns {Promise<tf.Tensor>} Batched tensor [1, height, width, channels]
 */
async function bufferToBatchTensor(buffer, options = {}) {
  const tensor = await bufferToTensor(buffer, options);
  return tensor.expandDims(0);
}

// ============================================================================
// HIGH-LEVEL TRANSFORM APPLICATION
// ============================================================================

/**
 * Apply a transformation to an image
 * @param {Object} image - Image object with buffer or path
 * @param {Object} transform - Transform specification
 * @returns {Object} Transformed image result
 */
async function applyTransform(image, transform) {
  const { name, type, params = {} } = transform;
  const transformType = name || type; // Support both formats
  
  console.log(`[Transform] Applying ${transformType} to ${image.name || 'image'}`);
  
  // Get input buffer
  let buffer = image.buffer;
  if (!buffer && image.path) {
    const fs = require('fs').promises;
    buffer = await fs.readFile(image.path);
  }
  
  if (!buffer) {
    throw new Error('Image must have buffer or path');
  }
  
  let transformedBuffer;
  const startTime = Date.now();
  
  // Apply appropriate transformation
  try {
    switch (transformType) {
      case 'jpeg':
      case 'jpeg-compression':
        transformedBuffer = await applyJpeg(buffer, transform.quality || params.quality || 75);
        break;
        
      case 'noise':
      case 'gaussian_noise':
      case 'gaussian-noise':
        transformedBuffer = await applyGaussianNoise(buffer, transform.sigma || params.sigma || 0.05);
        break;
        
      case 'resize':
        if (transform.scale || params.scale) {
          const metadata = await sharp(buffer).metadata();
          const width = Math.floor(metadata.width * (transform.scale || params.scale));
          const height = Math.floor(metadata.height * (transform.scale || params.scale));
          transformedBuffer = await applyResize(buffer, width, height);
        } else {
          transformedBuffer = await applyResize(buffer, transform.width || params.width, transform.height || params.height);
        }
        break;
        
      case 'rotation':
        transformedBuffer = await applyRotation(buffer, params.angle || 45);
        break;
        
      case 'crop':
        transformedBuffer = await applyCrop(buffer, params.ratio || 0.8);
        break;
        
      case 'blur':
        transformedBuffer = await applyBlur(buffer, params.sigma || params.radius || 3);
        break;
        
      case 'bit-corruption':
      case 'bit_corruption':
      case 'bitcorruption':
        transformedBuffer = await applyBitCorruption(buffer, transform.rate || params.rate || 0.3);
        break;
        
      default:
        console.warn(`[Transform] Unknown transform type: ${type}, returning original`);
        transformedBuffer = buffer;
    }
  } catch (error) {
    console.error(`[Transform] Error applying ${type}: ${error.message}`);
    throw error;
  }
  
  const processingTime = Date.now() - startTime;
  
  // Get metadata of transformed image
  const metadata = await sharp(transformedBuffer).metadata();
  
  // Create transformed image object
  const transformedImage = {
    ...image,
    name: `${image.name}_${type}`,
    buffer: transformedBuffer,
    size: transformedBuffer.length,
    width: metadata.width,
    height: metadata.height,
    channels: metadata.channels,
    format: metadata.format,
    transformed: true,
    transformType: type,
    transformParams: params
  };
  
  return {
    image: transformedImage,
    transform: {
      type,
      params,
      applied: true,
      processingTime,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Apply multiple transforms in sequence
 */
async function applyTransformChain(image, transforms) {
  let currentImage = image;
  const results = [];
  
  for (const transform of transforms) {
    const result = await applyTransform(currentImage, transform);
    currentImage = result.image;
    results.push(result);
  }
  
  return {
    finalImage: currentImage,
    chain: results
  };
}

/**
 * Get list of available transforms
 */
function listTransforms() {
  return [
    {
      type: 'jpeg-compression',
      description: 'JPEG compression with quality parameter',
      params: { quality: 'number (0-100)' },
      implemented: true
    },
    {
      type: 'gaussian-noise',
      description: 'Add Gaussian noise to image',
      params: { sigma: 'number (0-1, noise standard deviation)' },
      implemented: true
    },
    {
      type: 'resize',
      description: 'Resize image by scale factor or dimensions',
      params: { 
        scale: 'number (e.g., 0.5 for 50%)',
        width: 'number (target width)',
        height: 'number (target height)'
      },
      implemented: true
    },
    {
      type: 'rotation',
      description: 'Rotate image by angle',
      params: { angle: 'number (degrees)' },
      implemented: true
    },
    {
      type: 'crop',
      description: 'Crop image to ratio of original',
      params: { ratio: 'number (e.g., 0.8 for 80%)' },
      implemented: true
    },
    {
      type: 'blur',
      description: 'Apply Gaussian blur',
      params: { sigma: 'number (blur sigma, 0.3-1000)' },
      implemented: true
    }
  ];
}

module.exports = {
  // Core transform functions
  applyJpeg,
  applyResize,
  applyGaussianNoise,
  applyBlur,
  applyRotation,
  applyCrop,
  applyBitCorruption,
  
  // Tensor conversion helpers
  bufferToTensor,
  tensorToBuffer,
  bufferToBatchTensor,
  
  // High-level functions
  applyTransform,
  applyTransformChain,
  listTransforms
};
