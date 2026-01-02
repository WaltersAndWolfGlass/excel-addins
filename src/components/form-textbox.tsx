import * as React from "react"
import { Controller } from "react-hook-form"
import {
  Field,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { FormFieldErrorMessage } from "./form-fielderror-message";

interface FormTextBoxProps {
  control: any;
  name: string;
  label: string;
  suffix?: string | undefined;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: boolean
}

export function FormTextBox({
  control,
  name,
  label,
  suffix = undefined,
  required = false,
  disabled = false,
  autoComplete = true }: FormTextBoxProps) {

  const inputId = React.useId();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={inputId}>
            {label}{required ? " *" : ""}
          </FieldLabel>
          <InputGroup>
            <InputGroupInput
              {...field}
              id={inputId}
              aria-invalid={fieldState.invalid}
              autoComplete={autoComplete ? "on" : "off"}
              disabled={disabled}
            />
            {suffix && (
              <InputGroupAddon align="inline-end">
                {suffix}
              </InputGroupAddon>
            )}
          </InputGroup>
          <FormFieldErrorMessage fieldState={fieldState} />
        </Field>
      )}
    />
  );
}
