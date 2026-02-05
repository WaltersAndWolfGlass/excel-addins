import * as React from "react"
import { Controller } from "react-hook-form"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Field,
  FieldLabel,
} from "@/components/ui/field"
import { FormFieldErrorMessage } from "@/components/form-fielderror-message"

export interface ComboBoxItem {
  value: string;
  label: string;
}

interface FormComboSearchBoxProps {
  control: any;
  name: string;
  label: string;
  items: ComboBoxItem[];
  required?: boolean;
  disabled?: boolean;
}

export function FormComboSearchBox({
  control,
  name,
  label,
  items,
  required = false,
  disabled = false
}: FormComboSearchBoxProps) {
  const comboboxId = React.useId();

  const [open, setOpen] = React.useState(false);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={comboboxId}>
            {label}{required ? " *" : ""}
          </FieldLabel>
          <Popover open={open} onOpenChange={x => setOpen(disabled ? false : x)}>
            <PopoverTrigger asChild>
              <div>
                <Button
                  id={comboboxId}
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className={cn("w-full",
                    "justify-between",
                    field.value ? '' : 'text-muted-foreground',
                    'font-normal')}
                  disabled={disabled}
                  aria-invalid={fieldState.invalid}
                >
                  {field.value
                    ? items.find(item => item.value === field.value)?.label
                    : `Select ${label}...`}
                  <ChevronsUpDown />
                </Button>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command filter={(_, search, keywords) => {
                if (keywords) {
                  const searchWords = search.toLowerCase().split(" ");
                  if (searchWords.every(searchWord =>
                    keywords.find(keyword =>
                      keyword.includes(searchWord)) !== undefined)) return 1;
                }
                return 0;
              }}>
                <CommandInput placeholder={`Search ${label}...`} className="h-9" />
                <CommandList>
                  <CommandEmpty>No {label} found.</CommandEmpty>
                  <CommandGroup>
                    {items.map(item => (
                      <CommandItem
                        key={item.value}
                        value={item.value}
                        keywords={item.label.toLowerCase().split(" ")}
                        onSelect={(currentValue) => {
                          field.onChange(currentValue);
                          setOpen(false);
                        }}>
                        {item.label}
                        <Check
                          className={cn(
                            "ml-auto",
                            field.value === item.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <FormFieldErrorMessage fieldState={fieldState} />
        </Field>
      )}
    />
  );
}
