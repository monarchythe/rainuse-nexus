"use client";

import { useState } from "react";
import { buildings } from "@/lib/mock-data";
import { SortField } from "@/lib/types";
import { BuildingCard } from "@/components/building-card";
import { StateFilter } from "@/components/state-filter";
import { StatsOverview } from "@/components/stats-overview";

export function BuildingList() {
  const [selectedState, setSelectedState] = useState("ALL");
  const [sortField, setSortField] = useState<SortField>("viability_score");

  const filtered = buildings
    .filter((b) => selectedState === "ALL" || b.state === selectedState)
    .sort((a, b) => b[sortField] - a[sortField]);

  return (
    <div className="space-y-6">
      <StatsOverview buildings={filtered} />

      <div className="flex items-center justify-between">
        <StateFilter
          selectedState={selectedState}
          onStateChange={setSelectedState}
          sortField={sortField}
          onSortChange={setSortField}
        />
        <div className="text-sm text-muted-foreground">
          {filtered.length} building{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((building) => (
          <BuildingCard key={building.id} building={building} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-muted-foreground">
          <p className="text-lg font-medium">No buildings found</p>
          <p className="text-sm">Try selecting a different state</p>
        </div>
      )}
    </div>
  );
}
