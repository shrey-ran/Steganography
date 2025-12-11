#!/usr/bin/env node

/**
 * scripts/print_ethics_banner.js
 * Displays ethics and compliance banner at startup
 * Ensures researchers are aware of ethical requirements and restrictions
 */

/**
 * Print the full ethics banner
 * @param {Object} options - Banner options
 * @param {boolean} options.bypass - If true, print abbreviated warning instead
 */
function printBanner(options = {}) {
  const bypass = options.bypass || false;
  
  if (bypass) {
    // Abbreviated warning when bypassed
    console.log('\n' + '⚠️ '.repeat(35));
    console.log('  ETHICS BANNER BYPASSED - LOCAL-ONLY RESEARCH PROJECT');
    console.log('  Supervisor/IRB approval required before training or sharing');
    console.log('⚠️ '.repeat(35) + '\n');
    return;
  }
  
  // Full ethics banner
  console.log('\n');
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(78) + '║');
  console.log('║' + centerText('⚠️  ETHICS & COMPLIANCE NOTICE  ⚠️', 78) + '║');
  console.log('║' + centerText('STEGANOGRAPHY RESEARCH - LOCAL USE ONLY', 78) + '║');
  console.log('║' + ' '.repeat(78) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');
  console.log('');
  
  console.log('  ┌─────────────────────────────────────────────────────────────────────┐');
  console.log('  │  🚫  CRITICAL RESTRICTIONS  🚫                                      │');
  console.log('  └─────────────────────────────────────────────────────────────────────┘');
  console.log('');
  console.log('    ✗  DO NOT push to remote repositories (GitHub, GitLab, etc.)');
  console.log('    ✗  DO NOT share code or results without supervisor approval');
  console.log('    ✗  DO NOT distribute datasets or model weights');
  console.log('    ✗  DO NOT enable training (ALLOW_TRAINING=true) without approval');
  console.log('    ✗  DO NOT use for malicious, harmful, or unethical purposes');
  console.log('    ✗  DO NOT bypass security controls or audit logging');
  console.log('');
  
  console.log('  ┌─────────────────────────────────────────────────────────────────────┐');
  console.log('  │  ✓  REQUIRED APPROVALS  ✓                                          │');
  console.log('  └─────────────────────────────────────────────────────────────────────┘');
  console.log('');
  console.log('    ✓  Institutional Review Board (IRB) approval obtained');
  console.log('    ✓  Research supervisor authorization documented');
  console.log('    ✓  Ethics committee review completed');
  console.log('    ✓  Data privacy and security protocols implemented');
  console.log('    ✓  Compliance with institutional research policies');
  console.log('');
  
  console.log('  ┌─────────────────────────────────────────────────────────────────────┐');
  console.log('  │  📋  BEFORE ENABLING TRAINING (ALLOW_TRAINING=true)                │');
  console.log('  └─────────────────────────────────────────────────────────────────────┘');
  console.log('');
  console.log('    1. Obtain written approval from research supervisor');
  console.log('    2. Verify IRB protocol covers steganography experiments');
  console.log('    3. Document security measures and audit procedures');
  console.log('    4. Ensure all team members are trained on ethical guidelines');
  console.log('    5. Set up monitoring and logging for all experiments');
  console.log('    6. Review and sign data handling agreements');
  console.log('');
  
  console.log('  ┌─────────────────────────────────────────────────────────────────────┐');
  console.log('  │  📝  AUDIT & LOGGING                                                │');
  console.log('  └─────────────────────────────────────────────────────────────────────┘');
  console.log('');
  console.log('    • All experiments are logged with timestamps and parameters');
  console.log('    • Results are saved locally in scripts/output/ directory');
  console.log('    • Model checkpoints include metadata and warnings');
  console.log('    • Keep detailed research notes and experiment documentation');
  console.log('');
  
  console.log('  ┌─────────────────────────────────────────────────────────────────────┐');
  console.log('  │  🔒  CURRENT STATUS                                                 │');
  console.log('  └─────────────────────────────────────────────────────────────────────┘');
  console.log('');
  
  const allowTraining = process.env.ALLOW_TRAINING === 'true';
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  if (allowTraining) {
    console.log('    ⚠️  ALLOW_TRAINING: true (TRAINING ENABLED)');
    console.log('    ⚠️  Ensure all approvals are in place before proceeding');
  } else {
    console.log('    ✓  ALLOW_TRAINING: false (DRY-RUN MODE)');
    console.log('    ✓  Safe mode - no actual training will occur');
  }
  console.log(`    •  NODE_ENV: ${nodeEnv}`);
  console.log(`    •  Date: ${new Date().toISOString()}`);
  console.log('');
  
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + centerText('LOCAL RESEARCH ONLY - NO EXTERNAL SHARING', 78) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');
  console.log('\n');
}

/**
 * Center text within a given width
 * @param {string} text - Text to center
 * @param {number} width - Total width
 * @returns {string} Centered text with padding
 */
function centerText(text, width) {
  const textLength = text.length;
  if (textLength >= width) {
    return text.substring(0, width);
  }
  
  const leftPadding = Math.floor((width - textLength) / 2);
  const rightPadding = width - textLength - leftPadding;
  
  return ' '.repeat(leftPadding) + text + ' '.repeat(rightPadding);
}

/**
 * Print a compact warning banner
 */
function printCompactWarning() {
  console.log('\n⚠️  LOCAL-ONLY RESEARCH | IRB/SUPERVISOR APPROVAL REQUIRED ⚠️\n');
}

/**
 * Print ASCII art logo (optional)
 */
function printLogo() {
  console.log('');
  console.log('   ███████╗████████╗███████╗ ██████╗  ██████╗ ');
  console.log('   ██╔════╝╚══██╔══╝██╔════╝██╔════╝ ██╔═══██╗');
  console.log('   ███████╗   ██║   █████╗  ██║  ███╗██║   ██║');
  console.log('   ╚════██║   ██║   ██╔══╝  ██║   ██║██║   ██║');
  console.log('   ███████║   ██║   ███████╗╚██████╔╝╚██████╔╝');
  console.log('   ╚══════╝   ╚═╝   ╚══════╝ ╚═════╝  ╚═════╝ ');
  console.log('');
  console.log('   Steganography Robustness Research - JS Local');
  console.log('');
}

/**
 * Check if banner should be suppressed
 * @returns {boolean} True if banner should be suppressed
 */
function shouldSuppressBanner() {
  return process.env.SUPPRESS_ETHICS_BANNER === 'true' ||
         process.argv.includes('--no-banner');
}

// Run banner if executed directly (not required as module)
if (require.main === module) {
  const bypass = process.argv.includes('--bypass');
  printBanner({ bypass });
}

module.exports = {
  printBanner,
  printCompactWarning,
  printLogo,
  shouldSuppressBanner,
  centerText
};
