import * as React from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PartOptimizationGroupCells } from "@/components/optimization/extrusion-table/PartOptimizationGroupCells";
import { Checkbox } from "@/components/ui/checkbox";
import {
  PartGroupsContext,
  SelectionStateStoreContext,
  SetSelectionStateStoreContext,
} from "@/components/contexts/OptimizationContext";
import { SelectionStateStore } from "@/components/optimization/OptimizerForm";
import { PartGroup, PartOptimizationGroup } from "@/model/optimization";
import { CheckedState, SelectRowCell } from "./SelectRowCell";

const getSelectCellKey = (partGroup: PartGroup) =>
  partGroup.key + " | col:Select";
const getPartOptGroupRowKey = (partOptGroup: PartOptimizationGroup) =>
  partOptGroup.key + " | row";
const getPartGroupTotalsRowKey = (partGroup: PartGroup) =>
  partGroup.key + " | totals row";
const getPartGroupTotalsCellsKey = (partGroup: PartGroup) =>
  partGroup.key + " | totals cells";

function InternalExtrusionTable() {
  const partGroups = React.useContext(PartGroupsContext);
  const selectionStateStore = React.useContext(SelectionStateStoreContext);
  const setSelectionStateStore = React.useContext(
    SetSelectionStateStoreContext,
  );

  const selectedCount = partGroups.filter(
    (pg) => selectionStateStore[pg.key] ?? false,
  ).length;
  let selectHeaderState: CheckedState = "indeterminate";
  if (selectedCount == partGroups.length) selectHeaderState = true;
  if (selectedCount == 0) selectHeaderState = false;

  function changeSelectionHeader(state: CheckedState) {
    if (state === true) {
      const selectionState = partGroups.reduce((state, pg) => {
        state[pg.key] = true;
        return state;
      }, {} as SelectionStateStore);
      setSelectionStateStore(selectionState);
      return;
    }
    if (state === false) {
      setSelectionStateStore({} as SelectionStateStore);
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <Checkbox
              checked={selectHeaderState}
              onCheckedChange={changeSelectionHeader}
            />
          </TableHead>
          <TableHead>Extrusion</TableHead>
          <TableHead>Finish</TableHead>
          <TableHead>Groups</TableHead>
          <TableHead>PartQty</TableHead>
          <TableHead>Optimization</TableHead>
          <TableHead>Yield</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {partGroups.map((pg) => {
          const setChecked = (x: boolean) =>
            setSelectionStateStore({ ...selectionStateStore, [pg.key]: x });
          const checked = selectionStateStore[pg.key] === true;
          const toggleChecked = () => setChecked(!checked);
          const rows = pg.part_optimization_groups.map((pog, pogIndex) => (
            <TableRow key={getPartOptGroupRowKey(pog)} onClick={toggleChecked}>
              {pogIndex === 0 && (
                <SelectRowCell
                  key={getSelectCellKey(pg)}
                  partGroup={pg}
                  checked={checked}
                  setChecked={setChecked}
                />
              )}
              <PartOptimizationGroupCells
                key={pog.key}
                partGroup={pg}
                pogIndex={pogIndex}
              />
            </TableRow>
          ));
          if (pg.part_optimization_groups.length > 1) {
            rows.push(
              <TableRow
                key={getPartGroupTotalsRowKey(pg)}
                onClick={toggleChecked}
              >
                <PartOptimizationGroupCells
                  key={getPartGroupTotalsCellsKey(pg)}
                  partGroup={pg}
                  pogIndex="totals"
                />
              </TableRow>,
            );
          }
          return rows;
        })}
      </TableBody>
    </Table>
  );
}
export const ExtrusionTable = React.memo(InternalExtrusionTable);
