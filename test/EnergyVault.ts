import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { EnergyVault, EnergyVault__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("EnergyVault")) as EnergyVault__factory;
  const energyVaultContract = (await factory.deploy()) as EnergyVault;
  const energyVaultContractAddress = await energyVaultContract.getAddress();

  return { energyVaultContract, energyVaultContractAddress };
}

describe("EnergyVault", function () {
  let signers: Signers;
  let energyVaultContract: EnergyVault;
  let energyVaultContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ energyVaultContract, energyVaultContractAddress } = await deployFixture());
  });

  it("should have zero records after deployment", async function () {
    const totalRecords = await energyVaultContract.getTotalRecords();
    expect(totalRecords).to.eq(0);
  });

  it("should create a generation record", async function () {
    const clearValue = 100; // 100 kWh
    const source = "Solar Panel";

    // Encrypt the value
    const encryptedValue = await fhevm
      .createEncryptedInput(energyVaultContractAddress, signers.alice.address)
      .add32(clearValue)
      .encrypt();

    // Create generation record
    const tx = await energyVaultContract
      .connect(signers.alice)
      .createGenerationRecord(source, encryptedValue.handles[0], encryptedValue.inputProof);
    await tx.wait();

    // Verify record was created
    const totalRecords = await energyVaultContract.getTotalRecords();
    expect(totalRecords).to.eq(1);

    // Check user record IDs
    const userRecordIds = await energyVaultContract.getUserRecordIds(signers.alice.address);
    expect(userRecordIds.length).to.eq(1);
    expect(userRecordIds[0]).to.eq(0);

    // Check record metadata
    const metadata = await energyVaultContract.getRecordMetadata(0);
    expect(metadata.id).to.eq(0);
    expect(metadata.recordType).to.eq(0); // GENERATION
    expect(metadata.source).to.eq(source);
    expect(metadata.owner).to.eq(signers.alice.address);
  });

  it("should create a consumption record", async function () {
    const clearValue = 50; // 50 kWh
    const source = "Home Usage";

    // Encrypt the value
    const encryptedValue = await fhevm
      .createEncryptedInput(energyVaultContractAddress, signers.alice.address)
      .add32(clearValue)
      .encrypt();

    // Create consumption record
    const tx = await energyVaultContract
      .connect(signers.alice)
      .createConsumptionRecord(source, encryptedValue.handles[0], encryptedValue.inputProof);
    await tx.wait();

    // Verify record was created
    const totalRecords = await energyVaultContract.getTotalRecords();
    expect(totalRecords).to.eq(1);

    // Check record metadata
    const metadata = await energyVaultContract.getRecordMetadata(0);
    expect(metadata.id).to.eq(0);
    expect(metadata.recordType).to.eq(1); // CONSUMPTION
    expect(metadata.source).to.eq(source);
  });

  it("should decrypt record value for owner", async function () {
    const clearValue = 150;
    const source = "Wind Turbine";

    // Encrypt and create record
    const encryptedValue = await fhevm
      .createEncryptedInput(energyVaultContractAddress, signers.alice.address)
      .add32(clearValue)
      .encrypt();

    const tx = await energyVaultContract
      .connect(signers.alice)
      .createGenerationRecord(source, encryptedValue.handles[0], encryptedValue.inputProof);
    await tx.wait();

    // Get encrypted value
    const encryptedRecordValue = await energyVaultContract
      .connect(signers.alice)
      .getRecordEncryptedValue(0);

    // Decrypt the value
    const decryptedValue = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedRecordValue,
      energyVaultContractAddress,
      signers.alice,
    );

    expect(decryptedValue).to.eq(clearValue);
  });

  it("should aggregate generation totals correctly", async function () {
    const values = [100, 200, 50];
    const expectedTotal = values.reduce((a, b) => a + b, 0);

    // Create multiple generation records
    for (const value of values) {
      const encryptedValue = await fhevm
        .createEncryptedInput(energyVaultContractAddress, signers.alice.address)
        .add32(value)
        .encrypt();

      const tx = await energyVaultContract
        .connect(signers.alice)
        .createGenerationRecord("Solar", encryptedValue.handles[0], encryptedValue.inputProof);
      await tx.wait();
    }

    // Get encrypted total
    const encryptedTotal = await energyVaultContract
      .connect(signers.alice)
      .getTotalGeneration(signers.alice.address);

    // Decrypt and verify
    const decryptedTotal = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedTotal,
      energyVaultContractAddress,
      signers.alice,
    );

    expect(decryptedTotal).to.eq(expectedTotal);
  });

  it("should aggregate consumption totals correctly", async function () {
    const values = [30, 70, 100];
    const expectedTotal = values.reduce((a, b) => a + b, 0);

    // Create multiple consumption records
    for (const value of values) {
      const encryptedValue = await fhevm
        .createEncryptedInput(energyVaultContractAddress, signers.alice.address)
        .add32(value)
        .encrypt();

      const tx = await energyVaultContract
        .connect(signers.alice)
        .createConsumptionRecord("Home", encryptedValue.handles[0], encryptedValue.inputProof);
      await tx.wait();
    }

    // Get encrypted total
    const encryptedTotal = await energyVaultContract
      .connect(signers.alice)
      .getTotalConsumption(signers.alice.address);

    // Decrypt and verify
    const decryptedTotal = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedTotal,
      energyVaultContractAddress,
      signers.alice,
    );

    expect(decryptedTotal).to.eq(expectedTotal);
  });

  it("should not allow non-owner to access encrypted value", async function () {
    const clearValue = 100;

    // Alice creates a record
    const encryptedValue = await fhevm
      .createEncryptedInput(energyVaultContractAddress, signers.alice.address)
      .add32(clearValue)
      .encrypt();

    const tx = await energyVaultContract
      .connect(signers.alice)
      .createGenerationRecord("Solar", encryptedValue.handles[0], encryptedValue.inputProof);
    await tx.wait();

    // Bob tries to access Alice's record
    await expect(
      energyVaultContract.connect(signers.bob).getRecordEncryptedValue(0)
    ).to.be.revertedWith("Not record owner");
  });

  it("should correctly report record ownership", async function () {
    const encryptedValue = await fhevm
      .createEncryptedInput(energyVaultContractAddress, signers.alice.address)
      .add32(100)
      .encrypt();

    const tx = await energyVaultContract
      .connect(signers.alice)
      .createGenerationRecord("Solar", encryptedValue.handles[0], encryptedValue.inputProof);
    await tx.wait();

    // Check ownership
    expect(await energyVaultContract.isRecordOwner(0, signers.alice.address)).to.be.true;
    expect(await energyVaultContract.isRecordOwner(0, signers.bob.address)).to.be.false;
  });
});
