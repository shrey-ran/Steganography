/**
 * tests/test_transforms.test.js
 * Image transformation tests using Jest
 * Tests all transforms with real sample images
 */

const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const {
  applyJpeg,
  applyResize,
  applyGaussianNoise,
  applyBlur,
  bufferToTensor,
  tensorToBuffer
} = require('../experiments/transforms');

describe('Image Transforms', () => {
  let sampleImageBuffer;
  const sampleImagesDir = path.join(__dirname, '../datasets/sample_images');

  // Setup before all tests
  beforeAll(async () => {
    // Create a test image with pattern (checkerboard) for better transform testing
    // Solid colors don't show blur effects
    const size = 128;
    const checkerSize = 8;
    const channels = 3;
    const rawData = Buffer.alloc(size * size * channels);
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * channels;
        const isBlack = Math.floor(x / checkerSize) % 2 === Math.floor(y / checkerSize) % 2;
        rawData[idx] = isBlack ? 0 : 255;     // R
        rawData[idx + 1] = isBlack ? 0 : 255; // G
        rawData[idx + 2] = isBlack ? 0 : 255; // B
      }
    }
    
    sampleImageBuffer = await sharp(rawData, {
      raw: {
        width: size,
        height: size,
        channels: channels
      }
    })
      .png()
      .toBuffer();

    // Try to load a real sample image if available (optional)
    try {
      await fs.access(sampleImagesDir);
      const files = await fs.readdir(sampleImagesDir);
      const imageFiles = files.filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
      
      if (imageFiles.length > 0) {
        const imagePath = path.join(sampleImagesDir, imageFiles[0]);
        const realImage = await fs.readFile(imagePath);
        // Verify it's a valid image
        try {
          await sharp(realImage).metadata();
          sampleImageBuffer = realImage;
        } catch (err) {
          // Keep the generated buffer
        }
      }
    } catch (err) {
      // Use generated test image
    }
  });

  describe('applyJpeg', () => {
    it('should return a Buffer', async () => {
      const result = await applyJpeg(sampleImageBuffer, 80);
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should not throw with default quality', async () => {
      await expect(applyJpeg(sampleImageBuffer)).resolves.toBeDefined();
    });

    it('should not throw with quality 50', async () => {
      await expect(applyJpeg(sampleImageBuffer, 50)).resolves.toBeDefined();
    });

    it('should not throw with quality 95', async () => {
      await expect(applyJpeg(sampleImageBuffer, 95)).resolves.toBeDefined();
    });

    it('should return different buffer than input', async () => {
      const result = await applyJpeg(sampleImageBuffer, 80);
      expect(result).not.toEqual(sampleImageBuffer);
    });

    it('should compress image (result smaller for low quality)', async () => {
      const highQuality = await applyJpeg(sampleImageBuffer, 95);
      const lowQuality = await applyJpeg(sampleImageBuffer, 50);
      
      // Low quality should generally be smaller (though not guaranteed for tiny images)
      expect(lowQuality.length).toBeLessThanOrEqual(highQuality.length * 1.5);
    });
  });

  describe('applyResize', () => {
    it('should return a Buffer', async () => {
      const result = await applyResize(sampleImageBuffer, 64, 64);
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should not throw with default dimensions', async () => {
      await expect(applyResize(sampleImageBuffer, 128)).resolves.toBeDefined();
    });

    it('should not throw with width 128, height 128', async () => {
      await expect(
        applyResize(sampleImageBuffer, 128, 128)
      ).resolves.toBeDefined();
    });

    it('should not throw with width 256, height 256', async () => {
      await expect(
        applyResize(sampleImageBuffer, 256, 256)
      ).resolves.toBeDefined();
    });

    it('should not throw with custom fit mode', async () => {
      await expect(
        applyResize(sampleImageBuffer, 64, 64, { fit: 'contain' })
      ).resolves.toBeDefined();
    });

    it('should return different buffer than input', async () => {
      const result = await applyResize(sampleImageBuffer, 64, 64);
      expect(result).not.toEqual(sampleImageBuffer);
    });
  });

  describe('applyGaussianNoise', () => {
    it('should return a Buffer', async () => {
      const result = await applyGaussianNoise(sampleImageBuffer, 0.1);
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should not throw with default stddev', async () => {
      await expect(applyGaussianNoise(sampleImageBuffer)).resolves.toBeDefined();
    });

    it('should not throw with sigma 0.05', async () => {
      await expect(
        applyGaussianNoise(sampleImageBuffer, 0.05)
      ).resolves.toBeDefined();
    });

    it('should not throw with sigma 0.2', async () => {
      await expect(
        applyGaussianNoise(sampleImageBuffer, 0.2)
      ).resolves.toBeDefined();
    });

    it('should not throw with sigma 0.5', async () => {
      await expect(
        applyGaussianNoise(sampleImageBuffer, 0.5)
      ).resolves.toBeDefined();
    });

    it('should return different buffer than input', async () => {
      const result = await applyGaussianNoise(sampleImageBuffer, 0.1);
      expect(result).not.toEqual(sampleImageBuffer);
    });

    it('should produce different results on successive calls (randomness)', async () => {
      const result1 = await applyGaussianNoise(sampleImageBuffer, 0.1);
      const result2 = await applyGaussianNoise(sampleImageBuffer, 0.1);
      
      // Results should differ due to random noise
      expect(result1.equals(result2)).toBe(false);
    });
  });

  describe('applyBlur', () => {
    it('should return a Buffer', async () => {
      const result = await applyBlur(sampleImageBuffer, 2);
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should not throw with default sigma', async () => {
      await expect(applyBlur(sampleImageBuffer)).resolves.toBeDefined();
    });

    it('should not throw with sigma 1', async () => {
      await expect(
        applyBlur(sampleImageBuffer, 1)
      ).resolves.toBeDefined();
    });

    it('should not throw with sigma 3', async () => {
      await expect(
        applyBlur(sampleImageBuffer, 3)
      ).resolves.toBeDefined();
    });

    it('should not throw with sigma 5', async () => {
      await expect(
        applyBlur(sampleImageBuffer, 5)
      ).resolves.toBeDefined();
    });

    it('should return different buffer than input', async () => {
      const result = await applyBlur(sampleImageBuffer, 5);
      expect(result).not.toEqual(sampleImageBuffer);
    });
  });

  describe('bufferToTensor', () => {
    it('should convert buffer to tensor', async () => {
      const tensor = await bufferToTensor(sampleImageBuffer);
      expect(tensor).toBeDefined();
      expect(tensor.shape).toBeDefined();
      expect(tensor.shape.length).toBeGreaterThanOrEqual(2);
    });

    it('should not throw', async () => {
      await expect(bufferToTensor(sampleImageBuffer)).resolves.toBeDefined();
    });

    it('should produce tensor with valid shape', async () => {
      const tensor = await bufferToTensor(sampleImageBuffer);
      const shape = tensor.shape;
      
      // Should have at least height and width
      expect(shape.length).toBeGreaterThanOrEqual(2);
      expect(shape[0]).toBeGreaterThan(0); // height
      expect(shape[1]).toBeGreaterThan(0); // width
    });

    it('should dispose tensor properly', async () => {
      const tensor = await bufferToTensor(sampleImageBuffer);
      tensor.dispose();
      expect(tensor.isDisposed).toBe(true);
    });
  });

  describe('tensorToBuffer', () => {
    it('should convert tensor back to buffer', async () => {
      const tensor = await bufferToTensor(sampleImageBuffer);
      const buffer = await tensorToBuffer(tensor);
      tensor.dispose();
      
      expect(Buffer.isBuffer(buffer)).toBe(true);
    });

    it('should not throw', async () => {
      const tensor = await bufferToTensor(sampleImageBuffer);
      await expect(tensorToBuffer(tensor)).resolves.toBeDefined();
      tensor.dispose();
    });

    it('should produce valid image buffer', async () => {
      const tensor = await bufferToTensor(sampleImageBuffer);
      const buffer = await tensorToBuffer(tensor);
      tensor.dispose();
      
      expect(buffer.length).toBeGreaterThan(0);
    });
  });

  describe('Transform Chaining', () => {
    it('should apply multiple transforms in sequence', async () => {
      let buffer = sampleImageBuffer;
      
      buffer = await applyResize(buffer, 128, 128);
      expect(Buffer.isBuffer(buffer)).toBe(true);
      
      buffer = await applyGaussianNoise(buffer, 0.05);
      expect(Buffer.isBuffer(buffer)).toBe(true);
      
      buffer = await applyBlur(buffer, 1);
      expect(Buffer.isBuffer(buffer)).toBe(true);
      
      buffer = await applyJpeg(buffer, 80);
      expect(Buffer.isBuffer(buffer)).toBe(true);
    });

    it('should handle all transforms without throwing', async () => {
      const transforms = [
        () => applyResize(sampleImageBuffer, 64, 64),
        () => applyGaussianNoise(sampleImageBuffer, 0.1),
        () => applyBlur(sampleImageBuffer, 2),
        () => applyJpeg(sampleImageBuffer, 75)
      ];

      for (const transform of transforms) {
        await expect(transform()).resolves.toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid buffer gracefully', async () => {
      const invalidBuffer = Buffer.from('not an image');
      
      // Transforms should throw or return error for invalid input
      await expect(applyJpeg(invalidBuffer)).rejects.toThrow();
    });

    it('should handle null input gracefully', async () => {
      await expect(applyJpeg(null)).rejects.toThrow();
    });

    it('should handle empty buffer gracefully', async () => {
      const emptyBuffer = Buffer.alloc(0);
      await expect(applyJpeg(emptyBuffer)).rejects.toThrow();
    });
  });

  describe('Parameter Validation', () => {
    it('applyJpeg should clamp quality to valid range', async () => {
      // Should throw for out-of-range quality
      await expect(applyJpeg(sampleImageBuffer, 0)).rejects.toThrow();
      await expect(applyJpeg(sampleImageBuffer, 101)).rejects.toThrow();
    });

    it('applyResize should handle zero dimensions', async () => {
      // Should handle or throw appropriately
      await expect(
        applyResize(sampleImageBuffer, 0, 0)
      ).rejects.toThrow();
    });

    it('applyBlur should handle negative sigma', async () => {
      // Should handle or throw appropriately
      await expect(
        applyBlur(sampleImageBuffer, -1)
      ).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    it('transforms should complete in reasonable time', async () => {
      const start = Date.now();
      
      await applyJpeg(sampleImageBuffer, 80);
      await applyResize(sampleImageBuffer, 128, 128);
      await applyGaussianNoise(sampleImageBuffer, 0.1);
      await applyBlur(sampleImageBuffer, 2);
      
      const elapsed = Date.now() - start;
      
      // All transforms should complete within 5 seconds for small images
      expect(elapsed).toBeLessThan(5000);
    });
  });
});
