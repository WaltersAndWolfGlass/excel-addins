import * as React from "react";
import { Button } from "../ui/button";
import { DownloadIcon } from "lucide-react";
import {
  ExcelStateContext,
  PartGroupsContext,
  PartOptimizationStoreContext,
} from "../contexts/OptimizationContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ExcelOptimizationExporter from "@/model/excel_optimization_exporter";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Spinner } from "../ui/spinner";

export function ExportOptimizationButton({
  className,
}: {
  className?: string;
}) {
  const [exporting, setExporting] = React.useState(false);
  const excelState = React.useContext(ExcelStateContext);
  const partGroups = React.useContext(PartGroupsContext);
  const partOptStore = React.useContext(PartOptimizationStoreContext);
  const [_, startExport] = React.useTransition();

  async function exportOptimizations() {
    setExporting(true);
    startExport(async () => {
      try {
        const exporter = new ExcelOptimizationExporter(
          partGroups,
          partOptStore,
        );
        const messages = await exporter.exportAll();
        messages.forEach((m) => toast.success(m));
      } catch (error) {
        toast.error("Error in export... check console.");
        console.error(error);
      }
      startExport(() => {
        setExporting(false);
      });
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className={cn(className)}
          variant="outline"
          disabled={excelState !== "ready" || exporting}
        >
          {exporting ? <Spinner /> : <DownloadIcon />}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Confirmation</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Exporting this optimization will delete existing data in WWOpt tables
          and sheets in Excel, replacing stock length sizes and quantities from
          previous runs, cut list information, etc. Are you sure you want to
          export?
        </DialogDescription>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button onClick={exportOptimizations}>Export</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
