import { addTableData, autoFitAllColumns, createTable } from "./excel";
import {
  PartGroup,
  PartOptimizationSettingsStore,
  PartOptimizationStore,
  calculatePartOptimizationGroupKey,
} from "./optimization";

const optStkLensName = "WWOptStkLens";

const optOrderFormName = "WWOptOrderForm";
const optOrderFormPattern = /WWOpt[-_ ]?Order[-_ ]?Form/i;
const optCutListName = "WWOptCutList";
const optCutListPattern = /WWOpt[-_ ]?Cut[-_ ]?List/i;
const optCutDetailsName = "WWOptCutDetails";
const optCutDetailsPattern = /WWOpt[-_ ]?Cut[-_ ]?Details/i;

const allTableNames = [
  optStkLensName,
  optOrderFormName,
  optCutListName,
  optCutDetailsName,
];

type OrderFormRow = {
  part: string;
  finish: string;
  stklen_size: number;
  is_standard_length: boolean;
  stklen_qty: number;
  net_parts: number;
  net_part_length: number;
  gross_length: number;
  yield: number;
};

function getOrderFormRows(
  partGroups: PartGroup[],
  optStore: PartOptimizationStore,
): OrderFormRow[] {
  const rowData: OrderFormRow[] = [];
  for (let pgIndex = 0; pgIndex < partGroups.length; pgIndex++) {
    const pg = partGroups[pgIndex];
    const slOpts = pg.part_optimization_groups
      .map((pog) => optStore[pog.key])
      .flatMap((po) =>
        po === undefined || po === "optimizing" ? [] : po.total_stock_lengths,
      );
    const rows: OrderFormRow[] = [];
    for (let sloIndex = 0; sloIndex < slOpts.length; sloIndex++) {
      const slOpt = slOpts[sloIndex];
      let row = rows.find(
        (x) =>
          x.stklen_size === slOpt.length &&
          x.is_standard_length === slOpt.is_standard_length,
      );
      if (row === undefined) {
        row = {
          part: pg.part_number,
          finish: pg.finish,
          stklen_size: slOpt.length,
          is_standard_length: slOpt.is_standard_length,
          stklen_qty: 0,
          net_parts: 0,
          net_part_length: 0,
          gross_length: 0,
          yield: 0,
        };
        rows.push(row);
      }
      row.stklen_qty += slOpt.quantity === "unlimited" ? 0 : slOpt.quantity;
      row.net_parts += slOpt.net_parts;
      row.net_part_length += slOpt.net_part_length;
      row.gross_length += slOpt.gross_length;
      row.yield = row.net_part_length / row.gross_length;
    }
    rows.sort((a, b) => {
      if (a.stklen_size > b.stklen_size) return -1;
      if (a.stklen_size < b.stklen_size) return 1;
      if (a.is_standard_length < b.is_standard_length) return -1;
      if (a.is_standard_length > b.is_standard_length) return 1;
      return 0;
    });
    rowData.push(...rows);
  }
  return rowData;
}

type CutListRow = {
  cutlist: number;
  group: string;
  part: string;
  finish: string;
  stklen_size: number;
  is_standard_length: boolean;
  item: number;
  stklen_qty: number;
  piece_qty: number;
  mark: string;
  length: number;
  cut_from_drops: number;
  use_drops_for: string;
};

function getCutListRows(
  partGroups: PartGroup[],
  optStore: PartOptimizationStore,
): CutListRow[] {
  let cutlistIndex = 0;
  const rows: CutListRow[] = [];

  for (let pgIndex = 0; pgIndex < partGroups.length; pgIndex++) {
    const pg = partGroups[pgIndex];
    for (
      let pogIndex = 0;
      pogIndex < pg.part_optimization_groups.length;
      pogIndex++
    ) {
      const pog = pg.part_optimization_groups[pogIndex];
      const opt = optStore[pog.key];
      if (opt === undefined || opt === "optimizing") continue;

      for (let itemIndex = 0; itemIndex < opt.cut_list.length; itemIndex++) {
        const item = opt.cut_list[itemIndex];

        rows.push({
          cutlist: item.id === 1 ? ++cutlistIndex : cutlistIndex,
          group: pog.optimization_group,
          part: item.part_number,
          finish: item.finish,
          stklen_size: item.stock_lengths.length,
          is_standard_length: item.stock_lengths.is_standard_length,
          item: item.id,
          stklen_qty:
            item.stock_lengths.quantity !== "unlimited"
              ? item.stock_lengths.quantity
              : 0,
          piece_qty: item.quantity,
          mark: item.mark_number,
          length: item.length,
          cut_from_drops: item.cut_from_drops,
          use_drops_for: item.use_drops_for.map((x) => x.toString()).join(", "),
        });
      }
    }
  }

  return rows;
}

type CutDetailRow = {
  group: string;
  part: string;
  finish: string;
  stklen_id: number;
  stklen_size: number;
  is_standard_length: boolean;
  used_length: number;
  mark_number: string;
  length: number;
  release: string;
  pallet: string;
  floor: string;
  unit_id: string;
  unit_number: string;
};

function getCutDetailRows(
  partGroups: PartGroup[],
  optStore: PartOptimizationStore,
): CutDetailRow[] {
  const rows: CutDetailRow[] = [];

  for (let pgIndex = 0; pgIndex < partGroups.length; pgIndex++) {
    const pg = partGroups[pgIndex];
    for (
      let pogIndex = 0;
      pogIndex < pg.part_optimization_groups.length;
      pogIndex++
    ) {
      const pog = pg.part_optimization_groups[pogIndex];
      const opt = optStore[pog.key];
      if (opt === undefined || opt === "optimizing") continue;

      let stklenId = 1;

      for (
        let stkLenIndex = 0;
        stkLenIndex < opt.cut_stock_lengths.length;
        stkLenIndex++
      ) {
        const stkLen = opt.cut_stock_lengths[stkLenIndex];

        for (let partIndex = 0; partIndex < stkLen.parts.length; partIndex++) {
          const part = stkLen.parts[partIndex];
          rows.push({
            group: pog.optimization_group,
            part: stkLen.part_number,
            finish: stkLen.finish,
            stklen_id: stklenId,
            stklen_size: stkLen.length,
            is_standard_length: stkLen.is_standard_length,
            used_length: stkLen.used_length,
            mark_number: part.mark_number,
            length: part.length,
            release: part.release,
            pallet: part.pallet,
            floor: part.floor,
            unit_id: part.unit_id,
            unit_number: part.unit_number,
          });
        }

        stklenId++;
      }
    }
  }

  return rows;
}

async function clearTable(context: Excel.RequestContext, table: Excel.Table) {
  table.clearFilters();
  table.rows.load("items");
  await context.sync();
  table.rows.deleteRows(table.rows.items);
}
async function getHeaders(context: Excel.RequestContext, table: Excel.Table) {
  let range = table.getHeaderRowRange().load("values");
  await context.sync();

  return range.values[0];
}

async function createOrGetSheetAndClearTable(
  context: Excel.RequestContext,
  name: string,
) {
  let workbook = context.workbook;
  let sheets = workbook.worksheets;

  let sheet = sheets.getItemOrNullObject(name);
  await context.sync();
  if (sheet.isNullObject) {
    sheet = sheets.add(name);
  }

  let table = sheet.tables.getItemOrNullObject(name);
  await context.sync();
  if (!table.isNullObject) {
    table.clearFilters();
    table.delete();
    await context.sync();
  }

  return sheet;
}
async function stampUserAndTime(sheet: Excel.Worksheet, address: string) {
  let authContext = await Office.auth.getAuthContext();
  const username = authContext.userPrincipalName;

  let range = sheet.getRange(address);
  range.values = [[username], [new Date().toLocaleString()]];
}

function formatColumnAsCheckboxes(table: Excel.Table, column: string) {
  let range = table.columns.getItem(column).getDataBodyRange();
  range.control = {
    type: Excel.CellControlType.checkbox,
  };
}
function formatNumberColumn(
  table: Excel.Table,
  column: string,
  numberFormat: string,
) {
  let range = table.columns.getItem(column).getDataBodyRange();
  range.numberFormat = [[numberFormat]];
}

function formatColumnForWholeInch(table: Excel.Table, column: string) {
  formatNumberColumn(table, column, '#,##0\\"');
}
function formatColumnForDecimalInch(table: Excel.Table, column: string) {
  formatNumberColumn(table, column, '#,##0.00\\"');
}
function formatColumnForWholeNumber(table: Excel.Table, column: string) {
  formatNumberColumn(table, column, "#,##0");
}
function formatColumnForPercentage(table: Excel.Table, column: string) {
  formatNumberColumn(table, column, "0.0%");
}
function formatColumnAsText(table: Excel.Table, column: string) {
  formatNumberColumn(table, column, "@");
}

export default class ExcelOptimizationExporter {
  readonly partGroups: PartGroup[];
  readonly optStore: PartOptimizationStore;
  readonly orderFormRows: OrderFormRow[];
  readonly cutlistRows: CutListRow[];
  readonly cutDetailRows: CutDetailRow[];

  constructor();
  constructor(partGroups: PartGroup[], optStore: PartOptimizationStore);
  constructor(
    partGroups: PartGroup[] = [],
    optStore: PartOptimizationStore = {},
  ) {
    this.partGroups = partGroups;
    this.optStore = optStore;

    this.orderFormRows = getOrderFormRows(partGroups, optStore);
    this.cutlistRows = getCutListRows(partGroups, optStore);
    this.cutDetailRows = getCutDetailRows(partGroups, optStore);
  }

  private async exportStkLens(context: Excel.RequestContext) {
    let sheet = await createOrGetSheetAndClearTable(context, optStkLensName);

    let table = createTable(sheet, "A1:F1", optStkLensName, [
      [
        "Extrusion",
        "Finish",
        "Group",
        "StockLengthSize",
        "IsStandardLength",
        "StockLengthQty",
      ],
    ]);

    formatColumnForWholeInch(table, "StockLengthSize");
    formatColumnAsCheckboxes(table, "IsStandardLength");
    formatColumnForWholeNumber(table, "StockLengthQty");

    await stampUserAndTime(sheet, "H1:H2");

    const data = this.partGroups
      .flatMap((pg) => pg.part_optimization_groups)
      .reduce((result, pog) => {
        const optimization = this.optStore[pog.key];
        if (optimization === undefined || optimization === "optimizing")
          return result;
        result.push(
          ...optimization.total_stock_lengths.map((sl) => [
            pog.part_number,
            pog.finish,
            pog.optimization_group,
            sl.length,
            sl.is_standard_length,
            sl.quantity,
          ]),
        );
        return result;
      }, [] as any[][]);
    addTableData(table, data);
    autoFitAllColumns(sheet);
    await context.sync();
  }

  private async importPartOptSettingsStore(
    context: Excel.RequestContext,
  ): Promise<PartOptimizationSettingsStore> {
    let table = context.workbook.tables.getItemOrNullObject(optStkLensName);
    await context.sync();

    if (table.isNullObject) return {};

    let headerRange = table.getHeaderRowRange().load("values");
    let dataRange = table.getDataBodyRange().load("values");

    await context.sync();

    const headers = headerRange.values[0];
    const extIndex = headers.findIndex((x) => x === "Extrusion");
    const finishIndex = headers.findIndex((x) => x === "Finish");
    const groupIndex = headers.findIndex((x) => x === "Group");
    const sizeIndex = headers.findIndex((x) => x === "StockLengthSize");
    const stdlenIndex = headers.findIndex((x) => x === "IsStandardLength");
    const qtyIndex = headers.findIndex((x) => x === "StockLengthQty");

    const store: PartOptimizationSettingsStore = {};

    dataRange.values.forEach((row) => {
      const key = calculatePartOptimizationGroupKey(
        row[extIndex],
        row[finishIndex],
        row[groupIndex],
      );
      let settings = store[key];
      if (settings === undefined) {
        settings = {
          type: "stock_length_pool",
          stock_length_pool: [],
        };
        store[key] = settings;
      }
      if (settings.type === "stock_length_pool") {
        settings.stock_length_pool.push({
          length: row[sizeIndex],
          is_standard_length: row[stdlenIndex],
          quantity: row[qtyIndex],
        });
      }
    });

    return store;
  }

  private async exportOrderForm(context: Excel.RequestContext) {
    let sheet = await createOrGetSheetAndClearTable(context, optOrderFormName);

    let table = createTable(sheet, "A1:I1", optOrderFormName, [
      [
        "Qty",
        "Ext",
        "Finish",
        "Size",
        "StdLen",
        "NetPieces",
        "NetLength",
        "GrossLength",
        "Yield",
      ],
    ]);

    await context.sync();

    formatColumnForWholeNumber(table, "Qty");
    formatColumnForWholeInch(table, "Size");
    formatColumnAsCheckboxes(table, "StdLen");
    formatColumnForWholeNumber(table, "NetPieces");
    formatColumnForWholeInch(table, "NetLength");
    formatColumnForWholeInch(table, "GrossLength");
    formatColumnForPercentage(table, "Yield");

    await stampUserAndTime(sheet, "K1:K2");

    const data = this.orderFormRows.map((row) => [
      row.stklen_qty,
      row.part,
      row.finish,
      row.stklen_size,
      row.is_standard_length,
      row.net_parts,
      row.net_part_length,
      row.gross_length,
      row.yield,
    ]);
    addTableData(table, data);
    autoFitAllColumns(sheet);
    await context.sync();
  }

  private async exportOrderFormToExistingTable(
    context: Excel.RequestContext,
    table: Excel.Table,
  ) {
    const headers = await getHeaders(context, table);

    const valueFunctions: ((
      r: OrderFormRow,
    ) => string | number | boolean | null)[] = headers.map((header) => {
      if (/^(st(oc)?k[-_ ]?len(gth)?[-_ ]?)?(qty|quantity)$/i.test(header)) {
        return (r) => r.stklen_qty;
      } else if (
        /^(part|ext(rusion)?)([-_ ]?(num(ber)?|no\.?|#))?$/i.test(header)
      ) {
        return (r) => r.part;
      } else if (/^(text21|fin(ish)?)$/i.test(header)) {
        return (r) => r.finish;
      } else if (/^(is[-_ ])?(standard|std)[-_ ]?len(gth)?$/i.test(header)) {
        return (r) => r.is_standard_length;
      } else if (/^net[-_ ]?len(gth)?$/i.test(header)) {
        return (r) => r.net_part_length;
      } else if (/^gross[-_ ]?len(gth)?$/i.test(header)) {
        return (r) => r.gross_length;
      } else if (
        /^(text14|net[-_ ]?part(s|[-_ ]?(qty|quantity|c(oun)?t))|(#|no\.?|num(ber)?)[-_ ]?(of[-_ ]?)(pieces?|pcs?))$/i.test(
          header,
        )
      ) {
        return (r) => r.net_parts;
      } else if (/^yield$/i.test(header)) {
        return (r) => r.yield;
      } else if (
        /^(text18|st(oc)?k[-_ ]?len(gth)?[-_ ]?(size|len(gth)?)?)$/i.test(
          header,
        )
      ) {
        return (r) => r.stklen_size;
      } else {
        return (_) => null;
      }
    });

    const data = this.orderFormRows.map((r) => valueFunctions.map((f) => f(r)));

    await clearTable(context, table);
    addTableData(table, data);
    await context.sync();
  }

  private async exportCutList(context: Excel.RequestContext) {
    let sheet = await createOrGetSheetAndClearTable(context, optCutListName);

    let table = createTable(sheet, "A1:M1", optCutListName, [
      [
        "CutList#",
        "Group",
        "Ext",
        "Finish",
        "StkLenSize",
        "StdLen",
        "Item#",
        "StkLenQty",
        "PieceQty",
        "Mark",
        "Length",
        "CutFromDrops",
        "UseDropsFor",
      ],
    ]);

    await context.sync();

    formatColumnForWholeNumber(table, "CutList#");
    formatColumnForWholeInch(table, "StkLenSize");
    formatColumnAsCheckboxes(table, "StdLen");
    formatColumnForWholeNumber(table, "Item#");
    formatColumnForWholeNumber(table, "StkLenQty");
    formatColumnForWholeNumber(table, "PieceQty");
    formatColumnForDecimalInch(table, "Length");
    formatColumnForWholeNumber(table, "CutFromDrops");
    formatColumnAsText(table, "UseDropsFor");

    await stampUserAndTime(sheet, "O1:O2");

    const data = this.cutlistRows.map((row) => [
      row.cutlist,
      row.group,
      row.part,
      row.finish,
      row.stklen_size,
      row.is_standard_length,
      row.item,
      row.stklen_qty,
      row.piece_qty,
      row.mark,
      row.length,
      row.cut_from_drops,
      row.use_drops_for,
    ]);
    addTableData(table, data);
    autoFitAllColumns(sheet);
    await context.sync();
  }
  private async exportCutListToExistingTable(
    context: Excel.RequestContext,
    table: Excel.Table,
  ) {
    const headers = await getHeaders(context, table);

    const valueFunctions: ((
      r: CutListRow,
    ) => string | number | boolean | null)[] = headers.map((header) => {
      if (/^cut[-_ ]?list([-_ ]?(#|no\.?|num(ber)?))?$/i.test(header)) {
        return (r) => r.cutlist;
      } else if (
        /^((opt(imization)?|fab(rication)?)[-_ ]?)?group$/i.test(header)
      ) {
        return (r) => r.group;
      } else if (
        /^(part|ext(rusion)?)([-_ ]?(num(ber)?|no\.?|#))?$/i.test(header)
      ) {
        return (r) => r.part;
      } else if (/^fin(ish)?$/i.test(header)) {
        return (r) => r.finish;
      } else if (
        /^st(oc)?k[-_ ]?len(gth)?[-_ ]?(size|len(gth)?)$/i.test(header)
      ) {
        return (r) => r.stklen_size;
      } else if (/^(is[-_ ])?(standard|std)[-_ ]?len(gth)?$/i.test(header)) {
        return (r) => r.is_standard_length;
      } else if (/^(item[-_ ]?)?(#|no\.?|num(ber)?)$/i.test(header)) {
        return (r) => r.item;
      } else if (
        /^st(oc)?k[-_ ]?len(gth)?s?([-_ ]?(qty|quantity))?$/i.test(header)
      ) {
        return (r) => r.stklen_qty;
      } else if (
        /^((part|piece|mark|instance)[-_ ]?)?(qty|quantity)$/i.test(header)
      ) {
        return (r) => r.piece_qty;
      } else if (/^mark([-_ ]?(num(ber)?|no\.?|#))?$/i.test(header)) {
        return (r) => r.mark;
      } else if (/^(cut[-_ ]?)?len(gth)?$/i.test(header)) {
        return (r) => r.length;
      } else if (/^(cut[-_ ]?from[-_ ]?drops)$/i.test(header)) {
        return (r) => r.cut_from_drops;
      } else if (/^(use[-_ ]?drops[-_ ]?for)$/i.test(header)) {
        return (r) => r.use_drops_for;
      } else {
        return (_) => null;
      }
    });

    const data = this.cutlistRows.map((r) => valueFunctions.map((f) => f(r)));

    await clearTable(context, table);
    addTableData(table, data);
    await context.sync();
  }

  private async exportCutDetails(context: Excel.RequestContext) {
    let sheet = await createOrGetSheetAndClearTable(context, optCutDetailsName);

    let table = createTable(sheet, "A1:N1", optCutDetailsName, [
      [
        "Group",
        "Ext",
        "Finish",
        "StkLen#",
        "StkLenSize",
        "StdLen",
        "UsedLength",
        "Mark",
        "Length",
        "Release",
        "Pallet",
        "Floor",
        "UnitId",
        "UnitNumber",
      ],
    ]);

    await context.sync();

    formatColumnForWholeNumber(table, "StkLen#");
    formatColumnForWholeInch(table, "StkLenSize");
    formatColumnAsCheckboxes(table, "StdLen");
    formatColumnForDecimalInch(table, "UsedLength");
    formatColumnForDecimalInch(table, "Length");

    await stampUserAndTime(sheet, "P1:P2");

    const data = this.cutDetailRows.map((row) => [
      row.group,
      row.part,
      row.finish,
      row.stklen_id,
      row.stklen_size,
      row.is_standard_length,
      row.used_length,
      row.mark_number,
      row.length,
      row.release,
      row.pallet,
      row.floor,
      row.unit_id,
      row.unit_number,
    ]);
    addTableData(table, data);
    autoFitAllColumns(sheet);
    await context.sync();
  }

  private async exportCutDetailsToExistingTable(
    context: Excel.RequestContext,
    table: Excel.Table,
  ) {
    const headers = await getHeaders(context, table);

    const valueFunctions: ((
      r: CutDetailRow,
    ) => string | number | boolean | null)[] = headers.map((header) => {
      if (/^((opt(imization)?|fab(rication)?)[-_ ]?)?group$/i.test(header)) {
        return (r) => r.group;
      } else if (
        /^(part|ext(rusion)?)([-_ ]?(num(ber)?|no\.?|#))?$/i.test(header)
      ) {
        return (r) => r.part;
      } else if (/^fin(ish)?$/i.test(header)) {
        return (r) => r.finish;
      } else if (/^st(oc)?k[-_ ]?len(gth)?[-_ ]?(id|#)$/i.test(header)) {
        return (r) => r.stklen_id;
      } else if (
        /^st(oc)?k[-_ ]?len(gth)?[-_ ]?(size|len(gth)?)$/i.test(header)
      ) {
        return (r) => r.stklen_size;
      } else if (/^(is[-_ ])?(standard|std)[-_ ]?len(gth)?$/i.test(header)) {
        return (r) => r.is_standard_length;
      } else if (/^used[-_ ]?len(gth)?$/i.test(header)) {
        return (r) => r.used_length;
      } else if (/^mark([-_ ]?(num(ber)?|no\.?|#))?$/i.test(header)) {
        return (r) => r.mark_number;
      } else if (/^(cut[-_ ]?)?len(gth)?$/i.test(header)) {
        return (r) => r.length;
      } else if (/^rel(ease)?$/i.test(header)) {
        return (r) => r.release;
      } else if (/^(pallet([-_ ]?(#|no\.?|num(ber)?))?|P#)$/i.test(header)) {
        return (r) => r.pallet;
      } else if (/^(fl(oo)?r|level|lvl)$/i.test(header)) {
        return (r) => r.floor;
      } else if (/^unit[-_ ]?(#|id)$/i.test(header)) {
        return (r) => r.unit_id;
      } else if (/^unit([-_ ]?(no\.?|num(ber)?))?$/i.test(header)) {
        return (r) => r.unit_number;
      } else {
        return (_) => null;
      }
    });

    const data = this.cutDetailRows.map((r) => valueFunctions.map((f) => f(r)));

    await clearTable(context, table);
    addTableData(table, data);
    await context.sync();
  }

  async exportAll() {
    const messages: string[] = [];
    await Excel.run(async (context) => {
      await this.exportStkLens(context);
      await this.exportOrderForm(context);
      await this.exportCutList(context);
      await this.exportCutDetails(context);
      messages.push(`Updated WWOpt Tabs`);

      let workbook = context.workbook;
      workbook.tables.load("items/name");
      await context.sync();

      for (let index = 0; index < workbook.tables.items.length; index++) {
        let table = workbook.tables.items[index];
        const tableName = table.name;
        if (
          allTableNames
            .map((x) => x.toUpperCase())
            .findIndex((x) => x === tableName.toUpperCase()) >= 0
        )
          continue;

        if (optOrderFormPattern.test(tableName)) {
          this.exportOrderFormToExistingTable(context, table);
          messages.push(`Updated Order Form table "${tableName}"`);
        } else if (optCutListPattern.test(tableName)) {
          this.exportCutListToExistingTable(context, table);
          messages.push(`Updated Cut List table "${tableName}"`);
        } else if (optCutDetailsPattern.test(tableName)) {
          this.exportCutDetailsToExistingTable(context, table);
          messages.push(`Updated Cut Details table "${tableName}"`);
        } else {
          continue;
        }
      }
    });
    return messages;
  }

  async importPartOptSettingsFromAnotherRun() {
    let settingsStore: PartOptimizationSettingsStore = {};
    await Excel.run(async (context) => {
      settingsStore = await this.importPartOptSettingsStore(context);
    });
    return settingsStore;
  }
}
