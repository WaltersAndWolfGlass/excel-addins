import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PartOptimizationGroupCells } from "@/components/optimization/extrusion-table/PartOptimizationGroupCells";
import { Checkbox } from "@/components/ui/checkbox";
import {
  PartGroupLinkedStoreContext,
  PartGroupsContext,
  SelectionStateStoreContext,
  SetPartGroupLinkedStoreContext,
  SetSelectionStateStoreContext,
} from "@/components/contexts/OptimizationContext";
import { SelectionStateStore } from "@/components/optimization/OptimizerForm";
import {
  PartGroup,
  PartGroupLinkedStore,
  PartOptimizationGroup,
} from "@/model/optimization";
import { CheckedState, SelectRowCell } from "./SelectRowCell";
import { Button } from "@/components/ui/button";
import { Link2OffIcon, LinkIcon, UnlinkIcon } from "lucide-react";

const getPartOptGroupRowKey = (partOptGroup: PartOptimizationGroup) =>
  partOptGroup.key + " | row";
const getPartGroupTotalsRowKey = (partGroup: PartGroup) =>
  partGroup.key + " | totals row";
const getPartGroupTotalsCellsKey = (partGroup: PartGroup) =>
  partGroup.key + " | totals cells";

function InternalExtrusionTable() {
  const linkStore = React.useContext(PartGroupLinkedStoreContext);
  const setLinkStore = React.useContext(SetPartGroupLinkedStoreContext);
  const partGroups = React.useContext(PartGroupsContext);
  const selectionStateStore = React.useContext(SelectionStateStoreContext);
  const setSelectionStateStore = React.useContext(
    SetSelectionStateStoreContext,
  );

  const [shiftSelectState, setShiftSelectState] = React.useState<
    { pivot: string; store: SelectionStateStore } | undefined
  >(undefined);

  const keyOrder = React.useMemo(
    () =>
      partGroups.flatMap((pg) =>
        linkStore[pg.key] === true
          ? [pg.key]
          : pg.part_optimization_groups.map((pog) => pog.key),
      ),
    [partGroups, linkStore],
  );

  const selectedCount = keyOrder.filter(
    (key) => selectionStateStore[key] ?? false,
  ).length;

  let selectHeaderState: CheckedState = "indeterminate";
  if (selectedCount == keyOrder.length) selectHeaderState = true;
  if (selectedCount == 0) selectHeaderState = false;

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
    const pivotIndex = keyOrder.findIndex((x) => x === shiftSelectState.pivot);
    const selectedIndex = keyOrder.findIndex((x) => x === selectedKey);

    if (pivotIndex < 0 || selectedIndex < 0) {
      return;
    }

    const keys =
      pivotIndex <= selectedIndex
        ? keyOrder.slice(pivotIndex, selectedIndex + 1)
        : keyOrder.slice(selectedIndex, pivotIndex + 1);
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
      const selectionState = keyOrder.reduce((state, key) => {
        state[key] = true;
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

  let linkedHeaderState: CheckedState = "indeterminate";
  const linkedPartGroups = partGroups.filter(
    (pg) => linkStore[pg.key] === true,
  ).length;
  if (linkedPartGroups === partGroups.length) linkedHeaderState = true;
  if (linkedPartGroups === 0) linkedHeaderState = false;

  function changeLinkedHeader() {
    switch (linkedHeaderState) {
      case "indeterminate":
      case false:
        const newLinkStore: PartGroupLinkedStore = {};
        partGroups.forEach((pg) => (newLinkStore[pg.key] = true));
        setLinkStore(newLinkStore);
        break;
      case true:
      default:
        setLinkStore({});
    }
    setSelectionStateStore({} as SelectionStateStore);
    setShiftSelectState(undefined);
  }

  return (
    <>
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
            <TableHead>
              <Button
                onClick={changeLinkedHeader}
                variant="ghost"
                size="icon-xs"
              >
                {linkedHeaderState === true && <LinkIcon />}
                {linkedHeaderState === false && <UnlinkIcon />}
                {linkedHeaderState === "indeterminate" && <Link2OffIcon />}
              </Button>
            </TableHead>
            <TableHead>Release/Level</TableHead>
            <TableHead>PartQty</TableHead>
            <TableHead>Optimization</TableHead>
            <TableHead>Yield</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {partGroups.map((pg) => {
            const rows: React.JSX.Element[] = [];
            const linked = linkStore[pg.key] === true;
            if (linked) {
              const clickHandler: React.MouseEventHandler<
                HTMLTableRowElement
              > = (e) => selectionHandler(pg.key, e.ctrlKey, e.shiftKey);
              rows.push(
                ...pg.part_optimization_groups.map((pog, pogIndex) => {
                  return (
                    <TableRow
                      key={getPartOptGroupRowKey(pog)}
                      onClick={clickHandler}
                    >
                      <PartOptimizationGroupCells
                        key={pog.key}
                        partGroup={pg}
                        pogIndex={pogIndex}
                      />
                    </TableRow>
                  );
                }),
              );
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
            } else {
              rows.push(
                ...pg.part_optimization_groups.map((pog, pogIndex) => {
                  const clickHandler: React.MouseEventHandler<
                    HTMLTableRowElement
                  > = (e) => selectionHandler(pog.key, e.ctrlKey, e.shiftKey);
                  return (
                    <TableRow
                      key={getPartOptGroupRowKey(pog)}
                      onClick={clickHandler}
                    >
                      <PartOptimizationGroupCells
                        key={pog.key}
                        partGroup={pg}
                        pogIndex={pogIndex}
                      />
                    </TableRow>
                  );
                }),
              );
              if (pg.part_optimization_groups.length > 1) {
                rows.push(
                  <TableRow key={getPartGroupTotalsRowKey(pg)}>
                    <PartOptimizationGroupCells
                      key={getPartGroupTotalsCellsKey(pg)}
                      partGroup={pg}
                      pogIndex="totals"
                    />
                  </TableRow>,
                );
              }
            }
            return rows;
          })}
        </TableBody>
      </Table>
    </>
  );
}
export const ExtrusionTable = React.memo(InternalExtrusionTable);
