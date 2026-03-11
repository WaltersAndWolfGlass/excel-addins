import * as React from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Label,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  GetOptimizationSettings,
  GetPartLengthCalculator,
  Part,
  StockLengths,
} from "@/model/optimization";
import { cn } from "@/lib/utils";
import { OptimizationModeContext } from "../contexts/OptimizationContext";

const chartConfig = {
  sizes: {
    label: "Cut Size",
    color: "var(--chart-1)",
  },
};

function calculateXTicks(max: number) {
  const digits = Math.ceil(Math.abs(max)).toString().length;
  let tickInterval = 1;
  if (digits > 1) {
    const mag = 10 ** digits;
    const scale = max / mag;
    if (scale <= 0.1) tickInterval = 1 * 10 ** (digits - 2);
    else if (scale <= 0.2) tickInterval = 2 * 10 ** (digits - 2);
    else if (scale <= 0.5) tickInterval = 5 * 10 ** (digits - 2);
    else tickInterval = 10 ** (digits - 1);
  }
  const ticks: number[] = [];
  for (let i = 0; i <= max; i += tickInterval) {
    ticks.push(i);
  }
  return ticks;
}

function calculateYTicks(max: number) {
  let tickInterval = 2;
  if (max <= 12) {
    const inches = Math.ceil(Math.abs(max));
    if (inches <= 1) tickInterval = 0.25;
    else if (inches <= 2) tickInterval = 0.5;
    else if (inches <= 6) tickInterval = 1;
    else if (inches <= 12) tickInterval = 2;
  } else {
    const feet = Math.ceil(Math.abs(max) / 12);
    const digits = feet.toString().length;
    const mag = 10 ** digits;
    const scale = feet / mag;
    if (scale <= 0.1) tickInterval = 3 * 10 ** (digits - 1);
    else if (scale <= 0.3) tickInterval = 6 * 10 ** (digits - 1);
    else if (scale <= 0.6) tickInterval = 12 * 10 ** (digits - 1);
    else tickInterval = 24 * 10 ** (digits - 1);
  }

  const ticks: number[] = [];
  for (let i = 0; i <= max; i += tickInterval) {
    ticks.push(i);
  }
  return ticks;
}

function InternalPartSizeChart({
  parts,
  stklens,
  className,
}: {
  parts: Part[];
  stklens: StockLengths[];
  className?: string;
}) {
  const optMode = React.useContext(OptimizationModeContext);
  if (optMode === undefined) return <></>;

  const optSettings = GetOptimizationSettings(optMode);
  const partLengthCalc = GetPartLengthCalculator(optMode);

  const chartData = React.useMemo(
    () =>
      parts
        .sort((a, b) => {
          if (a.length > b.length) return -1;
          if (a.length < b.length) return 1;
          return 0;
        })
        .map((p) => Array(p.quantity).fill(partLengthCalc(p)))
        .flat()
        .map((l, i) => ({ item: i, size: l })),
    [parts],
  );

  const yMin = 0;
  let yMax = chartData.length > 0 ? chartData[0].size : 12;
  if (stklens.length > 0)
    yMax = Math.max(
      stklens.toSorted((a, b) => {
        if (a.length > b.length) return -1;
        if (a.length < b.length) return 1;
        return 0;
      })[0].length,
      yMax,
    );

  const xTicks = calculateXTicks(chartData.length);
  const yTicks = calculateYTicks(yMax);

  if (chartData.length > 0) {
    const lastItem = chartData[chartData.length - 1];
    chartData.push({
      item: lastItem.item + 1,
      size: lastItem.size,
    });
  }

  return (
    <ChartContainer className={cn(className)} config={chartConfig}>
      <AreaChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} horizontalValues={yTicks} />
        <XAxis dataKey="item" axisLine={false} ticks={xTicks}>
          <Label
            value="Quantity"
            position="insideBottom"
            textAnchor="middle"
            offset={0}
          />
        </XAxis>
        <YAxis
          dataKey="size"
          axisLine={false}
          ticks={yTicks}
          domain={[yMin, yMax]}
          width={40}
          unit='"'
        >
          <Label
            value="Cut Size"
            angle={-90}
            position="insideLeft"
            textAnchor="middle"
            offset={0}
          />
        </YAxis>
        <ChartTooltip
          content={<ChartTooltipContent nameKey="sizes" hideIndicator={true} />}
        />
        <Area
          dataKey="size"
          type="stepAfter"
          fill="var(--color-primary)"
          fillOpacity={0.4}
          stroke="var(--color-primary)"
          unit='"'
        />
        {stklens.length > 0 &&
          stklens
            .map((s) => [
              <ReferenceLine
                y={s.length}
                label={{
                  value: `${s.length.toString()}"`,
                  position: "insideTopRight",
                }}
                stroke="var(--color-gold)"
              />,
              !s.is_standard_length && (
                <ReferenceLine
                  y={s.length - 2 * optSettings.end_trim}
                  stroke="var(--color-gold)"
                  strokeDasharray="6 3"
                  strokeOpacity={0.6}
                />
              ),
            ])
            .flat()}
      </AreaChart>
    </ChartContainer>
  );
}

export const PartSizeChart = React.memo(InternalPartSizeChart);
