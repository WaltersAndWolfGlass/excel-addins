import { createContext } from "react";
import {
  OptimizationMode,
  PartGroup,
  PartOptimization,
} from "@/model/optimization";
import {
  SelectionStateStore,
  PartOptimizationStore,
  PartOptimizationSettingsStore,
} from "../optimizer-form";

export const PartGroupsContext = createContext<PartGroup[]>([]);

export const OptimizationModeContext =
  createContext<OptimizationMode>("estimate");
export const SetOptimizationModeContext = createContext<
  (m: OptimizationMode) => void
>((_) => {});

export const SelectionStateStoreContext = createContext<SelectionStateStore>(
  {},
);
export const SetSelectionStateStoreContext = createContext<
  (x: SelectionStateStore) => void
>((_) => {});

export const PartOptimizationStoreContext =
  createContext<PartOptimizationStore>({});
export const SetPartOptimizationStoreContext = createContext<
  (x: PartOptimizationStore) => void
>((_) => {});

export const PartOptimizationSettingsStoreContext =
  createContext<PartOptimizationSettingsStore>({});
export const SetPartOptimizationSettingsStoreContext = createContext<
  (x: PartOptimizationSettingsStore) => void
>((_) => {});
