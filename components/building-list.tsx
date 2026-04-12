"use client";

import { useState, useCallback } from "react";
import { ScoredCandidate, SortField, ScanStateResponse } from "@/lib/types";
import { BuildingCard } from "@/components/building-card";
import { StateFilter } from "@/components/state-filter";
import { StatsOverview } from "@/components/stats-overview";
import { Loader2, Search, Droplets } from "lucide-react";

type ScanState =
  | { status: "idle" }
  | { status: "loading"; state: string }
  | { status: "success"; data: ScanStateResponse }
  | { status: "error"; message: string };

function getSortValue(c: ScoredCandidate, field: SortField): number {
  switch (field) {
    case "viabilityScore":
      return c.viability.viabilityScore;
    case "area_sqft":
      return c.area_sqft;
    case "annualSavings":
      return c.viability.annualSavings;
    case "coolingTowerConfidence":
      return c.confidence;
  }
}

export function BuildingList() {
  const [selectedState, setSelectedState] = useState("NONE");
  const [sortField, setSortField] = useState<SortField>("viabilityScore");
  const [scan, setScan] = useState<ScanState>({ status: "idle" });

  const handleStateChange = useCallback(async (state: string) => {
    setSelectedState(state);

    if (state === "NONE") {
      setScan({ status: "idle" });
      return;
    }

    setScan({ status: "loading", state });

    try {
      const response = await fetch("/api/scan-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, maxResults: 25 }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `API returned ${response.status}`);
      }

      const data: ScanStateResponse = await response.json();
      setScan({ status: "success", data });
    } catch (error) {
      setScan({
        status: "error",
        message: error instanceof Error ? error.message : "Scan failed",
      });
    }
  }, []);

  // Sort candidates if we have results
  const candidates =
    scan.status === "success"
      ? [...scan.data.candidates].sort(
          (a, b) => getSortValue(b, sortField) - getSortValue(a, sortField)
        )
      : [];

  const scanStatus =
    scan.status === "success" ? scan.data.scanStatus : undefined;

  return (
    <div className="space-y-6">
      {/* Filters row */}
      <div className="flex items-center justify-between">
        <StateFilter
          selectedState={selectedState}
          onStateChange={handleStateChange}
          sortField={sortField}
          onSortChange={setSortField}
          disabled={scan.status === "loading"}
        />
        {scan.status === "success" && (
          <div className="text-sm text-muted-foreground">
            {candidates.length} candidate{candidates.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Idle state */}
      {scan.status === "idle" && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-muted-foreground">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Search className="h-7 w-7 text-primary" />
          </div>
          <p className="text-lg font-medium text-foreground">
            Select a state to begin scanning
          </p>
          <p className="mt-1 max-w-md text-center text-sm">
            The prospecting engine will analyze Microsoft Building Footprints,
            cross-reference rainfall data, FEMA risk scores, and water costs to
            find the best candidates for Grundfos rainwater reuse systems.
          </p>
        </div>
      )}

      {/* Loading state */}
      {scan.status === "loading" && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20">
          <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
          <p className="text-lg font-medium text-foreground">
            Scanning {scan.state}...
          </p>
          <p className="mt-1 max-w-md text-center text-sm text-muted-foreground">
            Fetching building footprints from Microsoft, looking up county data
            via FCC, querying FEMA risk index, and computing viability scores.
            This may take 15-30 seconds.
          </p>
          <div className="mt-6 flex items-center gap-6 text-xs text-muted-foreground">
            <Step label="Fetching tiles" active />
            <Step label="Computing areas" />
            <Step label="Scoring viability" />
          </div>
        </div>
      )}

      {/* Error state */}
      {scan.status === "error" && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-destructive/30 bg-destructive/5 py-16">
          <p className="text-lg font-medium text-destructive">Scan failed</p>
          <p className="mt-1 text-sm text-muted-foreground">{scan.message}</p>
          <button
            onClick={() => handleStateChange(selectedState)}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      )}

      {/* Results */}
      {scan.status === "success" && (
        <>
          <StatsOverview candidates={candidates} scanStatus={scanStatus} />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {candidates.map((candidate, i) => (
              <BuildingCard
                key={`${candidate.centroid_lat}-${candidate.centroid_lon}-${i}`}
                candidate={candidate}
              />
            ))}
          </div>

          {candidates.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-muted-foreground">
              <Droplets className="mb-3 h-8 w-8" />
              <p className="text-lg font-medium">
                No candidates found for this state
              </p>
              <p className="text-sm">
                Try a different state or adjust the parameters
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Step({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`h-2 w-2 rounded-full ${active ? "animate-pulse bg-primary" : "bg-muted-foreground/30"}`}
      />
      <span className={active ? "text-foreground font-medium" : ""}>
        {label}
      </span>
    </div>
  );
}
