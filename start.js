
const concurrently = require('concurrently');
const path = require('path');

const PORT = process.env.PORT || 3000;

concurrently([
  {
    command: 'vite',
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
