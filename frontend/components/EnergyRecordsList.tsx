"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Home, Clock, Lock, Unlock, Loader2 } from "lucide-react";
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
      <Card className="border-primary/20 bg-gradient-card">
        <CardHeader>
          <CardTitle>Energy Records History</CardTitle>
          <CardDescription>No records yet. Create your first energy record above.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-card">
      <CardHeader>
        <CardTitle>Energy Records History</CardTitle>
        <CardDescription>Your recorded energy data entries</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {records.map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between p-4 rounded-lg border border-primary/20 bg-background/50 hover:bg-background/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                {record.type === "generation" ? (
                  <Zap className="w-5 h-5 text-primary" />
                ) : (
                  <Home className="w-5 h-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">{record.source}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {record.timestamp.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={record.type === "generation" ? "default" : "secondary"}>
                  {record.type}
                </Badge>
                <div className="flex items-center gap-2">
                  {record.isEncrypted ? (
                    <>
                      <span className="text-lg font-bold text-locked">
                        ****
                      </span>
                      <Lock className="w-4 h-4 text-locked" />
                      {onDecrypt && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDecrypt(record.id)}
                          disabled={decryptingId === record.id}
                          className="ml-2"
                        >
                          {decryptingId === record.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Unlock className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="text-lg font-bold text-primary">
                        {record.value.toFixed(1)} kWh
                      </span>
                      <Unlock className="w-4 h-4 text-unlocked" />
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
