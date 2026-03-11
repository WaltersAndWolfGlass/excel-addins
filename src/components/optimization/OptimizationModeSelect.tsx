import * as React from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import {
  SetOptimizationModeContext,
  OptimizationModeContext,
} from "@/components/contexts/OptimizationContext";
import { cn } from "@/lib/utils";
import { OptimizationMode } from "@/model/optimization";

export function OptimizationModeSelect({ className }: { className?: string }) {
  const optMode = React.useContext(OptimizationModeContext);
  const setOptMode = React.useContext(SetOptimizationModeContext);
  return (
    <Select
      value={optMode}
      onValueChange={(v) => setOptMode(v as OptimizationMode)}
    >
      <SelectTrigger
        className={cn(className)}
        aria-invalid={optMode === undefined}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="estimate">Estimate</SelectItem>
          <SelectItem value="takeoff">Takeoff</SelectItem>
          <SelectItem value="fabrication">Fabrication</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
