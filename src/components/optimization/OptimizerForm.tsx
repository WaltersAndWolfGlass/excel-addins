import * as React from "react";
import {
  OptimizationMode,
  PartGroup,
  PartOptimizationStore,
  PartOptimizationSettingsStore,
  StockLengths,
} from "@/model/optimization";
import { toast } from "sonner";
import { OptimizationContext } from "@/components/contexts/OptimizationContext";
import { OptimizeActionButton } from "./OptimizeActionButton";
import { ImportPartsButton } from "./ImportPartsButton";
import { ExtrusionTable } from "./extrusion-table/ExtrusionTable";
import { ExportOptimizationButton } from "./ExportOptimizationButton";

export function getOptKey(partOptGroupKey: string, stklen: StockLengths) {
  return `${partOptGroupKey} | stklen: ${stklen.length}${stklen.is_standard_length ? " std" : ""}`;
}

export type SelectionStateStore = Record<string, boolean | undefined>;
export type ExcelState = "ready" | "unchecked" | "failure";

export function OptimizerForm() {
  const [excelState, setExcelState] = React.useState<ExcelState>("unchecked");
  const [partGroups, setPartGroups] = React.useState<PartGroup[]>([]);
  const [optMode, setOptMode] = React.useState<OptimizationMode | undefined>(
    undefined,
  );
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
        toast.warning(
          "Not running in Excel. Can't import or export optimizations.",
        );
        return;
      }
      setExcelState("ready");
    };

    setTimeout(checkOffice, 1000);
  }, []);

  return (
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
      <div className="sticky top-2 flex flex-row gap-2 z-50 mb-8">
        <div className="bg-background">
          <ImportPartsButton className="shadow-md" />
        </div>
        <div className="grow" />
        <div className="bg-background">
          <OptimizeActionButton className="shadow-md min-w-40" />
        </div>
        <div className="bg-background">
          <ExportOptimizationButton className="shadow-md" />
        </div>
      </div>
      <ExtrusionTable />
    </OptimizationContext>
  );
}
