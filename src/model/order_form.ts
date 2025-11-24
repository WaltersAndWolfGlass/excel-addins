import {
  getValues,
  getRangeAndLoadValues,
  getRangeValueAsString,
  getRangeDateValue,
  getCustomDocProperty,
} from "@/model/excel";

export type OrderFormLineItem = {
  description: string;
  units: "EA" | "LF";
  quantity: number;
  price_per_unit: number;
};

export class OrderForm {
  form_type: "metal" | "glass" | "misc" | "unknown" = "unknown";
  vendor: string | undefined = undefined;
  order_date: Date | undefined = undefined;
  expected_date: Date | undefined = undefined;
  ordered_by: string | undefined = undefined;
  job_number: string | undefined = undefined;
  cost_code: string | undefined = undefined;
  shipping_name: string | undefined = undefined;
  shipping_street: string | undefined = undefined;
  shipping_city: string | undefined = undefined;
  shipping_state: string | undefined = undefined;
  shipping_zip: string | undefined = undefined;

  template_version: number | undefined = undefined;

  private async LoadFormType(context: any) {
    let sheet = context.workbook.worksheets.getActiveWorksheet();
    let range = getRangeAndLoadValues(sheet, "K7");
    await context.sync();

    let value = getRangeValueAsString(range);

    if (value == "PURCHASE ORDER REQUEST") {
      this.form_type = "metal";
      return;
    }
  }

  async LoadHeaderFromWorkbook(): Promise<boolean> {
    try {
      return await Excel.run(async (context: any): Promise<boolean> => {
        await this.LoadFormType(context);

        if (this.form_type == "metal") {
          return await this.LoadHeaderFromMetalOrderForm(context);
        }

        return false;
      });
    } catch (error) {
      console.log("Error: " + error);
      return false;
    }
  }

  private async LoadHeaderFromMetalOrderForm(context: any): Promise<boolean> {
    try {
      let sheet = context.workbook.worksheets.getActiveWorksheet();

      let vendorRange = getRangeAndLoadValues(sheet, "K10");
      let jobNumberRange = getRangeAndLoadValues(sheet, "K12");
      let costCodeRange = getRangeAndLoadValues(sheet, "K13");
      let orderedByRange = getRangeAndLoadValues(sheet, "O10");
      let orderDateRange = getRangeAndLoadValues(sheet, "O12");
      let expectedDateRange = getRangeAndLoadValues(sheet, "O13");

      await context.sync();

      this.vendor = getRangeValueAsString(vendorRange) ?? "";
      this.job_number = getRangeValueAsString(jobNumberRange) ?? "";
      this.cost_code = getRangeValueAsString(costCodeRange) ?? "";
      this.ordered_by = getRangeValueAsString(orderedByRange) ?? "";
      this.order_date = getRangeDateValue(orderDateRange);
      this.expected_date = getRangeDateValue(expectedDateRange);

      return true;
    } catch (error) {
      console.log("Error: " + error);
      return false;
    }
  }

  async GetLineItems() {
    try {
      return await Excel.run(async (context: any) => {
        await this.LoadFormType(context);

        if (this.form_type == "metal") {
          return await this.GetLineItemsFromMetalOrderForm(context);
        }

        return "not metal";
      });
    } catch (error) {
      console.log("Error: " + error);
      return "error";
    }
  }

  private async GetTemplateVersion(context: any): Promise<number> {
    if (!this.template_version) {
      try {
        let value = await getCustomDocProperty(context, "Template Version");

        let num = Number(value);
        this.template_version = isNaN(num) ? 1 : value;
      } catch (error) {
        console.log("Error: " + error);
        this.template_version = 1;
      }
    }
    return this.template_version ?? 1;
  }

  private async GetMetalDataRowLimits(
    context: any,
    sheet: any,
  ): Promise<{ firstRow: number; lastRow: number }> {
    let version = await this.GetTemplateVersion(context);
    var firstRow: number;
    var lastRow: number;
    if (version >= 2) {
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
            e.length > 0 && String(e[0])?.toUpperCase().includes("SET-UP"),
        ) + 19;
    }
    return { firstRow: firstRow, lastRow: lastRow };
  }

  private async GetFinishNames(context: any, sheet: any) {
    let version = await this.GetTemplateVersion(context);
    var range: any;
    if (version >= 2) {
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
      `C${limits.firstRow}:N${limits.lastRow}`,
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
}
