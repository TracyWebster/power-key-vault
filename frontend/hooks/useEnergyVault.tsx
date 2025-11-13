"use client";

import { ethers } from "ethers";
import { RefObject, useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";

import { EnergyVaultABI } from "@/abi/EnergyVaultABI";
import { EnergyVaultAddresses } from "@/abi/EnergyVaultAddresses";

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
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptingId, setDecryptingId] = useState<string | null>(null);
  const [totalGeneration, setTotalGeneration] = useState(0);
  const [totalConsumption, setTotalConsumption] = useState(0);
  const [message, setMessage] = useState<string>("");

  const energyVaultRef = useRef<EnergyVaultInfo | undefined>(undefined);
  const isLoadingRef = useRef<boolean>(false);
  const isDecryptingRef = useRef<boolean>(false);

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

  // Create a new energy record
  const createRecord = useCallback(
    async (type: "generation" | "consumption", source: string, value: number) => {
      if (isLoadingRef.current) return;
      if (!energyVault.address || !instance || !ethersSigner) {
        toast.error("Wallet not connected or contract not deployed");
        return;
      }
      if (!Number.isFinite(value) || value < 0) {
        toast.error("Invalid value");
        return;
      }
      if (value > 0xffffffff) {
        toast.error("Value must fit in uint32");
        return;
      }

      const thisChainId = chainId;
      const thisAddress = energyVault.address;
      const thisSigner = ethersSigner;
      const contract = new ethers.Contract(thisAddress, energyVault.abi, thisSigner);

      isLoadingRef.current = true;
      setIsLoading(true);
      setMessage("Encrypting and submitting record...");

      const run = async () => {
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
            return;
          }

          const method = type === "generation" ? "createGenerationRecord" : "createConsumptionRecord";
          const tx: ethers.TransactionResponse = await contract[method](
            source,
            enc.handles[0],
            enc.inputProof
          );
          setMessage(`Waiting tx ${tx.hash}...`);
          toast.info("Transaction submitted, waiting for confirmation...");
          await tx.wait();

          if (isStale()) {
            setMessage("Ignore createRecord - stale");
            return;
          }

          setMessage("Record created successfully");
          toast.success(`${type === "generation" ? "Generation" : "Consumption"} record created!`);

          // Update local totals
          if (type === "generation") {
            setTotalGeneration((prev) => prev + value);
          } else {
            setTotalConsumption((prev) => prev + value);
          }
        } catch (e: unknown) {
          const s = String(e ?? "");
          if (s.includes("Failed to fetch") || s.includes("code\": -32603")) {
            setMessage("createRecord failed: Wallet RPC unreachable.");
            toast.error("Wallet RPC unreachable. Please check your network.");
          } else {
            setMessage("createRecord failed: " + s);
            toast.error("Failed to create record: " + s);
          }
        } finally {
          isLoadingRef.current = false;
          setIsLoading(false);
        }
      };

      run();
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
      const contract = new ethers.Contract(thisAddress, energyVault.abi, ethersReadonlyProvider ?? thisSigner);

      isDecryptingRef.current = true;
      setIsDecrypting(true);
      setDecryptingId(recordId);
      setMessage("Decrypting record...");

      try {
        const isStale = () =>
          thisAddress !== energyVaultRef.current?.address ||
          !sameChain.current(thisChainId) ||
          !sameSigner.current(thisSigner);

        // Get the encrypted handle from contract
        const encryptedHandle = await contract.getRecordEncryptedValue(recordId);

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

        const decryptedValue = Number(res[encryptedHandle] as bigint) / 10;
        setMessage(`Record decrypted: ${decryptedValue} kWh`);
        toast.success("Record decrypted successfully!");
        return decryptedValue;
      } catch (e: unknown) {
        const s = String(e ?? "");
        setMessage("Decrypt failed: " + s);
        toast.error("Failed to decrypt: " + s);
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
      ethersReadonlyProvider,
      energyVault.address,
      energyVault.abi,
      instance,
      chainId,
      sameChain,
      sameSigner,
    ]
  );

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
  };
};
