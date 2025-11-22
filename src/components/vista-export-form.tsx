import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/datepicker"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"


export function VistaExportForm() {
  return (
    <div className="mx-auto max-w-md my-8 space-y-8">
      <FieldSet>
        <FieldLegend>Vista Export</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel>Description</FieldLabel>
            <Input value="Metal Order" />
          </Field>
          <Field>
            <FieldLabel>Company</FieldLabel>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Choose a company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="201">Test</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Division</FieldLabel>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Choose a division" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Northern California</SelectItem>
                <SelectItem value="2">Southern California</SelectItem>
                <SelectItem value="3">Las Vegas</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Vendor</FieldLabel>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Choose a vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10000">Western</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Order Date</FieldLabel>
            <DatePicker />
          </Field>
          <Field>
            <FieldLabel>Required Date</FieldLabel>
            <DatePicker />
          </Field>
          <Field>
            <FieldLabel>Ordered by</FieldLabel>
            <Input />
          </Field>
          <Field>
            <FieldLabel>Job</FieldLabel>
            <Input />
          </Field>
          <Field>
            <FieldLabel>Cost Code</FieldLabel>
            <Input />
          </Field>
          <Field>
            <FieldLabel>Warranty</FieldLabel>
            <Input />
          </Field>
          <FieldSeparator />
          <FieldSet>
            <FieldLegend>Shipping Information</FieldLegend>
            <Field>
              <FieldLabel>Presets</FieldLabel>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a shipping location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shop-A">Shop A</SelectItem>
                  <SelectItem value="shop-B">Shop B</SelectItem>
                  <SelectItem value="la-verne">La Verne</SelectItem>
                  <SelectItem value="las-vegas">Las Vegas</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Shipping Instructions</FieldLabel>
              <Input />
            </Field>
            <FieldGroup>
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input />
              </Field>
              <Field>
                <FieldLabel>Attention</FieldLabel>
                <Input />
              </Field>
              <Field>
                <FieldLabel>Street Address</FieldLabel>
                <Input />
              </Field>
              <div className="grid grid-cols-[4fr_1fr_2fr] gap-4">
                <Field>
                  <FieldLabel>City</FieldLabel>
                  <Input />
                </Field>
                <Field>
                  <FieldLabel>State</FieldLabel>
                  <Input />
                </Field>
                <Field>
                  <FieldLabel>Zip</FieldLabel>
                  <Input />
                </Field>
              </div>
            </FieldGroup>
          </FieldSet>
        </FieldGroup>
      </FieldSet>
      <Button type="submit" id="helloButton">Export</Button>
    </div>
  )
}

