import * as React from "react";
import { Controller } from "react-hook-form";
import { Field, FieldLabel } from "@/components/ui/field";
import { FormFieldErrorMessage } from "./form-fielderror-message";
import { Switch } from "./ui/switch";
import { HelpLink } from "./help-link";

interface FormSwitchProps {
  control: any;
  name: string;
  label: string;
  help?: string;
  disabled?: boolean;
}

export function FormSwitch({
  control,
  name,
  label,
  help,
  disabled = false,
}: FormSwitchProps) {
  const switchId = React.useId();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field orientation="horizontal" data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={switchId}>
            {label}
            {help && <HelpLink href={help} />}
          </FieldLabel>
          <Switch
            id={switchId}
            disabled={disabled}
            aria-invalid={fieldState.invalid}
            checked={field.value}
            onCheckedChange={field.onChange}
          />
          <FormFieldErrorMessage fieldState={fieldState} />
        </Field>
      )}
    />
  );
}
