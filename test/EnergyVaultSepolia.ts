import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, deployments } from "hardhat";
import { EnergyVault } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  alice: HardhatEthersSigner;
};

describe("EnergyVaultSepolia", function () {
  let signers: Signers;
  let energyVaultContract: EnergyVault;
  let energyVaultContractAddress: string;
  let step: number;
  let steps: number;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn(`This hardhat test suite can only run on Sepolia Testnet`);
      this.skip();
    }

    try {
      const EnergyVaultDeployment = await deployments.get("EnergyVault");
      energyVaultContractAddress = EnergyVaultDeployment.address;
      energyVaultContract = await ethers.getContractAt("EnergyVault", EnergyVaultDeployment.address);
    } catch (e) {
      (e as Error).message += ". Call 'npx hardhat deploy --network sepolia'";
      throw e;
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { alice: ethSigners[0] };
  });

  beforeEach(async () => {
    step = 0;
    steps = 0;
  });

  it("create and decrypt a generation record", async function () {
    steps = 8;
    this.timeout(4 * 60000);

    const clearValue = 100; // 100 kWh
    const source = "Solar Panel Test";

    progress("Encrypting energy value...");
    const encryptedValue = await fhevm
      .createEncryptedInput(energyVaultContractAddress, signers.alice.address)
      .add32(clearValue)
      .encrypt();

    progress(
      `Creating generation record: EnergyVault=${energyVaultContractAddress} handle=${ethers.hexlify(encryptedValue.handles[0])} signer=${signers.alice.address}...`,
    );
    const tx = await energyVaultContract
      .connect(signers.alice)
      .createGenerationRecord(source, encryptedValue.handles[0], encryptedValue.inputProof);
    await tx.wait();

    progress("Getting record metadata...");
    const metadata = await energyVaultContract.getRecordMetadata(0);
    expect(metadata.source).to.eq(source);
    expect(metadata.recordType).to.eq(0); // GENERATION

    progress("Getting encrypted record value...");
    const encryptedRecordValue = await energyVaultContract
      .connect(signers.alice)
      .getRecordEncryptedValue(0);
    expect(encryptedRecordValue).to.not.eq(ethers.ZeroHash);

    progress(`Decrypting record value=${encryptedRecordValue}...`);
    const decryptedValue = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedRecordValue,
      energyVaultContractAddress,
      signers.alice,
    );
    progress(`Decrypted value: ${decryptedValue}`);

    expect(decryptedValue).to.eq(clearValue);

    progress("Getting total generation...");
    const encryptedTotal = await energyVaultContract
      .connect(signers.alice)
      .getTotalGeneration(signers.alice.address);

    progress(`Decrypting total generation=${encryptedTotal}...`);
    const decryptedTotal = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedTotal,
      energyVaultContractAddress,
      signers.alice,
    );
    progress(`Decrypted total: ${decryptedTotal}`);

    // Total should be at least the value we just added
    expect(decryptedTotal).to.be.gte(clearValue);
  });

  it("create and decrypt a consumption record", async function () {
    steps = 8;
    this.timeout(4 * 60000);

    const clearValue = 50; // 50 kWh
    const source = "Home Usage Test";

    progress("Encrypting energy value...");
    const encryptedValue = await fhevm
      .createEncryptedInput(energyVaultContractAddress, signers.alice.address)
      .add32(clearValue)
      .encrypt();

    progress(
      `Creating consumption record: EnergyVault=${energyVaultContractAddress} handle=${ethers.hexlify(encryptedValue.handles[0])} signer=${signers.alice.address}...`,
    );
    const tx = await energyVaultContract
      .connect(signers.alice)
      .createConsumptionRecord(source, encryptedValue.handles[0], encryptedValue.inputProof);
    await tx.wait();

    progress("Getting user record count...");
    const recordCount = await energyVaultContract.getUserRecordCount(signers.alice.address);
    expect(recordCount).to.be.gte(1);

    progress("Getting user record IDs...");
    const recordIds = await energyVaultContract.getUserRecordIds(signers.alice.address);
    const latestRecordId = recordIds[recordIds.length - 1];

    progress("Getting record metadata...");
    const metadata = await energyVaultContract.getRecordMetadata(latestRecordId);
    expect(metadata.source).to.eq(source);
    expect(metadata.recordType).to.eq(1); // CONSUMPTION

    progress("Getting encrypted record value...");
    const encryptedRecordValue = await energyVaultContract
      .connect(signers.alice)
      .getRecordEncryptedValue(latestRecordId);

    progress(`Decrypting record value=${encryptedRecordValue}...`);
    const decryptedValue = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedRecordValue,
      energyVaultContractAddress,
      signers.alice,
    );
    progress(`Decrypted value: ${decryptedValue}`);

    expect(decryptedValue).to.eq(clearValue);
  });
});
