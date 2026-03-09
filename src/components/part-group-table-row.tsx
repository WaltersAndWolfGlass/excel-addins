import * as React from "react";

import {
  Part,
  PartGroup,
  PartOptimization,
  PartOptimizationGroup,
} from "@/model/optimization";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { isPartErrors } from "@/model/excel_extrusion_data";
import { alphaNumCompare } from "@/lib/sorters";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { AlertOctagonIcon, TriangleAlertIcon } from "lucide-react";
import {
  SelectionStateStoreContext,
  SetSelectionStateStoreContext,
  PartOptimizationStoreContext,
} from "./contexts/OptimizationContext";
import { Checkbox } from "./ui/checkbox";

export function PartGroupTableRow({ partGroup }: { partGroup: PartGroup }) {
  const pgKey = partGroup.key;

  const selectionStateStore = React.useContext(SelectionStateStoreContext);
  const selectionState = selectionStateStore[pgKey] ?? false;
  const setSelectionStateStore = React.useContext(
    SetSelectionStateStoreContext,
  );
  const setSelectionState = (selectionState: boolean) =>
    setSelectionStateStore({ ...selectionStateStore, [pgKey]: selectionState });
  const handleClickPartGroupRow = () => {
    const currentState = selectionStateStore[pgKey] ?? false;
    setSelectionState(!currentState);
  };

  const partOptStore = React.useContext(PartOptimizationStoreContext);

  const singleRow = partGroup.part_optimization_groups.length === 1;
  let groupRowSpan = partGroup.part_optimization_groups.length;
  if (partGroup.part_optimization_groups.length > 1) groupRowSpan++;

  const totalsOptimization =
    partGroup.part_optimization_groups.length > 1
      ? partGroup.part_optimization_groups.reduce(
          (o, pog) => {
            const partOpt = partOptStore[pog.key];
            if (partOpt === undefined) return o;
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
        )
      : undefined;

  return (
    <>
      {partGroup.part_optimization_groups.map((g, gIndex) => {
        let cells: React.JSX.Element[] = [];
        if (gIndex === 0) {
          cells.push(
            <TableCell
              key={getSelectCellKey(partGroup)}
              rowSpan={groupRowSpan}
              onClick={handleClickPartGroupRow}
            >
              <Checkbox
                checked={selectionState}
                onCheckedChange={setSelectionState}
              />
            </TableCell>,
            <PartNumberCell
              key={getPartNumberCellKey(partGroup)}
              partGroup={partGroup}
              rowSpan={groupRowSpan}
              onClick={handleClickPartGroupRow}
            />,
            <FinishCell
              key={getFinishCellKey(partGroup)}
              partGroup={partGroup}
              rowSpan={groupRowSpan}
              onClick={handleClickPartGroupRow}
            />,
          );
        }
        cells.push(
          <PartOptGroupCell key={getPartOptGroupCellKey(g)} partOptGroup={g} />,
          <PartQtyGroupCell
            key={getPartQtyCellKey(g)}
            qty={g.part_qty}
            parts={g.parts}
            className={singleRow ? "font-bold" : ""}
          />,
          <OptimizationCell
            key={getOptimizationCellKey(g)}
            optimization={partOptStore[g.key]}
            className={singleRow ? "font-bold" : ""}
          />,
          <YieldCell
            key={getYieldCellKey(g)}
            optimization={partOptStore[g.key]}
            className={singleRow ? "font-bold" : ""}
          />,
        );
        return <TableRow key={g.key + " | row"}>{cells}</TableRow>;
      })}
      {partGroup.part_optimization_groups.length > 1 && (
        <TableRow key={partGroup.key + " | totals"}>
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
        </TableRow>
      )}
    </>
  );
}

const getSelectCellKey = (partGroup: PartGroup) =>
  partGroup.key + " | col:Select";
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

function PartNumberCell({
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

function FinishCell({
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

function PartOptGroupCell({
  partOptGroup,
  rowSpan = 1,
}: {
  partOptGroup: PartOptimizationGroup;
  rowSpan?: number;
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
    <TableCell rowSpan={rowSpan} className={cn(style, color)}>
      {text}
    </TableCell>
  );
}

function PartWarnings({
  parts,
  className = "",
}: {
  parts: Part[];
  className?: string;
}) {
  let missingUnits = parts
    .filter((p) => isPartErrors(p) && p.unit_not_found === true)
    .map((p) => p.unit_number);
  missingUnits = [...new Set(missingUnits)].sort((a, b) =>
    alphaNumCompare(a, b),
  );

  const partsNoLength = parts
    .filter((p) => isPartErrors(p) && p.no_length === true)
    .reduce((sum, p) => sum + p.quantity, 0);
  const partsNoQuantity = parts.filter(
    (p) => isPartErrors(p) && p.no_quantity === true,
  ).length;

  if (missingUnits.length == 0 && partsNoLength <= 0 && partsNoQuantity <= 0)
    return <></>;

  return (
    <Tooltip>
      <TooltipTrigger className={className}>
        <TriangleAlertIcon className="text-amber-400 size-4" />
      </TooltipTrigger>
      <TooltipContent>
        <div className="max-w-[33vw]">
          {partsNoLength > 0 && (
            <>
              <p>
                {partsNoLength} parts have no length. These will still be
                optimized and take up a saw's width of material.
              </p>
              <br />
            </>
          )}
          {partsNoQuantity > 0 && (
            <>
              <p className="mb-3">
                {partsNoQuantity} parts have no quantity. These probably
                shouldn't be in your data.
              </p>
              <br />
            </>
          )}
          {missingUnits.length > 0 && (
            <>
              <p>
                Quantities were not found for the following units. Assumed a
                quantity of 1 for each of them.
              </p>
              <br />
              {missingUnits.length > 10 ? (
                <p>{missingUnits.join(", ")}</p>
              ) : (
                <ul>
                  {missingUnits.map((u) => (
                    <li key={u}>{u}</li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
function PartQtyGroupCell({
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

function OptimizationCell({
  optimization,
  rowSpan = 1,
  className = "",
}: {
  optimization: PartOptimization | undefined;
  rowSpan?: number;
  className?: string;
}) {
  let optimizationResults: React.JSX.Element[] = [];
  if (optimization && optimization.successful) {
    optimizationResults.push(
      <ul className={cn(className, "ms-2")}>
        {optimization.total_stock_lengths
          .toSorted((a, b) => {
            if (a.length > b.length) return -1;
            if (a.length < b.length) return 1;
            return 0;
          })
          .map((s, i) => (
            <li key={i}>{`${s.length}" × ${s.quantity}`}</li>
          ))}
      </ul>,
    );
  }
  if (optimization && optimization.error_messages.length > 0) {
    optimizationResults.push(
      <Tooltip>
        <TooltipTrigger>
          <AlertOctagonIcon className="size-4 text-red-600 ms-2" />
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-[33vw] text-pretty">
            {optimization.error_messages.map((m, i) => (
              <>
                <p key={i}>{m}</p>
                <br />
              </>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>,
    );
  }
  if (optimization && optimization.warning_messages.length > 0) {
    optimizationResults.push(
      <Tooltip>
        <TooltipTrigger>
          <TriangleAlertIcon className="text-amber-400 size-4 ms-2" />
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-[33vw] text-pretty">
            {optimization.warning_messages.map((m, i) => (
              <>
                <p key={i}>{m}</p>
                <br />
              </>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>,
    );
  }

  return (
    <TableCell rowSpan={rowSpan}>
      <div className="flex flex-row">{optimizationResults}</div>
    </TableCell>
  );
}

function YieldCell({
  optimization,
  rowSpan = 1,
  className = "",
}: {
  optimization: PartOptimization | undefined;
  rowSpan?: number;
  className?: string;
}) {
  switch (optimization) {
    case undefined:
      return <TableCell rowSpan={rowSpan} className={cn(className)} />;
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
