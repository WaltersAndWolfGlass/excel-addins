import {
  getValues,
  getRangeAndLoadValues,
  getRangeValues,
  getRangeValueAsString,
  getRangeDateValue,
  getCustomDocProperty,
  getValueAsString,
} from "@/model/excel";
import { Fraction } from "fraction.js";
import { toast } from "sonner";

export type OrderFormLineItem = {
  description: string;
  units: "EA" | "LF";
  quantity: number;
  price_per_unit: number;
};

export class OrderForm {
  form_type: "metal" | "glass" | "misc" | "unknown" = "unknown";
  form_subtype: "n/a" | "glass" | "aluminum" | "composite" | "door" = "n/a";
  vendor: string | undefined = undefined;
  order_date: Date | undefined = undefined;
  expected_date: Date | undefined = undefined;
  ordered_by: string | undefined = undefined;
  job_number: string | undefined = undefined;
  cost_code: string | undefined = undefined;
  warranty: string | undefined = undefined;
  shipping_name: string | undefined = undefined;
  shipping_street: string | undefined = undefined;
  shipping_city: string | undefined = undefined;
  shipping_state: string | undefined = undefined;
  shipping_zip: string | undefined = undefined;

  template_version: number = 1;

  private async LoadFormType(context: any) {
    await this.GetTemplateVersion(context);

    let sheet = context.workbook.worksheets.getActiveWorksheet();

    let metalRange = getRangeAndLoadValues(sheet, "K7");
    let glass1Range = getRangeAndLoadValues(sheet, "T1:BS1");
    await context.sync();

    let value = getRangeValueAsString(metalRange);

    if (value == "PURCHASE ORDER REQUEST") {
      this.form_type = "metal";
      return;
    }

    if (this.template_version >= 2) {
      let firstSheet = context.workbook.worksheets.getFirst();
      firstSheet.load("name");
      await context.sync();

      if (firstSheet.name.toUpperCase() === "COVERSHEET") {
        let sheet = firstSheet.getNext();
        let glass2Range = getRangeAndLoadValues(sheet, "OrderFormType");
        await context.sync();
        let value = getRangeValueAsString(glass2Range);
        if (value == "GLASS ORDER") {
          this.form_type = "glass";
          this.form_subtype = "glass";
          return;
        } else if (value == "ALUMINUM PANEL ORDER") {
          this.form_type = "glass";
          this.form_subtype = "aluminum";
          return;
        } else if (value == "COMPOSITE PANEL ORDER") {
          this.form_type = "glass";
          this.form_subtype = "composite";
          return;
        } else if (value?.endsWith("DOOR GLASS ORDER")) {
          this.form_type = "glass";
          this.form_subtype = "door";
          return;
        }
      }
    } else {
      let values = getRangeValues(glass1Range);
      if (values?.find((x) => x.find((y) => y == "GLASS ORDER"))) {
        this.form_type = "glass";
        this.form_subtype = "glass";
        return;
      }
    }
  }

  async LoadHeaderFromWorkbook(): Promise<boolean> {
    try {
      return await Excel.run(async (context: any): Promise<boolean> => {
        await this.LoadFormType(context);

        if (this.form_type == "metal") {
          return await this.LoadHeaderFromMetalOrderForm(context);
        } else if (this.form_type == "glass") {
          if (this.template_version >= 2) {
            return await this.LoadHeaderFromGlassOrderForm2(context);
          } else {
            return false;
          }
        }

        return false;
      });
    } catch (error) {
      return false;
    }
  }

  private async LoadHeaderFromMetalOrderForm(context: any): Promise<boolean> {
    try {
      let sheet = context.workbook.worksheets.getActiveWorksheet();

      let { firstRow: _, lastRow } = await this.GetMetalDataRowLimits(
        context,
        sheet
      );

      let vendorRange = getRangeAndLoadValues(sheet, "K10");
      let jobNumberRange = getRangeAndLoadValues(sheet, "K12");
      let costCodeRange = getRangeAndLoadValues(sheet, "K13");
      let orderedByRange = getRangeAndLoadValues(sheet, "O10");
      let orderDateRange = getRangeAndLoadValues(sheet, "O12");
      let expectedDateRange = getRangeAndLoadValues(sheet, "O13");
      let warrantyRange = getRangeAndLoadValues(sheet, `L${lastRow + 10}`);

      await context.sync();

      this.vendor = getRangeValueAsString(vendorRange) ?? "";
      this.job_number = getRangeValueAsString(jobNumberRange) ?? "";
      this.cost_code = getRangeValueAsString(costCodeRange) ?? "";
      this.ordered_by = getRangeValueAsString(orderedByRange) ?? "";
      this.order_date = getRangeDateValue(orderDateRange);
      this.expected_date = getRangeDateValue(expectedDateRange);
      this.warranty = getRangeValueAsString(warrantyRange);

      return true;
    } catch (error) {
      return false;
    }
  }

  async GetLineItems(): Promise<string | OrderFormLineItem[]> {
    try {
      return await Excel.run(async (context: any) => {
        await this.LoadFormType(context);

        if (this.form_type == "metal") {
          return await this.GetLineItemsFromMetalOrderForm(context);
        } else if (this.form_type == "glass") {
          if (this.template_version >= 2) {
            return await this.GetLineItemsFromGlassOrderForm2(context);
          } else {
            return "glass form version 1 not implemented";
          }
        }

        return "unknown form type";
      });
    } catch (error) {
      return "error";
    }
  }

  private async GetTemplateVersion(context: any): Promise<number> {
    if (!this.template_version) {
      try {
        let value = await getCustomDocProperty(context, "Template Version");
        toast(JSON.stringify(value));

        let num = Number(value);
        this.template_version = isNaN(num) ? 1 : value;
      } catch (error) {
        toast("error in gettemplateversion");
        this.template_version = 1;
      }
    }
    return this.template_version ?? 1;
  }

  private async GetMetalDataRowLimits(
    context: any,
    sheet: any
  ): Promise<{ firstRow: number; lastRow: number }> {
    var firstRow: number;
    var lastRow: number;
    if (this.template_version >= 2) {
      let topRange = sheet.getRange("Print_Titles");
      topRange.load("rowIndex");
      let bottomRange = sheet.getRange("BeginSubTotals");
      bottomRange.load("rowIndex");
      await context.sync();

      firstRow = topRange.rowIndex + 2;
      lastRow = bottomRange.rowIndex;
    } else {
      firstRow = 20;

      let range = getRangeAndLoadValues(sheet, "M20:M10000");
      await context.sync();

      lastRow =
        range.values.findIndex(
          (e: any) =>
            e.length > 0 && String(e[0])?.toUpperCase().includes("SET-UP")
        ) + 19;
    }
    return { firstRow: firstRow, lastRow: lastRow };
  }

  private async GetFinishNames(context: any, sheet: any) {
    var range: any;
    if (this.template_version >= 2) {
      range = getRangeAndLoadValues(sheet, "FinishesLegend");
    } else {
      range = getRangeAndLoadValues(sheet, "E10:F16");
    }
    await context.sync();

    return range.values
      .map((x: any) => {
        let match = x[0].match(/FINISH TYPE (\w+)\s*=/);
        var key: string = "";
        if (match) {
          key = match[1];
        }
        let finish = x[1];
        return { key: key, finish: finish };
      })
      .filter((x: any) => x.key !== "");
  }

  private async GetLineItemsFromMetalOrderForm(context: any) {
    let sheet = context.workbook.worksheets.getActiveWorksheet();

    let limits = await this.GetMetalDataRowLimits(context, sheet);
    let finishes = await this.GetFinishNames(context, sheet);

    let values = await getValues(
      context,
      sheet,
      `C${limits.firstRow}:N${limits.lastRow}`
    );

    return values
      .filter((x: Array<any>) => {
        let qty = Number(x[0]);
        return !isNaN(qty) && qty > 0;
      })
      .map((x: Array<any>): OrderFormLineItem => {
        let qty = Number(x[0]); // column C
        let part_number = String(x[2]); // column E
        let length = Number(x[3]); // column F
        let finishCode = String(x[10]); // column M
        let unitCost = Number(x[11]); // column N

        let price = isNaN(unitCost) ? 0 : Math.round(unitCost * 10000) / 10000;

        var lengthString: string;
        if (isNaN(length)) {
          lengthString = "[length]";
        } else {
          let ft = Math.trunc(length);
          let inches = Math.round((length - ft) * 12);
          lengthString = `${ft}'-${inches}"`;
        }

        let finish: string =
          finishes.find((e: any) => {
            return e.key === finishCode;
          })?.finish ?? "[finish]";

        return {
          description: `${part_number} @ ${lengthString} ${finish}`,
          units: "EA",
          quantity: qty,
          price_per_unit: price,
        };
      });
  }

  private async LoadHeaderFromGlassOrderForm2(context: any): Promise<boolean> {
    try {
      let coversheet = context.workbook.worksheets.getFirst();
      let firstOrderSheet = coversheet.getNext();

      let vendorRange = getRangeAndLoadValues(firstOrderSheet, "Vendor");
      let jobNumberRange = getRangeAndLoadValues(firstOrderSheet, "JobNumber");
      let orderDateRange = getRangeAndLoadValues(
        firstOrderSheet,
        "DateOrdered"
      );
      let expectedDateRange = getRangeAndLoadValues(
        firstOrderSheet,
        "DeliveryDate"
      );

      await context.sync();

      this.vendor = getRangeValueAsString(vendorRange) ?? "";
      this.job_number = getRangeValueAsString(jobNumberRange) ?? "";
      this.order_date = getRangeDateValue(orderDateRange);
      this.expected_date = getRangeDateValue(expectedDateRange);

      return true;
    } catch (error) {
      return false;
    }
  }

  private async GetLineItemsFromGlassOrderForm2(context: any) {
    let sheets = context.workbook.worksheets;
    sheets.load("items/name");
    await context.sync();

    var results: OrderFormLineItem[] = [];

    function getStringValue(array: Array<any> | undefined, index: number) {
      return array !== undefined && index < array.length
        ? String(array[index])
        : "";
    }
    function getNumberValue(array: Array<any> | undefined, index: number) {
      return array !== undefined && index < array.length
        ? Number(array[index])
        : 0;
    }

    for (var i = 0; i++; i < sheets.items.length) {
      let sheet = sheets.items[i];
      var sheettype: "normal" | "raked" | "patterns" = "normal";

      let glassShape = await getValueAsString(context, sheet, "GlassShape");
      if (glassShape === "RAKED") {
        sheettype = "raked";
      } else if (glassShape === "PATTERNS") {
        sheettype = "patterns";
      } else if (glassShape === undefined) {
        continue;
      }

      let markStyle = this.form_subtype === "door" ? "DR#" : "Mk#";

      let qtyRange = getRangeAndLoadValues(sheet, "TotalQuantityData");
      let markRange = getRangeAndLoadValues(sheet, "MarkNumberData");
      let sqftRange = getRangeAndLoadValues(sheet, "SqFtEachData");
      let priceRange = getRangeAndLoadValues(sheet, "PricePerSqFtData");
      let baseRange = getRangeAndLoadValues(sheet, "BaseData");
      let leftRange = getRangeAndLoadValues(sheet, "LeftData");
      let rightRange = getRangeAndLoadValues(sheet, "RightData");
      let widthRange = getRangeAndLoadValues(sheet, "WidthData");
      let heightRange = getRangeAndLoadValues(sheet, "HeightData");

      await context.sync();

      let qtyValues = getRangeValues(qtyRange);
      if (qtyValues === undefined) continue;

      let markValues = getRangeValues(markRange);
      let sqftValues = getRangeValues(sqftRange);
      let priceValues = getRangeValues(priceRange);
      let baseValues = getRangeValues(baseRange);
      let leftValues = getRangeValues(leftRange);
      let rightValues = getRangeValues(rightRange);
      let widthValues = getRangeValues(widthRange);
      let heightValues = getRangeValues(heightRange);

      for (var j = 0; j++; j < qtyValues.length) {
        let qty = Number(qtyValues[j]);
        if (isNaN(qty) || qty <= 0) continue;
        let mark = getStringValue(markValues, j);
        let sqft = getNumberValue(sqftValues, j);
        let price = getNumberValue(priceValues, j);
        let base = getNumberValue(baseValues, j);
        let left = getNumberValue(leftValues, j);
        let right = getNumberValue(rightValues, j);
        let width = getNumberValue(widthValues, j);
        let height = getNumberValue(heightValues, j);

        var desc = "";
        if (sheettype === "raked") {
          desc = `${qty} @ ${new Fraction(base).toFraction()} x ${new Fraction(
            left
          ).toFraction()} x ${new Fraction(
            right
          ).toFraction()} ${markStyle} ${mark}`;
        } else if (sheettype === "patterns") {
          desc = `${qty} @ SEE DWG ${markStyle} ${mark}`;
        } else if (sheettype === "normal") {
          desc = `${qty} @ ${new Fraction(width).toFraction()} x ${new Fraction(
            height
          ).toFraction()} ${markStyle} ${mark}`;
        } else {
          desc = `${qty} @ [unknown] x [unknown] ${markStyle} ${mark}`;
        }

        results.push({
          description: desc,
          units: "EA",
          quantity: qty,
          price_per_unit: price * sqft,
        });
      }
    }

    return results;
  }
}
