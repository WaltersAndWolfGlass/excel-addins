import * as React from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  SetOptimizationModeContext,
  OptimizationModeContext,
} from "@/components/contexts/OptimizationContext";

export function OptimizationModeSelect() {
  const optMode = React.useContext(OptimizationModeContext);
  const setOptMode = React.useContext(SetOptimizationModeContext);
  return (
    <Field className="w-full">
      <FieldLabel>Optimization Mode</FieldLabel>
      <Select value={optMode} onValueChange={setOptMode}>
        <SelectTrigger className="w-full">
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
    </Field>
  );
}
