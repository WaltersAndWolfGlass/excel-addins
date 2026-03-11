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
} from "@/components/contexts/OptimizationContext";
import {
  CalculateStockLengthSettings,
  Optimizer,
  PartOptimizationSettings,
  StockLengthPool,
  StockLengths,
} from "@/model/optimization";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  PartOptimizationSettingsStore,
  PartOptimizationStore,
} from "@/components/optimization/OptimizerForm";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import { PlusIcon, TrashIcon } from "lucide-react";
import { PartSizeChart } from "./PartSizeChart";
import { cn } from "@/lib/utils";
import { OptimizationModeSelect } from "./OptimizationModeSelect";

const defaultSettings = {
  type: "calculate_sizes",
  maximum_number_of_sizes: 1,
  size_minimum: 180,
  size_maximum: 300,
} as CalculateStockLengthSettings;

function InternalOptimizeActionButton({ className }: { className?: string }) {
  const [isOptimizing, startOptimization] = React.useTransition();
  const [dialogOpen, setDialogOpen] = React.useState(false);

  console.log("Render OptimizeActionButton");

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

  const [optType, setOptType] = React.useState<string>("calculate_sizes");
  const [maxNumSizes, setMaxNumSizes] = React.useState<number>(1);
  const [sizeRange, setSizeRange] = React.useState<number[]>([180, 300]);
  const [stockLengths, setStockLengths] = React.useState<StockLengths[]>([]);

  const setInitialSettings = React.useMemo(() => {
    const initialSettings =
      partGroups
        .filter((pg) => selectedStateStore[pg.key] === true)
        .map((pg) => pg.part_optimization_groups)
        .flat()
        .reduce(
          (settings, pog) => {
            const partOptSettings = partOptSettingsStore[pog.key];
            if (partOptSettings === undefined) return settings;
            if (settings === undefined) return partOptSettings;
            if (Object.is(settings, partOptSettings)) return settings;
            return defaultSettings;
          },
          undefined as PartOptimizationSettings | undefined,
        ) ?? defaultSettings;

    if (initialSettings.type !== optType) setOptType(initialSettings.type);

    if (
      initialSettings.type === "calculate_sizes" &&
      initialSettings.maximum_number_of_sizes !== maxNumSizes
    )
      setMaxNumSizes(initialSettings.maximum_number_of_sizes);

    if (
      initialSettings.type === "calculate_sizes" &&
      (initialSettings.size_minimum !== sizeRange[0] ||
        initialSettings.size_maximum !== sizeRange[1])
    )
      setSizeRange([
        initialSettings.size_minimum,
        initialSettings.size_maximum,
      ]);

    if (
      initialSettings.type === "stock_length_pool" &&
      (initialSettings.stock_length_pool.length !== stockLengths.length ||
        initialSettings.stock_length_pool
          .map((stklen1, i) => {
            const stklen2 = stockLengths[i];
            return (
              stklen1.is_standard_length !== stklen2.is_standard_length ||
              stklen1.length !== stklen2.length ||
              stklen1.quantity !== stklen2.quantity
            );
          })
          .some((x) => x))
    )
      setStockLengths(initialSettings.stock_length_pool);
    return true;
  }, [partGroups, selectedStateStore, partOptSettingsStore]);

  const partsForChart = partGroups
    .filter((pg) => selectedStateStore[pg.key] === true)
    .map((pg) => pg.part_optimization_groups)
    .flat()
    .map((pog) => pog.parts)
    .flat();

  const partOptStore = React.useContext(PartOptimizationStoreContext);
  const setPartOptStore = React.useContext(SetPartOptimizationStoreContext);

  const handleOptimize = () => {
    if (optMode === undefined) return;
    setDialogOpen(false);

    const partOptSettings: PartOptimizationSettings =
      optType === "calculate_sizes"
        ? ({
            type: "calculate_sizes",
            maximum_number_of_sizes: maxNumSizes,
            size_minimum: sizeRange[0],
            size_maximum: sizeRange[1],
          } as CalculateStockLengthSettings)
        : ({
            type: "stock_length_pool",
            stock_length_pool: [...stockLengths],
          } as StockLengthPool);

    const partGroupsToOptimize = partGroups.filter(
      (x) => selectedStateStore[x.key] === true,
    );
    const optimizingStoreState = partGroupsToOptimize
      .map((pg) => pg.part_optimization_groups)
      .flat()
      .map((pog) => pog.key)
      .reduce((store, pogKey) => {
        store[pogKey] = "optimizing";
        return store;
      }, {} as PartOptimizationStore);

    setSelectedStateStore({});
    setPartOptStore({ ...partOptStore, ...optimizingStoreState });

    setTimeout(() => {
      startOptimization(async () => {
        let settings: PartOptimizationSettingsStore = {};
        let optimizations: PartOptimizationStore = {};
        const optimizer = new Optimizer();

        if (partOptSettings.type === "calculate_sizes") {
          for (
            let pgIndex = 0;
            pgIndex < partGroupsToOptimize.length;
            pgIndex++
          ) {
            const pg = partGroupsToOptimize[pgIndex];
            const bestOpts = await optimizer.FindBestOptimization(
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
          for (let pogIndex = 0; pogIndex < partOptGroups.length; pogIndex++) {
            const pog = partOptGroups[pogIndex];
            const optimization = await optimizer.Optimize(
              pog,
              optMode,
              partOptSettings,
            );
            optimizations[pog.key] = optimization;
          }
        }

        startOptimization(() => {
          setPartOptSettingsStore({ ...partOptSettingsStore, ...settings });
          setPartOptStore({ ...partOptStore, ...optimizations });
        });
      });
    }, 2000);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button className={cn(className)} disabled={selectedCount === 0}>
          Optimize {selectedCount} Part{selectedCount === 1 ? "" : "s"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Optimization Options</DialogTitle>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel>Optimization Mode</FieldLabel>
            <OptimizationModeSelect />
          </Field>
          <Field>
            <FieldLabel>Optimization Type</FieldLabel>
            <Select value={optType} onValueChange={setOptType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="calculate_sizes">
                    Calculate Best Stock Length Sizes
                  </SelectItem>
                  <SelectItem value="stock_length_pool">
                    Specify Stock Length Sizes and Quantity
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          {optType === "calculate_sizes" && (
            <Field>
              <FieldLabel>
                Stock Length Size Range: {sizeRange[0]} - {sizeRange[1]}
              </FieldLabel>
              <Slider
                value={sizeRange}
                onValueChange={setSizeRange}
                min={96}
                max={330}
                step={1}
              />
            </Field>
          )}
          {optType === "stock_length_pool" && (
            <>
              <Field>
                <FieldLabel>Part Sizes</FieldLabel>
                <PartSizeChart
                  className="min-h-10"
                  parts={partsForChart}
                  stklens={stockLengths}
                />
              </Field>
              <Field>
                <FieldLabel>Stock Lengths</FieldLabel>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Std</TableHead>
                      <TableHead colSpan={2}>Size</TableHead>
                      <TableHead>Quantity Available</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockLengths.map((s, i) => (
                      <TableRow key={i}>
                        <TableCell className="w-[1%]">
                          <Tooltip>
                            <TooltipTrigger>
                              <Checkbox
                                checked={s.is_standard_length}
                                onCheckedChange={(x) => {
                                  const oldStockLength = stockLengths[i];
                                  const newStockLength = {
                                    ...oldStockLength,
                                    is_standard_length: x ? true : false,
                                  };
                                  const newStockLengths = [...stockLengths];
                                  newStockLengths[i] = newStockLength;
                                  setStockLengths(newStockLengths);
                                }}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-[33vw]">
                                Check to indicate a standard stock length size.
                                Standard stock lengths do not automatically have
                                2-3&quot; trimmed from each end.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="w-[1%]">
                          <InputGroup>
                            <InputGroupInput
                              className="min-w-16"
                              placeholder="Length"
                              value={s.length}
                              type="number"
                              onChange={(e) => {
                                const oldStockLength = stockLengths[i];
                                const newStockLength = {
                                  ...oldStockLength,
                                  length: Number(e.target.value),
                                };
                                const newStockLengths = [...stockLengths];
                                newStockLengths[i] = newStockLength;
                                setStockLengths(newStockLengths);
                              }}
                            />
                            <InputGroupAddon align="inline-end">
                              inches
                            </InputGroupAddon>
                          </InputGroup>
                        </TableCell>
                        <TableCell>
                          <Slider
                            className="w-full"
                            min={96}
                            max={330}
                            value={[s.length]}
                            onValueChange={(v) => {
                              const oldStockLength = stockLengths[i];
                              const newStockLength = {
                                ...oldStockLength,
                                length: Number(v[0]),
                              };
                              const newStockLengths = [...stockLengths];
                              newStockLengths[i] = newStockLength;
                              setStockLengths(newStockLengths);
                            }}
                          />
                        </TableCell>
                        <TableCell className="w-[1%]">
                          <Input
                            value={s.quantity === "unlimited" ? "" : s.quantity}
                            placeholder="unlimited"
                            type="number"
                            onChange={(e) => {
                              const oldStockLength = stockLengths[i];
                              const newStockLength = {
                                ...oldStockLength,
                                quantity: (e.target.value
                                  ? Number(e.target.value)
                                  : "unlimited") as number | "unlimited",
                              };
                              const newStockLengths = [...stockLengths];
                              newStockLengths[i] = newStockLength;
                              setStockLengths(newStockLengths);
                            }}
                          />
                        </TableCell>
                        <TableCell className="w-[1%]">
                          <Button
                            variant="outline"
                            onClick={() => {
                              const newStockLengths = [...stockLengths];
                              newStockLengths.splice(i, 1);
                              setStockLengths(newStockLengths);
                            }}
                          >
                            <TrashIcon className="text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell />
                      <TableCell />
                      <TableCell />
                      <TableCell />
                      <TableCell>
                        <Button
                          variant="outline"
                          onClick={() => {
                            const newStockLength: StockLengths = {
                              is_standard_length: false,
                              length: 280,
                              quantity: "unlimited",
                            };
                            const newStockLengths = [
                              ...stockLengths,
                              newStockLength,
                            ];
                            setStockLengths(newStockLengths);
                          }}
                        >
                          <PlusIcon />
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Field>
            </>
          )}
        </FieldGroup>
        <DialogFooter className="mt-8">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleOptimize}>Optimize</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const OptimizeActionButton = React.memo(InternalOptimizeActionButton);
