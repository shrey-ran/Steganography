/**
 * datasets/loader.js
 * Dataset loader for steganography experiments
 * Loads sample images for testing (no real sensitive data)
 * 
 * IMPORTANT: No external downloads without explicit user confirmation
 */

const path = require('path');
const fs = require('fs').promises;
const readline = require('readline');

const SAMPLE_IMAGES_DIR = path.join(__dirname, 'sample_images');

/**
 * Ensure sample images exist, copy from bundled samples if needed
 * @param {string} dest - Destination directory for sample images
 * @returns {Promise<string[]>} Array of copied image paths
 */
async function ensureSampleImages(dest = null) {
  const destDir = dest || SAMPLE_IMAGES_DIR;
  
  console.log(`[Dataset Loader] Ensuring sample images in ${destDir}`);
  
  // Create destination directory
  await fs.mkdir(destDir, { recursive: true });
  
  // Check if sample_images source directory exists
  try {
    await fs.access(SAMPLE_IMAGES_DIR);
    
    // Copy sample images to destination if different
    if (dest && dest !== SAMPLE_IMAGES_DIR) {
      const files = await fs.readdir(SAMPLE_IMAGES_DIR);
      const imageFiles = files.filter(f => 
        f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg')
      );
      
      const copiedPaths = [];
      for (const file of imageFiles) {
        const srcPath = path.join(SAMPLE_IMAGES_DIR, file);
        const destPath = path.join(destDir, file);
        
        await fs.copyFile(srcPath, destPath);
        copiedPaths.push(destPath);
        console.log(`[Dataset Loader] Copied ${file} to ${destDir}`);
      }
      
      return copiedPaths;
    }
    
    // List existing sample images
    const files = await fs.readdir(SAMPLE_IMAGES_DIR);
    const imageFiles = files.filter(f => 
      f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg')
    );
    
    console.log(`[Dataset Loader] Found ${imageFiles.length} sample images`);
    return imageFiles.map(f => path.join(SAMPLE_IMAGES_DIR, f));
    
  } catch (error) {
    // Sample images don't exist, create minimal synthetic placeholders
    console.log(`[Dataset Loader] Sample images not found, creating minimal placeholders`);
    return await createMinimalSampleImages(destDir);
  }
}

/**
 * Create minimal sample image placeholders (tiny PNGs)
 * @param {string} destDir - Destination directory
 * @returns {Promise<string[]>} Array of created image paths
 */
async function createMinimalSampleImages(destDir) {
  await fs.mkdir(destDir, { recursive: true });
  
  const sampleFiles = [];
  
  // Create 3 tiny placeholder text files (representing images)
  // In a real scenario, you'd use sharp or jimp to create actual images
  for (let i = 1; i <= 3; i++) {
    const filename = `sample_${i}.png`;
    const filepath = path.join(destDir, filename);
    
    // Create a minimal text placeholder
    // Note: In production, use sharp.create() or jimp to create real images
    const placeholder = {
      type: 'placeholder',
      id: i,
      description: `Sample image ${i} - placeholder for testing`,
      size: { width: 256, height: 256, channels: 3 },
      created: new Date().toISOString()
    };
    
    await fs.writeFile(filepath, JSON.stringify(placeholder, null, 2));
    sampleFiles.push(filepath);
    console.log(`[Dataset Loader] Created placeholder: ${filename}`);
  }
  
  console.log(`[Dataset Loader] Created ${sampleFiles.length} placeholder images`);
  return sampleFiles;
}

/**
 * ImageDataset class
 * Manages image loading and iteration with optional fake payloads
 */
class ImageDataset {
  /**
   * Constructor
   * @param {string} datasetPath - Path to dataset directory
   * @param {Object} options - Dataset options
   */
  constructor(datasetPath, options = {}) {
    this.datasetPath = datasetPath;
    this.options = {
      limit: options.limit || 10,
      shuffle: options.shuffle || false,
      generatePayloads: options.generatePayloads !== false,
      payloadSize: options.payloadSize || 1024,
      ...options
    };
    
    this.images = [];
    this.currentIndex = 0;
    this.isLoaded = false;
  }
  
  /**
   * Load and index all images in the dataset
   * @returns {Promise<void>}
   */
  async load() {
    if (this.isLoaded) {
      return;
    }
    
    console.log(`[ImageDataset] Loading dataset from ${this.datasetPath}`);
    
    try {
      await fs.access(this.datasetPath);
      
      const files = await fs.readdir(this.datasetPath);
      const imageFiles = files.filter(f => 
        f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.bmp')
      );
      
      // Limit number of images
      const limitedFiles = imageFiles.slice(0, this.options.limit);
      
      for (let i = 0; i < limitedFiles.length; i++) {
        const file = limitedFiles[i];
        const filepath = path.join(this.datasetPath, file);
        const stats = await fs.stat(filepath);
        
        this.images.push({
          id: `img_${i}`,
          name: file,
          path: filepath,
          size: stats.size,
          format: path.extname(file).slice(1).toLowerCase(),
          index: i
        });
      }
      
      // Shuffle if requested
      if (this.options.shuffle) {
        this.images.sort(() => Math.random() - 0.5);
        // Reindex after shuffle
        this.images.forEach((img, idx) => img.index = idx);
      }
      
      this.isLoaded = true;
      console.log(`[ImageDataset] Loaded ${this.images.length} images`);
      
    } catch (error) {
      console.error(`[ImageDataset] Error loading dataset: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get image count
   * @returns {number} Number of images
   */
  size() {
    return this.images.length;
  }
  
  /**
   * Get image at specific index
   * @param {number} index - Image index
   * @returns {Promise<Object>} Image object with buffer and optional payload
   */
  async getImage(index) {
    if (!this.isLoaded) {
      await this.load();
    }
    
    if (index < 0 || index >= this.images.length) {
      throw new Error(`Index ${index} out of bounds (0-${this.images.length - 1})`);
    }
    
    const imageInfo = this.images[index];
    
    // Load image buffer
    let buffer = await fs.readFile(imageInfo.path);
    
    // Check if this is a JSON placeholder file
    if (buffer.toString().trim().startsWith('{')) {
      try {
        const placeholder = JSON.parse(buffer.toString());
        console.log(`[ImageDataset] Converting JSON placeholder to real image: ${imageInfo.name}`);
        
        // Generate a real image from the placeholder metadata
        buffer = await this.generateImageFromPlaceholder(placeholder);
        
        // Optionally save the generated image to replace the placeholder
        // await fs.writeFile(imageInfo.path, buffer);
        
      } catch (error) {
        console.warn(`[ImageDataset] Failed to parse JSON placeholder ${imageInfo.name}: ${error.message}`);
        // Fall back to a simple generated image
        buffer = await this.generateFallbackImage();
      }
    }
    
    // Generate fake payload if requested
    let payload = null;
    if (this.options.generatePayloads) {
      payload = this.generateFakePayload(imageInfo.id);
    }
    
    return {
      ...imageInfo,
      buffer,
      payload
    };
  }
  
  /**
   * Generate a real image from JSON placeholder metadata
   * @param {Object} placeholder - JSON placeholder object
   * @returns {Promise<Buffer>} Generated image buffer
   */
  async generateImageFromPlaceholder(placeholder) {
    const sharp = require('sharp');
    
    const width = placeholder.dimensions?.width || 256;
    const height = placeholder.dimensions?.height || 256;
    const channels = placeholder.dimensions?.channels || 3;
    
    // Generate different patterns based on the placeholder ID
    let background;
    if (placeholder.id === 'sample_1' || placeholder.id === 1) {
      background = { r: 255, g: 0, b: 0 }; // Red
    } else if (placeholder.id === 'sample_2' || placeholder.id === 2) {
      background = { r: 0, g: 255, b: 0 }; // Green
    } else if (placeholder.id === 'sample_3' || placeholder.id === 3) {
      background = { r: 0, g: 0, b: 255 }; // Blue
    } else {
      background = { r: 128, g: 128, b: 128 }; // Gray
    }
    
    const image = sharp({
      create: {
        width,
        height,
        channels,
        background
      }
    });
    
    return await image.png().toBuffer();
  }
  
  /**
   * Generate a fallback image when placeholder parsing fails
   * @returns {Promise<Buffer>} Generated fallback image buffer
   */
  async generateFallbackImage() {
    const sharp = require('sharp');
    
    const image = sharp({
      create: {
        width: 64,
        height: 64,
        channels: 3,
        background: { r: 200, g: 200, b: 200 }
      }
    });
    
    return await image.png().toBuffer();
  }
  
  /**
   * Generate a fake payload for testing
   * @param {string} imageId - Image identifier
   * @returns {Buffer} Fake payload buffer
   */
  generateFakePayload(imageId) {
    const payloadSize = this.options.payloadSize;
    const payload = Buffer.alloc(payloadSize);
    
    // Fill with a simple pattern (not actual data)
    for (let i = 0; i < payloadSize; i++) {
      payload[i] = (i + imageId.charCodeAt(0)) % 256;
    }
    
    return payload;
  }
  
  /**
   * Generator function to yield images one at a time
   */
  async *[Symbol.asyncIterator]() {
    if (!this.isLoaded) {
      await this.load();
    }
    
    for (let i = 0; i < this.images.length; i++) {
      yield await this.getImage(i);
    }
  }
  
  /**
   * Get batch of images
   * @param {number} batchSize - Number of images per batch
   * @returns {AsyncGenerator<Array>} Async generator yielding batches
   */
  async *batches(batchSize = 8) {
    if (!this.isLoaded) {
      await this.load();
    }
    
    for (let i = 0; i < this.images.length; i += batchSize) {
      const batch = [];
      const end = Math.min(i + batchSize, this.images.length);
      
      for (let j = i; j < end; j++) {
        batch.push(await this.getImage(j));
      }
      
      yield batch;
    }
  }
  
  /**
   * Get all images as array
   * @returns {Promise<Array>} Array of all images with buffers
   */
  async getAll() {
    if (!this.isLoaded) {
      await this.load();
    }
    
    const all = [];
    for (let i = 0; i < this.images.length; i++) {
      all.push(await this.getImage(i));
    }
    
    return all;
  }
  
  /**
   * Get dataset metadata
   * @returns {Object} Metadata object
   */
  getMetadata() {
    return {
      path: this.datasetPath,
      count: this.images.length,
      isLoaded: this.isLoaded,
      options: this.options,
      formats: [...new Set(this.images.map(img => img.format))],
      totalSize: this.images.reduce((sum, img) => sum + img.size, 0)
    };
  }
}

/**
 * Load dataset for experiments (backward compatibility)
 * @param {string} datasetName - Name or path of dataset
 * @param {Object} options - Loading options
 * @returns {Promise<Object>} Dataset object with images array
 */
async function loadDataset(datasetName = 'default', options = {}) {
  const limit = options.limit || 10;
  
  console.log(`[Dataset Loader] Loading dataset: ${datasetName}`);
  console.log(`[Dataset Loader] Limit: ${limit} images`);
  
  // Check for sample_images directory first
  let datasetPath;
  if (datasetName === 'default' || datasetName === 'sample') {
    datasetPath = SAMPLE_IMAGES_DIR;
    await ensureSampleImages();
  } else {
    datasetPath = path.join(__dirname, datasetName);
  }
  
  try {
    const dataset = new ImageDataset(datasetPath, options);
    await dataset.load();
    
    // Convert to old format for backward compatibility
    const images = await dataset.getAll();
    
    return {
      name: datasetName,
      count: images.length,
      images: images.map(img => ({
        id: img.id,
        name: img.name,
        path: img.path,
        size: img.size,
        format: img.format,
        buffer: img.buffer,
        payload: img.payload
      })),
      loadedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.log(`[Dataset Loader] Dataset '${datasetName}' not found, generating synthetic samples`);
    const syntheticImages = await generateSampleImages(limit);
    return {
      name: datasetName,
      count: syntheticImages.length,
      images: syntheticImages,
      loadedAt: new Date().toISOString()
    };
  }
}

/**
 * Generate synthetic sample data for dry-run testing
 */
async function generateSampleImages(count = 2) {
  const samples = [];
  const sharp = require('sharp');
  
  for (let i = 0; i < count; i++) {
    // Generate a real image buffer using sharp
    // Create a simple test image (checkerboard pattern)
    const width = 256;
    const height = 256;
    
    // Create a simple PNG image
    const buffer = await sharp({
      create: {
        width: width,
        height: height,
        channels: 3,
        background: { r: i * 50 % 256, g: i * 100 % 256, b: i * 150 % 256 }
      }
    })
    .png()
    .toBuffer();
    
    samples.push({
      id: `sample_${i + 1}`,
      name: `sample_image_${i + 1}.png`,
      path: `/synthetic/sample_${i + 1}.png`,
      width: width,
      height: height,
      channels: 3,
      size: buffer.length,
      format: 'png',
      buffer: buffer,
      metadata: {
        synthetic: true,
        generated: new Date().toISOString()
      }
    });
  }
  
  return samples;
}

/**
 * List available datasets
 */
async function listDatasets() {
  const datasetsDir = path.dirname(__filename);
  
  try {
    const entries = await fs.readdir(datasetsDir, { withFileTypes: true });
    const datasets = entries
      .filter(entry => entry.isDirectory() && entry.name !== 'node_modules')
      .map(entry => entry.name);
    
    return datasets;
  } catch (error) {
    return [];
  }
}

/**
 * Fetch external dataset (requires user confirmation)
 * 
 * ⚠️  IMPORTANT: This function requires interactive confirmation
 * NO automatic downloads without explicit user approval
 * 
 * @param {string} datasetUrl - URL of external dataset
 * @param {string} destDir - Destination directory
 * @returns {Promise<string>} Path to downloaded dataset
 */
async function fetchExternalDataset(datasetUrl, destDir) {
  console.log('\n' + '='.repeat(70));
  console.log('  ⚠️  EXTERNAL DATASET DOWNLOAD REQUESTED ⚠️');
  console.log('='.repeat(70));
  console.log(`\nDataset URL: ${datasetUrl}`);
  console.log(`Destination: ${destDir}`);
  console.log('\nIMPORTANT CONSIDERATIONS:');
  console.log('  - Verify the source is trusted and legitimate');
  console.log('  - Ensure compliance with data usage policies');
  console.log('  - Check for license and copyright restrictions');
  console.log('  - Confirm dataset content is appropriate for research');
  console.log('  - Verify IRB approval if dataset contains sensitive data');
  console.log('');
  
  // Request interactive confirmation
  const confirmed = await promptConfirmation(
    'Do you want to proceed with downloading this external dataset? (yes/no): '
  );
  
  if (!confirmed) {
    console.log('\n❌ Download cancelled by user');
    throw new Error('External dataset download cancelled by user');
  }
  
  console.log('\n✅ Download confirmed - proceeding...');
  console.log('\n⚠️  TODO: Implement actual download logic');
  console.log('This function is a placeholder. To implement:');
  console.log('  1. Add dependency: npm install axios');
  console.log('  2. Implement download with progress tracking');
  console.log('  3. Verify checksums/integrity');
  console.log('  4. Extract archives if needed');
  console.log('  5. Validate dataset structure');
  console.log('');
  
  throw new Error('fetchExternalDataset() not implemented - implement with axios after user confirms need');
}

/**
 * Prompt user for confirmation (interactive)
 * @param {string} question - Question to ask
 * @returns {Promise<boolean>} User's response
 */
function promptConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      const normalized = answer.toLowerCase().trim();
      resolve(normalized === 'yes' || normalized === 'y');
    });
  });
}

module.exports = {
  ensureSampleImages,
  ImageDataset,
  loadDataset,
  listDatasets,
  generateSampleImages,
  fetchExternalDataset
};
