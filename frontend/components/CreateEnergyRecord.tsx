"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
          value: numValue,
          timestamp: new Date(),
          isEncrypted: true,
        };

        onRecordCreated(newRecord);

        // Reset form
        setSource("");
        setValue("");
      }
    } catch (error) {
      toast.error("Failed to create record: " + (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const loading = isLoading || submitting;

  return (
    <Card className="border-primary/20 bg-gradient-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary" />
          Create Energy Record
        </CardTitle>
        <CardDescription>
          Record new energy generation or consumption data (encrypted on-chain)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as "generation" | "consumption")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading}
            >
              <option value="generation">Generation</option>
              <option value="consumption">Consumption</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Input
              id="source"
              placeholder="e.g., Solar Panel, Home Usage"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="value">Value (kWh)</Label>
            <Input
              id="value"
              type="number"
              step="0.1"
              min="0"
              placeholder="0.0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <Button type="submit" className="w-full gap-2" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create Encrypted Record
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
