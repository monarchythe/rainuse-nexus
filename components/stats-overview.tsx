"use client";

import { Building } from "@/lib/types";
import { Building2, Droplets, DollarSign, TrendingUp } from "lucide-react";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

export function StatsOverview({ buildings }: { buildings: Building[] }) {
  const totalBuildings = buildings.length;
  const totalGallons = buildings.reduce(
    (sum, b) => sum + b.estimated_gallons_year,
    0
  );
  const totalSavings = buildings.reduce(
    (sum, b) => sum + b.estimated_savings_year,
    0
  );
  const avgScore =
    totalBuildings > 0
      ? Math.round(
          buildings.reduce((sum, b) => sum + b.viability_score, 0) /
            totalBuildings
        )
      : 0;
  const highViability = buildings.filter((b) => b.viability_score >= 75).length;

  const stats = [
    {
      icon: Building2,
      label: "Buildings Found",
      value: totalBuildings.toString(),
    },
    {
      icon: TrendingUp,
      label: "Avg. Viability",
      value: `${avgScore}/100`,
    },
    {
      icon: Droplets,
      label: "Total Capturable",
      value: `${formatNumber(totalGallons)} gal/yr`,
    },
    {
      icon: DollarSign,
      label: "Total Savings",
      value: `$${formatNumber(totalSavings)}/yr`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <stat.icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
            <div className="text-lg font-bold text-foreground">
              {stat.value}
            </div>
          </div>
        </div>
      ))}
      {highViability > 0 && (
        <div className="col-span-2 sm:col-span-4">
          <div className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
            <strong>{highViability}</strong> building
            {highViability !== 1 ? "s" : ""} scored{" "}
            <strong>High Viability</strong> (75+) — prime candidates for
            Grundfos rainwater reuse systems.
          </div>
        </div>
      )}
    </div>
  );
}
