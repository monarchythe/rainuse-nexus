"use client";

import { ScoredCandidate } from "@/lib/types";
import {
  Building2,
  Droplets,
  DollarSign,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

export function StatsOverview({
  candidates,
  scanStatus,
}: {
  candidates: ScoredCandidate[];
  scanStatus?: {
    tilesTotal: number;
    tilesFetched: number;
    buildingsScanned: number;
    candidatesScored: number;
    candidatesReturned: number;
  };
}) {
  const total = candidates.length;
  const totalGallons = candidates.reduce(
    (sum, b) => sum + b.viability.annualHarvestGallons,
    0
  );
  const totalSavings = candidates.reduce(
    (sum, b) => sum + b.viability.annualSavings,
    0
  );
  const avgScore =
    total > 0
      ? Math.round(
          candidates.reduce((sum, b) => sum + b.viability.viabilityScore, 0) /
            total
        )
      : 0;
  const highViability = candidates.filter(
    (b) => b.viability.viabilityScore >= 75
  ).length;

  const stats = [
    {
      icon: Building2,
      label: "Top Candidates",
      value: total.toString(),
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
    <div className="space-y-3">
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
      </div>

      {highViability > 0 && (
        <div className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          <strong>{highViability}</strong> building
          {highViability !== 1 ? "s" : ""} scored{" "}
          <strong>High Viability</strong> (75+) — prime candidates for Grundfos
          rainwater reuse systems.
        </div>
      )}

      {scanStatus && (
        <div className="rounded-lg border border-dashed border-muted-foreground/30 px-4 py-2 text-xs text-muted-foreground">
          Scan: {scanStatus.tilesFetched}/{scanStatus.tilesTotal} tiles fetched
          | {scanStatus.buildingsScanned.toLocaleString()} buildings scanned |{" "}
          {scanStatus.candidatesScored} scored |{" "}
          {scanStatus.candidatesReturned} returned
        </div>
      )}

      {total > 0 && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-4 py-2 text-xs text-amber-700">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Screening estimate only. Final yield requires site engineering.
        </div>
      )}
    </div>
  );
}
