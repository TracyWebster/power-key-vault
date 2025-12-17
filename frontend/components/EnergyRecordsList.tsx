"use client";

import { Badge } from "@/components/ui/badge";
import { Zap, Home, Clock, Unlock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnergyRecord } from "./CreateEnergyRecord";

interface EnergyRecordsListProps {
  records: EnergyRecord[];
  onDecrypt?: (recordId: string) => Promise<number | null>;
  decryptingId?: string | null;
}

export function EnergyRecordsList({ records, onDecrypt, decryptingId }: EnergyRecordsListProps) {
  if (records.length === 0) {
    return (
      <div className="h-full">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-gradient-energy rounded-3xl flex items-center justify-center energy-glow">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-energy bg-clip-text text-transparent">
              Energy Records History
            </h2>
            <p className="text-muted-foreground text-lg">
              No records yet. Create your first energy record above.
            </p>
          </div>
        </div>

        <div className="card-enhanced p-12 rounded-3xl text-center">
          <div className="w-24 h-24 bg-muted/50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-5v2m0 0v2m0-2h2m-2 0h-2" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-4">No Energy Records Yet</h3>
          <p className="text-muted-foreground text-lg">
            Your energy records will appear here once you create them.
            Start by adding your first generation or consumption record.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-gradient-energy rounded-3xl flex items-center justify-center energy-glow">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-energy bg-clip-text text-transparent">
            Energy Records History
          </h2>
          <p className="text-muted-foreground text-lg">
            Your recorded energy data entries ({records.length} records)
          </p>
        </div>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {records.map((record, index) => (
          <div
            key={record.id}
            className="card-enhanced p-6 rounded-2xl hover:scale-[1.02] transition-all duration-300 group"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  record.type === "generation"
                    ? "bg-gradient-energy group-hover:scale-110"
                    : "bg-secondary/20 group-hover:bg-secondary/30"
                }`}>
                  {record.type === "generation" ? (
                    <Zap className="w-7 h-7 text-white" />
                  ) : (
                    <Home className="w-7 h-7 text-secondary" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg text-foreground">{record.source}</h3>
                    <Badge
                      variant={record.type === "generation" ? "default" : "secondary"}
                      className={`px-3 py-1 rounded-xl font-semibold ${
                        record.type === "generation"
                          ? "bg-gradient-energy text-white"
                          : "bg-secondary/20 text-secondary"
                      }`}
                    >
                      {record.type === "generation" ? "⚡ Generation" : "🏠 Consumption"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">
                      {record.timestamp.toLocaleDateString()} at {record.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {record.isEncrypted ? (
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-black text-locked mb-1">🔒</div>
                      <div className="text-sm font-bold text-locked">Encrypted</div>
                    </div>
                    {onDecrypt && (
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => onDecrypt(record.id)}
                        disabled={decryptingId === record.id}
                        className="px-6 py-3 rounded-2xl border-2 border-locked/30 hover:border-locked hover:bg-locked/10 transition-all duration-300"
                      >
                        {decryptingId === record.id ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="font-semibold">Decrypting...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Unlock className="w-5 h-5" />
                            <span className="font-semibold">Decrypt</span>
                          </div>
                        )}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-3xl font-black bg-gradient-energy bg-clip-text text-transparent mb-1">
                      {record.value.toFixed(1)}
                    </div>
                    <div className="text-sm font-bold text-primary flex items-center justify-center gap-1">
                      <Unlock className="w-4 h-4" />
                      kWh Verified
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
