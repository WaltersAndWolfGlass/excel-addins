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

function InternalImportExtrusionsButton() {
  const [readingExtrusions, setReadingExtrusions] = React.useState(false);
  const excelState = React.useContext(ExcelStateContext);
  const setPartGroups = React.useContext(SetPartGroupsContext);
  const setSelectionStateStore = React.useContext(
    SetSelectionStateStoreContext,
  );
  const setOptimizations = React.useContext(SetPartOptimizationStoreContext);
  const [_, startImportingExtrusions] = React.useTransition();

  async function readExtrusions() {
    setReadingExtrusions(true);
    setSelectionStateStore({});

    startImportingExtrusions(async () => {
      try {
        const excelExtrusionData = new ExcelExtrusionData();
        const parts = await excelExtrusionData.GetParts();
        const optimizer = new Optimizer();
        const groups = await optimizer.GroupParts(parts);

        startImportingExtrusions(() => {
          setPartGroups(groups);
          setOptimizations({});
        });
      } catch (error) {
        toast("Import Extrusions failed. Check the console log for details.");
        console.error(error);
      }
      startImportingExtrusions(() => {
        setReadingExtrusions(false);
      });
    });
  }

  return (
    <Button
      variant="outline"
      onClick={readExtrusions}
      disabled={excelState !== "ready" || readingExtrusions}
    >
      Import Extrusions from Excel
      {readingExtrusions && <Spinner />}
    </Button>
  );
}

export const ImportExtrusionsButton = React.memo(
  InternalImportExtrusionsButton,
);
