
#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Checking if dependencies are installed...');

// List of critical dependencies to check
const criticalDeps = [
  'vite', 
  '@vitejs/plugin-react-swc', 
  '@types/react', 
  '@types/react-dom', 
  'react', 
  'react-dom', 
  'react-router-dom', 
  '@tanstack/react-query',
  'lucide-react',
  'date-fns',
  'socket.io-client'
];

try {
  // Check if node_modules exists
  if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
    console.log('node_modules not found. Installing all dependencies...');
    try {
      execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
      console.log('All dependencies installed successfully!');
    } catch (e) {
      console.error('Failed to install all dependencies. Trying individual installs...');
      criticalDeps.forEach(dep => {
        try {
          console.log(`Installing ${dep}...`);
          execSync(`npm install ${dep} --legacy-peer-deps`, { stdio: 'inherit' });
        } catch (err) {
          console.error(`Failed to install ${dep}: ${err.message}`);
        }
      });
    }
  } else {
    // Check for critical dependencies
    let missingDeps = [];
    
    criticalDeps.forEach(dep => {
      try {
        require.resolve(dep);
      } catch (e) {
        missingDeps.push(dep);
      }
    });
    
    if (missingDeps.length > 0) {
      console.log(`Missing critical dependencies: ${missingDeps.join(', ')}`);
      console.log('Installing missing dependencies...');
      missingDeps.forEach(dep => {
        try {
          console.log(`Installing ${dep}...`);
          execSync(`npm install ${dep} --legacy-peer-deps`, { stdio: 'inherit' });
        } catch (err) {
          console.error(`Failed to install ${dep}: ${err.message}`);
        }
      });
      console.log('Missing dependencies installation attempted.');
    } else {
      console.log('All critical dependencies are already installed.');
    }
  }
} catch (error) {
  console.error('Error during dependency check:', error.message);
  process.exit(1);
}

console.log('You can now run the application with: npm run dev');
