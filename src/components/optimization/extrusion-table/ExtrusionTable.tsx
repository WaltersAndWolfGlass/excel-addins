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

  const [shiftSelectState, setShiftSelectState] = React.useState<
    { pivot: string; store: SelectionStateStore } | undefined
  >(undefined);

  const selectedCount = partGroups.filter(
    (pg) => selectionStateStore[pg.key] ?? false,
  ).length;
  let selectHeaderState: CheckedState = "indeterminate";
  if (selectedCount == partGroups.length) selectHeaderState = true;
  if (selectedCount == 0) selectHeaderState = false;

  const pgKeyOrder = React.useMemo(
    () => partGroups.map((pg) => pg.key),
    [partGroups],
  );

  const selectionHandler = (
    selectedKey: string,
    ctrlActive: boolean,
    shiftActive: boolean,
  ) => {
    const currentState = selectionStateStore[selectedKey] ?? false;

    if (!ctrlActive && (!shiftActive || shiftSelectState === undefined)) {
      const newStore = { [selectedKey]: true };
      setSelectionStateStore(newStore);
      setShiftSelectState({ pivot: selectedKey, store: newStore });
      return;
    }

    if (!shiftActive || shiftSelectState === undefined) {
      const newStore = { ...selectionStateStore, [selectedKey]: !currentState };
      setSelectionStateStore(newStore);
      setShiftSelectState({ pivot: selectedKey, store: newStore });
      return;
    }

    const desiredRangeState = shiftSelectState.store[shiftSelectState.pivot];
    const pivotIndex = pgKeyOrder.findIndex(
      (x) => x === shiftSelectState.pivot,
    );
    const selectedIndex = pgKeyOrder.findIndex((x) => x === selectedKey);

    if (pivotIndex < 0 || selectedIndex < 0) {
      return;
    }

    const keys =
      pivotIndex <= selectedIndex
        ? pgKeyOrder.slice(pivotIndex, selectedIndex + 1)
        : pgKeyOrder.slice(selectedIndex, pivotIndex + 1);
    const stateChanges = keys.reduce((result, key) => {
      result[key] = desiredRangeState;
      return result;
    }, {} as SelectionStateStore);

    if (!ctrlActive) {
      setSelectionStateStore(stateChanges);
      return;
    }

    setSelectionStateStore({ ...shiftSelectState.store, ...stateChanges });
  };

  function changeSelectionHeader(state: CheckedState) {
    if (state === true) {
      const selectionState = partGroups.reduce((state, pg) => {
        state[pg.key] = true;
        return state;
      }, {} as SelectionStateStore);
      setSelectionStateStore(selectionState);
      setShiftSelectState(undefined);
      return;
    }

    if (state === false) {
      setSelectionStateStore({} as SelectionStateStore);
      setShiftSelectState(undefined);
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
          const checked = selectionStateStore[pg.key] === true;
          const clickHandler: React.MouseEventHandler<HTMLTableRowElement> = (
            e,
          ) => selectionHandler(pg.key, e.ctrlKey, e.shiftKey);
          const rows = pg.part_optimization_groups.map((pog, pogIndex) => (
            <TableRow key={getPartOptGroupRowKey(pog)} onClick={clickHandler}>
              {pogIndex === 0 && (
                <SelectRowCell
                  key={getSelectCellKey(pg)}
                  partGroup={pg}
                  checked={checked}
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
                onClick={clickHandler}
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
