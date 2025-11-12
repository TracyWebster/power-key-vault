import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const CONTRACT_NAMES = ["FHECounter", "EnergyVault"];

// <root>/packages/fhevm-hardhat-template
const rel = "..";

// <root>/packages/site/components
const outdir = path.resolve("./abi");

if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir);
}

const dir = path.resolve(rel);
const dirname = path.basename(dir);

const line =
  "\n===================================================================\n";

if (!fs.existsSync(dir)) {
  console.error(
    `${line}Unable to locate ${rel}. Expecting <root>/packages/${dirname}${line}`
  );
  process.exit(1);
}

if (!fs.existsSync(outdir)) {
  console.error(`${line}Unable to locate ${outdir}.${line}`);
  process.exit(1);
}

const deploymentsDir = path.join(dir, "deployments");

function deployOnHardhatNode() {
  if (process.platform === "win32") {
    // Not supported on Windows
    return;
  }
  try {
    execSync(`./deploy-hardhat-node.sh`, {
      cwd: path.resolve("./scripts"),
      stdio: "inherit",
    });
  } catch (e) {
    console.error(`${line}Script execution failed: ${e}${line}`);
    process.exit(1);
  }
}

function readDeployment(chainName, chainId, contractName, optional) {
  const chainDeploymentDir = path.join(deploymentsDir, chainName);

  if (!fs.existsSync(chainDeploymentDir) && chainId === 31337) {
    // Try to auto-deploy the contract on hardhat node!
    deployOnHardhatNode();
  }

  if (!fs.existsSync(chainDeploymentDir)) {
    if (!optional) {
      console.error(
        `${line}Unable to locate '${chainDeploymentDir}' directory.\n\n1. Goto '${dirname}' directory\n2. Run 'npx hardhat deploy --network ${chainName}'.${line}`
      );
      process.exit(1);
    }
    return undefined;
  }

  const contractFile = path.join(chainDeploymentDir, `${contractName}.json`);
  if (!fs.existsSync(contractFile)) {
    if (!optional) {
      console.error(
        `${line}Unable to locate '${contractFile}'.\n\n1. Goto '${dirname}' directory\n2. Run 'npx hardhat deploy --network ${chainName}'.${line}`
      );
      process.exit(1);
    }
    return undefined;
  }

  const jsonString = fs.readFileSync(contractFile, "utf-8");

  const obj = JSON.parse(jsonString);
  obj.chainId = chainId;

  return obj;
}

// Process each contract
for (const CONTRACT_NAME of CONTRACT_NAMES) {
  console.log(`\nProcessing ${CONTRACT_NAME}...`);

  // Auto deployed on Linux/Mac (will fail on windows)
  const deployLocalhost = readDeployment("localhost", 31337, CONTRACT_NAME, true /* optional */);

  // Sepolia is optional
  let deploySepolia = readDeployment("sepolia", 11155111, CONTRACT_NAME, true /* optional */);
  
  // Skip if neither deployment exists
  if (!deployLocalhost && !deploySepolia) {
    console.log(`Skipping ${CONTRACT_NAME} - no deployments found`);
    continue;
  }

  // Use localhost ABI as base, or sepolia if localhost not available
  const baseDeployment = deployLocalhost || deploySepolia;
  
  if (!deploySepolia) {
    deploySepolia = { abi: baseDeployment.abi, address: "0x0000000000000000000000000000000000000000" };
  }
  
  const finalLocalhost = deployLocalhost || { abi: baseDeployment.abi, address: "0x0000000000000000000000000000000000000000" };

  const tsCode = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}ABI = ${JSON.stringify({ abi: baseDeployment.abi }, null, 2)} as const;
`;

  const tsAddresses = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}Addresses = { 
  "11155111": { address: "${deploySepolia.address}", chainId: 11155111, chainName: "sepolia" },
  "31337": { address: "${finalLocalhost.address}", chainId: 31337, chainName: "hardhat" },
};
`;

  // Also write JSON file for dynamic loading
  const jsonData = {
    address: finalLocalhost.address,
    abi: baseDeployment.abi,
    addresses: {
      "11155111": deploySepolia.address,
      "31337": finalLocalhost.address,
    }
  };

  console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}ABI.ts`)}`);
  console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}Addresses.ts`)}`);
  console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}.json`)}`);

  fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}ABI.ts`), tsCode, "utf-8");
  fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}Addresses.ts`), tsAddresses, "utf-8");
  fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}.json`), JSON.stringify(jsonData, null, 2), "utf-8");
}

console.log("\nABI generation complete!");
