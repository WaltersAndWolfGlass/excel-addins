import * as React from "react";

import {
  PartGroup,
  PartOptimization,
  PartOptimizationGroup,
} from "@/model/optimization";
import { TableCell } from "@/components/ui/table";
import { PartOptimizationStoreContext } from "@/components/contexts/OptimizationContext";
import { PartQtyGroupCell } from "./PartQtyGroupCell";
import { OptimizationCell } from "./OptimizationCell";
import { YieldCell } from "./YieldCell";
import { PartNumberCell } from "./PartNumberCell";
import { FinishCell } from "./FinishCell";
import { PartOptGroupNameCell } from "./PartOptGroupNameCell";

function InternalPartOptimizationGroupCells({
  partGroup,
  pogIndex,
}: {
  partGroup: PartGroup;
  pogIndex: number | "totals";
}) {
  console.log("Render PartOptimizationGroupCells");
  const partOptStore = React.useContext(PartOptimizationStoreContext);

  const singleRowMode = partGroup.part_optimization_groups.length === 1;
  let groupRowSpan = partGroup.part_optimization_groups.length;
  if (partGroup.part_optimization_groups.length > 1) groupRowSpan++;

  if (pogIndex === "totals") {
    const totalsOptimization = partGroup.part_optimization_groups.reduce(
      (o, pog) => {
        const partOpt = partOptStore[pog.key];
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
    return (
      <>
        <TableCell
          key={getTotalsPartOptGroupCellKey(partGroup)}
          className="italic text-foreground/50"
        ></TableCell>
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

  return (
    <>
      {pogIndex === 0 && (
        <PartNumberCell
          key={getPartNumberCellKey(partGroup)}
          partGroup={partGroup}
          rowSpan={groupRowSpan}
        />
      )}
      {pogIndex === 0 && (
        <FinishCell
          key={getFinishCellKey(partGroup)}
          partGroup={partGroup}
          rowSpan={groupRowSpan}
        />
      )}
      <PartOptGroupNameCell
        key={getPartOptGroupCellKey(pog)}
        partOptGroup={pog}
      />
      <PartQtyGroupCell
        key={getPartQtyCellKey(pog)}
        qty={pog.part_qty}
        parts={pog.parts}
        className={singleRowMode ? "font-bold" : ""}
      />
      <OptimizationCell
        key={getOptimizationCellKey(pog)}
        optimization={partOptStore[pog.key]}
        className={singleRowMode ? "font-bold" : ""}
      />
      <YieldCell
        key={getYieldCellKey(pog)}
        optimization={partOptStore[pog.key]}
        className={singleRowMode ? "font-bold" : ""}
      />
    </>
  );
}

export const PartOptimizationGroupCells = React.memo(
  InternalPartOptimizationGroupCells,
);

const getPartNumberCellKey = (partGroup: PartGroup) =>
  partGroup.key + " | col:PartNumber";
const getFinishCellKey = (partGroup: PartGroup) =>
  partGroup.key + " | col:Finish";
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
