import * as React from "react";
import { ColumnDef, VisibilityState, RowData } from "@tanstack/react-table";
import { DataTable } from "../datatable";
import { Input } from "../ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "../ui/input-group";

export type POLineItem = {
  description: string;
  units: "EA" | "LF";
  quantity: number;
  price_per_unit: number;
  mark_number: string;
};

const columns: ColumnDef<POLineItem>[] = [
  {
    accessorKey: "description",
    size: undefined,
    header: "Description",
  },
  {
    accessorKey: "mark_number",
    size: 120,
    header: "Mark#",
  },
  {
    accessorKey: "quantity",
    size: 120,
    header: () => <div className="text-right">Quantity</div>,
    cell: ({ getValue, row: { index }, column: { id }, table }) => {
      const initialValue = getValue();
      const [value, setValue] = React.useState(initialValue);
      const [invalid, setInvalid] = React.useState(false);

      const onBlur = () => {
        const intValue = parseInt(value as string);

        if (isNaN(intValue)) {
          setInvalid(true);
          return;
        }

        setInvalid(false);
        table.options.meta?.updateData(index, id, intValue);
      };

      React.useEffect(() => {
        setValue(initialValue);
      }, [initialValue]);

      return (
        <Input
          className="text-right"
          placeholder="Quantity"
          value={value as string}
          onChange={(e) => setValue(e.target.value)}
          onBlur={onBlur}
          aria-invalid={invalid}
        />
      );
    },
  },
  {
    accessorKey: "price_per_unit",
    size: 120,
    header: () => <div className="text-right">Price/Unit</div>,
    cell: ({ getValue, row: { index }, column: { id }, table }) => {
      const initialValue = getValue();
      const [value, setValue] = React.useState(initialValue as string);
      const [invalid, setInvalid] = React.useState(false);

      const onBlur = () => {
        const decimalValue = parseFloat(value as string);

        if (isNaN(decimalValue)) {
          setInvalid(true);
          return;
        }

        setInvalid(false);
        table.options.meta?.updateData(index, id, decimalValue);
      };

      React.useEffect(() => {
        setValue(parseFloat(initialValue as string).toFixed(2));
      }, [initialValue]);

      return (
        <InputGroup className="text-right">
          <InputGroupAddon>
            <InputGroupText>$</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Price"
            className="text-right"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={onBlur}
            aria-invalid={invalid}
          />
        </InputGroup>
      );
    },
  },
];

export function POItemDataTable({
  data,
  setData,
  showMarkNumber = true,
}: {
  data: POLineItem[];
  setData: React.Dispatch<React.SetStateAction<POLineItem[]>>;
  showMarkNumber?: boolean;
}) {
  const columnVisibility: VisibilityState = showMarkNumber
    ? {}
    : { mark_number: false };
  return (
    <DataTable
      columns={columns}
      data={data}
      editable={true}
      columnVisibility={columnVisibility}
      updateData={(rowIndex, columnId, value) => {
        setData((old) =>
          old.map((row, index) => {
            if (index === rowIndex) {
              return {
                ...old[rowIndex]!,
                [columnId]: value,
              };
            }
            return row;
          }),
        );
      }}
      addRow={(insertAtIndex) => {
        setData((old) => {
          const newRow: POLineItem = {
            description: "",
            units: "EA",
            quantity: 0,
            price_per_unit: 0,
            mark_number: "",
          };
          if (insertAtIndex === old.length) return [...old, newRow];

          return old.flatMap((row, index) => {
            if (index === insertAtIndex) {
              return [newRow, row];
            }
            return [row];
          });
        });
      }}
      deleteRow={(rowIndexes) => {
        setData((old) =>
          old.flatMap((row, index) =>
            rowIndexes.includes(index) ? [] : [row],
          ),
        );
      }}
    />
  );
}
