import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  CalculateStockLengthSettings,
  PartOptimizationSettings,
  StockLengthPool,
  StockLengths,
} from "@/model/optimization";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { PlusIcon, TrashIcon } from "lucide-react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "./ui/dialog";
import { Field, FieldGroup, FieldLabel } from "./ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Slider } from "./ui/slider";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";

export function OptimizationSettingsDialogContent({
  initialSettings,
  onOptimize,
}: {
  initialSettings: PartOptimizationSettings;
  onOptimize: (s: PartOptimizationSettings) => void;
}) {
  const [optType, setOptType] = React.useState<string>(initialSettings.type);
  const [maxNumSizes, setMaxNumSizes] = React.useState<number>(
    initialSettings.type === "calculate_sizes"
      ? initialSettings.maximum_number_of_sizes
      : 1,
  );
  const [sizeRange, setSizeRange] = React.useState<number[]>(
    initialSettings.type === "calculate_sizes"
      ? [initialSettings.size_minimum, initialSettings.size_maximum]
      : [180, 300],
  );
  const [stockLengths, setStockLengths] = React.useState<StockLengths[]>(
    initialSettings.type === "stock_length_pool"
      ? initialSettings.stock_length_pool.map((x) => ({ ...x }))
      : [
          {
            is_standard_length: false,
            length: 280,
            quantity: "unlimited",
          },
        ],
  );

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Optimization Options</DialogTitle>
      </DialogHeader>
      <FieldGroup>
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
          <>
            <Field>
              <FieldLabel>
                Max Number of Different Stock Length Sizes: {maxNumSizes}
              </FieldLabel>
              <Slider
                value={[maxNumSizes]}
                onValueChange={(v) => setMaxNumSizes(v[0])}
                min={1}
                max={4}
                step={1}
              />
            </Field>
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
          </>
        )}
        {optType === "stock_length_pool" && (
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
                        <TrashIcon className="text-red-700" />
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
        )}
      </FieldGroup>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <DialogClose asChild>
          <Button
            onClick={() => {
              const settings =
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
              onOptimize(settings);
            }}
          >
            Optimize
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}
