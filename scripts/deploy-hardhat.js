// Load environment variables FIRST, before anything else
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function deployToHedera() {
  console.log("--- Deploying EscrowContract to Hedera Network ---\n");

  const {
    Client,
    PrivateKey,
    ContractCreateFlow,
    ContractFunctionParameters,
    Hbar,
  } = require("@hashgraph/sdk");

  // Validate environment variables with better error messages
  const myAccountId = process.env.MY_ACCOUNT_ID;
  const myPrivateKey = process.env.MY_PRIVATE_KEY;
  const networkName = hre.network.name;
  
  // Determine network from Hardhat config name
  let network = 'testnet';
  if (networkName.includes('mainnet')) {
    network = 'mainnet';
  } else if (networkName.includes('previewnet')) {
    network = 'previewnet';
  }

  // Better error handling
  if (!myAccountId) {
    console.error("\n❌ Error: MY_ACCOUNT_ID is not set!");
    console.error("   Please check your .env file and ensure MY_ACCOUNT_ID is defined.");
    console.error(`   Current value: ${myAccountId}`);
    console.error(`   .env file location: ${path.join(__dirname, "../.env")}`);
    throw new Error("MY_ACCOUNT_ID must be set in your .env file for Hedera deployment.");
  }

  if (!myPrivateKey) {
    console.error("\n❌ Error: MY_PRIVATE_KEY is not set!");
    console.error("   Please check your .env file and ensure MY_PRIVATE_KEY is defined.");
    console.error(`   Current value: ${myPrivateKey ? "***" + myPrivateKey.slice(-10) : "undefined"}`);
    console.error(`   .env file location: ${path.join(__dirname, "../.env")}`);
    throw new Error("MY_PRIVATE_KEY must be set in your .env file for Hedera deployment.");
  }

  // Strip quotes if present (dotenv should handle this, but just in case)
  const cleanAccountId = myAccountId.replace(/^["']|["']$/g, '');
  const cleanPrivateKey = myPrivateKey.replace(/^["']|["']$/g, '');

  if (!cleanAccountId || !cleanPrivateKey) {
    throw new Error(
      "MY_ACCOUNT_ID and MY_PRIVATE_KEY must have valid values in your .env file for Hedera deployment."
    );
  }

  // Configure Hedera client
  let client;
  if (network === "mainnet") {
    client = Client.forMainnet();
  } else if (network === "previewnet") {
    client = Client.forPreviewnet();
  } else {
    client = Client.forTestnet();
  }

  client.setOperator(cleanAccountId, PrivateKey.fromString(cleanPrivateKey));
  client.setDefaultMaxTransactionFee(new Hbar(100));

  console.log(`Using account: ${cleanAccountId} on ${network}\n`);

  try {
    // Get bytecode from Hardhat compilation artifacts
    const artifactPath = path.join(
      __dirname,
      "../artifacts/contracts/EscrowContract.sol/EscrowContract.json"
    );

    if (!fs.existsSync(artifactPath)) {
      throw new Error(
        "Contract artifact not found. Please run 'npm run compile' first."
      );
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const bytecode = artifact.bytecode;

    if (!bytecode || bytecode === "0x") {
      throw new Error("Bytecode not found in artifact. Please compile the contract first.");
    }

    console.log(`Bytecode loaded (length: ${bytecode.length} characters)\n`);
    console.log("Deploying contract to Hedera...");
    console.log("This may take 30-60 seconds...\n");

    // Deploy using Hedera SDK
    // Note: Hedera has a maximum gas limit, but we need enough for contract creation
    // Large contracts may need more gas - try increasing if you get INSUFFICIENT_GAS
    const contractTx = new ContractCreateFlow()
      .setBytecode(bytecode)
      .setGas(5000000) // Increased gas for contract creation (max is typically 15M)
      .setConstructorParameters(new ContractFunctionParameters()) // No constructor parameters
      .setAdminKey(PrivateKey.fromString(cleanPrivateKey).publicKey)
      .setContractMemo("Agbejo Escrow Contract");

    const txResponse = await contractTx.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const contractId = receipt.contractId;

    if (!contractId) {
      throw new Error("Failed to deploy contract, no contract ID returned.");
    }

    const contractAddress = contractId.toSolidityAddress();

    console.log("\n✅ Contract deployed successfully!");
    console.log(`Contract ID: ${contractId.toString()}`);
    console.log(`Contract Address (EVM): ${contractAddress}\n`);

    // Verify contract deployment
    console.log("Verifying contract deployment...");
    try {
      const { ContractInfoQuery } = require("@hashgraph/sdk");
      const contractInfo = await new ContractInfoQuery()
        .setContractId(contractId)
        .execute(client);

      console.log(`✅ Contract verified!`);
      console.log(`   Admin Key: ${contractInfo.adminKey ? "Set" : "Not set"}`);
      console.log(`   Balance: ${contractInfo.balance.toTinybars()} tinybars`);
    } catch (err) {
      console.warn(
        "Could not verify contract (may need to wait a few seconds):",
        err.message
      );
    }

    const deploymentInfo = {
      network: network,
      contractId: contractId.toString(),
      contractAddress: contractAddress,
      deployer: cleanAccountId,
      timestamp: new Date().toISOString(),
    };

    console.log("\nDeployment Info:");
    console.log(JSON.stringify(deploymentInfo, null, 2));

    console.log("\n*** ACTION REQUIRED ***");
    console.log("Please add these to your .env file:");
    console.log(`CONTRACT_ID=${contractId.toString()}`);
    console.log(`NEXT_PUBLIC_CONTRACT_ID=${contractId.toString()}`);
    console.log(`CONTRACT_ADDRESS=${contractAddress}`);
    console.log("***********************\n");

    return { contractId: contractId.toString(), contractAddress };
  } finally {
    client.close();
    console.log("Client connection closed.");
  }
}

async function deployToLocalHardhat() {
  console.log("--- Deploying EscrowContract to Local Hardhat Network ---\n");

  // Get the contract factory
  const EscrowContract = await hre.ethers.getContractFactory("EscrowContract");

  // Deploy the contract
  console.log("Deploying contract...");
  const escrowContract = await EscrowContract.deploy();

  // Wait for deployment
  await escrowContract.waitForDeployment();

  const contractAddress = await escrowContract.getAddress();

  // Get deployer address
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();

  console.log("\n✅ Contract deployed successfully!");
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Deployer: ${deployerAddress}\n`);

  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deployer: deployerAddress,
    timestamp: new Date().toISOString(),
  };

  console.log("Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  console.log("\n*** ACTION REQUIRED ***");
  console.log("Please add this to your .env file:");
  console.log(`CONTRACT_ADDRESS=${contractAddress}`);
  console.log("***********************\n");

  return { contractAddress, deployer: deployerAddress };
}

async function main() {
  const networkName = hre.network.name;

  // Check if deploying to Hedera network
  if (networkName.includes("hedera")) {
    await deployToHedera();
  } else {
    // Deploy to local Hardhat network
    await deployToLocalHardhat();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });

