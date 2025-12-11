/**
 * models/lsb_steganography.js
 * Simple LSB (Least Significant Bit) Steganography Implementation
 * 
 * FOR EDUCATIONAL/DEMONSTRATION PURPOSES ONLY
 * 
 * This implements basic steganography by modifying the least significant
 * bits of pixel values to hide data. This is a well-known technique
 * commonly taught in computer science courses.
 */

const sharp = require('sharp');

/**
 * Convert string to binary representation
 * @param {string} str - Input string
 * @returns {string} Binary string
 */
function stringToBinary(str) {
  return str.split('').map(char => {
    return char.charCodeAt(0).toString(2).padStart(8, '0');
  }).join('');
}

/**
 * Convert binary string to text
 * @param {string} binary - Binary string
 * @returns {string} Decoded text
 */
function binaryToString(binary) {
  const chars = binary.match(/.{1,8}/g) || [];
  return chars.map(bin => String.fromCharCode(parseInt(bin, 2))).join('');
}

/**
 * Embed message into image using LSB steganography
 * @param {Buffer} imageBuffer - Input image buffer
 * @param {string} message - Message to hide
 * @returns {Promise<{stegoImage: Buffer, metadata: Object}>}
 */
async function embedMessage(imageBuffer, message) {
  console.log(`[LSB] Embedding message: "${message}" (${message.length} chars)`);
  
  // Get image metadata and raw pixels
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  // Convert message to binary with length prefix
  const messageLength = message.length.toString().padStart(16, '0');
  const messageBinary = stringToBinary(messageLength + message);
  
  // Check if image has enough capacity
  const maxBits = data.length; // Each byte can store 1 bit
  if (messageBinary.length > maxBits) {
    throw new Error(`Message too long! Max ${Math.floor(maxBits / 8)} chars, got ${message.length}`);
  }
  
  console.log(`[LSB] Message binary length: ${messageBinary.length} bits`);
  console.log(`[LSB] Image capacity: ${maxBits} bits`);
  
  // Create a copy of the pixel data
  const modifiedData = Buffer.from(data);
  
  // Embed message into LSBs
  for (let i = 0; i < messageBinary.length; i++) {
    // Clear LSB and set to message bit
    modifiedData[i] = (modifiedData[i] & 0xFE) | parseInt(messageBinary[i]);
  }
  
  // Convert back to image
  const stegoImage = await sharp(modifiedData, {
    raw: {
      width: info.width,
      height: info.height,
      channels: info.channels
    }
  })
  .png()
  .toBuffer();
  
  console.log(`[LSB] Embedding complete: ${imageBuffer.length} -> ${stegoImage.length} bytes`);
  
  return {
    stegoImage,
    metadata: {
      originalSize: imageBuffer.length,
      stegoSize: stegoImage.length,
      messageLength: message.length,
      bitsUsed: messageBinary.length,
      capacity: maxBits,
      utilizationPercent: ((messageBinary.length / maxBits) * 100).toFixed(2)
    }
  };
}

/**
 * Extract message from stego image using LSB steganography
 * @param {Buffer} stegoImageBuffer - Stego image buffer
 * @returns {Promise<{message: string, metadata: Object}>}
 */
async function extractMessage(stegoImageBuffer, options = {}) {
  const { tolerance = false, debug = false } = options;
  
  console.log('[LSB] Extracting message from stego image...');
  if (tolerance) {
    console.log('[LSB] Using error-tolerant extraction mode');
  }
  
  // Get raw pixel data
  const image = sharp(stegoImageBuffer);
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  // Extract length prefix (first 128 bits = 16 chars)
  let lengthBinary = '';
  for (let i = 0; i < 128; i++) {
    lengthBinary += (data[i] & 1).toString();
  }
  
  let messageLength = 0;
  try {
    const lengthStr = binaryToString(lengthBinary);
    messageLength = parseInt(lengthStr);
    
    if (isNaN(messageLength) || messageLength <= 0 || messageLength > 10000) {
      throw new Error('Invalid length value: ' + messageLength);
    }
  } catch (e) {
    if (!tolerance) {
      throw new Error('Invalid message length detected - no message hidden or corrupted data');
    }
    // In tolerance mode, try to recover length
    console.log(`[LSB] Length prefix corrupted (error: ${e.message}), attempting recovery...`);
    messageLength = attemptLengthRecovery(data);
    console.log(`[LSB] Recovered length: ${messageLength}`);
  }
  
  console.log(`[LSB] Detected message length: ${messageLength} chars`);
  
  // Extract message bits
  const messageBitsNeeded = messageLength * 8;
  let messageBinary = '';
  let bitsRecovered = 0;
  
  for (let i = 128; i < 128 + messageBitsNeeded; i++) {
    messageBinary += (data[i] & 1).toString();
    bitsRecovered++;
  }
  
  let message = '';
  let wasCorrupted = false;
  
  try {
    message = binaryToString(messageBinary);
  } catch (e) {
    if (!tolerance) throw e;
    // In tolerance mode, try to recover what we can
    wasCorrupted = true;
    message = attemptMessageRecovery(messageBinary);
  }
  
  // Check if extracted message looks corrupted even if no exception
  if (!wasCorrupted && tolerance && message.length > 0) {
    // Count non-printable characters
    const printableCount = (message.match(/[ -~]/g) || []).length;
    const printableRatio = printableCount / message.length;
    
    // If we have many non-printable chars, it's probably corrupted
    if (printableRatio < 0.7) {
      wasCorrupted = true;
      // Try to recover better version
      const recovered = attemptMessageRecovery(messageBinary);
      if (recovered.length > 0) {
        message = recovered;
      }
    }
  }
  
  // Calculate recovery score based on message quality
  let recoveryScore = 1.0;
  
  // Always calculate recovery score in tolerance mode, even if no explicit corruption detected
  if (tolerance) {
    // Message quality assessment
    const printableCount = (message.match(/[ -~]/g) || []).length;
    const printableScore = message.length > 0 ? printableCount / message.length : 0;
    
    // If message looks OK (mostly printable), keep score high
    // If message looks bad (many non-printable), lower the score
    if (printableScore >= 0.9) {
      // Message looks mostly normal - but check length
      // If we got a reasonable amount back, good recovery
      recoveryScore = Math.min(1.0, message.length / Math.max(message.length, 30));
    } else if (printableScore >= 0.5) {
      // Message is partially corrupted (50-90% printable)
      // Recovery score is reduced significantly
      const lengthScore = message.length / 30;
      recoveryScore = (printableScore * 0.6 + lengthScore * 0.4);
    } else {
      // Message is mostly garbage (< 50% printable)
      // Very low recovery score
      recoveryScore = printableScore * 0.3;
    }
    
    console.log(`[LSB] Recovery assessment: printable=${printableScore.toFixed(2)}, final=${recoveryScore.toFixed(3)}`);
  }
  
  console.log(`[LSB] Extraction complete: "${message.substring(0, 40)}" (recovery: ${(recoveryScore * 100).toFixed(1)}%)`);
  
  return {
    message,
    recoveryScore,
    bitsRecovered,
    wasCorrupted,
    metadata: {
      messageLength: message.length,
      bitsExtracted: messageBitsNeeded + 128,
      imageSize: stegoImageBuffer.length
    }
  };
}

/**
 * Attempt to recover message length from corrupted prefix
 * Tries different lengths and picks one that produces valid printable text
 */
function attemptLengthRecovery(data) {
  // We don't have ground truth, so try reasonable lengths
  // and see which produces the most printable ASCII text
  
  let bestLength = 10;  // Default guess
  let bestScore = -1;
  
  // Try lengths from 1 to 100
  for (let testLength = 1; testLength <= 100; testLength++) {
    let printableCount = 0;
    
    // Extract message bits for this hypothetical length
    for (let charIdx = 0; charIdx < testLength && (128 + charIdx * 8 + 8) <= data.length; charIdx++) {
      let char8bits = '';
      for (let bitIdx = 0; bitIdx < 8 && (128 + charIdx * 8 + bitIdx) < data.length; bitIdx++) {
        char8bits += (data[128 + charIdx * 8 + bitIdx] & 1).toString();
      }
      
      if (char8bits.length === 8) {
        const charCode = parseInt(char8bits, 2);
        // Count printable ASCII
        if (charCode >= 32 && charCode <= 126) {
          printableCount++;
        }
      }
    }
    
    // Score: percentage of printable characters
    const score = testLength > 0 ? printableCount / testLength : 0;
    
    if (score > bestScore) {
      bestScore = score;
      bestLength = testLength;
    }
  }
  
  console.log(`[LSB] Recovered length: ${bestLength} (printability: ${(bestScore * 100).toFixed(0)}%)`);
  return bestLength;
}

/**
 * Attempt to recover partial message from corrupted bits
 * Uses hamming distance to find closest valid ASCII characters
 */
function attemptMessageRecovery(messageBinary, expectedLength = null) {
  let recovered = '';
  
  // Process 8 bits at a time to extract characters
  for (let i = 0; i < messageBinary.length; i += 8) {
    const char8bits = messageBinary.substr(i, 8);
    if (char8bits.length === 8) {
      const charCode = parseInt(char8bits, 2);
      
      // First try: is this already a valid printable ASCII?
      if (charCode >= 32 && charCode <= 126) {
        recovered += String.fromCharCode(charCode);
        continue;
      }
      
      // Second try: find the closest valid printable ASCII using hamming distance
      let bestMatch = '';
      let bestDistance = 8;
      
      for (let code = 32; code <= 126; code++) {
        const expected = code.toString(2).padStart(8, '0');
        let distance = 0;
        for (let j = 0; j < 8; j++) {
          if (expected[j] !== char8bits[j]) distance++;
        }
        // Pick closest, prefer lower error rates
        if (distance < bestDistance) {
          bestDistance = distance;
          bestMatch = String.fromCharCode(code);
        }
      }
      
      // Accept if reasonably close (3 or fewer bit errors) OR if we have nothing better
      if (bestDistance <= 3) {
        recovered += bestMatch;
      } else if (recovered.length === 0) {
        // If first character, accept even with more errors
        recovered += bestMatch;
      }
    }
  }
  
  // Filter out trailing garbage if it looks like random data
  // Keep only if looks like English text
  return recovered;
}

/**
 * Calculate embedding capacity of an image
 * @param {Buffer} imageBuffer - Input image buffer
 * @returns {Promise<Object>} Capacity information
 */
async function calculateCapacity(imageBuffer) {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const { data } = await image.raw().toBuffer({ resolveWithObject: true });
  
  const maxBits = data.length;
  const maxChars = Math.floor((maxBits - 128) / 8); // Subtract length prefix
  
  return {
    width: metadata.width,
    height: metadata.height,
    channels: metadata.channels,
    totalPixels: metadata.width * metadata.height,
    maxBits,
    maxChars,
    maxKilobytes: (maxChars / 1024).toFixed(2)
  };
}

module.exports = {
  embedMessage,
  extractMessage,
  calculateCapacity,
  stringToBinary,
  binaryToString
};
