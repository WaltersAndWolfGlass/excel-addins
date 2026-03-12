import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  ExcelStateContext,
  PartGroupsContext,
  SetPartGroupsContext,
  SetPartOptimizationStoreContext,
  SetSelectionStateStoreContext,
} from "@/components/contexts/OptimizationContext";
import { ExcelExtrusionData } from "@/model/excel_extrusion_data";
import { Optimizer } from "@/model/optimization";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";

function InternalImportPartsButton({ className }: { className?: string }) {
  const [readingParts, setReadingParts] = React.useState(false);
  const excelState = React.useContext(ExcelStateContext);
  const partGroups = React.useContext(PartGroupsContext);
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

  const renderMainButton = (onClick?: () => void) => {
    return (
      <Button
        className={cn(className)}
        variant="outline"
        onClick={onClick}
        disabled={excelState !== "ready" || readingParts}
      >
        Import Parts from Excel
        {readingParts && <Spinner />}
      </Button>
    );
  };

  if (partGroups.length == 0) return renderMainButton(readParts);

  return (
    <Dialog>
      <DialogTrigger asChild>{renderMainButton()}</DialogTrigger>
      <DialogContent>
        <DialogTitle>Import Parts</DialogTitle>
        <DialogDescription className="text-pretty">
          Importing parts will replace all the parts and optimizations in the
          form. Are you sure?
        </DialogDescription>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button onClick={readParts}>Import</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const ImportPartsButton = React.memo(InternalImportPartsButton);
