"use client";

import { ethers } from "ethers";
import { RefObject, useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";

import { EnergyVaultABI } from "@/abi/EnergyVaultABI";
import { EnergyVaultAddresses } from "@/abi/EnergyVaultAddresses";

export interface EnergyRecord {
  id: string;
  type: "generation" | "consumption";
  source: string;
  value: number;
  timestamp: Date;
  isEncrypted: boolean;
}

type EnergyVaultInfo = {
  abi: typeof EnergyVaultABI.abi;
  address?: `0x${string}`;
  chainId?: number;
  chainName?: string;
};

function getEnergyVaultByChainId(chainId: number | undefined): EnergyVaultInfo {
  if (!chainId) {
    return { abi: EnergyVaultABI.abi };
  }

  const entry =
    EnergyVaultAddresses[chainId.toString() as keyof typeof EnergyVaultAddresses];

  if (!entry || !("address" in entry) || entry.address === ethers.ZeroAddress) {
    return { abi: EnergyVaultABI.abi, chainId };
  }

  return {
    address: entry.address as `0x${string}`,
    chainId: entry.chainId ?? chainId,
    chainName: entry.chainName,
    abi: EnergyVaultABI.abi,
  };
}

export const useEnergyVault = (parameters: {
  instance: FhevmInstance | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  eip1193Provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<(ethersSigner: ethers.JsonRpcSigner | undefined) => boolean>;
}) => {
  const {
    instance,
    fhevmDecryptionSignatureStorage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  } = parameters;

  const [isLoading, setIsLoading] = useState(false);
  const [records, setRecords] = useState<EnergyRecord[]>([]);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptingId, setDecryptingId] = useState<string | null>(null);
  const [totalGeneration, setTotalGeneration] = useState(0);
  const [totalConsumption, setTotalConsumption] = useState(0);
  const [message, setMessage] = useState("");
  const [isListening, setIsListening] = useState(false);

  const energyVaultRef = useRef<EnergyVaultInfo | undefined>(undefined);
  const isLoadingRef = useRef<boolean>(isLoading);
  const isDecryptingRef = useRef<boolean>(isDecrypting);
  const contractRef = useRef<ethers.Contract | null>(null);

  const energyVault = useMemo(() => {
    const c = getEnergyVaultByChainId(chainId);
    energyVaultRef.current = c;
    if (!c.address) {
      setMessage(`EnergyVault deployment not found for chainId=${chainId}.`);
    }
    return c;
  }, [chainId]);

  const isDeployed = useMemo(() => {
    if (!energyVault) return undefined;
    return Boolean(energyVault.address) && energyVault.address !== ethers.ZeroAddress;
  }, [energyVault]);

  const canCreateRecord = useMemo(() => {
    return (
      !!energyVault.address &&
      !!instance &&
      !!ethersSigner &&
      !isLoading
    );
  }, [energyVault.address, instance, ethersSigner, isLoading]);

  // Create a new energy record - returns record ID on success
  const createRecord = useCallback(
    async (type: "generation" | "consumption", source: string, value: number): Promise<string | null> => {
      if (isLoadingRef.current) return null;
      if (!energyVault.address || !instance || !ethersSigner) {
        toast.error("Wallet not connected or contract not deployed");
        return null;
      }
      if (!Number.isFinite(value) || value < 0) {
        toast.error("Invalid value");
        return null;
      }
      if (value > 0xffffffff) {
        toast.error("Value must fit in uint32");
        return null;
      }

      const thisChainId = chainId;
      const thisAddress = energyVault.address;
      const thisSigner = ethersSigner;
      const contract = new ethers.Contract(thisAddress, energyVault.abi, thisSigner);

      isLoadingRef.current = true;
      setIsLoading(true);
      setMessage("Encrypting and submitting record...");

      await new Promise((r) => setTimeout(r, 100));

      const isStale = () =>
        thisAddress !== energyVaultRef.current?.address ||
        !sameChain.current(thisChainId) ||
        !sameSigner.current(thisSigner);

      try {
        const input = instance.createEncryptedInput(thisAddress, thisSigner.address);
        input.add32(Math.round(value * 10)); // Store with 1 decimal precision
        const enc = await input.encrypt();

        if (isStale()) {
          setMessage("Ignore createRecord - stale");
          return null;
        }

        const method = type === "generation" ? "createGenerationRecord" : "createConsumptionRecord";
        const tx: ethers.TransactionResponse = await contract[method](
          source,
          enc.handles[0],
          enc.inputProof
        );
        setMessage(`Waiting tx ${tx.hash}...`);
        toast.info("Transaction submitted, waiting for confirmation...");
        const receipt = await tx.wait();

        if (isStale()) {
          setMessage("Ignore createRecord - stale");
          return null;
        }

        // Parse RecordCreated event to get the record ID
        let recordId: string | null = null;
        if (receipt && receipt.logs) {
          console.log("[useEnergyVault] Parsing logs for RecordCreated event, logs count:", receipt.logs.length);
          for (const log of receipt.logs) {
            try {
              const parsed = contract.interface.parseLog({
                topics: log.topics as string[],
                data: log.data,
              });
              console.log("[useEnergyVault] Parsed log:", parsed?.name, parsed?.args);
              if (parsed && parsed.name === "RecordCreated") {
                recordId = parsed.args.id.toString();
                console.log("[useEnergyVault] Found RecordCreated event, recordId:", recordId);
                break;
              }
            } catch {
              // Not our event, skip
            }
          }
        }
        
        if (!recordId) {
          console.warn("[useEnergyVault] RecordCreated event not found in logs");
        }

        setMessage("Record created successfully");
        toast.success(`${type === "generation" ? "Generation" : "Consumption"} record created!`);

        // Update local totals
        if (type === "generation") {
          setTotalGeneration((prev) => prev + value);
        } else {
          setTotalConsumption((prev) => prev + value);
        }

        return recordId;
      } catch (e: unknown) {
        const s = String(e ?? "");
        if (s.includes("Failed to fetch") || s.includes("code\": -32603")) {
          setMessage("createRecord failed: Wallet RPC unreachable.");
          toast.error("Wallet RPC unreachable. Please check your network.");
        } else {
          setMessage("createRecord failed: " + s);
          toast.error("Failed to create record: " + s);
        }
        return null;
      } finally {
        isLoadingRef.current = false;
        setIsLoading(false);
      }
    },
    [ethersSigner, energyVault.address, energyVault.abi, instance, chainId, sameChain, sameSigner]
  );

  const canDecrypt = useMemo(() => {
    return (
      !!energyVault.address &&
      !!instance &&
      !!ethersSigner &&
      !isLoading &&
      !isDecrypting
    );
  }, [energyVault.address, instance, ethersSigner, isLoading, isDecrypting]);

  // Decrypt a record value
  const decryptRecord = useCallback(
    async (recordId: string): Promise<number | null> => {
      if (isDecryptingRef.current) return null;
      if (!energyVault.address || !instance || !ethersSigner) {
        toast.error("Wallet not connected or contract not deployed");
        return null;
      }

      const thisChainId = chainId;
      const thisAddress = energyVault.address;
      const thisSigner = ethersSigner;
      // IMPORTANT: Must use signer (not readonly provider) for getRecordEncryptedValue
      // because the contract checks msg.sender == record.owner
      const contract = new ethers.Contract(thisAddress, energyVault.abi, thisSigner);

      isDecryptingRef.current = true;
      setIsDecrypting(true);
      setDecryptingId(recordId);
      setMessage("Decrypting record...");

      console.log("[useEnergyVault] Decrypting record:", recordId, "from address:", thisSigner.address);

      try {
        const isStale = () =>
          thisAddress !== energyVaultRef.current?.address ||
          !sameChain.current(thisChainId) ||
          !sameSigner.current(thisSigner);

        // Get the encrypted handle from contract
        // Convert recordId to BigInt for the contract call
        const recordIdBigInt = BigInt(recordId);
        console.log("[useEnergyVault] Calling getRecordEncryptedValue with recordId:", recordIdBigInt);
        const encryptedHandle = await contract.getRecordEncryptedValue(recordIdBigInt);

        if (isStale()) {
          setMessage("Ignore decrypt - stale");
          return null;
        }

        const sig: FhevmDecryptionSignature | null =
          await FhevmDecryptionSignature.loadOrSign(
            instance,
            [thisAddress],
            thisSigner,
            fhevmDecryptionSignatureStorage
          );

        if (!sig) {
          setMessage("Unable to build FHEVM decryption signature");
          toast.error("Unable to build decryption signature");
          return null;
        }

        if (isStale()) {
          setMessage("Ignore decrypt - stale");
          return null;
        }

        const res = await instance.userDecrypt(
          [{ handle: encryptedHandle, contractAddress: thisAddress }],
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        );

        if (isStale()) {
          setMessage("Ignore decrypt - stale");
          return null;
        }

        const rawValue = res[encryptedHandle];
        if (rawValue === undefined || rawValue === null) {
          throw new Error("Decryption returned undefined value");
        }
        
        const decryptedValue = Number(rawValue as bigint) / 10;
        if (isNaN(decryptedValue) || decryptedValue < 0) {
          throw new Error("Invalid decrypted value");
        }
        
        setMessage(`Record decrypted: ${decryptedValue} kWh`);
        toast.success("Record decrypted successfully!");
        return decryptedValue;
      } catch (e: unknown) {
        console.error("[useEnergyVault] Decrypt error:", e);
        const errorMessage = e instanceof Error ? e.message : String(e ?? "Unknown error");
        
        if (errorMessage.includes("user rejected")) {
          setMessage("Decryption cancelled by user");
          toast.error("Decryption was cancelled");
        } else if (errorMessage.includes("Not record owner")) {
          setMessage("Access denied - not record owner");
          toast.error("You don't have permission to decrypt this record");
        } else if (errorMessage.includes("Record does not exist")) {
          setMessage("Record not found");
          toast.error("The requested record does not exist");
        } else {
          setMessage("Decrypt failed: " + errorMessage);
          toast.error("Failed to decrypt: " + errorMessage);
        }
        return null;
      } finally {
        isDecryptingRef.current = false;
        setIsDecrypting(false);
        setDecryptingId(null);
      }
    },
    [
      fhevmDecryptionSignatureStorage,
      ethersSigner,
      energyVault.address,
      energyVault.abi,
      instance,
      chainId,
      sameChain,
      sameSigner,
    ]
  );

  // Event listener setup
  const setupEventListeners = useCallback(() => {
    if (!energyVault.address || !ethersReadonlyProvider || isListening) {
      return;
    }

    const contract = new ethers.Contract(
      energyVault.address,
      energyVault.abi,
      ethersReadonlyProvider
    );

    contractRef.current = contract;
    setIsListening(true);

    // Listen for RecordCreated events
    contract.on("RecordCreated", (id, owner, recordType, source, timestamp) => {
      console.log("[useEnergyVault] RecordCreated event:", { id, owner, recordType, source, timestamp });
      
      // Only add records for the current user
      if (ethersSigner && owner.toLowerCase() === ethersSigner.address.toLowerCase()) {
        const newRecord: EnergyRecord = {
          id: id.toString(),
          type: recordType === 0 ? "generation" : "consumption",
          source,
          value: 0, // Will be decrypted later if needed
          timestamp: new Date(Number(timestamp) * 1000),
          isEncrypted: true,
        };
        
        setRecords(prev => {
          // Avoid duplicates
          if (prev.some(r => r.id === newRecord.id)) {
            return prev;
          }
          return [...prev, newRecord];
        });
      }
    });

    return () => {
      contract.removeAllListeners();
      setIsListening(false);
    };
  }, [energyVault.address, energyVault.abi, ethersReadonlyProvider, ethersSigner, isListening]);

  // Cleanup event listeners on unmount
  const cleanupEventListeners = useCallback(() => {
    if (contractRef.current) {
      contractRef.current.removeAllListeners();
      contractRef.current = null;
      setIsListening(false);
    }
  }, []);

  return {
    contractAddress: energyVault.address,
    isDeployed,
    isLoading,
    isDecrypting,
    decryptingId,
    canCreateRecord,
    canDecrypt,
    createRecord,
    decryptRecord,
    totalGeneration,
    totalConsumption,
    message,
    records,
    setupEventListeners,
    cleanupEventListeners,
    isListening,
  };
};
