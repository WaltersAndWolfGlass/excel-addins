import * as React from "react";

import { Part } from "@/model/optimization";
import { TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { PartWarnings } from "./PartWarnings";

function InternalPartQtyGroupCell({
  qty,
  parts,
  rowSpan = 1,
  className = "",
}: {
  qty: number;
  parts: Part[];
  rowSpan?: number;
  className?: string;
}) {
  return (
    <TableCell rowSpan={rowSpan} className={cn(className)}>
      {qty}
      <PartWarnings parts={parts} className="relative top-0.75 ms-1" />
    </TableCell>
  );
}

export const PartQtyGroupCell = React.memo(InternalPartQtyGroupCell);
