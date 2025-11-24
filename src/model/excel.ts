export async function insertText(
  context: any,
  sheet: any,
  address: string,
  text: string,
) {
  try {
    const range = sheet.getRange(address);
    range.values = [[text]];
    await context.sync();
  } catch (error) {
    console.log("Error: " + error);
  }
}

export function getRangeAndLoadValues(sheet: any, address: string): any {
  let range = sheet.getRange(address);
  range.load("values");
  return range;
}

export async function getValues(
  context: any,
  sheet: any,
  address: string,
): Promise<Array<Array<any>>> {
  try {
    const range = getRangeAndLoadValues(sheet, address);
    await context.sync();
    return range.values;
  } catch (error) {
    console.log("Error: " + error);
    return [];
  }
}

export async function getValueAsString(
  context: any,
  sheet: any,
  address: string,
): Promise<string | undefined> {
  try {
    const range = getRangeAndLoadValues(sheet, address);
    await context.sync();
    return getRangeValueAsString(range);
  } catch (error) {
    console.log("Error: " + error);
    return undefined;
  }
}

export function getRangeValueAsString(range: any): string | undefined {
  let values: Array<Array<any>> = range.values;
  if (values.length > 0 && values[0].length > 0) {
    return String(values[0][0]);
  } else {
    return undefined;
  }
}
export function getRangeDateValue(range: any): Date | undefined {
  let values: Array<any> = range.values;
  if (values.length > 0 && values[0].length > 0) {
    let num = Number(values[0][0]);
    if (isNaN(num)) {
      return undefined;
    } else {
      let date = new Date((num - 25569) * 24 * 60 * 60 * 1000);
      return new Date(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
      );
    }
  } else {
    return undefined;
  }
}

export async function getCustomDocProperty(
  context: any,
  key: string,
): Promise<any> {
  try {
    let customDocProperties = context.workbook.properties.custom;
    customDocProperties.load(["key", "value"]);
    await context.sync();

    return customDocProperties.items.find((e: any) => e.key === key)?.value;
  } catch (error) {
    console.log("Error: " + error);
    return undefined;
  }
}
