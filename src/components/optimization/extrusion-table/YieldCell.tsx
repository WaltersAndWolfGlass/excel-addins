import * as React from "react";

import { PartOptimization } from "@/model/optimization";
import { TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

function InternalYieldCell({
  optimization,
  rowSpan = 1,
  className = "",
}: {
  optimization: PartOptimization | undefined | "optimizing";
  rowSpan?: number;
  className?: string;
}) {
  switch (optimization) {
    case undefined:
      return <TableCell rowSpan={rowSpan} className={cn(className)} />;
    case "optimizing":
      return (
        <TableCell rowSpan={rowSpan} className={cn(className)}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      );
    default:
      if (!optimization.successful) {
        return <TableCell rowSpan={rowSpan} className={cn(className)} />;
      } else {
        return (
          <TableCell rowSpan={rowSpan} className={cn(className)}>
            {isNaN(optimization.yield)
              ? "-"
              : `${(optimization.yield * 100).toFixed(1)}%`}
          </TableCell>
        );
      }
  }
}

export const YieldCell = React.memo(InternalYieldCell);
