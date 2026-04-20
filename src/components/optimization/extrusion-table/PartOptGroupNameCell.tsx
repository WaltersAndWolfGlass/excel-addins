import * as React from "react";

import { PartOptimizationGroup } from "@/model/optimization";
import { TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";

function InternalPartOptGroupNameCell({
  partOptGroup,
  rowSpan = 1,
  className = "",
}: {
  partOptGroup: PartOptimizationGroup;
  rowSpan?: number;
  className?: string;
}) {
  let style = "";
  let color = "";
  let text = partOptGroup.optimization_group;
  if (text === "") {
    text = "(blank)";
    style = "italic";
    color = "text-foreground/60";
  }

  return (
    <TableCell rowSpan={rowSpan} className={cn(style, color, className)}>
      {text}
    </TableCell>
  );
}

export const PartOptGroupNameCell = React.memo(InternalPartOptGroupNameCell);
