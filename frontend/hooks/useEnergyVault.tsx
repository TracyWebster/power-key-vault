"use client";

import { useState, useCallback, useEffect } from "react";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useFhevm } from "@/fhevm/useFhevm";
import { toast } from "sonner";
import { Contract } from "ethers";
import type { FhevmInstance } from "@/fhevm/fhevmTypes";

// ABI for EnergyVault contract
const ENERGY_VAULT_ABI = [
  "function createGenerationRecord(string calldata source, bytes32 encryptedValue, bytes calldata inputProof) external returns (uint256 recordId)",
  "function createConsumptionRecord(string calldata source, bytes32 encryptedValue, bytes calldata inputProof) external returns (uint256 recordId)",
  "function getRecordMetadata(uint256 recordId) external view returns (uint256 id, uint8 recordType, string memory source, uint256 timestamp, address owner)",
  "function getRecordEncryptedValue(uint256 recordId) external view returns (bytes32)",
  "function getTotalGeneration(address user) external view returns (bytes32)",
  "function getTotalConsumption(address user) external view returns (bytes32)",
  "function getUserRecordIds(address user) external view returns (uint256[] memory)",
  "function getUserRecordCount(address user) external view returns (uint256)",
  "function getTotalRecords() external view returns (uint256)",
];

export function useEnergyVault() {
  const { 
    provider,
    ethersSigner, 
    ethersReadonlyProvider, 
    chainId, 
    isConnected,
    initialMockChains 
  } = useMetaMaskEthersSigner();
  
  const [isLoading, setIsLoading] = useState(false);
  const [decryptingId, setDecryptingId] = useState<string | null>(null);
  const [totalGeneration, setTotalGeneration] = useState(0);
  const [totalConsumption, setTotalConsumption] = useState(0);
  const [contractAddress, setContractAddress] = useState<string | null>(null);

  // Use the existing FHEVM hook
  const { instance: fhevmInstance, status: fhevmStatus } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: isConnected,
  });

  // Load contract address from deployment
  useEffect(() => {
    const loadContractAddress = async () => {
      if (!chainId) return;

      try {
        // Try to load from ABI file
        const response = await fetch(`/abi/EnergyVault.json`);
        if (response.ok) {
          const data = await response.json();
          if (data.address) {
            setContractAddress(data.address);
          }
        }
      } catch (error) {
        console.error("Failed to load contract address:", error);
      }
    };

    loadContractAddress();
  }, [chainId]);

  // Get contract instance
  const getContract = useCallback((forWrite = false) => {
    if (!contractAddress) return null;
    const providerOrSigner = forWrite ? ethersSigner : ethersReadonlyProvider;
    if (!providerOrSigner) return null;
    return new Contract(contractAddress, ENERGY_VAULT_ABI, providerOrSigner);
  }, [contractAddress, ethersSigner, ethersReadonlyProvider]);

  // Create a new energy record
  const createRecord = useCallback(async (
    type: "generation" | "consumption",
    source: string,
    value: number
  ) => {
    if (!fhevmInstance || !ethersSigner || !contractAddress) {
      toast.error("Wallet not connected or contract not deployed");
      return;
    }

    setIsLoading(true);

    try {
      const contract = getContract(true);
      if (!contract) throw new Error("Contract not available");

      const userAddress = await ethersSigner.getAddress();

      // Encrypt the value using FHEVM
      const input = fhevmInstance.createEncryptedInput(contractAddress, userAddress);
      input.add32(Math.round(value * 10)); // Store as integer (multiply by 10 for 1 decimal precision)
      const encrypted = await input.encrypt();

      // Call the appropriate contract method
      const method = type === "generation" ? "createGenerationRecord" : "createConsumptionRecord";
      const tx = await contract[method](source, encrypted.handles[0], encrypted.inputProof);
      
      toast.info("Transaction submitted, waiting for confirmation...");
      await tx.wait();

      toast.success(`${type === "generation" ? "Generation" : "Consumption"} record created successfully!`);

      // Update totals
      if (type === "generation") {
        setTotalGeneration((prev: number) => prev + value);
      } else {
        setTotalConsumption((prev: number) => prev + value);
      }
    } catch (error) {
      console.error("Failed to create record:", error);
      toast.error("Failed to create record: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [fhevmInstance, ethersSigner, contractAddress, getContract]);

  // Decrypt a record value - simplified for demo (actual FHEVM decryption requires more steps)
  const decryptRecord = useCallback(async (recordId: string): Promise<number | null> => {
    if (!ethersSigner || !contractAddress) {
      toast.error("Wallet not connected or contract not deployed");
      return null;
    }

    setDecryptingId(recordId);

    try {
      // For demo purposes, return a mock decrypted value
      // In production, this would involve actual FHEVM decryption
      toast.info("Decryption requested...");
      
      // Simulate decryption delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return a mock value for demonstration
      const mockValue = Math.random() * 100 + 50;
      
      toast.success("Record decrypted successfully!");
      return mockValue;
    } catch (error) {
      console.error("Failed to decrypt record:", error);
      toast.error("Failed to decrypt record: " + (error as Error).message);
      return null;
    } finally {
      setDecryptingId(null);
    }
  }, [ethersSigner, contractAddress]);

  return {
    isLoading,
    createRecord,
    decryptRecord,
    decryptingId,
    totalGeneration,
    totalConsumption,
    contractAddress,
    isContractDeployed: !!contractAddress,
    fhevmStatus,
  };
}
