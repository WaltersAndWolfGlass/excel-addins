import * as React from "react";
import { TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { PartGroup } from "@/model/optimization";

export type CheckedState = boolean | "indeterminate";

function InternalSelectRowCell({
  partGroup,
  checked,
}: {
  partGroup: PartGroup;
  checked: boolean;
}) {
  return (
    <TableCell
      rowSpan={
        partGroup.part_optimization_groups.length > 1
          ? partGroup.part_optimization_groups.length + 1
          : 1
      }
    >
      <Checkbox checked={checked} />
    </TableCell>
  );
}
export const SelectRowCell = React.memo(InternalSelectRowCell);
