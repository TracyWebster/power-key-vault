"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface EnergyRecord {
  id: string;
  type: "generation" | "consumption";
  source: string;
  value: number;
  timestamp: Date;
  isEncrypted: boolean;
}

interface CreateEnergyRecordProps {
  onRecordCreated: (record: EnergyRecord) => void;
  isLoading?: boolean;
  onSubmit?: (type: "generation" | "consumption", source: string, value: number) => Promise<string | null>;
}

export function CreateEnergyRecord({ onRecordCreated, isLoading = false, onSubmit }: CreateEnergyRecordProps) {
  const [type, setType] = useState<"generation" | "consumption">("generation");
  const [source, setSource] = useState("");
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!source || !value) {
      toast.error("Please fill in all fields");
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      toast.error("Please enter a valid positive number");
      return;
    }

    if (numValue > 10000) {
      toast.error("Energy value cannot exceed 10,000 kWh");
      return;
    }

    if (source.length < 2) {
      toast.error("Source description must be at least 2 characters");
      return;
    }

    setSubmitting(true);

    try {
      let recordId: string | null = null;
      
      if (onSubmit) {
        recordId = await onSubmit(type, source, numValue);
      }

      // Only create local record if contract call succeeded
      if (recordId) {
        const newRecord: EnergyRecord = {
          id: recordId,
          type,
          source,
          value: numValue, // Store the original value user entered
          timestamp: new Date(),
          isEncrypted: true,
        };

        onRecordCreated(newRecord);

        // Reset form
        setSource("");
        setValue("");
        toast.success(`${type === "generation" ? "Generation" : "Consumption"} record created with ${numValue} kWh!`);
      }
    } catch (error) {
      console.error("CreateEnergyRecord error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      if (errorMessage.includes("user rejected")) {
        toast.error("Transaction was cancelled by user");
      } else if (errorMessage.includes("insufficient funds")) {
        toast.error("Insufficient funds for transaction");
      } else if (errorMessage.includes("network")) {
        toast.error("Network error. Please check your connection");
      } else {
        toast.error(`Failed to create record: ${errorMessage}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const loading = isLoading || submitting;

  return (
    <div className="h-full">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-gradient-energy rounded-3xl flex items-center justify-center energy-glow">
          <Plus className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-energy bg-clip-text text-transparent">
            Create Energy Record
          </h2>
          <p className="text-muted-foreground text-lg">
            Record new energy generation or consumption data (encrypted on-chain)
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Enhanced Type Selection */}
        <div className="space-y-4">
          <Label className="text-lg font-semibold text-foreground">Record Type</Label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setType("generation")}
              disabled={loading}
              className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                type === "generation"
                  ? "border-primary bg-primary/10 shadow-glow"
                  : "border-border hover:border-primary/50 hover:bg-primary/5"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  type === "generation" ? "bg-gradient-energy" : "bg-muted"
                }`}>
                  <svg className={`w-6 h-6 ${type === "generation" ? "text-white" : "text-muted-foreground"}`}
                       fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className={`font-bold text-lg ${type === "generation" ? "text-primary" : "text-foreground"}`}>
                    Generation
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Energy produced
                  </div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setType("consumption")}
              disabled={loading}
              className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                type === "consumption"
                  ? "border-secondary bg-secondary/10 shadow-glow"
                  : "border-border hover:border-secondary/50 hover:bg-secondary/5"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  type === "consumption" ? "bg-secondary" : "bg-muted"
                }`}>
                  <svg className={`w-6 h-6 ${type === "consumption" ? "text-white" : "text-muted-foreground"}`}
                       fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className={`font-bold text-lg ${type === "consumption" ? "text-secondary" : "text-foreground"}`}>
                    Consumption
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Energy used
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Enhanced Source Input */}
        <div className="space-y-4">
          <Label htmlFor="source" className="text-lg font-semibold text-foreground">
            Energy Source
          </Label>
          <div className="relative">
            <Input
              id="source"
              placeholder="e.g., Solar Panel, Home Usage, Wind Turbine"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              disabled={loading}
              className="h-14 px-6 text-lg rounded-2xl border-2 border-border focus:border-primary transition-all duration-300"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Enhanced Value Input */}
        <div className="space-y-4">
          <Label htmlFor="value" className="text-lg font-semibold text-foreground">
            Energy Value
          </Label>
          <div className="relative">
            <Input
              id="value"
              type="number"
              step="0.1"
              min="0"
              max="10000"
              placeholder="0.0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={loading}
              className="h-14 px-6 text-lg rounded-2xl border-2 border-border focus:border-primary transition-all duration-300"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <span className="text-lg font-semibold text-primary">kWh</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Maximum value: 10,000 kWh</span>
            <span className={`font-medium ${value && parseFloat(value) > 10000 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {value ? `${parseFloat(value).toFixed(1)} kWh` : '0.0 kWh'}
            </span>
          </div>
        </div>

        {/* Enhanced Submit Button */}
        <Button
          type="submit"
          className="w-full h-16 text-xl font-bold rounded-2xl bg-gradient-energy hover:scale-105 transition-all duration-300 shadow-glow hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center gap-4">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Creating Encrypted Record...</span>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Plus className="w-6 h-6" />
              <span>Create Encrypted Record</span>
            </div>
          )}
        </Button>
      </form>
    </div>
  );
}
