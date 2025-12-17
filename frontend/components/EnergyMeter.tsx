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
    <div className="card-enhanced rounded-3xl p-8 energy-glow-hover group">
      {/* Header with Icon */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
            isEncrypted
              ? 'bg-locked/20 group-hover:bg-locked/30'
              : 'bg-gradient-energy group-hover:scale-110'
          }`}>
            {isEncrypted ? (
              <Lock className="w-6 h-6 text-locked" />
            ) : (
              <Unlock className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">{title}</h3>
            <span className={`text-sm font-medium ${
              isEncrypted ? 'text-locked' : 'text-unlocked'
            }`}>
              {isEncrypted ? "🔒 Encrypted" : "✅ Verified"}
            </span>
          </div>
        </div>
      </div>

      {/* Value Display */}
      <div className="space-y-6">
        <div className="flex items-baseline gap-3">
          <span className={`text-5xl font-black transition-all duration-500 ${
            isEncrypted
              ? 'text-muted-foreground blur-sm'
              : 'bg-gradient-energy bg-clip-text text-transparent'
          }`}>
            {isEncrypted ? "****" : animatedValue.toFixed(1)}
          </span>
          <span className="text-2xl text-muted-foreground font-medium">{unit}</span>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="relative">
          <div className="relative h-4 bg-muted/50 rounded-2xl overflow-hidden shadow-inner">
            <div
              className={`absolute inset-y-0 left-0 rounded-2xl transition-all duration-1000 ease-out ${
                isEncrypted
                  ? 'bg-muted-foreground/30'
                  : 'bg-gradient-energy shadow-glow'
              }`}
              style={{ width: `${isEncrypted ? 0 : percentage}%` }}
            />
            {isEncrypted && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-full bg-locked/10 animate-pulse" />
              </div>
            )}
          </div>
          {/* Progress Glow Effect */}
          {!isEncrypted && percentage > 0 && (
            <div
              className="absolute inset-y-0 left-0 rounded-2xl bg-gradient-energy opacity-50 blur-sm transition-all duration-1000"
              style={{ width: `${percentage}%` }}
            />
          )}
        </div>

        {/* Scale Indicators */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground font-medium">0 {unit}</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gradient-energy rounded-full animate-pulse"></div>
            <span className="text-muted-foreground font-medium">{maxValue} {unit}</span>
          </div>
        </div>

        {/* Percentage Indicator */}
        {!isEncrypted && (
          <div className="text-center">
            <span className="text-lg font-bold text-primary">
              {percentage.toFixed(1)}% of capacity
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
