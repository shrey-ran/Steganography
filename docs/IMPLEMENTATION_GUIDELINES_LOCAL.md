# Implementation Guidelines for Local Development

## Overview

This document specifies the interface and integration patterns for implementing steganography models in this codebase. It does NOT include hiding/extraction algorithms - implementers must research and develop those independently.

## StegoModel Class Interface

All steganography models must implement the following class interface:

### Required Methods

```javascript
class StegoModel {
  /**
   * Build/initialize the model architecture
   * @param {Object} config - Model configuration
   * @param {number} config.inputHeight - Image height
   * @param {number} config.inputWidth - Image width
   * @param {number} config.channels - Color channels (3 for RGB)
   * @param {number} config.messageLength - Maximum message bits
   * @returns {Promise<void>}
   */
  async build(config) {
    // Initialize model architecture
    // Load pretrained weights if available
    // Validate configuration parameters
  }

  /**
   * Encode a message into a cover image
   * @param {Buffer} coverImage - Input image buffer (PNG/JPEG)
   * @param {Buffer|string} message - Message to hide
   * @param {Object} options - Encoding options
   * @returns {Promise<Buffer>} Stego image buffer
   * @throws {Error} If encoding fails or parameters invalid
   */
  async encode(coverImage, message, options = {}) {
    throw new Error('encode() not implemented - implement hiding algorithm');
  }

  /**
   * Extract hidden message from stego image
   * @param {Buffer} stegoImage - Image containing hidden message
   * @param {Object} options - Extraction options
   * @returns {Promise<Buffer|string>} Extracted message
   * @throws {Error} If extraction fails
   */
  async extract(stegoImage, options = {}) {
    throw new Error('extract() not implemented - implement extraction algorithm');
  }

  /**
   * Dry-run validation without actual encoding/extraction
   * Tests model readiness and parameter validation
   * @param {Object} params - Parameters to validate
   * @returns {Promise<Object>} Validation results
   */
  async dryRun(params) {
    return {
      valid: true,
      modelReady: this.isModelBuilt,
      inputShape: this.config?.inputShape,
      messageCapacity: this.config?.messageLength,
      warnings: [],
      errors: []
    };
  }

  /**
   * Save model checkpoint
   * @param {string} checkpointPath - Path to save checkpoint
   * @returns {Promise<void>}
   */
  async saveCheckpoint(checkpointPath) {
    // Save model weights, config, and metadata
  }

  /**
   * Load model checkpoint
   * @param {string} checkpointPath - Path to checkpoint
   * @returns {Promise<void>}
   */
  async loadCheckpoint(checkpointPath) {
    // Load model weights, config, and metadata
  }
}
```

## Data Inputs

### Image Buffers

All image inputs/outputs use Node.js `Buffer` objects:

```javascript
const fs = require('fs').promises;
const sharp = require('sharp');

// Load image as buffer
const imageBuffer = await fs.readFile('path/to/image.png');

// Process with Sharp if needed
const processedBuffer = await sharp(imageBuffer)
  .resize(256, 256)
  .png()
  .toBuffer();

// Convert buffer to tensor for ML processing
const { bufferToTensor } = require('../experiments/transforms');
const tensor = await bufferToTensor(imageBuffer);

// Convert tensor back to buffer
const { tensorToBuffer } = require('../experiments/transforms');
const outputBuffer = await tensorToBuffer(tensor);
```

### Message Format

Messages can be:
- `Buffer` for binary data
- `string` for text messages (convert to Buffer internally)

```javascript
// Text message
const message = "Secret message";
const messageBuffer = Buffer.from(message, 'utf8');

// Binary message
const binaryMessage = Buffer.from([0x01, 0x02, 0x03, 0x04]);
```

## Checkpoint Management

### Save Checkpoints

Checkpoints should include:
- Model weights (TensorFlow.js format)
- Configuration JSON
- Training metadata
- Timestamp and version info

```javascript
async saveCheckpoint(checkpointPath) {
  const checkpointDir = path.dirname(checkpointPath);
  await fs.mkdir(checkpointDir, { recursive: true });

  // Save model weights
  if (this.model) {
    await this.model.save(`file://${checkpointPath}/model`);
  }

  // Save configuration and metadata
  const metadata = {
    config: this.config,
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    trainedEpochs: this.trainedEpochs || 0,
    performance: this.metrics || {}
  };

  await fs.writeFile(
    path.join(checkpointPath, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );

  console.log(`Checkpoint saved: ${checkpointPath}`);
}
```

### Load Checkpoints

```javascript
async loadCheckpoint(checkpointPath) {
  // Load metadata
  const metadataPath = path.join(checkpointPath, 'metadata.json');
  const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
  
  this.config = metadata.config;
  this.trainedEpochs = metadata.trainedEpochs;
  this.metrics = metadata.performance;

  // Load model weights
  const modelPath = `file://${checkpointPath}/model/model.json`;
  this.model = await tf.loadLayersModel(modelPath);

  console.log(`Checkpoint loaded: ${checkpointPath}`);
}
```

## Integration with experiments/runner.js

### Runner Integration Points

The experiment runner expects models to follow this lifecycle:

```javascript
// 1. Instantiate model
const model = new StegoModel();

// 2. Build/initialize
await model.build({
  inputHeight: 256,
  inputWidth: 256,
  channels: 3,
  messageLength: 1024
});

// 3. Process images
for (const imagePath of dataset) {
  const imageBuffer = await fs.readFile(imagePath);
  const message = generateMessage(); // Your message generation logic
  
  // Encode
  const stegoBuffer = await model.encode(imageBuffer, message);
  
  // Save result
  await fs.writeFile(outputPath, stegoBuffer);
  
  // Optional: verify extraction
  const extracted = await model.extract(stegoBuffer);
  validateMessage(message, extracted);
}

// 4. Save checkpoint after training/processing
await model.saveCheckpoint('./checkpoints/experiment-1');
```

### Runner Configuration

Add model configuration to `config/experiment.json`:

```json
{
  "model": {
    "type": "StegoModel",
    "config": {
      "inputHeight": 256,
      "inputWidth": 256,
      "channels": 3,
      "messageLength": 1024
    },
    "checkpoint": "./checkpoints/pretrained"
  }
}
```

### Dry-Run Mode

Always test with dry-run before full execution:

```javascript
// In experiments/runner.js
if (config.dryRun) {
  const validation = await model.dryRun({
    dataset: config.dataset,
    batchSize: config.batchSize,
    transforms: config.transforms
  });
  
  console.log('Dry-run validation:', validation);
  return validation;
}
```

## Ethics Checklist

**IMPORTANT: Before implementing encode/extract methods, you MUST:**

### ✅ Required Ethical Considerations

- [ ] **Consent & Authorization**: Verify you have permission to modify all images
- [ ] **Legal Compliance**: Ensure compliance with local laws regarding steganography
- [ ] **No Malicious Use**: Do not use for circumventing security, spreading malware, or illegal activities
- [ ] **Data Privacy**: Protect any personal or sensitive information in messages
- [ ] **Academic Integrity**: Properly cite research papers and algorithms used
- [ ] **Responsible Disclosure**: If discovering vulnerabilities, follow responsible disclosure practices
- [ ] **Transparency**: Document limitations, failure modes, and potential misuse scenarios
- [ ] **Copyright Respect**: Do not hide copyrighted content without authorization
- [ ] **Harm Prevention**: Consider potential harms and implement safeguards
- [ ] **Intended Use Only**: Limit usage to educational, research, or authorized purposes

### 🚨 Prohibited Use Cases

**DO NOT implement or use this system for:**

- Evading content moderation or censorship systems
- Concealing malware or malicious code
- Violating terms of service of platforms
- Infringing intellectual property rights
- Facilitating illegal communications
- Bypassing security controls without authorization
- Any purpose that could cause harm to individuals or organizations

### 📋 Pre-Implementation Review

Before enabling encode/extract:

1. **Document Use Case**: Write clear description of intended research purpose
2. **Risk Assessment**: Identify potential misuse scenarios
3. **Mitigation Strategies**: Implement controls to prevent misuse
4. **Code Review**: Have implementations reviewed by peers
5. **Testing Protocols**: Establish safe testing procedures
6. **Incident Response**: Plan for handling misuse if discovered

### 🔒 Security Recommendations

- Keep steganography implementations private (do not publish publicly without review)
- Log all encode/extract operations with timestamps
- Implement rate limiting for production deployments
- Add watermarking or fingerprinting to track usage
- Maintain audit trail of who accessed the system
- Regular security audits of implementation

## Development Workflow

### Recommended Steps

1. **Start with Dry-Run**: Implement and test `dryRun()` first
2. **Build Infrastructure**: Implement `build()`, checkpoint save/load
3. **Research Algorithms**: Study academic papers on steganography methods
4. **Ethics Review**: Complete ethics checklist
5. **Implement Stubs**: Create `encode()`/`extract()` stubs that throw errors
6. **Gradual Implementation**: Implement algorithms incrementally with testing
7. **Validation**: Test with sample images, measure capacity and imperceptibility
8. **Documentation**: Document algorithm, limitations, and usage guidelines

### Testing Strategy

```javascript
// tests/test_stego_model.test.js
describe('StegoModel', () => {
  it('should build model successfully', async () => {
    const model = new StegoModel();
    await model.build(testConfig);
    expect(model.isModelBuilt).toBe(true);
  });

  it('should perform dry-run validation', async () => {
    const model = new StegoModel();
    const result = await model.dryRun(testParams);
    expect(result.valid).toBe(true);
  });

  it('should save and load checkpoints', async () => {
    const model = new StegoModel();
    await model.build(testConfig);
    await model.saveCheckpoint(checkpointPath);
    
    const loadedModel = new StegoModel();
    await loadedModel.loadCheckpoint(checkpointPath);
    expect(loadedModel.config).toEqual(testConfig);
  });
});
```

## Performance Considerations

- Use TensorFlow.js GPU acceleration when available
- Batch process images to improve throughput
- Implement caching for frequently accessed models
- Monitor memory usage with large image datasets
- Consider streaming for very large files

## Error Handling

All methods should handle errors gracefully:

```javascript
async encode(coverImage, message, options = {}) {
  try {
    // Validate inputs
    if (!Buffer.isBuffer(coverImage)) {
      throw new Error('Cover image must be a Buffer');
    }
    
    if (!this.isModelBuilt) {
      throw new Error('Model not built. Call build() first');
    }

    // Implementation here (when ready)
    throw new Error('encode() not implemented - implement hiding algorithm');

  } catch (error) {
    console.error('Encoding failed:', error);
    throw error;
  }
}
```

## Resources

- TensorFlow.js documentation: https://www.tensorflow.org/js
- Sharp image processing: https://sharp.pixelplumbing.com/
- Node.js Buffer API: https://nodejs.org/api/buffer.html
- Academic papers on steganography (research independently)

---

**Remember**: This document provides the interface specification only. Algorithm implementation is the responsibility of the developer and must be done ethically and legally.
