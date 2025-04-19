
#!/usr/bin/env node

// This script directly executes Vite by requiring it
try {
  console.log('Starting Vite...');
  
  // First try to use the local installation
  try {
    require('./node_modules/vite/bin/vite.js');
  } catch (e) {
    console.log('Local Vite not found, trying global installation...');
    require('vite/bin/vite.js');
  }
} catch (error) {
  console.error('Failed to start Vite:', error.message);
  console.error('Make sure Vite is installed by running: npm install vite');
  console.error('Trying to automatically install required dependencies...');
  
  const { execSync } = require('child_process');
  try {
    execSync('node ensure-deps.js', { stdio: 'inherit' });
    console.log('Dependencies installed. Starting Vite again...');
    try {
      require('./node_modules/vite/bin/vite.js');
    } catch (e) {
      console.error('Still unable to start Vite:', e.message);
      process.exit(1);
    }
  } catch (e) {
    console.error('Failed to install dependencies:', e.message);
    process.exit(1);
  }
}
