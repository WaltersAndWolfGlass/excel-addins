import * as React from "react"
import { Controller } from "react-hook-form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Field,
  FieldLabel,
} from "@/components/ui/field"
import { FormFieldErrorMessage } from "@/components/form-fielderror-message";

interface SelectItem {
  value: string;
  label: string;
};

interface FormSelectProps {
  control: any;
  name: string;
  label: string;
  items: SelectItem[];
  required?: boolean;
  disabled?: boolean;
}

export function FormSelect({
  control,
  name,
  label,
  items,
  required = false,
  disabled = false }: FormSelectProps) {

  const selectId = React.useId();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={selectId}>
            {label}{required ? " *" : ""}
          </FieldLabel>
          <Select
            name={field.name}
            value={field.value}
            onValueChange={field.onChange}
            disabled={disabled}>
            <SelectTrigger
              id={selectId}
              aria-invalid={fieldState.invalid}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {items.map(x => (
                <SelectItem key={x.value} value={x.value}>{x.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormFieldErrorMessage fieldState={fieldState} />
        </Field>
      )}
    />
  );
}
