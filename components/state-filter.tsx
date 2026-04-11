"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { stateOptions } from "@/lib/mock-data";
import { SortField } from "@/lib/types";

export function StateFilter({
  selectedState,
  onStateChange,
  sortField,
  onSortChange,
}: {
  selectedState: string;
  onStateChange: (state: string) => void;
  sortField: SortField;
  onSortChange: (field: SortField) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-muted-foreground">
          State:
        </label>
        <Select value={selectedState} onValueChange={(v) => { if (v !== null) onStateChange(v); }}>
          <SelectTrigger className="w-[140px]">
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

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-muted-foreground">
          Sort by:
        </label>
        <Select
          value={sortField}
          onValueChange={(v) => { if (v !== null) onSortChange(v as SortField); }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="viability_score">Viability Score</SelectItem>
            <SelectItem value="roof_area_sqft">Roof Area</SelectItem>
            <SelectItem value="estimated_savings_year">
              Est. Savings
            </SelectItem>
            <SelectItem value="cooling_tower_confidence">
              Cooling Tower
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
