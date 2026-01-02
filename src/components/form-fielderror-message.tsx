import * as React from "react"
import { FieldError } from "@/components/ui/field"
import * as ReactHookForm from "react-hook-form"

interface FormFieldErrorProps {
  fieldState: {
    invalid: boolean,
    error?: undefined | ReactHookForm.FieldError
  }
}

export function FormFieldErrorMessage({ fieldState }: FormFieldErrorProps) {
  return (
    <>
      {fieldState.invalid && fieldState.error?.message != "Required" && (
        <FieldError errors={[fieldState.error]} />
      )}
    </>
  )
}
