import * as React from "react";
import { TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

export type CheckedState = boolean | "indeterminate";

function InternalSelectRowCell({
  checked,
  rowSpan = undefined,
}: {
  checked: boolean;
  rowSpan?: number;
}) {
  return (
    <TableCell rowSpan={rowSpan}>
      <Checkbox checked={checked} />
    </TableCell>
  );
}
export const SelectRowCell = React.memo(InternalSelectRowCell);
