import * as React from "react";

import {
  PartGroup,
  PartOptimization,
  PartOptimizationGroup,
} from "@/model/optimization";
import { TableCell } from "@/components/ui/table";
import {
  PartGroupLinkedStoreContext,
  PartOptimizationStoreContext,
  SelectionStateStoreContext,
  SetPartGroupLinkedStoreContext,
  SetSelectionStateStoreContext,
} from "@/components/contexts/OptimizationContext";
import { PartQtyGroupCell } from "./PartQtyGroupCell";
import { OptimizationCell } from "./OptimizationCell";
import { YieldCell } from "./YieldCell";
import { PartNumberCell } from "./PartNumberCell";
import { FinishCell } from "./FinishCell";
import { PartOptGroupNameCell } from "./PartOptGroupNameCell";
import { SelectRowCell } from "./SelectRowCell";
import { PartGroupLinkCell } from "./PartGroupLinkCell";

const getPartSelectCellKey = (partGroup: PartGroup) =>
  partGroup.key + " | col:Select";
const getGroupSelectCellKey = (partOptGroup: PartOptimizationGroup) =>
  partOptGroup.key + " | col:Select";

function InternalPartOptimizationGroupCells({
  partGroup,
  pogIndex,
}: {
  partGroup: PartGroup;
  pogIndex: number | "totals";
}) {
  const linkStore = React.useContext(PartGroupLinkedStoreContext);
  const setLinkStore = React.useContext(SetPartGroupLinkedStoreContext);
  const partOptStore = React.useContext(PartOptimizationStoreContext);
  const selectionStateStore = React.useContext(SelectionStateStoreContext);

  const singleRowMode = partGroup.part_optimization_groups.length === 1;

  const linked = linkStore[partGroup.key] === true;

  if (pogIndex === "totals") {
    const partOpts = partGroup.part_optimization_groups.map(
      (pog) => partOptStore[pog.key],
    );
    let totalsOptimization: PartOptimization | undefined | "optimizing" =
      undefined;
    if (partOpts.every((o) => o === undefined)) {
      totalsOptimization = undefined;
    } else if (partOpts.some((o) => o === "optimizing")) {
      totalsOptimization = "optimizing";
    } else {
      totalsOptimization = partOpts.reduce<PartOptimization>(
        (o, partOpt) => {
          if (partOpt === undefined || partOpt === "optimizing") return o;
          for (
            let slIndex = 0;
            slIndex < partOpt.total_stock_lengths.length;
            slIndex++
          ) {
            const sl = partOpt.total_stock_lengths[slIndex];
            let oSl = o.total_stock_lengths.find(
              (x) =>
                x.is_standard_length === sl.is_standard_length &&
                x.length === sl.length,
            );
            if (oSl === undefined) {
              oSl = { ...sl, quantity: 0 };
              o.total_stock_lengths.push(oSl);
            }
            if (oSl.quantity !== "unlimited" && sl.quantity !== "unlimited")
              oSl.quantity += sl.quantity;
          }
          o.net_parts += partOpt.net_parts;
          o.gross_length += partOpt.gross_length;
          o.net_part_length += partOpt.net_part_length;
          o.yield = o.net_part_length / o.gross_length;
          return o;
        },
        {
          total_stock_lengths: [],
          cut_list: [],
          cut_stock_lengths: [],
          net_parts: 0,
          gross_length: 0,
          net_part_length: 0,
          yield: 0,
          successful: true,
          warning_messages: [],
          error_messages: [],
        } as PartOptimization,
      );
    }
    return (
      <>
        {!linked && (
          <>
            <TableCell />
            <PartNumberCell
              key={getPartNumberCellKey(partGroup)}
              partGroup={partGroup}
            />
            <FinishCell
              key={getFinishCellKey(partGroup)}
              partGroup={partGroup}
            />
            <TableCell />
          </>
        )}
        <TableCell
          key={getTotalsPartOptGroupCellKey(partGroup)}
          className="font-bold"
        >
          Total
        </TableCell>
        <PartQtyGroupCell
          key={getTotalsPartQtyCellKey(partGroup)}
          qty={partGroup.part_optimization_groups.reduce(
            (sum, pog) => sum + pog.part_qty,
            0,
          )}
          parts={partGroup.part_optimization_groups
            .map((pog) => pog.parts)
            .flat()}
          className="font-bold"
        />
        <OptimizationCell
          key={getTotalsOptimizationCellKey(partGroup)}
          className="font-bold"
          optimization={totalsOptimization}
        />
        <YieldCell
          key={getTotalsYieldCellKey(partGroup)}
          className="font-bold"
          optimization={totalsOptimization}
        />
      </>
    );
  }

  const pog = partGroup.part_optimization_groups[pogIndex];

  const cells: React.JSX.Element[] = [];

  if (!linked) {
    const checked = selectionStateStore[pog.key] === true;
    cells.push(
      <SelectRowCell key={getGroupSelectCellKey(pog)} checked={checked} />,
    );

    cells.push(
      <PartNumberCell
        key={getPartNumberCellKey(partGroup)}
        partGroup={partGroup}
      />,
      <FinishCell key={getFinishCellKey(partGroup)} partGroup={partGroup} />,
      <PartGroupLinkCell
        key={getLinkedCellKey(partGroup)}
        pgKey={partGroup.key}
      />,
    );
  } else if (pogIndex === 0) {
    const checked = selectionStateStore[partGroup.key] === true;
    const rowSpan =
      partGroup.part_optimization_groups.length +
      (partGroup.part_optimization_groups.length === 1 ? 0 : 1);
    cells.push(
      <SelectRowCell
        key={getPartSelectCellKey(partGroup)}
        checked={checked}
        rowSpan={rowSpan}
      />,
      <PartNumberCell
        key={getPartNumberCellKey(partGroup)}
        partGroup={partGroup}
        rowSpan={
          partGroup.part_optimization_groups.length + (singleRowMode ? 0 : 1)
        }
      />,
      <FinishCell
        key={getFinishCellKey(partGroup)}
        partGroup={partGroup}
        rowSpan={
          partGroup.part_optimization_groups.length + (singleRowMode ? 0 : 1)
        }
      />,
      <PartGroupLinkCell
        key={getLinkedCellKey(partGroup)}
        pgKey={partGroup.key}
        rowSpan={rowSpan}
      />,
    );
  }

  cells.push(
    <PartOptGroupNameCell
      key={getPartOptGroupCellKey(pog)}
      partOptGroup={pog}
      className={singleRowMode ? "font-bold" : ""}
    />,
    <PartQtyGroupCell
      key={getPartQtyCellKey(pog)}
      qty={pog.part_qty}
      parts={pog.parts}
      className={singleRowMode ? "font-bold" : ""}
    />,
    <OptimizationCell
      key={getOptimizationCellKey(pog)}
      optimization={partOptStore[pog.key]}
      className={singleRowMode ? "font-bold" : ""}
    />,
    <YieldCell
      key={getYieldCellKey(pog)}
      optimization={partOptStore[pog.key]}
      className={singleRowMode ? "font-bold" : ""}
    />,
  );

  return cells;
}

export const PartOptimizationGroupCells = React.memo(
  InternalPartOptimizationGroupCells,
);

const getPartNumberCellKey = (partGroup: PartGroup) =>
  partGroup.key + " | col:PartNumber";
const getFinishCellKey = (partGroup: PartGroup) =>
  partGroup.key + " | col:Finish";
const getLinkedCellKey = (partGroup: PartGroup) =>
  partGroup.key + " | col:Linked";
const getPartOptGroupCellKey = (partOptGroup: PartOptimizationGroup) =>
  partOptGroup.key + " | col:PartOptGroup";
const getPartQtyCellKey = (partOptGroup: PartOptimizationGroup) =>
  partOptGroup.key + " | col:PartQty";
const getOptimizationCellKey = (partOptGroup: PartOptimizationGroup) =>
  partOptGroup.key + " | col:Optimization";
const getYieldCellKey = (partOptGroup: PartOptimizationGroup) =>
  partOptGroup.key + " | col:Yield";

const getTotalsPartOptGroupCellKey = (partGroup: PartGroup) =>
  partGroup.key + " | totals | col:PartOptGroup";
const getTotalsPartQtyCellKey = (partGroup: PartGroup) =>
  partGroup.key + " | totals | col:PartQty";
const getTotalsOptimizationCellKey = (partGroup: PartGroup) =>
  partGroup.key + " | totals | col:Optimization";
const getTotalsYieldCellKey = (partGroup: PartGroup) =>
  partGroup.key + " | totals | col:Yield";
