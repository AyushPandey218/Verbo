
const concurrently = require('concurrently');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Run dependency check first
try {
  console.log('Checking dependencies before starting...');
  execSync('node ensure-deps.js', { stdio: 'inherit' });
} catch (e) {
  console.error('Failed to check dependencies:', e.message);
  console.error('Attempting to install critical dependencies directly...');
  try {
    execSync('npm install vite @vitejs/plugin-react-swc react react-dom @types/react @types/react-dom --save-dev', { stdio: 'inherit' });
    console.log('Critical dependencies installed successfully!');
  } catch (installError) {
    console.error('Failed to install critical dependencies:', installError.message);
    process.exit(1);
  }
}

const PORT = process.env.PORT || 3000;

// Check if vite is accessible via npx or fallback to direct executable
const viteCommand = 'node run-vite.js';

concurrently([
  {
    command: viteCommand,
    name: 'frontend',
    prefixColor: 'blue',
    env: { PORT: process.env.PORT || '5173' }
  },
  {
    command: 'node server/server.js',
    name: 'backend',
    prefixColor: 'green',
    env: { PORT }
  }
], {
  prefix: 'name',
  killOthers: ['failure', 'success'],
}).then(
  () => console.log('All processes exited successfully'),
  (err) => console.error('Error running processes:', err)
);
