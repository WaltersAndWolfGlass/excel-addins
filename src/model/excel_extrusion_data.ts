import { getTableData, TableData } from "@/model/excel";
import { Part } from "@/model/optimization";

type Unit = {
  release: string;
  floor: string;
  unit_id: string;
  unit_number: string;
  pallet: string;
  optimization_group: string;
  fab_order: string;
};

export interface PartErrors {
  unit_not_found?: boolean;
  no_length?: boolean;
  no_quantity?: boolean;
}

export function isPartErrors(obj: any): obj is PartErrors {
  return (
    (obj.unit_not_found === undefined ||
      typeof obj.unit_not_found === "boolean") &&
    (obj.no_length === undefined || typeof obj.no_length === "boolean") &&
    (obj.no_quantity === undefined || typeof obj.no_quantity === "boolean")
  );
}

export class ExcelExtrusionData {
  private async GetPartsFromExcel(context: any): Promise<Part[]> {
    let ustSheet;
    try {
      ustSheet = context.workbook.worksheets.getItem("UST");
    } catch (error) {
      throw 'Unable to find the "UST" sheet';
    }
    let ustData: TableData;
    try {
      ustData = await getTableData(context, ustSheet, "UST");
    } catch (error) {
      throw 'Unable to find the "UST" table';
    }

    let releaseRegex = /^release$/i;
    let releaseIndex = ustData.columns[0].findIndex((x: string) =>
      releaseRegex.test(x),
    );
    let floorRegex = /^(level|floor)$/i;
    let floorIndex = ustData.columns[0].findIndex((x: string) =>
      floorRegex.test(x),
    );
    let groupRegex = /^(fab ?)?group(ing)?$/i;
    let groupIndex = ustData.columns[0].findIndex((x: string) =>
      groupRegex.test(x),
    );
    let unitIdRegex = /^(unit|loc(action)?)(\s*|_)id$/i;
    let unitIdIndex = ustData.columns[0].findIndex((x: string) =>
      unitIdRegex.test(x),
    );
    let unitNumberRegex = /^unit((\s*|_)(#|number))?$/i;
    let unitNumberIndex = ustData.columns[0].findIndex((x: string) =>
      unitNumberRegex.test(x),
    );
    let palletRegex = /^(crate|pallet)(\s*|_)(#|number)$/i;
    let palletIndex = ustData.columns[0].findIndex((x: string) =>
      palletRegex.test(x),
    );
    let fabOrderRegex = /order$/i;
    let fabOrderIndex = ustData.columns[0].findIndex((x: string) =>
      fabOrderRegex.test(x),
    );

    let units: Record<string, Unit[]> = {};

    for (let index = 0; index < ustData.data.length; index++) {
      const row = ustData.data[index];
      let unitNumber =
        unitNumberIndex >= 0 && unitNumberIndex < row.length
          ? row[unitNumberIndex]
          : "";

      if (unitNumber != "") {
        if (!units.hasOwnProperty(unitNumber)) {
          units[unitNumber] = [];
        }

        let unitId =
          unitIdIndex >= 0 && unitIdIndex < row.length ? row[unitIdIndex] : "";
        let release =
          releaseIndex >= 0 && releaseIndex < row.length
            ? row[releaseIndex]
            : "";
        let floor =
          floorIndex >= 0 && floorIndex < row.length ? row[floorIndex] : "";
        let pallet =
          palletIndex >= 0 && palletIndex < row.length ? row[palletIndex] : "";
        let group =
          groupIndex >= 0 && groupIndex < row.length ? row[groupIndex] : "";
        let fabOrder =
          fabOrderIndex >= 0 && fabOrderIndex < row.length
            ? row[fabOrderIndex]
            : "";

        let unit: Unit = {
          release: release ?? "",
          floor: floor ?? "",
          unit_id: unitId ?? "",
          unit_number: unitNumber,
          pallet: pallet ?? "",
          optimization_group: group ?? "",
          fab_order: fabOrder ?? "",
        };

        units[unitNumber].push(unit);
      }
    }

    let mpdbSheet;
    try {
      mpdbSheet = context.workbook.worksheets.getItem("MPDB");
    } catch (error) {
      throw 'Unable to find the "MPDB" sheet';
    }
    let mpdbData;
    try {
      mpdbData = await getTableData(context, mpdbSheet, "MPDB");
    } catch (error) {
      throw 'Unable to find the "MPDB" table';
    }

    let partNumberRegex = /^(extrusion|part)$/i;
    let partNumberIndex = mpdbData.columns[0].findIndex((x) =>
      partNumberRegex.test(x),
    );
    let markNumberRegex = /^(mark|part)(\s*|_)(#|number)$/i;
    let markNumberIndex = mpdbData.columns[0].findIndex((x) =>
      markNumberRegex.test(x),
    );
    let finishRegex = /^finish$/i;
    let finishIndex = mpdbData.columns[0].findIndex((x) => finishRegex.test(x));
    let lengthRegex = /^(length|cut(\s*|_)(size|len(gth)?))$/i;
    let lengthIndex = mpdbData.columns[0].findIndex((x) => lengthRegex.test(x));
    let quantityRegex = /^(qty|quantity)$/i;
    let quantityIndex = mpdbData.columns[0].findIndex((x) =>
      quantityRegex.test(x),
    );
    unitNumberIndex = mpdbData.columns[0].findIndex((x) =>
      unitNumberRegex.test(x),
    );

    let results: Part[] = [];

    for (let index = 0; index < mpdbData.data.length; index++) {
      const row = mpdbData.data[index];
      let partNumber =
        partNumberIndex >= 0 && partNumberIndex < row.length
          ? row[partNumberIndex]
          : "";

      if (partNumber != "") {
        let markNumber =
          markNumberIndex >= 0 && markNumberIndex < row.length
            ? row[markNumberIndex]
            : "";
        let finish =
          finishIndex >= 0 && finishIndex < row.length ? row[finishIndex] : "";
        let length =
          lengthIndex >= 0 && lengthIndex < row.length
            ? Number(row[lengthIndex])
            : 0;
        if (isNaN(length)) length = 0;

        let quantity =
          quantityIndex >= 0 && quantityIndex < row.length
            ? Number(row[quantityIndex])
            : 0;
        if (isNaN(quantity)) quantity = 0;

        let unitNumber =
          unitNumberIndex >= 0 && unitNumberIndex < row.length
            ? row[unitNumberIndex]
            : "";

        let parts: (Part & PartErrors)[] = [];

        if (units.hasOwnProperty(unitNumber)) {
          let unitInstances = units[unitNumber];
          for (
            let unitIndex = 0;
            unitIndex < unitInstances.length;
            unitIndex++
          ) {
            let unit: Unit = unitInstances[unitIndex];
            let part: Part & PartErrors = {
              part_number: partNumber,
              mark_number: markNumber ?? "",
              finish: finish ?? "",
              length: length,
              unit_id: unit.unit_id,
              unit_number: unit.unit_number,
              release: unit.release,
              floor: unit.floor,
              optimization_group: unit.optimization_group,
              pallet: unit.pallet,
              fab_order: unit.fab_order,
              quantity: quantity,
            };
            parts.push(part);
          }
        } else {
          let part: Part & PartErrors = {
            part_number: partNumber,
            mark_number: markNumber ?? "",
            finish: finish ?? "",
            length: length,
            unit_id: "",
            unit_number: unitNumber,
            release: "",
            floor: "",
            optimization_group: "",
            pallet: "",
            fab_order: "",
            quantity: quantity,
            unit_not_found: true,
          };
          parts.push(part);
        }
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          if (part.length === 0) {
            part.no_length = true;
          }
          if (part.quantity === 0) {
            part.no_quantity = true;
          }
        }
        results.push(...parts);
      }
    }

    return results;
  }

  async GetParts(): Promise<Part[]> {
    return await Excel.run(
      async (context: any): Promise<Part[]> =>
        await this.GetPartsFromExcel(context),
    );
  }
}
