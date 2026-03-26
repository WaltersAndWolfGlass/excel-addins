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
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";

export function OptimizationModeSelect({ className }: { className?: string }) {
  const optMode = React.useContext(OptimizationModeContext);
  const setOptMode = React.useContext(SetOptimizationModeContext);
  return (
    <Select
      value={optMode ?? ""}
      onValueChange={(v) =>
        v === "" ? setOptMode(undefined) : setOptMode(v as OptimizationMode)
      }
    >
      <SelectTrigger
        className={cn(className)}
        aria-invalid={optMode === undefined}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <Tooltip>
            <TooltipTrigger asChild>
              <SelectItem value="estimate">Estimate</SelectItem>
            </TooltipTrigger>
            <TooltipContent side="right">
              <ul className="max-w-[15vw] list-disc ms-4 text-pretty">
                <li>
                  Parts over 10&quot; are rounded up to the nearest{" "}
                  <strong>6&quot;</strong> increment.
                </li>
                <li>
                  <strong>3&quot;</strong> from each end of each stock length is
                  trimmed and not used.
                </li>
              </ul>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <SelectItem value="takeoff">Takeoff</SelectItem>
            </TooltipTrigger>
            <TooltipContent side="right">
              <ul className="max-w-[15vw] list-disc ms-4 text-pretty">
                <li>
                  Parts over 10&quot; are rounded up to the nearest{" "}
                  <strong>inch</strong>.
                </li>
                <li>
                  <strong>3&quot;</strong> from each end of each stock length is
                  trimmed and not used.
                </li>
                <li>Parts are optimized to be cut in order if provided.</li>
              </ul>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <SelectItem value="fabrication">Fabrication</SelectItem>
            </TooltipTrigger>
            <TooltipContent side="right">
              <ul className="max-w-[15vw] list-disc ms-4 text-pretty">
                <li>
                  <strong>2&quot;</strong> from each end of each stock length is
                  trimmed and not used.
                </li>
                <li>Parts are optimized to be cut in order if provided.</li>
              </ul>
            </TooltipContent>
          </Tooltip>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
