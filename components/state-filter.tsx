"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SortField, StateOption } from "@/lib/types";
import { CITIES } from "@/lib/cities";

const stateOptions: StateOption[] = [
  { value: "NONE", label: "Select a state..." },
  { value: "TX", label: "Texas" },
  { value: "AZ", label: "Arizona" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "IL", label: "Illinois" },
  { value: "NJ", label: "New Jersey" },
  { value: "PA", label: "Pennsylvania" },
  { value: "WA", label: "Washington" },
];

export function StateFilter({
  selectedState,
  onStateChange,
  selectedCity,
  onCityChange,
  sortField,
  onSortChange,
  disabled,
}: {
  selectedState: string;
  onStateChange: (state: string) => void;
  selectedCity: string;
  onCityChange: (city: string, bbox: [number, number, number, number]) => void;
  sortField: SortField;
  onSortChange: (field: SortField) => void;
  disabled?: boolean;
}) {
  const cities = selectedState !== "NONE" ? (CITIES[selectedState] ?? []) : [];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-muted-foreground">
          State:
        </label>
        <Select
          value={selectedState}
          onValueChange={(v) => {
            if (v !== null) onStateChange(v);
          }}
          disabled={disabled}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {stateOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedState !== "NONE" && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">
            City:
          </label>
          <Select
            key={selectedState}
            value={selectedCity}
            onValueChange={(v) => {
              if (!v || v === "NONE") return;
              const city = cities.find((c) => c.name === v);
              if (city) onCityChange(city.name, city.bbox);
            }}
            disabled={disabled}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a city..." />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city.name} value={city.name}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-muted-foreground">
          Sort by:
        </label>
        <Select
          value={sortField}
          onValueChange={(v) => {
            if (v !== null) onSortChange(v as SortField);
          }}
          disabled={disabled}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="viabilityScore">Viability Score</SelectItem>
            <SelectItem value="area_sqft">Roof Area</SelectItem>
            <SelectItem value="annualSavings">Est. Savings</SelectItem>
            <SelectItem value="coolingTowerConfidence">
              Cooling Tower Conf.
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
