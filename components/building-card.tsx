"use client";

import { Building } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/score-badge";
import {
  Droplets,
  ThermometerSun,
  DollarSign,
  Leaf,
  Ruler,
  MapPin,
} from "lucide-react";

const typeLabels: Record<Building["type"], string> = {
  commercial: "Commercial",
  industrial: "Industrial",
  "data-center": "Data Center",
  warehouse: "Warehouse",
};

const esgColors: Record<Building["esg_signal"], string> = {
  strong: "bg-emerald-100 text-emerald-700",
  moderate: "bg-amber-100 text-amber-700",
  weak: "bg-orange-100 text-orange-700",
  none: "bg-gray-100 text-gray-500",
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

export function BuildingCard({ building }: { building: Building }) {
  const b = building;

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs shrink-0">
              {typeLabels[b.type]}
            </Badge>
            {b.leed_certified && (
              <Badge className="bg-emerald-100 text-emerald-700 text-xs hover:bg-emerald-100">
                LEED
              </Badge>
            )}
          </div>
          <h3 className="mt-2 text-base font-semibold leading-tight text-foreground truncate">
            {b.name}
          </h3>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {b.city}, {b.state}
          </div>
        </div>
        <ScoreBadge score={b.viability_score} size="md" />
      </CardHeader>

      <CardContent className="pt-0">
        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-3">
          <MetricRow
            icon={Ruler}
            label="Roof Area"
            value={`${formatNumber(b.roof_area_sqft)} sqft`}
            highlight={b.roof_area_sqft >= 100_000}
          />
          <MetricRow
            icon={ThermometerSun}
            label="Cooling Tower"
            value={`${b.cooling_tower_confidence}%`}
            highlight={b.cooling_tower_confidence >= 80}
          />
          <MetricRow
            icon={Droplets}
            label="Rainfall"
            value={`${b.rainfall_inches} in/yr`}
          />
          <MetricRow
            icon={DollarSign}
            label="Water Cost"
            value={`${b.water_cost_index}/10`}
            highlight={b.water_cost_index >= 7}
          />
        </div>

        {/* ESG + incentives row */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${esgColors[b.esg_signal]}`}
          >
            <Leaf className="h-3 w-3" />
            ESG: {b.esg_signal}
          </span>
          {b.stormwater_fee && (
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              Stormwater Fee
            </span>
          )}
          {b.tax_incentive && (
            <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700">
              Tax Incentive
            </span>
          )}
        </div>

        {/* Bottom stats */}
        <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Est. Capture</div>
            <div className="text-sm font-semibold text-foreground">
              {formatNumber(b.estimated_gallons_year)} gal/yr
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Est. Savings</div>
            <div className="text-sm font-semibold text-emerald-600">
              ${formatNumber(b.estimated_savings_year)}/yr
            </div>
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
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div
          className={`text-sm font-medium ${highlight ? "text-primary" : "text-foreground"}`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
