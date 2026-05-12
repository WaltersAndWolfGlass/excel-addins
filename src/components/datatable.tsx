import * as React from "react";
import {
  ColumnDef,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
  RowData,
  Table as tanstackTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { BetweenHorizonalEndIcon, PlusIcon, TrashIcon } from "lucide-react";
import { Checkbox } from "./ui/checkbox";

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
    addRow: (insertAtIndex: number) => void;
    deleteRow: (rowIndexes: number[]) => void;
  }
}

function useSkipper() {
  const shouldSkipRef = React.useRef(true);
  const shouldSkip = shouldSkipRef.current;

  // Wrap a function with this to skip a pagination reset temporarily
  const skip = React.useCallback(() => {
    shouldSkipRef.current = false;
  }, []);

  React.useEffect(() => {
    shouldSkipRef.current = true;
  });

  return [shouldSkip, skip] as const;
}
export function DataTable<TData, TValue>({
  columns,
  data,
  editable = false,
  columnVisibility = {},
  updateData = (a, b, c) => {},
  addRow = (a) => {},
  deleteRow = (a) => {},
}: {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  editable?: boolean;
  columnVisibility?: VisibilityState;
  updateData?: (rowIndex: number, columnId: string, value: unknown) => void;
  addRow?: (insertAtIndex: number) => void;
  deleteRow?: (rowIndexes: number[]) => void;
}) {
  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();
  const [lastSelectedIndex, setLastSelectedIndex] = React.useState<
    number | undefined
  >(undefined);
  const [lastSelectionState, setLastSelectionState] = React.useState<boolean[]>(
    [],
  );

  var table: tanstackTable<TData>;

  if (editable) {
    const selectColumnDef: ColumnDef<TData, TValue> = {
      id: "select",
      size: 20,
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => {
            table.toggleAllPageRowsSelected(!!value);
            setLastSelectedIndex(undefined);
          }}
          aria-label="Select all"
        />
      ),
      cell: ({ table, row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onClick={(e) => {
            const shiftKey = e.shiftKey;

            if (!shiftKey || lastSelectedIndex === undefined) {
              setLastSelectedIndex(row.index);
              setLastSelectionState(
                table
                  .getRowModel()
                  .rows.map((r) =>
                    r.index === row.index
                      ? !r.getIsSelected()
                      : r.getIsSelected(),
                  ),
              );
              row.toggleSelected();
              return;
            }

            const desiredState = lastSelectionState[lastSelectedIndex];
            const rows = table.getRowModel().rows;
            let startIndex = lastSelectedIndex;
            let endIndex = row.index;
            if (endIndex < startIndex) {
              const temp = startIndex;
              startIndex = endIndex;
              endIndex = temp;
            }
            rows.forEach((r, index) => {
              const currentState = r.getIsSelected();
              const originalState = lastSelectionState[index];
              const finalState =
                index >= startIndex && index <= endIndex
                  ? desiredState
                  : originalState;
              if (currentState !== finalState) r.toggleSelected(finalState);
            });
          }}
          aria-label="Select row"
        />
      ),
    };

    const editableColumn: Partial<ColumnDef<TData>> = {
      cell: ({
        getValue,
        row: { index },
        column: { id, columnDef },
        table,
      }) => {
        const initialValue = getValue();
        const [value, setValue] = React.useState(initialValue);

        const onBlur = () => {
          table.options.meta?.updateData(index, id, value);
        };

        React.useEffect(() => {
          setValue(initialValue);
        }, [initialValue]);

        return (
          <Input
            value={value as string}
            placeholder={
              typeof columnDef.header === "string" ? columnDef.header : ""
            }
            onChange={(e) => setValue(e.target.value)}
            onBlur={onBlur}
          />
        );
      },
    };

    table = useReactTable({
      data,
      columns: [selectColumnDef, ...columns],
      defaultColumn: editableColumn,
      getCoreRowModel: getCoreRowModel(),
      state: {
        columnVisibility,
      },
      meta: {
        updateData: (rowIndex, columnId, value) => {
          skipAutoResetPageIndex();
          updateData(rowIndex, columnId, value);
        },
        addRow: (insertAtIndex) => {
          skipAutoResetPageIndex();
          addRow(insertAtIndex);
          setLastSelectedIndex(undefined);
        },
        deleteRow: (rowIndexes) => {
          skipAutoResetPageIndex();
          deleteRow(rowIndexes);
          setLastSelectedIndex(undefined);
        },
      },
    });
  } else {
    table = useReactTable({
      data,
      columns,
      getCoreRowModel: getCoreRowModel(),
      state: {
        columnVisibility,
      },
      meta: {
        updateData: (rowIndex, columnId, value) => {
          skipAutoResetPageIndex();
          updateData(rowIndex, columnId, value);
        },
        addRow: (insertAtIndex) => {
          skipAutoResetPageIndex();
          addRow(insertAtIndex);
          setLastSelectedIndex(undefined);
        },
        deleteRow: (rowIndexes) => {
          skipAutoResetPageIndex();
          deleteRow(rowIndexes);
          setLastSelectedIndex(undefined);
        },
      },
    });
  }

  return (
    <div>
      {editable && (
        <div className="sticky top-2 flex flex-row gap-2 z-50 mb-2">
          <div className="grow" />
          <div className="bg-background">
            <Button
              variant="outline"
              disabled={!table.getIsSomeRowsSelected()}
              onClick={() =>
                table.options.meta?.addRow(
                  table.getSelectedRowModel().rows[0].index,
                )
              }
            >
              <BetweenHorizonalEndIcon />
              Insert
            </Button>
          </div>
          <div className="bg-background">
            <Button
              className="text-destructive border-destructive"
              variant="outline"
              disabled={!table.getIsSomeRowsSelected()}
              onClick={() => {
                table.options.meta?.deleteRow(
                  table.getSelectedRowModel().rows.map((r) => r.index),
                );
                table.toggleAllRowsSelected(false);
                setLastSelectedIndex(undefined);
              }}
            >
              <TrashIcon />
              Delete
            </Button>
          </div>
        </div>
      )}
      <div className="overflow-hidden">
        <Table className="table-auto">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      style={
                        header.column.columnDef.size
                          ? { width: header.column.columnDef.size }
                          : {}
                      }
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {editable && (
        <div className="flex flex-row">
          <div className="grow" />
          <div className="bg-background">
            <Button
              variant="outline"
              onClick={() => table.options.meta?.addRow(data.length)}
            >
              <PlusIcon />
              Add
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
