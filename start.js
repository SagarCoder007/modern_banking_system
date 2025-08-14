#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏦 Banking System Startup Script');
console.log('================================');

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = !isProduction;

// Check if all dependencies are installed
function checkDependencies() {
  console.log('📦 Checking dependencies...');
  
  const rootNodeModules = fs.existsSync('node_modules');
  const backendNodeModules = fs.existsSync('backend/node_modules');
  const frontendNodeModules = fs.existsSync('frontend/node_modules');
  
  if (!rootNodeModules || !backendNodeModules || !frontendNodeModules) {
    console.log('⚠️  Missing dependencies. Installing...');
    console.log('⏳ Installing all dependencies...');
    execSync('npm run install:all', { stdio: 'inherit' });
    console.log('✅ All dependencies installed!');
  } else {
    console.log('✅ Dependencies already installed!');
  }
}

// Build frontend for production
function buildFrontend() {
  if (isProduction) {
    console.log('🏗️  Building frontend for production...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Frontend build completed!');
  }
}

// Start the appropriate mode
function startApplication() {
  if (isProduction) {
    console.log('🚀 Starting Banking System in PRODUCTION mode...');
    console.log('📍 Frontend + Backend served from:', `http://localhost:${process.env.PORT || 5000}`);
    
    // Start unified server
    const server = spawn('npm', ['start'], { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    
    server.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
    });
    
  } else {
    console.log('🚀 Starting Banking System in DEVELOPMENT mode...');
    console.log('📍 Backend API: http://localhost:5000');
    console.log('📍 Frontend: http://localhost:3000');
    
    // Start both backend and frontend
    const concurrently = spawn('npm', ['run', 'dev'], { stdio: 'inherit' });
    
    concurrently.on('close', (code) => {
      console.log(`Development servers exited with code ${code}`);
    });
  }
}

// Main execution
function main() {
  try {
    checkDependencies();
    buildFrontend();
    startApplication();
  } catch (error) {
    console.error('❌ Error starting Banking System:', error.message);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down Banking System...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down Banking System...');
  process.exit(0);
});

// Run the main function
main();