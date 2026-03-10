import * as React from "react";

import { PartGroup } from "@/model/optimization";
import { TableCell } from "@/components/ui/table";

function InternalFinishCell({
  partGroup,
  rowSpan = 1,
  onClick = undefined,
}: {
  partGroup: PartGroup;
  rowSpan?: number;
  onClick?: () => void;
}) {
  return (
    <TableCell rowSpan={rowSpan} onClick={onClick}>
      {partGroup.finish}
    </TableCell>
  );
}

export const FinishCell = React.memo(InternalFinishCell);
