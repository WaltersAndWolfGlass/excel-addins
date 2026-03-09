import * as React from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExcelExtrusionData } from "@/model/excel_extrusion_data";
import {
  OptimizationMode,
  Optimizer,
  PartGroup,
  PartOptimization,
  PartOptimizationSettings,
  StockLengths,
} from "@/model/optimization";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PartGroupTableRow } from "./part-group-table-row";
import { OptimizationModeSelect } from "./optimization-mode-select";
import {
  PartGroupsContext,
  OptimizationModeContext,
  SetOptimizationModeContext,
  SelectionStateStoreContext,
  SetSelectionStateStoreContext,
  PartOptimizationSettingsStoreContext,
  SetPartOptimizationSettingsStoreContext,
  PartOptimizationStoreContext,
  SetPartOptimizationStoreContext,
} from "./contexts/OptimizationContext";
import { Field, FieldSet } from "./ui/field";
import { Checkbox } from "./ui/checkbox";
import { OptimizeActionButton } from "./optimize-action-button";

export function getOptKey(partOptGroupKey: string, stklen: StockLengths) {
  return `${partOptGroupKey} | stklen: ${stklen.length}${stklen.is_standard_length ? " std" : ""}`;
}

type CheckedState = boolean | "indeterminate";
export type SelectionStateStore = Record<string, boolean | undefined>;
export type PartOptimizationSettingsStore = Record<
  string,
  PartOptimizationSettings | undefined
>;
export type PartOptimizationStore = Record<
  string,
  PartOptimization | undefined
>;

export function OptimizerForm() {
  const [officeReady, setOfficeReady] = React.useState(false);
  const [readingExtrusions, setReadingExtrusions] = React.useState(false);
  const [partGroups, setPartGroups] = React.useState<PartGroup[]>([]);
  const [optMode, setOptMode] = React.useState<OptimizationMode>("estimate");
  const [selectedGroups, setSelectedGroups] =
    React.useState<SelectionStateStore>({});
  const [partOptSettings, setPartOptSettings] =
    React.useState<PartOptimizationSettingsStore>({});
  const [optimizations, setOptimizations] =
    React.useState<PartOptimizationStore>({});

  const selectedCount = partGroups
    .map((pg) => selectedGroups[pg.key] ?? false)
    .filter((x) => x).length;
  let selectHeaderState: CheckedState = "indeterminate";
  if (selectedCount == partGroups.length) selectHeaderState = true;
  if (selectedCount == 0) selectHeaderState = false;

  function changeSelectionHeader(state: CheckedState) {
    if (state === true) {
      const selectionState = partGroups.reduce((state, pg) => {
        state[pg.key] = true;
        return state;
      }, {} as SelectionStateStore);
      setSelectedGroups(selectionState);
      return;
    }
    if (state === false) {
      setSelectedGroups({} as SelectionStateStore);
    }
  }

  React.useEffect(() => {
    try {
      Office.onReady().then(() => setOfficeReady(true));
    } catch {
      setOfficeReady(true);
    }
  });

  async function readExtrusions() {
    setReadingExtrusions(true);

    try {
      const excelExtrusionData = new ExcelExtrusionData();
      const parts = await excelExtrusionData.GetParts();
      const optimizer = new Optimizer();
      const groups = await optimizer.GroupParts(parts);

      setPartGroups(groups);
      setOptimizations({});
      setSelectedGroups({});
      setOptimizations({});
    } catch (error) {
      toast(JSON.stringify(error));
    }

    setReadingExtrusions(false);
  }

  return (
    <div className="m-8">
      <PartGroupsContext.Provider value={partGroups}>
        <OptimizationModeContext.Provider value={optMode}>
          <SetOptimizationModeContext.Provider value={setOptMode}>
            <SelectionStateStoreContext.Provider value={selectedGroups}>
              <SetSelectionStateStoreContext.Provider value={setSelectedGroups}>
                <PartOptimizationSettingsStoreContext.Provider
                  value={partOptSettings}
                >
                  <SetPartOptimizationSettingsStoreContext.Provider
                    value={setPartOptSettings}
                  >
                    <PartOptimizationStoreContext.Provider
                      value={optimizations}
                    >
                      <SetPartOptimizationStoreContext.Provider
                        value={setOptimizations}
                      >
                        <FieldSet>
                          <OptimizationModeSelect />
                          {officeReady ? (
                            <Field>
                              <Button
                                variant="outline"
                                onClick={readExtrusions}
                                disabled={readingExtrusions}
                              >
                                Import Extrusions from Excel
                              </Button>
                            </Field>
                          ) : (
                            <Field>
                              <Skeleton className="w-full h-9" />
                            </Field>
                          )}
                          <Field className="sticky top-2 bg-background z-50">
                            <OptimizeActionButton />
                          </Field>
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
                              {partGroups.map((x) => (
                                <PartGroupTableRow key={x.key} partGroup={x} />
                              ))}
                            </TableBody>
                          </Table>
                        </FieldSet>
                      </SetPartOptimizationStoreContext.Provider>
                    </PartOptimizationStoreContext.Provider>
                  </SetPartOptimizationSettingsStoreContext.Provider>
                </PartOptimizationSettingsStoreContext.Provider>
              </SetSelectionStateStoreContext.Provider>
            </SelectionStateStoreContext.Provider>
          </SetOptimizationModeContext.Provider>
        </OptimizationModeContext.Provider>
      </PartGroupsContext.Provider>
    </div>
  );
}
