import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  ExcelStateContext,
  SetPartGroupsContext,
  SetPartOptimizationStoreContext,
  SetSelectionStateStoreContext,
} from "@/components/contexts/OptimizationContext";
import { ExcelExtrusionData } from "@/model/excel_extrusion_data";
import { Optimizer } from "@/model/optimization";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

function InternalImportPartsButton({ className }: { className?: string }) {
  const [readingParts, setReadingParts] = React.useState(false);
  const excelState = React.useContext(ExcelStateContext);
  const setPartGroups = React.useContext(SetPartGroupsContext);
  const setSelectionStateStore = React.useContext(
    SetSelectionStateStoreContext,
  );
  const setOptimizations = React.useContext(SetPartOptimizationStoreContext);
  const [_, startImportingParts] = React.useTransition();

  async function readParts() {
    setReadingParts(true);
    setSelectionStateStore({});

    startImportingParts(async () => {
      try {
        const excelExtrusionData = new ExcelExtrusionData();
        const parts = await excelExtrusionData.GetParts();
        const optimizer = new Optimizer();
        const groups = await optimizer.GroupParts(parts);

        startImportingParts(() => {
          setPartGroups(groups);
          setOptimizations({});
        });
      } catch (error) {
        toast("Import Parts failed. Check the console log for details.");
        console.error(error);
      }
      startImportingParts(() => {
        setReadingParts(false);
      });
    });
  }

  return (
    <Button
      className={cn(className)}
      variant="outline"
      onClick={readParts}
      disabled={excelState !== "ready" || readingParts}
    >
      Import Parts from Excel
      {readingParts && <Spinner />}
    </Button>
  );
}

export const ImportPartsButton = React.memo(InternalImportPartsButton);
