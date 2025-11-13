"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Lock, Unlock } from "lucide-react";
import { EnergyMeter } from "@/components/EnergyMeter";
import { EnergyFooter } from "@/components/EnergyFooter";
import { CreateEnergyRecord, EnergyRecord } from "@/components/CreateEnergyRecord";
import { EnergyRecordsList } from "@/components/EnergyRecordsList";
import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useEnergyVault } from "@/hooks/useEnergyVault";
import Image from "next/image";

export default function Home() {
  const [isEncrypted, setIsEncrypted] = useState(true);
  const [energyRecords, setEnergyRecords] = useState<EnergyRecord[]>([]);

  // MetaMask and FHEVM setup
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  const {
    instance: fhevmInstance,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  // EnergyVault hook with all required parameters
  const energyVault = useEnergyVault({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const toggleEncryption = async () => {
    if (!isConnected) {
      return;
    }
    setIsEncrypted(!isEncrypted);
  };

  const handleRecordCreated = (record: EnergyRecord) => {
    setEnergyRecords([record, ...energyRecords]);
  };

  const handleCreateRecord = async (type: "generation" | "consumption", source: string, value: number): Promise<string | null> => {
    return await energyVault.createRecord(type, source, value);
  };

  const handleDecrypt = async (recordId: string): Promise<number | null> => {
    const decryptedValue = await energyVault.decryptRecord(recordId);
    if (decryptedValue !== null) {
      setEnergyRecords(records =>
        records.map(r =>
          r.id === recordId ? { ...r, value: decryptedValue, isEncrypted: false } : r
        )
      );
    }
    return decryptedValue;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero Section */}
      <header 
        className="relative bg-cover bg-center py-20 px-6"
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(/hero-bg.jpg)` 
        }}
      >
        {/* Wallet Connect Button - Top Right */}
        <div className="absolute top-4 right-4">
          <button
            onClick={connect}
            disabled={isConnected}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {isConnected ? `Connected (Chain ${chainId})` : "Connect Wallet"}
          </button>
        </div>

        <div className="container mx-auto">
          <div className="flex items-center justify-center mb-8">
            <Image src="/logo.png" alt="Power Key Vault Logo" width={80} height={80} />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-center text-white mb-6">
            Power the Grid, Privately.
          </h1>
          <p className="text-xl text-center text-white/90 max-w-2xl mx-auto">
            Record encrypted energy generation and consumption data, decrypted only for verified trades.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 py-12">
        {!isConnected ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-6">
              Please connect your wallet to create and manage encrypted energy records.
            </p>
            <button
              onClick={connect}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
            >
              Connect to MetaMask
            </button>
          </div>
        ) : (
          <>
            {/* Encryption Toggle */}
            <div className="flex justify-center mb-12">
              <Button
                onClick={toggleEncryption}
                size="lg"
                variant={isEncrypted ? "default" : "secondary"}
                className="gap-2"
              >
                {isEncrypted ? (
                  <>
                    <Lock className="w-5 h-5" />
                    Decrypt Data for Trade
                  </>
                ) : (
                  <>
                    <Unlock className="w-5 h-5" />
                    Re-encrypt Data
                  </>
                )}
              </Button>
            </div>

            {/* Energy Meters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <EnergyMeter
                title="Solar Generation"
                value={energyVault.totalGeneration * 0.6}
                maxValue={1000}
                isEncrypted={isEncrypted}
              />
              <EnergyMeter
                title="Home Consumption"
                value={energyVault.totalConsumption * 0.7}
                maxValue={1000}
                isEncrypted={isEncrypted}
              />
              <EnergyMeter
                title="Wind Generation"
                value={energyVault.totalGeneration * 0.4}
                maxValue={500}
                isEncrypted={isEncrypted}
              />
              <EnergyMeter
                title="Grid Export"
                value={Math.max(0, energyVault.totalGeneration - energyVault.totalConsumption)}
                maxValue={500}
                isEncrypted={isEncrypted}
              />
            </div>

            {/* Create Energy Record */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <CreateEnergyRecord 
                onRecordCreated={handleRecordCreated}
                isLoading={energyVault.isLoading}
                onSubmit={handleCreateRecord}
              />
              <EnergyRecordsList 
                records={energyRecords}
                onDecrypt={handleDecrypt}
                decryptingId={energyVault.decryptingId}
              />
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <EnergyFooter 
        totalGeneration={energyVault.totalGeneration}
        totalConsumption={energyVault.totalConsumption}
        isEncrypted={isEncrypted}
      />
    </div>
  );
}
