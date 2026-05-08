import * as React from "react";
import { Controller } from "react-hook-form";
import { Field, FieldLabel } from "@/components/ui/field";
import { FormFieldErrorMessage } from "@/components/form-fielderror-message";
import { DatePicker } from "@/components/datepicker";

interface FormDatePickerProps {
  control: any;
  name: string;
  label: string;
  disabled?: boolean;
  hidden?: boolean;
}

export function FormDatePicker({
  control,
  name,
  label,
  disabled = false,
  hidden = false,
}: FormDatePickerProps) {
  const datePickerId = React.useId();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} hidden={hidden}>
          <FieldLabel htmlFor={datePickerId}>{label}</FieldLabel>
          <DatePicker
            id={datePickerId}
            date={field.value}
            onChange={field.onChange}
            aria-invalid={fieldState.invalid}
            disabled={disabled}
          />
          <FormFieldErrorMessage fieldState={fieldState} />
        </Field>
      )}
    />
  );
}
