import { alphaNumCompare } from "@/lib/sorters";

export interface Part {
  part_number: string;
  mark_number: string;
  finish: string;
  length: number;
  unit_id: string;
  unit_number: string;
  release: string;
  floor: string;
  optimization_group: string;
  pallet: string;
  fab_order: string;
  quantity: number;
}

export type OptimizationMode = "estimate" | "takeoff" | "fabrication";

export interface OptimizationSettings {
  end_trim: number;
  saw_kerf: number;
  mode: OptimizationMode;
  use_fab_order: boolean;
}

export interface StockLengths {
  length: number;
  quantity: number | "unlimited";
  is_standard_length: boolean;
}

export interface CalculateStockLengthSettings {
  type: "calculate_sizes";
  maximum_number_of_sizes: number;
  size_minimum: number;
  size_maximum: number;
}

export interface StockLengthPool {
  type: "stock_length_pool";
  stock_length_pool: StockLengths[];
}

export type PartOptimizationSettings =
  | CalculateStockLengthSettings
  | StockLengthPool;

export interface Distribution {
  pallet: string;
  unit_id: string;
  unit_number: string;
  release: string;
  floor: string;
  quantity: number;
}

export interface CutListItem {
  id: number;
  key: string;
  part_number: string;
  mark_number: string;
  finish: string;
  length: number;
  quantity: number;
  stock_lengths: StockLengths;
  use_drops_for: number[];
  use_drops_for_key: string[];
  cut_from_drops: number;
  distribution: Distribution[];
}

export interface CutStockLength {
  length: number;
  used_length: number;
  is_standard_length: boolean;
  part_number: string;
  finish: string;
  parts: Part[];
}

export interface PartOptimization {
  total_stock_lengths: StockLengths[];
  cut_list: CutListItem[];
  cut_stock_lengths: CutStockLength[];
  net_parts: number;
  gross_length: number;
  net_part_length: number;
  yield: number;
  successful: boolean;
  warning_messages: string[];
  error_messages: string[];
}

export interface PartGroup {
  part_optimization_groups: PartOptimizationGroup[];
  key: string;
  part_number: string;
  finish: string;
  part_qty: number;
}
export interface PartOptimizationGroup {
  parts: Part[];
  key: string;
  part_number: string;
  finish: string;
  optimization_group: string;
  part_qty: number;
}

const getPartGroupKey = (partOptimizationGroup: PartOptimizationGroup) =>
  `${partOptimizationGroup.part_number} | ${partOptimizationGroup.finish}`.toUpperCase();
const getPartOptimizationGroupKey = (part: Part) =>
  `${part.optimization_group} | ${part.part_number} | ${part.finish}`.toUpperCase();

const groupBy = <T, K extends keyof any>(arr: T[], key: (i: T) => K) =>
  arr.reduce(
    (groups, item) => {
      (groups[key(item)] ||= []).push(item);
      return groups;
    },
    {} as Record<K, T[]>,
  );

export class Optimizer {
  private GetOptimizationSettings(
    mode: OptimizationMode,
  ): OptimizationSettings {
    switch (mode) {
      case "estimate":
        return {
          saw_kerf: 0.25,
          end_trim: 3,
          mode: mode,
          use_fab_order: false,
        };
      case "takeoff":
        return { saw_kerf: 0.25, end_trim: 3, mode: mode, use_fab_order: true };
      case "fabrication":
        return { saw_kerf: 0.25, end_trim: 2, mode: mode, use_fab_order: true };
    }
  }

  private GetSettingsAndComparer(optimization_mode: OptimizationMode): {
    optSettings: OptimizationSettings;
    comparer: (a: Part, b: Part) => number;
  } {
    const optSettings = this.GetOptimizationSettings(optimization_mode);
    const baseComparer = (a: Part, b: Part) => {
      if (a.length < b.length) return -1;
      if (a.length > b.length) return 1;
      let result = alphaNumCompare(a.unit_id, b.unit_id);
      if (result !== 0) return result;
      return alphaNumCompare(a.mark_number, b.mark_number);
    };
    let comparer = baseComparer;
    if (optSettings.use_fab_order) {
      comparer = (a: Part, b: Part) => {
        let result = alphaNumCompare(a.fab_order, b.fab_order);
        if (result !== 0) return result;
        return baseComparer(a, b);
      };
    }

    return { optSettings, comparer };
  }

  FindBestOptimization(
    part_optimization_groups: PartOptimizationGroup[],
    optimization_mode: OptimizationMode,
    settings: CalculateStockLengthSettings,
  ): {
    stockLengthPool: Record<string, StockLengthPool | undefined>;
    optimizations: Record<string, PartOptimization>;
  } {
    const { optSettings, comparer } =
      this.GetSettingsAndComparer(optimization_mode);

    part_optimization_groups.forEach((x) => x.parts.sort(comparer));

    const trialStockLengths = Array.from(
      { length: settings.size_maximum - settings.size_minimum + 1 },
      (_, i) => settings.size_minimum + i,
    ).map((l) => {
      return {
        type: "stock_length_pool",
        stock_length_pool: [
          {
            is_standard_length: false,
            quantity: "unlimited",
            length: l,
          },
        ],
      } as StockLengthPool;
    });

    const optCollection = trialStockLengths.map((stockLengthPool) => {
      const optimizations = part_optimization_groups.reduce(
        (store, pog) => {
          const optimization = this.OptimizeSortedParts(
            pog.parts,
            optSettings,
            stockLengthPool,
          );
          store[pog.key] = optimization;
          return store;
        },
        {} as Record<string, PartOptimization>,
      );
      if (Object.values(optimizations).some((x) => !x.successful))
        return { success: false, stockLengthPool, optimizations, yield: 0 };
      const yieldFraction =
        Object.values(optimizations).reduce(
          (sum, o) => sum + o.net_part_length,
          0,
        ) /
        Object.values(optimizations).reduce(
          (sum, o) => sum + o.gross_length,
          0,
        );
      return {
        success: true,
        stockLengthPool,
        optimizations,
        yield: yieldFraction,
      };
    });

    const sortedOptCollection = optCollection
      .filter((x) => x.success)
      .sort((a, b) => {
        if (a.yield > b.yield) return -1;
        if (a.yield < b.yield) return 1;
        return 0;
      });

    if (sortedOptCollection.length === 0) {
      const opt = optCollection[optCollection.length - 1];
      const opts = part_optimization_groups.reduce(
        (s, pog) => {
          const pogOpt = opt.optimizations[pog.key];
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
            error_messages: [],
          } as PartOptimization;
          if (pogOpt.successful)
            optFailure.warning_messages.push(
              "Optimization unsuccessful because another optimization group failed with the same stock length sizes. Check the messages on the other optimization groups.",
            );
          if (!pogOpt.successful)
            optFailure.error_messages.push(...pogOpt.error_messages);
          s[pog.key] = optFailure;
          return s;
        },
        {} as Record<string, PartOptimization>,
      );
      const pool = part_optimization_groups.reduce(
        (s, pog) => {
          s[pog.key] = undefined;
          return s;
        },
        {} as Record<string, StockLengthPool | undefined>,
      );
      return { stockLengthPool: pool, optimizations: opts };
    }

    const bestOpt = sortedOptCollection[0];
    const bestPool = part_optimization_groups.reduce(
      (s, pog) => {
        s[pog.key] = bestOpt.stockLengthPool;
        return s;
      },
      {} as Record<string, StockLengthPool | undefined>,
    );

    return {
      stockLengthPool: bestPool,
      optimizations: bestOpt.optimizations,
    };
  }

  Optimize(
    part_optimization_group: PartOptimizationGroup,
    optimization_mode: OptimizationMode,
    settings: StockLengthPool,
  ): PartOptimization {
    const { optSettings, comparer } =
      this.GetSettingsAndComparer(optimization_mode);
    let parts = part_optimization_group.parts.sort(comparer);

    return this.OptimizeSortedParts(parts, optSettings, settings);
  }

  private OptimizeSortedParts(
    sortedParts: Part[],
    optSettings: OptimizationSettings,
    stklenPool: StockLengthPool,
  ): PartOptimization {
    //clone stock length pool
    let stklens: StockLengths[] = [];
    for (let index = 0; index < stklenPool.stock_length_pool.length; index++) {
      const stklen = stklenPool.stock_length_pool[index];
      stklens.push({ ...stklen });
    }

    let cutlistitems: Record<string, CutListItem> = {};

    function getUsableLength(stklen: StockLengths): number {
      var result = stklen.length;
      if (!stklen.is_standard_length) {
        result -= 2 * optSettings.end_trim;
      }
      return result;
    }

    var getPartLength: (p: Part) => number;
    switch (optSettings.mode) {
      case "estimate":
        getPartLength = (p) => {
          if (p.length > 10) return Math.ceil(Math.ceil(p.length) / 6) * 6;
          return p.length;
        };
        break;
      case "takeoff":
        getPartLength = (p) => {
          if (p.length > 10) return Math.ceil(p.length);
          return p.length;
        };
        break;
      case "fabrication":
      default:
        getPartLength = (p) => p.length;
        break;
    }
    //clone parts with rounded lengths
    let parts: Part[] = [];
    for (let index = 0; index < sortedParts.length; index++) {
      const part = sortedParts[index];
      let part2 = { ...part };
      part2.length = getPartLength(part);
      parts.push(part2);
    }

    type LoadedStockLength = {
      stock_length: StockLengths;
      part_indexes: number[];
      used_length: number;
      yield: number;
    };

    function loadStockLength(
      stklen: StockLengths,
      parts: Part[],
    ): LoadedStockLength {
      var partIndexes: number[] = [];
      var usable_length = getUsableLength(stklen);
      var used_length = 0;
      while (usable_length > 0) {
        let partIndex = parts.findIndex((p, i) => {
          return (
            p.length <= usable_length &&
            p.quantity > partIndexes.filter((x) => x == i).length
          );
        });
        if (partIndex < 0) break;
        let part = parts[partIndex];
        partIndexes.push(partIndex);
        usable_length -= part.length + optSettings.saw_kerf;
        used_length += part.length;
      }

      return {
        stock_length: stklen,
        part_indexes: partIndexes,
        used_length,
        yield: used_length / stklen.length,
      };
    }

    let result: PartOptimization = {
      total_stock_lengths: [],
      cut_list: [],
      cut_stock_lengths: [],
      net_parts: 0,
      gross_length: 0,
      net_part_length: 0,
      yield: 0,
      successful: false,
      warning_messages: [],
      error_messages: [],
    };

    while (parts.length > 0) {
      const part = parts[0];
      if (part.quantity == 0) {
        parts.shift();
        continue;
      }
      let candidateStkLens = stklens.filter((s) => {
        return (
          getUsableLength(s) >= part.length &&
          (s.quantity == "unlimited" || s.quantity > 0)
        );
      });
      if (candidateStkLens.length == 0) {
        if (
          stklens.filter((s) => getUsableLength(s) >= part.length).length > 0
        ) {
          result.warning_messages.push(
            `Not enough stock lengths available to cut all the parts. Increased supply of stock lengths to continue with optimization.`,
          );
          stklens.forEach((s) => (s.quantity = "unlimited"));
          continue;
        } else {
          result.error_messages.push(
            `${part.mark_number} is too long to fit on any stock length.`,
          );

          return result;
        }
      }
      let loadedStkLens = candidateStkLens.map((s) =>
        loadStockLength(s, parts),
      );
      loadedStkLens
        .sort((a, b) => {
          if (a.yield < b.yield) return -1;
          if (a.yield > b.yield) return 1;
          return 0;
        })
        .reverse();
      let bestLoadedStkLen = loadedStkLens[0];
      let stklen = bestLoadedStkLen.stock_length;
      if (stklen.quantity != "unlimited") {
        stklen.quantity--;
      }

      var resultStkLen = result.total_stock_lengths.find((s) => {
        return (
          s.length === stklen.length &&
          s.is_standard_length === stklen.is_standard_length
        );
      });
      if (!resultStkLen) {
        resultStkLen = { ...stklen };
        resultStkLen.quantity = 0;
        result.total_stock_lengths.push(resultStkLen);
      }
      if (resultStkLen.quantity != "unlimited") {
        resultStkLen.quantity++;
      }

      let cutStkLen: CutStockLength = {
        length: stklen.length,
        used_length: 0,
        is_standard_length: stklen.is_standard_length,
        part_number: part.part_number,
        finish: part.finish,
        parts: [],
      };
      result.cut_stock_lengths.push(cutStkLen);
      result.gross_length += stklen.length;

      var primaryCutlistItem: CutListItem | undefined = undefined;
      for (let i = 0; i < bestLoadedStkLen.part_indexes.length; i++) {
        const partIndex = bestLoadedStkLen.part_indexes[i];
        let part = parts[partIndex];
        part.quantity--;
        result.net_parts++;
        result.net_part_length += part.length;
        let singlePart = { ...part, quantity: 1 };
        cutStkLen.parts.push(singlePart);
        cutStkLen.used_length += part.length;

        let cutlistKey = `${part.mark_number} | ${stklen.length}`.toUpperCase();
        var cutlistitem: CutListItem | undefined = result.cut_list.find(
          (x) => x.key === cutlistKey,
        );
        if (!cutlistitem) {
          let cutlistStkLen = { ...stklen };
          cutlistStkLen.quantity = 0;

          cutlistitem = {
            id: 0,
            key: cutlistKey,
            part_number: part.part_number,
            mark_number: part.mark_number,
            finish: part.finish,
            length: part.length,
            quantity: 0,
            stock_lengths: cutlistStkLen,
            use_drops_for: [],
            use_drops_for_key: [],
            cut_from_drops: 0,
            distribution: [],
          };

          result.cut_list.push(cutlistitem);
          cutlistitems[cutlistKey] = cutlistitem;
        }
        cutlistitem.quantity++;
        if (i == 0) {
          primaryCutlistItem = cutlistitem;
          if (cutlistitem.stock_lengths.quantity != "unlimited") {
            cutlistitem.stock_lengths.quantity++;
          }
        } else {
          if (primaryCutlistItem && primaryCutlistItem.key != cutlistKey) {
            primaryCutlistItem.use_drops_for_key.push(cutlistKey);
            cutlistitem.cut_from_drops++;
          }
        }

        var dist: Distribution | undefined = cutlistitem.distribution.find(
          (x) => x.unit_id === part.unit_id,
        );
        if (!dist) {
          dist = {
            pallet: part.pallet,
            unit_id: part.unit_id,
            unit_number: part.unit_number,
            release: part.release,
            floor: part.floor,
            quantity: 0,
          };
          cutlistitem.distribution.push(dist);
        }
        if (dist) {
          dist.quantity++;
        }
      }
    }

    result.yield = result.net_part_length / result.gross_length;

    result.cut_list.sort((a, b) => {
      if (a.stock_lengths.length > b.stock_lengths.length) return -1;
      if (a.stock_lengths.length < b.stock_lengths.length) return 1;
      return 0;
    });

    var length: number | undefined = undefined;
    var id = 1;
    for (let index = 0; index < result.cut_list.length; index++) {
      const cutlistitem = result.cut_list[index];
      cutlistitem.use_drops_for_key = [
        ...new Set(cutlistitem.use_drops_for_key),
      ];
      if (length !== cutlistitem.stock_lengths.length) {
        length = cutlistitem.stock_lengths.length;
        id = 1;
      }
      cutlistitem.id = id++;
    }
    for (let index = 0; index < result.cut_list.length; index++) {
      const cutlistitem = result.cut_list[index];
      if (cutlistitem.use_drops_for_key.length > 0) {
        cutlistitem.use_drops_for = cutlistitem.use_drops_for_key
          .map((key) => cutlistitems[key].id)
          .sort();
      }
    }

    result.successful = true;

    return result;
  }

  async GroupParts(all_parts: Part[]): Promise<PartGroup[]> {
    let partOptGrouping = groupBy(all_parts, getPartOptimizationGroupKey);
    let optimizationGroups = Object.entries(partOptGrouping)
      .map(([key, pog]) => ({
        key: key,
        parts: pog,
        part_number: pog[0].part_number,
        finish: pog[0].finish,
        optimization_group: pog[0].optimization_group,
        part_qty: pog.reduce((prev, p) => prev + p.quantity, 0),
      }))
      .sort((a, b) =>
        alphaNumCompare(a.optimization_group, b.optimization_group),
      );
    let partGrouping = groupBy(optimizationGroups, getPartGroupKey);
    return Object.entries(partGrouping)
      .map(([key, pg]) => ({
        key: key,
        part_optimization_groups: pg,
        part_number: pg[0].part_number,
        finish: pg[0].finish,
        part_qty: pg.reduce((prev, p) => prev + p.part_qty, 0),
      }))
      .sort((a, b) => {
        let result = alphaNumCompare(a.part_number, b.part_number);
        if (result !== 0) return result;
        return alphaNumCompare(a.finish, b.finish);
      });
  }
}
