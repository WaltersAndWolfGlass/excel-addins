import * as React from "react"
import * as z from 'zod'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { FormTextBox } from "@/components/form-textbox"
import { FormSelect } from "@/components/form-select"
import { ComboBoxItem, FormComboSearchBox } from "@/components/form-combosearchbox"
import { FormDatePicker } from "@/components/form-datepicker"
import {
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field"
import {
  ButtonGroup,
} from "@/components/ui/button-group"
import { OrderForm, OrderFormLineItem } from "@/model/order_form"
import { Company, getCompanies, Division, getDivisions, getVendors, getJobs, getPhaseCodes, getTaxCodes, getShipLocs } from "@/services/database"
import { Job } from "@/data/job"
import { Vendor } from "@/data/vendor"
import { PhaseCode } from "@/data/phasecode"
import { TaxCode } from "@/data/taxcode"
import { ShipLoc } from "@/data/shiploc"

const optionalString = z.optional(z.string().trim()).transform(e => !e ? undefined : e);
const reqString = optionalString.pipe(z.string({ message: 'Required' }));
const reqJobNumber = reqString.pipe(z.string().regex(/^[A-Z0-9][-A-Z0-9]*[A-Z0-9]$/, 'Not a valid job number'));
const reqDate = z.date({ error: issue => issue.input === undefined ? 'Required' : 'Invalid date' });
const reqId = reqString.pipe(
  z.coerce.number<string>({ message: "Invalid id" }
  ).positive({ message: 'Invalid id' }
  ).pipe(
    z.int32({ message: 'Invalid id' })));
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
  job_number: reqJobNumber,
  warranty: reqCountingNumber,
  ship_location: reqId,
  ship_attention: optionalString,
  ship_street_address: reqString,
  ship_city: reqString,
  ship_state: reqString,
  ship_zip: reqString,
  ship_instructions: optionalString,
  item_type: reqCountingNumber,
  cost_code: reqJobNumber,
  division: reqCountingNumber,
  pay_type: reqCountingNumber,
  tax_type: reqCountingNumber,
  tax_code: reqString,
});

const alphaNumCompare = new Intl.Collator('en', { numeric: true, sensitivity: 'accent' }).compare;

export function VistaExportForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    defaultValues: {
      po_number: 'NEW',
      vendor_number: '',
      po_description: '',
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
      tax_code: ''
    }
  });
  form.trigger();
  const [officeReady, setOfficeReady] = React.useState(false);
  const [exportText, setExportText] = React.useState('');
  const [exportFileName, setExportFileName] = React.useState('example.tsv');
  const [exportCount, setExportCount] = React.useState(0);
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [companySelected, setCompanySelected] = React.useState(false);
  const [divisions, setDivisions] = React.useState<Division[]>([]);
  const [vendors, setVendors] = React.useState<(ComboBoxItem & Vendor)[]>([]);
  const [jobs, setJobs] = React.useState<(ComboBoxItem & Job)[]>([]);
  const [jobSelected, setJobSelected] = React.useState(false);
  const [costCodes, setCostCodes] = React.useState<(ComboBoxItem & PhaseCode)[]>([]);
  const [taxCodes, setTaxCodes] = React.useState<(ComboBoxItem & TaxCode)[]>([]);
  const [shipLocs, setShipLocs] = React.useState<(ComboBoxItem & ShipLoc)[]>([]);

  React.useEffect(() => {
    try {
      Office.onReady()
        .then(() => setOfficeReady(true));
    } catch {
      setOfficeReady(true);
    }
  });

  const downloadRef = React.useRef<HTMLAnchorElement>(null);
  React.useEffect(() => {
    if (exportCount > 0) {
      downloadRef.current?.click();
    }
  }, [exportText, exportFileName, exportCount]);

  React.useEffect(() => {
    getCompanies()
      .then(data => setCompanies(data))
  }, [])

  React.useEffect(() => {
    const subscription = form.watch((data, { name }) => {
      switch (name) {
        case "jc_company":
          if (data.jc_company) {
            form.resetField("division");
            form.resetField("vendor_number");
            form.resetField("job_number");
            form.resetField("cost_code")
            form.resetField("tax_code")
            form.resetField("ship_location")
            form.resetField("ship_street_address")
            form.resetField("ship_city")
            form.resetField("ship_state")
            form.resetField("ship_zip")
            setCompanySelected(true);
            setJobSelected(false);
            getDivisions(data.jc_company)
              .then(data => setDivisions(data));
            getVendors(data.jc_company ?? "")
              .then(vs => {
                vs.sort((a, b) => alphaNumCompare(a.Name, b.Name));
                setVendors(vs.map(v => ({ value: v.Id.toString(), label: v.Name, ...v })));
              })
            getJobs(data.jc_company ?? "")
              .then(js => {
                js.sort((a, b) => alphaNumCompare(a.JobNumber, b.JobNumber));
                setJobs(js.map(j => ({ value: j.JobNumber, label: `[${j.JobNumber}] ${j.JobName}`, ...j })));
              })
            setCostCodes([]);
            getTaxCodes(data.jc_company ?? "")
              .then(tcs => {
                tcs.sort((a, b) => alphaNumCompare(a.Code, b.Code))
                setTaxCodes(tcs.map(tc => ({ value: tc.Code, label: `[${tc.Code}] ${tc.Description}`, ...tc })));
              });
            getShipLocs(data.jc_company ?? "")
              .then(sls => {
                sls.sort((a, b) => alphaNumCompare(a.Code, b.Code));
                setShipLocs(
                  sls.map(sl => ({ value: sl.Code, label: `[${sl.Code}] ${sl.Description}`, ...sl }))
                );
              })
          } else {
            form.resetField("division");
            form.resetField("vendor_number");
            form.resetField("job_number");
            form.resetField("cost_code")
            form.resetField("tax_code")
            form.resetField("ship_location")
            form.resetField("ship_street_address")
            form.resetField("ship_city")
            form.resetField("ship_state")
            form.resetField("ship_zip")
            setCompanySelected(false);
            setJobSelected(false);
            setDivisions([]);
            setVendors([]);
            setJobs([]);
            setCostCodes([]);
            setTaxCodes([]);
            setShipLocs([]);
          }
          form.trigger();
          break;
        case "job_number":
          if (data.job_number) {
            form.resetField("cost_code")
            setJobSelected(true);
            getPhaseCodes(data.job_number ?? "")
              .then(pcs => {
                pcs.sort((a, b) => alphaNumCompare(a.Code, b.Code));
                setCostCodes(pcs.map(pc => ({ value: pc.Code, label: `[${pc.Code}] ${pc.Description}`, ...pc })))
              });
          } else {
            form.resetField("cost_code")
            setJobSelected(false);
            setCostCodes([]);
          }
          form.trigger();
          break;
        case "ship_location":
          if (data.ship_location) {
            let filteredShipLocs = shipLocs.filter(x => x.Code == data.ship_location);
            let sl = filteredShipLocs[0];
            if (sl.Address) {
              form.setValue("ship_street_address", sl.Address);
            } else { form.resetField("ship_street_address"); }
            if (sl.City) {
              form.setValue("ship_city", sl.City);
            } else { form.resetField("ship_city"); }
            if (sl.State) {
              form.setValue("ship_state", sl.State);
            } else { form.resetField("ship_state"); }
            if (sl.Zip) {
              form.setValue("ship_zip", sl.Zip);
            } else { form.resetField("ship_zip"); }
            form.trigger();
          }
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch, shipLocs])

  function formatDate(date: Date, delimeter: string = '/'): string {
    return (date.getMonth() + 1).toString().padStart(2, '0')
      + delimeter
      + date.getDate().toString().padStart(2, '0')
      + delimeter
      + date.getFullYear().toString();
  }

  function onSubmit(data: z.infer<typeof formSchema>) {
    constructText(data).then(text => {
      setExportText(text);
      setExportFileName(`${data.po_description} (${data.job_number}).tsv`);
      setExportCount(exportCount + 1);
    });
    toast("Exported! Check your downloads folder.");
  };

  async function constructText(data: z.infer<typeof formSchema>) {
    let orderForm = new OrderForm();
    let lineItems = await orderForm.GetLineItems();

    let today = new Date();

    let header: string = [
      "POHB",
      data.po_number,
      data.vendor_number,
      data.po_description,
      formatDate(data.order_date, ''),
      formatDate(data.expected_date, ''),
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
      data.ship_instructions,
      formatDate(new Date(today.getFullYear(), today.getMonth())),
      "reckey"
    ].join("\t");

    if (typeof lineItems === "string") {
      return header;
    }

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
        data.tax_code,
        "reckey"
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
        form.setValue("job_number", orderForm.job_number ?? '');
        // needs to fill in vendor field
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
        form.setValue("warranty", orderForm.warranty ?? '');
        toast(`Successfully imported sheet data for Metal Order Form (v${orderForm.template_version})`);
        return;
      }

      if (orderForm.form_type === "glass") {
        var desc = "";
        switch (orderForm.form_subtype) {
          case "glass":
            desc = "Glass Order";
            break;
          case "aluminum":
            desc = "Aluminum Panel Order";
            break;
          case "composite":
            desc = "Composite Panel Order";
            break;
          case "door":
            desc = "Door Glass Order";
            break;
          default:
            desc = "Unknown Glass Order";
            break;
        }

        form.setValue("po_description", desc);
        form.setValue("job_number", orderForm.job_number ?? '');
        // needs to fill in vendor field
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
        toast(`Successfully imported first sheet data for ${desc} Form (v${orderForm.template_version})`);
        return;
      }
    });
  }

  return (
    <div className="m-8">
      <Toaster />
      <h1 className="flex items-center space-x-2 scroll-m-20 tracking-tight text-balance mb-8">
        <img src="/vista256.png" className="inline-block size-6" />
        <span className="text-2xl font-extrabold ">Vista Export</span>
      </h1>
      <form id="export-vista-form" onSubmit={form.handleSubmit(onSubmit)} className="mb-8">
        <FieldSet>
          <FieldGroup className="sm:grid sm:grid-cols-2">
            <FieldGroup className="min-w-3xs">
              <FieldLegend className="font-bold">Information</FieldLegend>
              <FormSelect
                name="jc_company"
                control={form.control}
                label="Company"
                required={true}
                items={companies.map(x => ({ value: x.id.toString(), label: x.name }))}
              />
              <FormSelect
                name="division"
                control={form.control}
                label="Division"
                required={true}
                disabled={!companySelected}
                items={divisions.map(x => ({ value: x.id.toString(), label: x.name }))}
              />
              {officeReady ? (
                <Button variant="outline" onClick={readSheetHeader} disabled={!companySelected}>Import from Excel</Button>
              ) : (
                <Skeleton className="w-full h-9" />
              )}
              <FormTextBox
                name="po_description"
                control={form.control}
                label="Description"
                required={true} />
              <FormComboSearchBox
                name="job_number"
                control={form.control}
                label="Job"
                items={jobs}
                required={true}
                disabled={!companySelected}
              />
              <FormComboSearchBox
                name="vendor_number"
                control={form.control}
                label="Vendor"
                items={vendors}
                required={true}
                disabled={!companySelected}
              />
              <FormComboSearchBox
                name="cost_code"
                control={form.control}
                label="Cost Code"
                items={costCodes}
                required={true}
                disabled={!companySelected || !jobSelected}
              />
              <FormDatePicker
                name="order_date"
                control={form.control}
                label="Order Date"
                required={true}
              />
              <FormDatePicker
                name="expected_date"
                control={form.control}
                label="Expected Date"
                required={true}
              />
              <FormTextBox
                name="ordered_by"
                control={form.control}
                label="Ordered By"
                required={true}
              />
              <FormTextBox
                name="warranty"
                control={form.control}
                label="Warranty"
                required={true}
                suffix="years"
              />
            </FieldGroup>
            <FieldSeparator className="min-w-3xs sm:hidden" />
            <FieldGroup className="min-w-3xs">
              <FieldLegend className="font-bold">Shipping</FieldLegend>
              <FormComboSearchBox
                name="ship_location"
                control={form.control}
                label="Shipping Location"
                items={shipLocs}
                required={true}
                disabled={!companySelected}
              />
              <FormTextBox
                name="ship_instructions"
                control={form.control}
                label="Shipping Instructions"
              />
              <FormTextBox
                name="ship_attention"
                control={form.control}
                label="Attention"
              />
              <FormTextBox
                name="ship_street_address"
                control={form.control}
                label="Street Address"
                required={true}
              />
              <FormTextBox
                name="ship_city"
                control={form.control}
                label="City"
                required={true}
              />
              <FormTextBox
                name="ship_state"
                control={form.control}
                label="State"
                required={true}
              />
              <FormTextBox
                name="ship_zip"
                control={form.control}
                label="Zip"
                required={true}
              />
              <FormComboSearchBox
                name="tax_code"
                control={form.control}
                label="Tax Code"
                items={taxCodes}
                required={true}
                disabled={!companySelected}
              />
            </FieldGroup>
          </FieldGroup>
        </FieldSet>
      </form>
      {officeReady ? (
        <>
          <Button type="submit" form="export-vista-form">Export</Button>
          <a ref={downloadRef}
            href={'data:text/plain;charset=utf-8,' + encodeURIComponent(exportText)}
            download={exportFileName}
            className="hidden"
          >Download</a>
        </>
      ) : (
        <Skeleton className="w-full h-9" />
      )}
    </div>
  )
}

