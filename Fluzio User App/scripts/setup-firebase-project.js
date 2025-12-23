#!/usr/bin/env node
/**
 * Firebase Project Setup Script
 * 
 * Automatically replaces YOUR_PROJECT_ID with actual Firebase project ID
 * Run: node scripts/setup-firebase-project.js YOUR_ACTUAL_PROJECT_ID
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const projectId = args[0];

if (!projectId || projectId === 'YOUR_PROJECT_ID') {
  console.error('❌ Error: Please provide a valid Firebase project ID');
  console.log('\nUsage: node scripts/setup-firebase-project.js YOUR_ACTUAL_PROJECT_ID');
  console.log('Example: node scripts/setup-firebase-project.js fluzio-production');
  process.exit(1);
}

console.log(`🔧 Setting up Firebase project: ${projectId}\n`);

// File to update
const configFile = path.join(__dirname, '../src/config/firebaseFunctions.ts');

try {
  // Read the file
  let content = fs.readFileSync(configFile, 'utf8');
  
  // Check if already configured
  if (!content.includes('YOUR_PROJECT_ID')) {
    console.log('✅ Project ID already configured!');
    console.log(`   Current project: ${content.match(/FIREBASE_PROJECT_ID = '(.+?)'/)[1]}`);
    process.exit(0);
  }
  
  // Replace the placeholder
  const updatedContent = content.replace(
    /const FIREBASE_PROJECT_ID = 'YOUR_PROJECT_ID';/,
    `const FIREBASE_PROJECT_ID = '${projectId}';`
  );
  
  // Write back
  fs.writeFileSync(configFile, updatedContent, 'utf8');
  
  console.log('✅ Successfully configured Firebase project ID!');
  console.log(`   File updated: ${configFile}`);
  console.log(`   Project ID: ${projectId}`);
  console.log('\n📋 Next steps:');
  console.log('   1. Build the frontend: npm run build');
  console.log('   2. Deploy functions: firebase deploy --only functions');
  console.log('   3. Deploy hosting: firebase deploy --only hosting');
  
} catch (error) {
  console.error('❌ Error updating configuration:', error.message);
  process.exit(1);
}
