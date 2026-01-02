/**
 * NFTTicket Contract Deployment Script
 * Deploys NFTTicket contract to specified network
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting NFTTicket contract deployment...\n");

  // Get network info
  const network = await hre.ethers.provider.getNetwork();
  console.log(`📍 Network: ${network.name} (Chain ID: ${network.chainId})`);

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  const deployerBalance = await hre.ethers.provider.getBalance(deployer.address);
  
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`💰 Balance: ${hre.ethers.formatEther(deployerBalance)} ETH\n`);

  // Compile contracts
  console.log("Compiling contracts...");
  await hre.run("compile");
  console.log("✅ Contracts compiled\n");

  // Deploy NFTTicket contract
  console.log("Deploying NFTTicket contract...");
  const NFTTicket = await hre.ethers.getContractFactory("NFTTicket");
  const nftTicket = await NFTTicket.deploy();
  
  await nftTicket.waitForDeployment();
  const contractAddress = await nftTicket.getAddress();

  console.log(`✅ NFTTicket deployed to: ${contractAddress}\n`);

  // Get deployment receipt
  const deploymentTx = nftTicket.deploymentTransaction();
  if (deploymentTx) {
    const receipt = await deploymentTx.wait();
    console.log(`📊 Deployment Gas Used: ${receipt.gasUsed.toString()}`);
    console.log(`📦 Block Number: ${receipt.blockNumber}\n`);
  }

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId,
    contractAddress: contractAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    deploymentTx: deploymentTx?.hash || "N/A"
  };

  const deploymentDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  const deploymentFile = path.join(
    deploymentDir,
    `${network.name}-${Date.now()}.json`
  );
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log(`📝 Deployment info saved to: ${deploymentFile}\n`);

  // Update .env file
  const envPath = path.join(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf-8");
    
    const envKey = `NFT_TICKET_ADDRESS_${network.name.toUpperCase()}`;
    const envRegex = new RegExp(`^${envKey}=.*$`, "m");
    
    if (envRegex.test(envContent)) {
      envContent = envContent.replace(envRegex, `${envKey}=${contractAddress}`);
    } else {
      envContent += `\n${envKey}=${contractAddress}`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log(`📄 Updated .env with contract address\n`);
  }

  // Contract verification info
  console.log("═".repeat(50));
  console.log("CONTRACT DEPLOYMENT SUMMARY");
  console.log("═".repeat(50));
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Network: ${network.name}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log("═".repeat(50));

  console.log("\n✨ Deployment successful!\n");

  // Verification instructions
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("🔍 To verify the contract on block explorer, run:");
    console.log(`npx hardhat verify --network ${network.name} ${contractAddress}`);
  }

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
