import * as React from "react";
import {
  OptimizationMode,
  PartGroup,
  PartOptimization,
  PartOptimizationSettings,
  StockLengths,
} from "@/model/optimization";
import { toast } from "sonner";
import { OptimizationModeSelect } from "./OptimizationModeSelect";
import { OptimizationContext } from "@/components/contexts/OptimizationContext";
import { Field, FieldSet } from "@/components/ui/field";
import { OptimizeActionButton } from "./OptimizeActionButton";
import { ImportExtrusionsButton } from "./ImportExtrusionsButton";
import { ExtrusionTable } from "./extrusion-table/ExtrusionTable";

export function getOptKey(partOptGroupKey: string, stklen: StockLengths) {
  return `${partOptGroupKey} | stklen: ${stklen.length}${stklen.is_standard_length ? " std" : ""}`;
}

export type SelectionStateStore = Record<string, boolean | undefined>;
export type PartOptimizationSettingsStore = Record<
  string,
  PartOptimizationSettings | undefined
>;
export type PartOptimizationStore = Record<
  string,
  PartOptimization | undefined | "optimizing"
>;
export type ExcelState = "ready" | "unchecked" | "failure";

export function OptimizerForm() {
  const [excelState, setExcelState] = React.useState<ExcelState>("unchecked");
  const [partGroups, setPartGroups] = React.useState<PartGroup[]>([]);
  const [optMode, setOptMode] = React.useState<OptimizationMode>("estimate");
  const [selectionStateStore, setSelectionStateStore] =
    React.useState<SelectionStateStore>({});
  const [partOptSettings, setPartOptSettings] =
    React.useState<PartOptimizationSettingsStore>({});
  const [optimizations, setOptimizations] =
    React.useState<PartOptimizationStore>({});

  React.useEffect(() => {
    const checkOffice = async () => {
      const { host } = await Office.onReady();
      if (host !== Office.HostType.Excel) {
        setExcelState("failure");
        toast("Not running in Excel. Can't import or export optimizations.");
        return;
      }
      setExcelState("ready");
    };

    setTimeout(checkOffice, 1000);
  }, []);

  return (
    <div className="m-8">
      <OptimizationContext
        excelState={excelState}
        setExcelState={setExcelState}
        partGroups={partGroups}
        setPartGroups={setPartGroups}
        optMode={optMode}
        setOptMode={setOptMode}
        selectionStateStore={selectionStateStore}
        setSelectionStateStore={setSelectionStateStore}
        partOptSettings={partOptSettings}
        setPartOptSettings={setPartOptSettings}
        optimizations={optimizations}
        setOptimizations={setOptimizations}
      >
        <FieldSet>
          <OptimizationModeSelect />
          <Field>
            <ImportExtrusionsButton />
          </Field>
          <Field className="sticky top-2 bg-background z-50">
            <OptimizeActionButton />
          </Field>
          <ExtrusionTable />
        </FieldSet>
      </OptimizationContext>
    </div>
  );
}
