"use client";

import { Zap, TrendingUp, TrendingDown } from "lucide-react";

interface EnergyFooterProps {
  totalGeneration: number;
  totalConsumption: number;
  isEncrypted: boolean;
}

export function EnergyFooter({ totalGeneration, totalConsumption, isEncrypted }: EnergyFooterProps) {
  const netBalance = totalGeneration - totalConsumption;
  const isPositive = netBalance >= 0;

  return (
    <footer className="bg-gradient-card border-t border-border mt-auto">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="flex items-center gap-4 p-4 bg-background/50 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Generation</p>
              <p className="text-2xl font-bold text-foreground">
                {isEncrypted ? "****" : totalGeneration.toFixed(1)} kWh
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-background/50 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Consumption</p>
              <p className="text-2xl font-bold text-foreground">
                {isEncrypted ? "****" : totalConsumption.toFixed(1)} kWh
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-background/50 rounded-lg">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isPositive ? 'bg-primary/10' : 'bg-destructive/10'
            }`}>
              <Zap className={`w-6 h-6 ${isPositive ? 'text-primary' : 'text-destructive'}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Net Balance</p>
              <p className={`text-2xl font-bold ${
                isPositive ? 'text-primary' : 'text-destructive'
              }`}>
                {isEncrypted ? "****" : `${isPositive ? '+' : ''}${netBalance.toFixed(1)}`} kWh
              </p>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground border-t border-border pt-6">
          <p>Power Key Vault - Powering the grid, privately.</p>
        </div>
      </div>
    </footer>
  );
}
