/**
 * Create JSON ABI file for NFTTicket contract
 * Run this after compiling the contract
 */

const fs = require('fs');
const path = require('path');

// This script should be run after: npx hardhat compile
// It will copy the ABI from artifacts to a accessible location

const artifactPath = path.join(
  __dirname,
  '../artifacts/contracts/NFTTicket.sol/NFTTicket.json'
);

const destinationPath = path.join(
  __dirname,
  '../backend/src/abis/NFTTicket.json'
);

try {
  // Read artifact
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));
  
  // Extract ABI
  const abi = artifact.abi;
  
  // Ensure directory exists
  const abiDir = path.dirname(destinationPath);
  if (!fs.existsSync(abiDir)) {
    fs.mkdirSync(abiDir, { recursive: true });
  }
  
  // Write ABI
  fs.writeFileSync(destinationPath, JSON.stringify(abi, null, 2));
  
  console.log('✅ ABI file created at:', destinationPath);
  console.log(`📦 ABI contains ${abi.length} functions/events`);
  
} catch (error) {
  console.error('❌ Error creating ABI file:', error.message);
  process.exit(1);
}
