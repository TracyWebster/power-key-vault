"use client";

import { Lock, Unlock } from "lucide-react";
import { useState, useEffect } from "react";

interface EnergyMeterProps {
  title: string;
  value: number;
  maxValue: number;
  isEncrypted: boolean;
  unit?: string;
}

export function EnergyMeter({ title, value, maxValue, isEncrypted, unit = "kWh" }: EnergyMeterProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const percentage = (value / maxValue) * 100;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value);
    }, 100);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="bg-gradient-card rounded-xl p-6 shadow-glow border border-border transition-all hover:shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <div className="flex items-center gap-2">
          {isEncrypted ? (
            <Lock className="w-5 h-5 text-locked animate-pulse-glow" />
          ) : (
            <Unlock className="w-5 h-5 text-unlocked" />
          )}
          <span className="text-sm text-muted-foreground">
            {isEncrypted ? "Encrypted" : "Verified"}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold bg-gradient-energy bg-clip-text text-transparent">
            {isEncrypted ? "****" : animatedValue.toFixed(1)}
          </span>
          <span className="text-xl text-muted-foreground">{unit}</span>
        </div>

        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-energy rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${isEncrypted ? 0 : percentage}%` }}
          />
          {isEncrypted && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full bg-locked/20 animate-pulse-glow" />
            </div>
          )}
        </div>

        <div className="flex justify-between text-sm text-muted-foreground">
          <span>0 {unit}</span>
          <span>{maxValue} {unit}</span>
        </div>
      </div>
    </div>
  );
}
