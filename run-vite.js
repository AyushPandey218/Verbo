
#!/usr/bin/env node

// This script directly executes Vite by requiring it
try {
  console.log('Starting Vite...');
  
  // First try to use the local installation
  try {
    require('./node_modules/vite/bin/vite.js');
  } catch (e) {
    console.log('Local Vite not found, trying to install it...');
    try {
      const { execSync } = require('child_process');
      console.log('Installing Vite and React plugin...');
      execSync('npm install vite@latest @vitejs/plugin-react-swc@latest --save-dev --legacy-peer-deps', { stdio: 'inherit' });
      console.log('Successfully installed Vite, trying to run it now...');
      require('./node_modules/vite/bin/vite.js');
    } catch (installError) {
      console.error('Failed to install or run Vite:', installError.message);
      console.error('Trying fallback global installation...');
      try {
        require('vite/bin/vite.js');
      } catch (globalError) {
        throw new Error('Unable to find or install Vite');
      }
    }
  }
} catch (error) {
  console.error('Failed to start Vite:', error.message);
  console.error('Make sure Vite is installed by running: npm install vite --save-dev');
  process.exit(1);
}
