#!/usr/bin/env node

/**
 * scripts/create_sample_images.js
 * 
 * Programmatically creates minimal sample images for testing.
 * Keeps the repository self-contained without needing external image files.
 * 
 * Usage:
 *   node scripts/create_sample_images.js
 *   npm run create-samples  (if added to package.json scripts)
 */

const fs = require('fs').promises;
const path = require('path');
const { Jimp } = require('jimp');

const OUTPUT_DIR = path.join(__dirname, '../datasets/sample_images');
const IMAGE_SIZE = 64; // Small for fast testing

/**
 * Create sample images
 */
async function createSampleImages() {
  console.log('[Create Samples] Starting sample image generation...');
  
  try {
    // Create output directory
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    console.log(`[Create Samples] Output directory: ${OUTPUT_DIR}`);

    // 1. Solid Red Image
    console.log('[Create Samples] Creating solid_red.png...');
    const redImage = new Jimp({
      width: IMAGE_SIZE,
      height: IMAGE_SIZE,
      color: 0xFF0000FF // Red
    });
    await redImage.write(path.join(OUTPUT_DIR, 'solid_red.png'));

    // 2. Solid Blue Image
    console.log('[Create Samples] Creating solid_blue.png...');
    const blueImage = new Jimp({
      width: IMAGE_SIZE,
      height: IMAGE_SIZE,
      color: 0x0000FFFF // Blue
    });
    await blueImage.write(path.join(OUTPUT_DIR, 'solid_blue.png'));

    // 3. Checkerboard Pattern
    console.log('[Create Samples] Creating checkerboard.png...');
    const checkerboard = new Jimp({
      width: IMAGE_SIZE,
      height: IMAGE_SIZE,
      color: 0xFFFFFFFF // White background
    });
    
    const checkerSize = 8; // 8x8 pixel squares
    for (let y = 0; y < IMAGE_SIZE; y++) {
      for (let x = 0; x < IMAGE_SIZE; x++) {
        const isBlack = Math.floor(x / checkerSize) % 2 === Math.floor(y / checkerSize) % 2;
        if (isBlack) {
          checkerboard.setPixelColor(0x000000FF, x, y); // Black
        }
      }
    }
    await checkerboard.write(path.join(OUTPUT_DIR, 'checkerboard.png'));

    // 4. Gradient Image (using scan for pixel manipulation)
    console.log('[Create Samples] Creating gradient.png...');
    const gradient = new Jimp({
      width: IMAGE_SIZE,
      height: IMAGE_SIZE,
      color: 0x000000FF
    });
    
    gradient.scan(0, 0, IMAGE_SIZE, IMAGE_SIZE, function(x, y, idx) {
      const intensity = Math.floor((x / IMAGE_SIZE) * 255);
      this.bitmap.data[idx + 0] = intensity; // R
      this.bitmap.data[idx + 1] = intensity; // G
      this.bitmap.data[idx + 2] = intensity; // B
      this.bitmap.data[idx + 3] = 255;       // A
    });
    await gradient.write(path.join(OUTPUT_DIR, 'gradient.png'));

    // 5. Vertical Stripes
    console.log('[Create Samples] Creating stripes.png...');
    const stripes = new Jimp({
      width: IMAGE_SIZE,
      height: IMAGE_SIZE,
      color: 0xFFFFFFFF
    });
    
    const stripeWidth = 8;
    for (let y = 0; y < IMAGE_SIZE; y++) {
      for (let x = 0; x < IMAGE_SIZE; x++) {
        if (Math.floor(x / stripeWidth) % 2 === 0) {
          stripes.setPixelColor(0x000000FF, x, y); // Black stripe
        }
      }
    }
    await stripes.write(path.join(OUTPUT_DIR, 'stripes.png'));

    // 6. Dot Pattern
    console.log('[Create Samples] Creating dots.png...');
    const dots = new Jimp({
      width: IMAGE_SIZE,
      height: IMAGE_SIZE,
      color: 0xFFFFFFFF
    });
    
    const dotSpacing = 8;
    const dotRadius = 2;
    for (let y = 0; y < IMAGE_SIZE; y += dotSpacing) {
      for (let x = 0; x < IMAGE_SIZE; x += dotSpacing) {
        // Draw a small circle (approximation)
        for (let dy = -dotRadius; dy <= dotRadius; dy++) {
          for (let dx = -dotRadius; dx <= dotRadius; dx++) {
            if (dx * dx + dy * dy <= dotRadius * dotRadius) {
              const px = x + dx;
              const py = y + dy;
              if (px >= 0 && px < IMAGE_SIZE && py >= 0 && py < IMAGE_SIZE) {
                dots.setPixelColor(0xFF0000FF, px, py); // Red dots
              }
            }
          }
        }
      }
    }
    await dots.write(path.join(OUTPUT_DIR, 'dots.png'));

    // Create README for the dataset
    const readmeContent = `# Sample Images Dataset

This directory contains programmatically generated sample images for testing.

## Contents

- \`solid_red.png\` - ${IMAGE_SIZE}x${IMAGE_SIZE} solid red image
- \`solid_blue.png\` - ${IMAGE_SIZE}x${IMAGE_SIZE} solid blue image
- \`checkerboard.png\` - ${IMAGE_SIZE}x${IMAGE_SIZE} black and white checkerboard pattern
- \`gradient.png\` - ${IMAGE_SIZE}x${IMAGE_SIZE} horizontal grayscale gradient
- \`stripes.png\` - ${IMAGE_SIZE}x${IMAGE_SIZE} vertical black and white stripes
- \`dots.png\` - ${IMAGE_SIZE}x${IMAGE_SIZE} grid of red dots on white background

## Generation

These images are created by \`scripts/create_sample_images.js\`.

To regenerate:
\`\`\`bash
node scripts/create_sample_images.js
\`\`\`

## Usage

These images are used for:
- Unit testing image transforms
- API endpoint testing
- Dry-run experiment validation
- Fast local development

## License

CC0-1.0 (Public Domain) - These images are programmatically generated and contain no copyrighted content.

## Notes

- Images are intentionally small (${IMAGE_SIZE}x${IMAGE_SIZE}) for fast testing
- All images are PNG format for lossless testing
- Patterns are simple geometric shapes for predictable behavior
`;

    await fs.writeFile(path.join(OUTPUT_DIR, 'README.md'), readmeContent);
    console.log('[Create Samples] Created README.md');

    // List created files
    const files = await fs.readdir(OUTPUT_DIR);
    const imageFiles = files.filter(f => f.endsWith('.png'));
    
    console.log('\n[Create Samples] ✅ Successfully created sample images:');
    for (const file of imageFiles) {
      const filepath = path.join(OUTPUT_DIR, file);
      const stats = await fs.stat(filepath);
      console.log(`  - ${file} (${stats.size} bytes)`);
    }
    
    console.log(`\n[Create Samples] Total: ${imageFiles.length} images`);
    console.log(`[Create Samples] Location: ${OUTPUT_DIR}`);
    console.log('[Create Samples] Done! ✨');

  } catch (error) {
    console.error('[Create Samples] ❌ Error creating sample images:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  createSampleImages();
}

module.exports = { createSampleImages };
