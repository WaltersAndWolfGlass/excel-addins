import * as React from "react";
import {
  OptimizationModeContext,
  PartGroupLinkedStoreContext,
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
  PartOptimization,
  PartOptimizationSettings,
  PartOptimizationStore,
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
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

  const partGroups = React.useContext(PartGroupsContext);

  const optMode = React.useContext(OptimizationModeContext);

  const linkStore = React.useContext(PartGroupLinkedStoreContext);
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
  const [canDoVarious, setCanDoVarious] = React.useState<boolean>(false);
  const [maxNumSizes, setMaxNumSizes] = React.useState<number>(1);
  const [sizeRange, setSizeRange] = React.useState<number[]>([180, 300]);
  const [stockLengths, setStockLengths] = React.useState<StockLengths[]>([]);

  const [selectedPartGroups, selectedPartOptGroups] = React.useMemo(
    () => [
      partGroups
        .filter((pg) => linkStore[pg.key] === true)
        .filter((pg) => selectedStateStore[pg.key] === true),
      partGroups
        .filter((pg) => linkStore[pg.key] !== true)
        .flatMap((pg) => pg.part_optimization_groups)
        .filter((pog) => selectedStateStore[pog.key] === true),
    ],
    [partGroups, selectedStateStore, linkStore],
  );

  const setInitialSettings = React.useMemo(() => {
    const initialSettings =
      selectedPartGroups
        .flatMap((pg) => pg.part_optimization_groups)
        .concat(selectedPartOptGroups)
        .reduce(
          (settings, pog) => {
            const partOptSettings = partOptSettingsStore[pog.key];
            if (partOptSettings === undefined) return settings;
            if (settings === undefined) return partOptSettings;
            if (Object.is(settings, partOptSettings)) return settings;
            return "various";
          },
          undefined as StockLengthPool | undefined | "various",
        ) ?? defaultSettings;

    if (initialSettings === "various" && optType !== "various")
      setOptType("various");

    if (initialSettings !== "various" && initialSettings.type !== optType)
      setOptType(initialSettings.type);

    if (canDoVarious !== (initialSettings === "various"))
      setCanDoVarious(initialSettings === "various");

    if (
      initialSettings !== "various" &&
      initialSettings.type === "calculate_sizes" &&
      initialSettings.maximum_number_of_sizes !== maxNumSizes
    )
      setMaxNumSizes(initialSettings.maximum_number_of_sizes);

    if (
      initialSettings !== "various" &&
      initialSettings.type === "calculate_sizes" &&
      (initialSettings.size_minimum !== sizeRange[0] ||
        initialSettings.size_maximum !== sizeRange[1])
    )
      setSizeRange([
        initialSettings.size_minimum,
        initialSettings.size_maximum,
      ]);

    if (
      initialSettings !== "various" &&
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
  }, [selectedPartGroups, selectedPartOptGroups, partOptSettingsStore]);

  const partsForChart = selectedPartGroups
    .flatMap((pg) => pg.part_optimization_groups)
    .concat(selectedPartOptGroups)
    .flatMap((pog) => pog.parts);

  const partOptStore = React.useContext(PartOptimizationStoreContext);
  const setPartOptStore = React.useContext(SetPartOptimizationStoreContext);

  const handleOptimize = () => {
    if (optMode === undefined) return;
    setDialogOpen(false);

    const partOptSettings: PartOptimizationSettings | "various" =
      optType === "various"
        ? "various"
        : optType === "calculate_sizes"
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

    const partGroupsToOptimize = selectedPartGroups;
    const partOptGroupsToOptimize = selectedPartOptGroups;

    const optimizingStoreState = partGroupsToOptimize
      .flatMap((pg) => pg.part_optimization_groups)
      .concat(partOptGroupsToOptimize)
      .map((pog) => pog.key)
      .reduce((store, pogKey) => {
        store[pogKey] = "optimizing";
        return store;
      }, {} as PartOptimizationStore);

    setSelectedStateStore({});
    setPartOptStore({ ...partOptStore, ...optimizingStoreState });

    setTimeout(() => {
      startOptimization(async () => {
        const optimizer = new Optimizer();
        const optimizations: Record<string, PartOptimization> = {};
        const settings: Record<string, StockLengthPool> = {};

        for (
          let pgIndex = 0;
          pgIndex < partGroupsToOptimize.length;
          pgIndex++
        ) {
          const pg = partGroupsToOptimize[pgIndex];
          const pogs = pg.part_optimization_groups;

          if (
            partOptSettings !== "various" &&
            partOptSettings.type === "calculate_sizes"
          ) {
            const opts = await optimizer.FindBestOptimization(
              pogs,
              optMode,
              partOptSettings,
            );
            const totalPool = optimizer.GetTotalPoolFromOptimizations(
              Object.values(opts),
            );
            totalPool.stock_length_pool.forEach(
              (x) => (x.quantity = "unlimited"),
            );

            Object.entries(opts).forEach(([key, value]) => {
              optimizations[key] = value;
              settings[key] = totalPool;
            });
          } else if (
            partOptSettings !== "various" &&
            partOptSettings.type === "stock_length_pool"
          ) {
            const opts = await optimizer.Optimize(
              pogs,
              optMode,
              partOptSettings,
            );
            Object.entries(opts).forEach(([key, value]) => {
              optimizations[key] = value;
              settings[key] = partOptSettings;
            });
          } else {
            const pogSettings = pogs.map(
              (pog) => partOptSettingsStore[pog.key],
            );
            if (pogSettings.every((s) => s !== undefined)) {
              const pogSetting = pogSettings[0];
              if (
                pogSetting !== undefined &&
                pogSettings.every((s) => Object.is(s, pogSetting))
              ) {
                const opts = await optimizer.Optimize(
                  pogs,
                  optMode,
                  pogSetting,
                );
                Object.entries(opts).forEach(([key, value]) => {
                  optimizations[key] = value;
                });
                continue;
              }
            }

            const pogsWithoutSettings = pogs.filter(
              (pog) => partOptSettingsStore[pog.key] === undefined,
            );
            if (pogsWithoutSettings.length > 0) {
              const optFailure = {
                total_stock_lengths: [],
                cut_list: [],
                cut_stock_lengths: [],
                net_parts: 0,
                gross_length: 0,
                net_part_length: 0,
                yield: 0,
                successful: false,
                warning_messages: [],
                error_messages: [
                  "No stock lengths assigned from a previous optimization.  Please re-optimize this part specifying new stock length sizes or unlink the Releases so they are free to use different stock lengths.",
                ],
              } as PartOptimization;
              pogsWithoutSettings.forEach((pog) => {
                optimizations[pog.key] = optFailure;
              });
            }

            const pogsWithSettings = pogs.filter(
              (pog) => partOptSettingsStore[pog.key] !== undefined,
            );
            if (pogsWithSettings.length > 0) {
              for (
                let pogIndex = 0;
                pogIndex < pogsWithSettings.length;
                pogIndex++
              ) {
                const pog = pogsWithSettings[pogIndex];
                const pogSetting = partOptSettingsStore[pog.key];
                if (pogSetting === undefined) continue;
                const opt = await optimizer.Optimize(
                  [pog],
                  optMode,
                  pogSetting,
                );
                optimizations[pog.key] = opt[pog.key];
              }
            }
          }
        }

        for (
          let pogIndex = 0;
          pogIndex < partOptGroupsToOptimize.length;
          pogIndex++
        ) {
          const pog = partOptGroupsToOptimize[pogIndex];

          if (
            partOptSettings !== "various" &&
            partOptSettings.type === "calculate_sizes"
          ) {
            const opt = await optimizer.FindBestOptimization(
              [pog],
              optMode,
              partOptSettings,
            );
            const pool = optimizer.GetTotalPoolFromOptimizations(
              Object.values(opt),
            );
            pool.stock_length_pool.forEach((x) => (x.quantity = "unlimited"));
            optimizations[pog.key] = opt[pog.key];
            settings[pog.key] = pool;
          } else if (
            partOptSettings !== "various" &&
            partOptSettings.type === "stock_length_pool"
          ) {
            const opt = await optimizer.Optimize(
              [pog],
              optMode,
              partOptSettings,
            );
            optimizations[pog.key] = opt[pog.key];
            settings[pog.key] = partOptSettings;
          } else {
            const pogSetting = partOptSettingsStore[pog.key];
            if (pogSetting === undefined) {
              const optFailure = {
                total_stock_lengths: [],
                cut_list: [],
                cut_stock_lengths: [],
                net_parts: 0,
                gross_length: 0,
                net_part_length: 0,
                yield: 0,
                successful: false,
                warning_messages: [],
                error_messages: [
                  "No stock lengths assigned from a previous optimization.  Please re-optimize this Release/Level.",
                ],
              } as PartOptimization;
              optimizations[pog.key] = optFailure;
            } else {
              const opt = await optimizer.Optimize([pog], optMode, pogSetting);
              optimizations[pog.key] = opt[pog.key];
            }
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
          Optimize {selectedCount} Selection{selectedCount === 1 ? "" : "s"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Optimization Options</DialogTitle>
        </DialogHeader>
        <DialogDescription className="hidden">
          Choose how you want to optimize these parts.
        </DialogDescription>
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
                  {canDoVarious && (
                    <SelectItem value="various">
                      Use Stock Lengths from Previous Optimizations
                    </SelectItem>
                  )}
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
                            <TooltipTrigger asChild>
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
                              length: Math.min(
                                ...stockLengths.map((x) => x.length),
                                280,
                              ),
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
