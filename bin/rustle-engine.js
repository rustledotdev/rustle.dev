#!/usr/bin/env node

const { runRustleEngine } = require('../dist/cli/rustleEngine.js');

// Parse command line arguments
const args = process.argv.slice(2);
const config = {};

// Simple argument parsing
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--debug') {
    config.debug = true;
  } else if (arg === '--src' && args[i + 1]) {
    config.srcDir = args[i + 1];
    i++;
  } else if (arg === '--output' && args[i + 1]) {
    config.outputDir = args[i + 1];
    i++;
  } else if (arg === '--source-lang' && args[i + 1]) {
    config.sourceLanguage = args[i + 1];
    i++;
  } else if (arg === '--target-langs' && args[i + 1]) {
    config.targetLanguages = args[i + 1].split(',');
    i++;
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
RustleEngine CLI - Automatic translation extraction

Usage: rustle-engine [options]

Options:
  --src <dir>              Source directory (default: ./src)
  --output <dir>           Output directory (default: ./public/rustle)
  --source-lang <lang>     Source language (default: en)
  --target-langs <langs>   Target languages, comma-separated (default: es,fr,de,it,pt)
  --debug                  Enable debug output
  --help, -h               Show this help message

Examples:
  rustle-engine
  rustle-engine --debug
  rustle-engine --src ./app --output ./public/translations
  rustle-engine --source-lang en --target-langs es,fr,de
`);
    process.exit(0);
  }
}

// Run the engine
runRustleEngine(config).catch(error => {
  console.error('Failed to run RustleEngine:', error);
  process.exit(1);
});
