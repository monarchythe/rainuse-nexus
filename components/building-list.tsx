"use client";

import { useState, useCallback, useRef } from "react";
import { ScoredCandidate, SortField, ScanStateResponse } from "@/lib/types";
import { BuildingCard } from "@/components/building-card";
import { StateFilter } from "@/components/state-filter";
import { StatsOverview } from "@/components/stats-overview";
import { Loader2, Search, Droplets } from "lucide-react";

type ScanState =
  | { status: "idle" }
  | { status: "loading"; state: string; city: string }
  | { status: "streaming"; state: string; city: string; candidates: ScoredCandidate[]; scored: number; total: number }
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
  const [selectedCity, setSelectedCity] = useState("NONE");
  const [sortField, setSortField] = useState<SortField>("viabilityScore");
  const [scan, setScan] = useState<ScanState>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);
  const lastScanRef = useRef<{ state: string; city: string; bbox: [number, number, number, number] } | null>(null);

  const handleStateChange = useCallback((state: string) => {
    abortRef.current?.abort();
    abortRef.current = null;
    setSelectedState(state);
    setSelectedCity("NONE");
    setScan({ status: "idle" });
  }, []);

  const handleCityChange = useCallback(async (
    cityName: string,
    bbox: [number, number, number, number]
  ) => {
    setSelectedCity(cityName);
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;
    lastScanRef.current = { state: selectedState, city: cityName, bbox };
    setScan({ status: "loading", state: selectedState, city: cityName });

    try {
      const response = await fetch("/api/scan-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: selectedState, city: cityName, bbox, maxResults: 25 }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `API returned ${response.status}`);
      }

      const contentType = response.headers.get("Content-Type") ?? "";

      // Cache hit — immediate JSON response
      if (contentType.includes("application/json")) {
        const data: ScanStateResponse = await response.json();
        setScan({ status: "success", data });
        return;
      }

      // Live scan — stream NDJSON
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done || controller.signal.aborted) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          let msg: Record<string, unknown>;
          try {
            msg = JSON.parse(line);
          } catch {
            continue;
          }

          if (msg.type === "meta") {
            setScan({
              status: "streaming",
              state: selectedState,
              city: cityName,
              candidates: [],
              scored: 0,
              total: msg.total as number,
            });
          } else if (msg.type === "candidate") {
            setScan((prev) =>
              prev.status === "streaming"
                ? {
                    ...prev,
                    candidates: [...prev.candidates, msg.data as ScoredCandidate],
                    scored: prev.scored + 1,
                  }
                : prev
            );
          } else if (msg.type === "done") {
            const { topCandidates, scanStatus, state: s, timestamp } = msg as {
              topCandidates: ScoredCandidate[];
              scanStatus: ScanStateResponse["scanStatus"];
              state: string;
              timestamp: string;
            };
            setScan({
              status: "success",
              data: { candidates: topCandidates, scanStatus, state: s, timestamp },
            });
          } else if (msg.type === "error") {
            throw new Error((msg.error as string) || "Stream error");
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      setScan({
        status: "error",
        message: error instanceof Error ? error.message : "Scan failed",
      });
    }
  }, [selectedState]);

  const handleRetry = useCallback(() => {
    const last = lastScanRef.current;
    if (last) handleCityChange(last.city, last.bbox);
  }, [handleCityChange]);

  const candidates =
    scan.status === "success"
      ? [...scan.data.candidates].sort(
          (a, b) => getSortValue(b, sortField) - getSortValue(a, sortField)
        )
      : scan.status === "streaming"
      ? scan.candidates
      : [];

  const scanStatus =
    scan.status === "success" ? scan.data.scanStatus : undefined;

  const isActive = scan.status === "loading" || scan.status === "streaming";

  return (
    <div className="space-y-6">
      {/* Filters row */}
      <div className="flex items-center justify-between">
        <StateFilter
          selectedState={selectedState}
          onStateChange={handleStateChange}
          selectedCity={selectedCity}
          onCityChange={handleCityChange}
          sortField={sortField}
          onSortChange={setSortField}
          disabled={isActive}
        />
        {scan.status === "success" && (
          <div className="text-sm text-muted-foreground">
            {candidates.length} candidate{candidates.length !== 1 ? "s" : ""}
          </div>
        )}
        {scan.status === "streaming" && (
          <div className="text-sm text-muted-foreground">
            {scan.total > 0
              ? `Scoring ${scan.scored}/${scan.total} buildings…`
              : `${scan.scored} building${scan.scored !== 1 ? "s" : ""} scored…`}
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
            {selectedState === "NONE"
              ? "Select a state to begin"
              : "Select a city to start scanning"}
          </p>
          <p className="mt-1 max-w-md text-center text-sm">
            {selectedState === "NONE"
              ? "Choose a state, then a city. The prospecting engine will analyze Microsoft Building Footprints, cross-reference rainfall data, FEMA risk scores, and water costs to find the best candidates."
              : "Choose a city from the dropdown to scan its buildings for rainwater reuse viability."}
          </p>
        </div>
      )}

      {/* Loading state — tile fetch phase, no candidates yet */}
      {scan.status === "loading" && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20">
          <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
          <p className="text-lg font-medium text-foreground">
            Scanning {scan.city}, {scan.state}...
          </p>
          <p className="mt-1 max-w-md text-center text-sm text-muted-foreground">
            Fetching building footprints from Microsoft, looking up county data
            via FCC, querying FEMA risk index, and computing viability scores.
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
            onClick={handleRetry}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      )}

      {/* Streaming — cards appear as buildings are scored */}
      {scan.status === "streaming" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>
              Scoring viability for {scan.city}, {scan.state} &mdash;{" "}
              {scan.total > 0
                ? `${scan.scored} of ${scan.total} buildings analyzed`
                : `${scan.scored} building${scan.scored !== 1 ? "s" : ""} analyzed`}
            </span>
          </div>
          {candidates.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {candidates.map((candidate, i) => (
                <BuildingCard
                  key={`${candidate.centroid_lat}-${candidate.centroid_lon}-${i}`}
                  candidate={candidate}
                />
              ))}
            </div>
          )}
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
                No candidates found for this city
              </p>
              <p className="text-sm">
                Try a different city or state
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
