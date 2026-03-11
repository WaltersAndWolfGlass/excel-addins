import * as React from "react";

import { PartOptimization } from "@/model/optimization";
import { TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertOctagonIcon, TriangleAlertIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function InternalOptimizationCell({
  optimization,
  rowSpan = 1,
  className = "",
}: {
  optimization: PartOptimization | undefined | "optimizing";
  rowSpan?: number;
  className?: string;
}) {
  if (optimization === "optimizing")
    return (
      <TableCell rowSpan={rowSpan}>
        <div className="flex flex-row">
          <Skeleton className="h-4 w-full" />
        </div>
      </TableCell>
    );

  let optimizationResults: React.JSX.Element[] = [];
  if (optimization && optimization.successful) {
    optimizationResults.push(
      <ul key="stklenList" className={cn(className, "ms-2")}>
        {optimization.total_stock_lengths
          .toSorted((a, b) => {
            if (a.length > b.length) return -1;
            if (a.length < b.length) return 1;
            return 0;
          })
          .map((s, i) => (
            <li key={i}>{`${s.length}" × ${s.quantity}`}</li>
          ))}
      </ul>,
    );
  }
  if (optimization && optimization.error_messages.length > 0) {
    optimizationResults.push(
      <Tooltip key="errors">
        <TooltipTrigger>
          <AlertOctagonIcon className="size-4 text-destructive ms-2" />
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-[33vw] text-pretty">
            {optimization.error_messages.map((m, i) => (
              <>
                <p key={i} className="text-pretty">
                  {m}
                </p>
                <br />
              </>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>,
    );
  }
  if (optimization && optimization.warning_messages.length > 0) {
    optimizationResults.push(
      <Tooltip key="warnings">
        <TooltipTrigger>
          <TriangleAlertIcon className="text-warning size-4 ms-2" />
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-[33vw] text-pretty">
            {optimization.warning_messages.map((m, i) => (
              <>
                <p key={i} className="text-pretty">
                  {m}
                </p>
                <br />
              </>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>,
    );
  }

  return (
    <TableCell rowSpan={rowSpan}>
      <div className="flex flex-row gap-2">{optimizationResults}</div>
    </TableCell>
  );
}

export const OptimizationCell = React.memo(InternalOptimizationCell);
