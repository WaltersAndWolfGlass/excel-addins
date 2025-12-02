import * as React from "react"
import * as z from 'zod'
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"
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
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from "@/components/ui/button-group"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { ShipAddressPresets, ShipProperty } from "@/model/ship_address_presets"
import { OrderForm, OrderFormLineItem } from "@/model/order_form"

const optionalString = z.optional(z.string().trim()).transform(e => !e ? undefined : e);
const reqString = optionalString.pipe(z.string({ message: 'Required' }));
const reqDate = z.date({ error: issue => issue.input === undefined ? 'Required' : 'Invalid date' });
const reqId = reqString.pipe(
  z.coerce.number<string>({ message: "Invalid id" }
  ).positive({ message: 'Invalid id' }
  ).pipe(
    z.int32({ message: 'Invalid id' })));
const optionalCountingNumber = optionalString.pipe(z.optional(
  z.coerce.number<string>({ message: "Invalid number" }
  ).positive({ message: 'Must be positive' }
  ).pipe(z.int({ message: 'Must be a counting number' }))));
const reqCountingNumber = optionalString.pipe(
  z.coerce.number<string>({ message: "Required" }
  ).positive({ message: 'Must be positive' }
  ).pipe(z.int({ message: 'Must be a counting number' })));

const formSchema = z.object({
  po_number: reqString,
  vendor_number: reqString,
  po_description: reqString,
  order_date: reqDate,
  expected_date: reqDate,
  ordered_by: reqString,
  jc_company: reqId,
  job_number: reqId,
  warranty: optionalCountingNumber,
  ship_location: reqString,
  ship_attention: optionalString,
  ship_street_address: reqString,
  ship_city: reqString,
  ship_state: reqString,
  ship_zip: reqString,
  ship_instructions: optionalString,
  item_type: reqCountingNumber,
  cost_code: reqCountingNumber,
  division: reqCountingNumber,
  pay_type: reqCountingNumber,
  tax_type: reqCountingNumber,
  tax_code: reqString,
});

export function VistaExportForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      po_number: 'NEW',
      vendor_number: '',
      po_description: 'Metal Order',
      order_date: undefined,
      expected_date: undefined,
      ordered_by: '',
      jc_company: '',
      job_number: '',
      warranty: '',
      ship_location: '',
      ship_attention: '',
      ship_street_address: '',
      ship_city: '',
      ship_state: '',
      ship_zip: '',
      ship_instructions: '',
      item_type: '1', // 1 = job, 2 = inventory
      cost_code: '',
      division: '',
      pay_type: '2', // type of payable, ie job, AP, retention
      tax_type: '1', // 1 = sales tax
      tax_code: '123'
    }
  });
  const [exportText, setExportText] = React.useState('');
  const [exportFileName, setExportFileName] = React.useState('example.tsv');
  const [exportCount, setExportCount] = React.useState(0);

  const downloadRef = React.useRef(null);
  React.useEffect(() => {
    if (exportCount > 0) {
      downloadRef.current?.click();
    }
  }, [exportText, exportFileName, exportCount]);

  function setAddressPreset(preset: Array<ShipProperty>) {
    preset.forEach(setting => {
      form.setValue(setting.name, setting.value);
    })
  }
  function onShipShopA() {
    setAddressPreset(ShipAddressPresets.ShopA)
  }
  function onShipShopB() {
    setAddressPreset(ShipAddressPresets.ShopB)
  }
  function onShipLaVerne() {
    setAddressPreset(ShipAddressPresets.LaVerne)
  }
  function onShipLasVegas() {
    setAddressPreset(ShipAddressPresets.LasVegas)
  }

  function formatDate(date: Date): string {
    return (date.getMonth() + 1).toString().padStart(2, '0')
      + date.getDate().toString().padStart(2, '0')
      + date.getFullYear().toString();
  }

  function onSubmit(data: z.infer<typeof formSchema>) {
    toast("Pushed Submit!");
    constructText(data).then(text => {
      setExportText(text);
      setExportFileName(`${data.po_description} (${data.job_number}).tsv`);
      setExportCount(exportCount + 1);
    });
  };

  async function constructText(data: z.infer<typeof formSchema>) {
    let orderForm = new OrderForm();
    let lineItems = await orderForm.GetLineItems();

    let header: string = [
      "POHB",
      data.po_number,
      data.vendor_number,
      data.po_description,
      formatDate(data.order_date),
      formatDate(data.expected_date),
      data.ordered_by,
      data.jc_company,
      data.job_number,
      data.warranty,
      data.ship_location,
      data.ship_attention,
      data.ship_street_address,
      data.ship_city,
      data.ship_state,
      data.ship_zip,
      data.ship_instructions].join("\t");

    var i = 1;
    let lines = lineItems.map((x: OrderFormLineItem) => {
      return [
        "POIB",
        i++,
        data.item_type,
        data.jc_company,
        data.job_number,
        '', // material #
        data.cost_code,
        x.description,
        formatDate(data.expected_date),
        data.division,
        data.pay_type,
        x.units,
        x.quantity,
        x.price_per_unit,
        data.tax_type,
        data.tax_code
      ].join("\t");
    });

    return header + "\r\n" + lines.join("\r\n");
  }

  function readSheetHeader() {
    let orderForm = new OrderForm();
    orderForm.LoadHeaderFromWorkbook().then(success => {
      if (!success) {
        toast("Failed to load data from sheet")
        return;
      }

      if (orderForm.form_type === "metal") {
        form.setValue("po_description", "Metal Order");
        form.setValue("vendor_number", "10000");
        form.setValue("job_number", orderForm.job_number ?? '');
        form.setValue("cost_code", orderForm.cost_code ?? '');
        form.setValue("ordered_by", orderForm.ordered_by ?? '');
        if (orderForm.order_date) {
          form.setValue("order_date", orderForm.order_date);
        } else {
          form.resetField("order_date");
        }
        if (orderForm.expected_date) {
          form.setValue("expected_date", orderForm.expected_date);
        } else {
          form.resetField("expected_date");
        }
        toast("Successfully imported sheet data");
        return;
      }
    });
  }

  return (
    <div className="m-8">
      <Toaster />
      <h1 className="scroll-m-20 text-center text-2xl font-extrabold tracking-tight text-balance mb-8">
        Vista Export
      </h1>
      <Button variant="outline" onClick={readSheetHeader}>Import Info</Button>
      <form id="export-vista-form" onSubmit={form.handleSubmit(onSubmit)} className="mb-8">
        <FieldSet>
          <FieldGroup className="sm:grid sm:grid-cols-2">
            <FieldGroup className="min-w-3xs">
              <FieldLegend className="font-bold">Information</FieldLegend>
              <Controller
                name="po_description"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="evf-description">
                      Description *
                    </FieldLabel>
                    <Input
                      {...field}
                      id="evf-description"
                      aria-invalid={fieldState.invalid}
                      autoComplete="on"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="jc_company"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="evf-company">
                      Company *
                    </FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}>
                      <SelectTrigger
                        id="evf-company"
                        aria-invalid={fieldState.invalid}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="201">Test</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="division"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="evf-division">
                      Division *
                    </FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}>
                      <SelectTrigger
                        id="evf-division"
                        aria-invalid={fieldState.invalid}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Northern California</SelectItem>
                        <SelectItem value="2">Southern California</SelectItem>
                        <SelectItem value="3">Las Vegas</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="vendor_number"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="evf-vendor">
                      Vendor *
                    </FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}>
                      <SelectTrigger
                        id="evf-vendor"
                        aria-invalid={fieldState.invalid}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10000">Western</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="order_date"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="evf-order-date">
                      Order Date *
                    </FieldLabel>
                    <DatePicker
                      id='evf-order-date'
                      date={field.value}
                      onChange={field.onChange} />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="expected_date"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="evf-expected-date">
                      Expected Date *
                    </FieldLabel>
                    <DatePicker
                      id='evf-expected-date'
                      date={field.value}
                      onChange={field.onChange} />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="ordered_by"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="evf-ordered-by">
                      Ordered By *
                    </FieldLabel>
                    <Input
                      {...field}
                      id="evf-ordered-by"
                      aria-invalid={fieldState.invalid}
                      autoComplete="on"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="job_number"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="evf-job-number">
                      Job Number *
                    </FieldLabel>
                    <Input
                      {...field}
                      id="evf-job-number"
                      aria-invalid={fieldState.invalid}
                      autoComplete="on"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="cost_code"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="evf-cost-code">
                      Cost Code *
                    </FieldLabel>
                    <Input
                      {...field}
                      id="evf-cost-code"
                      aria-invalid={fieldState.invalid}
                      autoComplete="on"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="warranty"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="evf-warranty">
                      Warranty
                    </FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        {...field}
                        id="evf-warranty"
                        aria-invalid={fieldState.invalid}
                        autoComplete="on"
                      />
                      <InputGroupAddon align="inline-end">
                        years
                      </InputGroupAddon>
                    </InputGroup>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
            <FieldSeparator className="min-w-3xs sm:hidden" />
            <FieldGroup className="min-w-3xs">
              <FieldLegend className="font-bold">Shipping</FieldLegend>
              <ButtonGroup>
                <Button variant="outline" type="button" size="xs" onClick={onShipShopA} >Shop A</Button>
                <Button variant="outline" type="button" size="xs" onClick={onShipShopB} >Shop B</Button>
                <Button variant="outline" type="button" size="xs" onClick={onShipLaVerne} >La Verne</Button>
                <Button variant="outline" type="button" size="xs" onClick={onShipLasVegas} >Las Vegas</Button>
              </ButtonGroup>
              <Controller
                name="ship_instructions"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="evf-ship-instructions">
                      Shipping Instructions
                    </FieldLabel>
                    <Input
                      {...field}
                      id="evf-ship-instructions"
                      aria-invalid={fieldState.invalid}
                      autoComplete="on"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="ship_location"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="evf-ship-location">
                      Name *
                    </FieldLabel>
                    <Input
                      {...field}
                      id="evf-ship-location"
                      aria-invalid={fieldState.invalid}
                      autoComplete="on"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="ship_attention"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="evf-ship-attention">
                      Attention
                    </FieldLabel>
                    <Input
                      {...field}
                      id="evf-ship-attention"
                      aria-invalid={fieldState.invalid}
                      autoComplete="on"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="ship_street_address"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="evf-ship-street-address">
                      Street Address *
                    </FieldLabel>
                    <Input
                      {...field}
                      id="evf-ship-street-address"
                      aria-invalid={fieldState.invalid}
                      autoComplete="on"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="ship_city"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="evf-ship-city">
                      City *
                    </FieldLabel>
                    <Input
                      {...field}
                      id="evf-ship-city"
                      aria-invalid={fieldState.invalid}
                      autoComplete="on"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="ship_state"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="evf-ship-state">
                      State *
                    </FieldLabel>
                    <Input
                      {...field}
                      id="evf-ship-state"
                      aria-invalid={fieldState.invalid}
                      autoComplete="on"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="ship_zip"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="evf-ship-zip">
                      Zip *
                    </FieldLabel>
                    <Input
                      {...field}
                      id="evf-ship-zip"
                      aria-invalid={fieldState.invalid}
                      autoComplete="on"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </FieldGroup>
        </FieldSet>
      </form>
      <Button type="submit" form="export-vista-form">Export</Button>
      <a ref={downloadRef}
        href={'data:text/plain;charset=utf-8,' + encodeURIComponent(exportText)}
        download={exportFileName}
        className="hidden"
      >Download</a>
    </div>
  )
}

