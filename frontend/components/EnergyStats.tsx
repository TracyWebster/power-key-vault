"use client";

import { TrendingUp, Activity, BarChart3, PieChart } from "lucide-react";

interface EnergyStatsProps {
  totalGeneration: number;
  totalConsumption: number;
  recordCount: number;
  isEncrypted: boolean;
}

export function EnergyStats({ totalGeneration, totalConsumption, recordCount, isEncrypted }: EnergyStatsProps) {
  const netEnergy = totalGeneration - totalConsumption;
  const efficiency = totalGeneration > 0 ? (totalConsumption / totalGeneration) * 100 : 0;

  const stats = [
    {
      title: "Total Records",
      value: recordCount,
      icon: BarChart3,
      color: "text-primary",
      bgColor: "bg-primary/10",
      description: "Energy transactions"
    },
    {
      title: "Net Balance",
      value: `${netEnergy > 0 ? '+' : ''}${netEnergy.toFixed(1)} kWh`,
      icon: TrendingUp,
      color: netEnergy >= 0 ? "text-green-500" : "text-red-500",
      bgColor: netEnergy >= 0 ? "bg-green-500/10" : "bg-red-500/10",
      description: netEnergy >= 0 ? "Energy surplus" : "Energy deficit"
    },
    {
      title: "Efficiency Rate",
      value: `${efficiency.toFixed(1)}%`,
      icon: PieChart,
      color: "text-accent",
      bgColor: "bg-accent/10",
      description: "Consumption vs Generation"
    },
    {
      title: "System Status",
      value: isEncrypted ? "Secure" : "Active",
      icon: Activity,
      color: isEncrypted ? "text-locked" : "text-unlocked",
      bgColor: isEncrypted ? "bg-locked/10" : "bg-unlocked/10",
      description: isEncrypted ? "FHE Protected" : "Trade Ready"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {stats.map((stat, index) => (
        <div
          key={stat.title}
          className="card-enhanced p-4 sm:p-6 rounded-2xl text-center hover-scale"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className={`w-12 h-12 sm:w-14 sm:h-14 ${stat.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4`}>
            <stat.icon className={`w-6 h-6 sm:w-7 sm:h-7 ${stat.color}`} />
          </div>

          <div className="space-y-1 sm:space-y-2">
            <h3 className="text-sm sm:text-base font-semibold text-muted-foreground">
              {stat.title}
            </h3>
            <p className={`text-xl sm:text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {stat.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

