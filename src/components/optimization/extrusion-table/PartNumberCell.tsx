import * as React from "react";

import { PartGroup } from "@/model/optimization";
import { TableCell } from "@/components/ui/table";

function InternalPartNumberCell({
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
      {partGroup.part_number}
    </TableCell>
  );
}

export const PartNumberCell = React.memo(InternalPartNumberCell);
