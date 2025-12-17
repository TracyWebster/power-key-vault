"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Lock, Unlock } from "lucide-react";
import { EnergyMeter } from "@/components/EnergyMeter";
import { EnergyFooter } from "@/components/EnergyFooter";
import { CreateEnergyRecord, EnergyRecord } from "@/components/CreateEnergyRecord";
import { EnergyRecordsList } from "@/components/EnergyRecordsList";
import { EnergyStats } from "@/components/EnergyStats";
import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useEnergyVault } from "@/hooks/useEnergyVault";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ThemeToggle } from "@/components/ThemeToggle";
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
      {/* Enhanced Hero Section */}
      <header className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 animated-bg"
             style={{ backgroundImage: 'var(--gradient-hero)' }}>
          <div className="absolute inset-0 opacity-20"
               style={{ backgroundImage: 'var(--gradient-mesh)' }}></div>
        </div>

        {/* Floating Elements - Hidden on mobile for performance */}
        <div className="hidden md:block absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl float"></div>
        <div className="hidden lg:block absolute bottom-20 right-10 w-48 h-48 bg-accent/10 rounded-full blur-2xl float" style={{ animationDelay: '2s' }}></div>
        <div className="hidden xl:block absolute top-1/2 left-1/4 w-24 h-24 bg-primary/10 rounded-full blur-lg float" style={{ animationDelay: '4s' }}></div>

        {/* Top Controls */}
        <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
          <ThemeToggle />
          <div className="glass rounded-2xl p-2">
            <ConnectButton />
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo with Glow Effect */}
            <div className="flex items-center justify-center mb-8 sm:mb-12">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl scale-110"></div>
                <Image
                  src="/logo.png"
                  alt="Power Key Vault Logo"
                  width={80}
                  height={80}
                  className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 energy-glow-hover"
                />
              </div>
            </div>

            {/* Enhanced Typography - Responsive */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6 sm:mb-8 leading-tight px-4">
              <span className="bg-gradient-to-r from-white via-white to-accent bg-clip-text text-transparent">
                Power the Grid,
              </span>
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Privately.
              </span>
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8 sm:mb-12 leading-relaxed font-light px-4">
              Record encrypted energy generation and consumption data,
              decrypted only for verified trades. Secure your energy future with FHE technology.
            </p>

            {/* CTA Buttons - Responsive */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center px-4">
              <button className="btn-energy text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto sm:min-w-[200px]">
                Get Started
              </button>
              <button className="glass text-white border border-white/30 px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:bg-white/10 transition-all duration-300 w-full sm:w-auto sm:min-w-[200px] text-base sm:text-lg">
                Learn More
              </button>
            </div>

            {/* Scroll Indicator - Hidden on very small screens */}
            <div className="hidden sm:block absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
              <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Main Content */}
      <main className="flex-1 relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'var(--gradient-mesh)' }}></div>

        <div className="relative z-10 container mx-auto px-6 py-16">
          {!isConnected ? (
            <div className="text-center py-20">
              <div className="card-enhanced max-w-md mx-auto p-8 rounded-3xl">
                <div className="w-20 h-20 bg-gradient-energy rounded-2xl flex items-center justify-center mx-auto mb-6 energy-glow">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold mb-4 bg-gradient-energy bg-clip-text text-transparent">Connect Your Wallet</h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Please connect your wallet to create and manage encrypted energy records with FHE technology.
                </p>
                <div className="glass rounded-2xl p-4">
                  <ConnectButton />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-16">
              {/* Enhanced Encryption Toggle Section */}
              <section className="text-center px-4">
                <div className="inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-4 card-enhanced px-4 sm:px-8 py-4 sm:py-6 rounded-2xl">
                  <div className="text-sm sm:text-base font-medium text-muted-foreground whitespace-nowrap">Data Privacy Mode:</div>
                  <Button
                    onClick={toggleEncryption}
                    size="lg"
                    variant={isEncrypted ? "default" : "secondary"}
                    className="gap-3 px-4 sm:px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 w-full sm:w-auto"
                  >
                    {isEncrypted ? (
                      <>
                        <Lock className="w-5 h-5" />
                        <span className="font-semibold">Encrypted</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-5 h-5" />
                        <span className="font-semibold">Decrypted</span>
                      </>
                    )}
                  </Button>
                  <div className="text-xs sm:text-sm text-muted-foreground max-w-xs text-center sm:text-left">
                    {isEncrypted ? "Data is secured with FHE encryption" : "Data is visible for trading"}
                  </div>
                </div>
              </section>

              {/* Enhanced Energy Meters Grid */}
              <section>
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-bold mb-4 bg-gradient-energy bg-clip-text text-transparent">
                    Energy Dashboard
                  </h2>
                  <p className="text-muted-foreground text-lg">
                    Real-time monitoring of your energy portfolio
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
                  <EnergyMeter
                    title="Total Generation"
                    value={energyVault.totalGeneration}
                    maxValue={10000}
                    isEncrypted={isEncrypted}
                  />
                  <EnergyMeter
                    title="Total Consumption"
                    value={energyVault.totalConsumption}
                    maxValue={10000}
                    isEncrypted={isEncrypted}
                  />
                  <EnergyMeter
                    title="Net Energy"
                    value={Math.abs(energyVault.totalGeneration - energyVault.totalConsumption)}
                    maxValue={10000}
                    isEncrypted={isEncrypted}
                  />
                  <EnergyMeter
                    title="Grid Export"
                    value={Math.max(0, energyVault.totalGeneration - energyVault.totalConsumption)}
                    maxValue={10000}
                    isEncrypted={isEncrypted}
                  />
                </div>

                {/* Energy Statistics */}
                <div className="mb-8 sm:mb-12">
                  <EnergyStats
                    totalGeneration={energyVault.totalGeneration}
                    totalConsumption={energyVault.totalConsumption}
                    recordCount={energyRecords.length}
                    isEncrypted={isEncrypted}
                  />
                </div>
              </section>

              {/* Enhanced Create and Manage Section */}
              <section>
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-bold mb-4 bg-gradient-energy bg-clip-text text-transparent">
                    Energy Records
                  </h2>
                  <p className="text-muted-foreground text-lg">
                    Create new records and manage your encrypted energy data
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  <div className="card-enhanced p-8 rounded-3xl">
                    <CreateEnergyRecord
                      onRecordCreated={handleRecordCreated}
                      isLoading={energyVault.isLoading}
                      onSubmit={handleCreateRecord}
                    />
                  </div>
                  <div className="card-enhanced p-8 rounded-3xl">
                    <EnergyRecordsList
                      records={energyRecords}
                      onDecrypt={handleDecrypt}
                      decryptingId={energyVault.decryptingId}
                    />
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
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
