"use client";

import { ScoredCandidate } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/score-badge";
import {
  Droplets,
  ThermometerSun,
  DollarSign,
  Ruler,
  MapPin,
  CloudRain,
  Gauge,
} from "lucide-react";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

function formatCoord(lat: number, lon: number): string {
  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

/** Green = measured data, Yellow = inferred/estimated */
function SourceBadge({ measured }: { measured: boolean }) {
  return measured ? (
    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
      Measured
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
      Estimated
    </span>
  );
}

export function BuildingCard({ candidate }: { candidate: ScoredCandidate }) {
  const c = candidate;
  const v = c.viability;
  const confPct = Math.round(c.confidence * 100);

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div className="min-w-0 flex-1">
          {/* Location badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs shrink-0">
              {c.area_sqft >= 100_000 ? "> 100K sqft" : "Commercial"}
            </Badge>
            {c.confidence > 0.7 && (
              <Badge className="bg-blue-100 text-blue-700 text-xs hover:bg-blue-100">
                Cooling Tower
              </Badge>
            )}
          </div>

          {/* Address / coordinates */}
          <h3 className="mt-2 text-base font-semibold leading-tight text-foreground">
            {v.countyName && v.countyName !== "Unknown"
              ? `${v.countyName} Building`
              : `Building @ ${formatCoord(c.centroid_lat, c.centroid_lon)}`}
          </h3>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {v.countyName && v.countyName !== "Unknown"
              ? `${v.countyName}, ${c.state}`
              : `${formatCoord(c.centroid_lat, c.centroid_lon)} | ${c.state}`}
          </div>
        </div>
        <ScoreBadge score={v.viabilityScore} size="md" />
      </CardHeader>

      <CardContent className="pt-0">
        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-3">
          <MetricRow
            icon={Ruler}
            label="Roof Area"
            value={`${formatNumber(c.area_sqft)} sqft`}
            highlight={c.area_sqft >= 100_000}
            badge={<SourceBadge measured={true} />}
          />
          <MetricRow
            icon={ThermometerSun}
            label="Cooling Tower"
            value={c.confidence > 0 ? `${confPct}% conf` : "Not detected"}
            highlight={c.confidence > 0.7}
            badge={
              <SourceBadge measured={c.confidence > 0 && c.confidence !== -1} />
            }
          />
          <MetricRow
            icon={CloudRain}
            label="Rainfall"
            value={`${v.rainfallInches} in/yr`}
            badge={<SourceBadge measured={v.countyFips !== "00000"} />}
          />
          <MetricRow
            icon={Gauge}
            label="Usable Water"
            value={`${formatNumber(v.usableGallons)} gal/yr`}
            badge={<SourceBadge measured={false} />}
          />
        </div>

        {/* Sub-score pills */}
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          <ScorePill label="Roof" value={v.breakdown.roofAreaScore} />
          <ScorePill label="Rain" value={v.breakdown.rainfallHarvestScore} />
          <ScorePill label="Cool" value={v.breakdown.coolingTowerScore} />
          <ScorePill label="Cost" value={v.breakdown.waterCostScore} />
          <ScorePill label="Risk" value={v.breakdown.resilienceScore} />
          <ScorePill label="ESG" value={v.breakdown.esgScore} />
          <ScorePill label="Reg" value={v.breakdown.regulatoryScore} />
        </div>

        {/* Bottom stats */}
        <div className="mt-4 grid grid-cols-3 gap-px rounded-lg bg-border overflow-hidden">
          <div className="bg-muted/50 px-3 py-2 text-center">
            <div className="text-[10px] text-muted-foreground">Harvest</div>
            <div className="text-sm font-semibold text-foreground">
              {formatNumber(v.annualHarvestGallons)}
            </div>
            <div className="text-[10px] text-muted-foreground">gal/yr</div>
          </div>
          <div className="bg-muted/50 px-3 py-2 text-center">
            <div className="text-[10px] text-muted-foreground">Usable</div>
            <div className="text-sm font-semibold text-primary">
              {formatNumber(v.usableGallons)}
            </div>
            <div className="text-[10px] text-muted-foreground">gal/yr</div>
          </div>
          <div className="bg-muted/50 px-3 py-2 text-center">
            <div className="text-[10px] text-muted-foreground">Savings</div>
            <div className="text-sm font-semibold text-emerald-600">
              ${formatNumber(v.annualSavings)}
            </div>
            <div className="text-[10px] text-muted-foreground">/yr</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricRow({
  icon: Icon,
  label,
  value,
  highlight = false,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  highlight?: boolean;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{label}</span>
          {badge}
        </div>
        <div
          className={`text-sm font-medium ${highlight ? "text-primary" : "text-foreground"}`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function ScorePill({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 70
      ? "bg-emerald-100 text-emerald-700"
      : pct >= 40
        ? "bg-amber-100 text-amber-700"
        : "bg-gray-100 text-gray-500";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${color}`}
    >
      {label}
      <span className="font-bold">{pct}</span>
    </span>
  );
}
