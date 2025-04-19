
#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Checking if dependencies are installed...');

// List of critical dependencies to check
const criticalDeps = [
  'vite', 
  '@types/react', 
  '@types/react-dom', 
  'react', 
  'react-dom', 
  'react-router-dom', 
  '@tanstack/react-query',
  'lucide-react'
];

try {
  // Check if node_modules exists
  if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
    console.log('node_modules not found. Installing all dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    console.log('All dependencies installed successfully!');
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
      execSync(`npm install ${missingDeps.join(' ')}`, { stdio: 'inherit' });
      console.log('Missing dependencies installed successfully!');
    } else {
      console.log('All critical dependencies are already installed.');
    }
  }
} catch (error) {
  console.error('Error during dependency check:', error.message);
  process.exit(1);
}

console.log('You can now run the application with: npm run dev');
