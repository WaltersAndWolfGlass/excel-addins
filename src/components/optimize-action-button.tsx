import * as React from "react";
import {
  OptimizationModeContext,
  PartGroupsContext,
  PartOptimizationSettingsStoreContext,
  PartOptimizationStoreContext,
  SelectionStateStoreContext,
  SetPartOptimizationSettingsStoreContext,
  SetPartOptimizationStoreContext,
  SetSelectionStateStoreContext,
} from "./contexts/OptimizationContext";
import { OptimizationSettingsDialogContent } from "./opt-settings-dialog-content";
import {
  CalculateStockLengthSettings,
  Optimizer,
  PartOptimizationSettings,
} from "@/model/optimization";
import { Dialog, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import {
  PartOptimizationSettingsStore,
  PartOptimizationStore,
  SelectionStateStore,
} from "./optimizer-form";

export function OptimizeActionButton({ ...props }) {
  const partGroups = React.useContext(PartGroupsContext);

  const optMode = React.useContext(OptimizationModeContext);

  const selectedStateStore = React.useContext(SelectionStateStoreContext);
  const selectedCount = Object.values(selectedStateStore).filter(
    (x) => x,
  ).length;
  const setSelectedStateStore = React.useContext(SetSelectionStateStoreContext);

  const partOptSettingsStore = React.useContext(
    PartOptimizationSettingsStoreContext,
  );
  const setPartOptSettingsStore = React.useContext(
    SetPartOptimizationSettingsStoreContext,
  );

  const defaultSettings = {
    type: "calculate_sizes",
    maximum_number_of_sizes: 1,
    size_minimum: 180,
    size_maximum: 300,
  } as CalculateStockLengthSettings;

  const initialSettings =
    Object.entries(selectedStateStore).reduce(
      (settings, [key, value]) => {
        if (!value) return settings;
        const partOptSettings = partOptSettingsStore[key];
        if (partOptSettings === undefined) return settings;
        if (settings === undefined) return partOptSettings;
        if (Object.is(settings, partOptSettings)) return settings;
        return defaultSettings;
      },
      undefined as PartOptimizationSettings | undefined,
    ) ?? defaultSettings;
  const initialSettingsKey = JSON.stringify(initialSettings);

  const partOptStore = React.useContext(PartOptimizationStoreContext);
  const setPartOptStore = React.useContext(SetPartOptimizationStoreContext);

  const handleOptimize = (partOptSettings: PartOptimizationSettings) => {
    const optimizer = new Optimizer();
    const partGroupsToOptimize = partGroups.filter(
      (x) => selectedStateStore[x.key] === true,
    );

    let settings: PartOptimizationSettingsStore = {};
    let optimizations: PartOptimizationStore = {};

    if (partOptSettings.type === "calculate_sizes") {
      for (let pgIndex = 0; pgIndex < partGroupsToOptimize.length; pgIndex++) {
        const pg = partGroupsToOptimize[pgIndex];
        const bestOpts = optimizer.FindBestOptimization(
          pg.part_optimization_groups,
          optMode,
          partOptSettings,
        );
        Object.assign(settings, bestOpts.stockLengthPool);
        Object.assign(optimizations, bestOpts.optimizations);
      }
    } else {
      const partOptGroups = partGroupsToOptimize
        .map((pg) => pg.part_optimization_groups)
        .flat();
      settings = partOptGroups.reduce((store, pog) => {
        store[pog.key] = partOptSettings;
        return store;
      }, {} as PartOptimizationSettingsStore);
      optimizations = partOptGroups.reduce((store, pog) => {
        const optimization = optimizer.Optimize(pog, optMode, partOptSettings);
        store[pog.key] = optimization;
        return store;
      }, {} as PartOptimizationStore);
    }

    console.log(optimizations);

    setSelectedStateStore({});
    setPartOptSettingsStore({ ...partOptSettingsStore, ...settings });
    setPartOptStore({ ...partOptStore, ...optimizations });
  };

  return (
    <Dialog>
      <DialogTrigger disabled={selectedCount === 0}>
        <Button className="w-full" disabled={selectedCount === 0}>
          Optimize {selectedCount} Part{selectedCount === 1 ? "" : "s"}
        </Button>
      </DialogTrigger>
      <OptimizationSettingsDialogContent
        key={initialSettingsKey}
        initialSettings={initialSettings}
        onOptimize={handleOptimize}
      />
    </Dialog>
  );
}
