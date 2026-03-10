import * as React from "react";
import { TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { PartGroup } from "@/model/optimization";

export type CheckedState = boolean | "indeterminate";

function InternalSelectRowCell({
  partGroup,
  checked,
  setChecked,
}: {
  partGroup: PartGroup;
  checked: boolean;
  setChecked: (s: boolean) => void;
}) {
  console.log("Render SelectRowCell");

  const handleClickCell = () => {
    setChecked(!checked);
  };

  return (
    <TableCell
      rowSpan={
        partGroup.part_optimization_groups.length > 1
          ? partGroup.part_optimization_groups.length + 1
          : 1
      }
      onClick={handleClickCell}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={(v: CheckedState) => setChecked(v === true)}
      />
    </TableCell>
  );
}
export const SelectRowCell = React.memo(InternalSelectRowCell);
