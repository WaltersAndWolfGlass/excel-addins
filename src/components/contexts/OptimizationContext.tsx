import * as React from "react";
import {
  SelectionStateStore,
  PartOptimizationStore,
  PartOptimizationSettingsStore,
  ExcelState,
} from "../optimization/OptimizerForm";
import { OptimizationMode, PartGroup } from "@/model/optimization";

export const ExcelStateContext = React.createContext<ExcelState>("unchecked");
export const SetExcelStateContext = React.createContext<
  (s: ExcelState) => void
>((_) => {});

export const PartGroupsContext = React.createContext<PartGroup[]>([]);
export const SetPartGroupsContext = React.createContext<
  (p: PartGroup[]) => void
>((_) => {});

export const OptimizationModeContext = React.createContext<
  OptimizationMode | undefined
>(undefined);
export const SetOptimizationModeContext = React.createContext<
  (m: OptimizationMode | undefined) => void
>((_) => {});

export const SelectionStateStoreContext =
  React.createContext<SelectionStateStore>({});
export const SetSelectionStateStoreContext = React.createContext<
  (x: SelectionStateStore) => void
>((_) => {});

export const PartOptimizationStoreContext =
  React.createContext<PartOptimizationStore>({});
export const SetPartOptimizationStoreContext = React.createContext<
  (x: PartOptimizationStore) => void
>((_) => {});

export const PartOptimizationSettingsStoreContext =
  React.createContext<PartOptimizationSettingsStore>({});
export const SetPartOptimizationSettingsStoreContext = React.createContext<
  (x: PartOptimizationSettingsStore) => void
>((_) => {});

function InternalOptimizationContext({
  excelState,
  setExcelState,
  partGroups,
  setPartGroups,
  optMode,
  setOptMode,
  selectionStateStore,
  setSelectionStateStore,
  partOptSettings,
  setPartOptSettings,
  optimizations,
  setOptimizations,
  children,
}: {
  excelState: ExcelState;
  setExcelState: (s: ExcelState) => void;
  partGroups: PartGroup[];
  setPartGroups: (p: PartGroup[]) => void;
  optMode: OptimizationMode | undefined;
  setOptMode: (m: OptimizationMode | undefined) => void;
  selectionStateStore: SelectionStateStore;
  setSelectionStateStore: (s: SelectionStateStore) => void;
  partOptSettings: PartOptimizationSettingsStore;
  setPartOptSettings: (s: PartOptimizationSettingsStore) => void;
  optimizations: PartOptimizationStore;
  setOptimizations: (s: PartOptimizationStore) => void;
  children: React.ReactNode;
}) {
  return (
    <ExcelStateContext value={excelState}>
      <SetExcelStateContext value={setExcelState}>
        <PartGroupsContext value={partGroups}>
          <SetPartGroupsContext value={setPartGroups}>
            <OptimizationModeContext value={optMode}>
              <SetOptimizationModeContext value={setOptMode}>
                <SelectionStateStoreContext value={selectionStateStore}>
                  <SetSelectionStateStoreContext value={setSelectionStateStore}>
                    <PartOptimizationSettingsStoreContext
                      value={partOptSettings}
                    >
                      <SetPartOptimizationSettingsStoreContext
                        value={setPartOptSettings}
                      >
                        <PartOptimizationStoreContext value={optimizations}>
                          <SetPartOptimizationStoreContext
                            value={setOptimizations}
                          >
                            {children}
                          </SetPartOptimizationStoreContext>
                        </PartOptimizationStoreContext>
                      </SetPartOptimizationSettingsStoreContext>
                    </PartOptimizationSettingsStoreContext>
                  </SetSelectionStateStoreContext>
                </SelectionStateStoreContext>
              </SetOptimizationModeContext>
            </OptimizationModeContext>
          </SetPartGroupsContext>
        </PartGroupsContext>
      </SetExcelStateContext>
    </ExcelStateContext>
  );
}

export const OptimizationContext = React.memo(InternalOptimizationContext);
