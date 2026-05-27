import * as React from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormTextBox } from "@/components/form-textbox";
import { FormSelect } from "@/components/form-select";
import {
  ComboBoxItem,
  FormComboSearchBox,
} from "@/components/form-combosearchbox";
import { FormDatePicker } from "@/components/form-datepicker";
import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import { OrderForm } from "@/model/order_form";
import {
  Company,
  getCompanies,
  getVendors,
  getJobs,
  getPhaseCodes,
  getTaxCodes,
  getShipLocs,
} from "@/services/database";
import { Job } from "@/data/job";
import { Vendor } from "@/data/vendor";
import { PhaseCode } from "@/data/phasecode";
import { TaxCode } from "@/data/taxcode";
import { ShipLoc } from "@/data/shiploc";
import { alphaNumCompare } from "@/lib/sorters";
import { TryGetVistaJobNumber } from "@/lib/domain";
import { FormSwitch } from "./form-switch";
import { cn } from "@/lib/utils";
import { POItemDataTable, POLineItem } from "./vista/poitem_datatable";
import { HelpLink } from "./help-link";

const optionalString = z
  .optional(z.string().trim())
  .transform((e) => (!e ? undefined : e));
const reqString = optionalString.pipe(z.string({ message: "Required" }));
const reqJobNumber = reqString.pipe(
  z.string().regex(/^[A-Z0-9][-A-Z0-9]*[A-Z0-9]$/, "Not a valid job number"),
);
const reqCostCode = reqString.pipe(
  z.string().regex(/^[A-Z0-9][-A-Z0-9]*[A-Z0-9]$/, "Not a valid cost code"),
);
const reqOrderedBy = reqString.pipe(
  z
    .string()
    .min(2, "Must be 2-10 characters")
    .max(10, "Must be 2-10 characters"),
);
const reqDate = z.date({
  error: (issue) => (issue.input === undefined ? "Required" : "Invalid date"),
});
const reqId = reqString.pipe(
  z.coerce
    .number<string>({ message: "Invalid id" })
    .positive({ message: "Invalid id" })
    .pipe(z.int32({ message: "Invalid id" })),
);
const reqWholeNumber = reqString.pipe(
  z.coerce
    .number<string>({ message: "Must be a number" })
    .gte(0, { message: "Must be zero or greater" })
    .pipe(z.int({ message: "Must be a whole number" })),
);
const reqCountingNumber = optionalString.pipe(
  z.coerce
    .number<string>({ message: "Required" })
    .positive({ message: "Must be positive" })
    .pipe(z.int({ message: "Must be a counting number" })),
);

const formSchema = z.discriminatedUnion("createPO", [
  z.object({
    createPO: z.literal(true),
    vendor_number: reqString,
    po_description: reqString,
    order_date: reqDate,
    expected_date: reqDate,
    ordered_by: reqOrderedBy,
    jc_company: reqId,
    job_number: reqJobNumber,
    warranty: reqWholeNumber,
    ship_location: reqId,
    ship_attention: optionalString,
    ship_street_address: reqString,
    ship_city: reqString,
    ship_state: reqString,
    ship_zip: reqString,
    ship_instructions: optionalString,
    cost_code: reqCostCode,
    tax_code: optionalString,
  }),
  z.object({
    createPO: z.literal(false),
    po_number: reqString,
    first_item_number: reqCountingNumber,
    po_description: reqString,
    jc_company: reqId,
    job_number: reqJobNumber,
    cost_code: reqCostCode,
    tax_code: optionalString,
  }),
]);

export type ExcelState = "ready" | "unchecked" | "failure";

export function VistaExportForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    defaultValues: {
      createPO: false,
      po_number: "",
      first_item_number: "1",
      po_description: "",
      jc_company: "",
      job_number: "",
      cost_code: "",
      tax_code: "",
    },
  });
  form.trigger();
  const [excelState, setExcelState] = React.useState<ExcelState>("unchecked");
  const [exportText, setExportText] = React.useState("");
  const [exportFileName, setExportFileName] = React.useState("example.tsv");
  const [exportCount, setExportCount] = React.useState(0);
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [companySelected, setCompanySelected] = React.useState(false);
  const [vendors, setVendors] = React.useState<(ComboBoxItem & Vendor)[]>([]);
  const [jobs, setJobs] = React.useState<(ComboBoxItem & Job)[]>([]);
  const [jobSelected, setJobSelected] = React.useState(false);
  const [costCodes, setCostCodes] = React.useState<
    (ComboBoxItem & PhaseCode)[]
  >([]);
  const [taxCodes, setTaxCodes] = React.useState<(ComboBoxItem & TaxCode)[]>(
    [],
  );
  const [shipLocs, setShipLocs] = React.useState<(ComboBoxItem & ShipLoc)[]>(
    [],
  );
  const [createPO, setCreatePO] = React.useState(false);
  const [poType, setPoType] = React.useState<"metal" | "glass">("metal");
  const [lineItems, setLineItems] = React.useState<POLineItem[]>([]);

  React.useEffect(() => {
    const checkOffice = async () => {
      const { host } = await Office.onReady();
      if (host !== Office.HostType.Excel) {
        setExcelState("failure");
        toast.warning(
          "Not running in Excel. Can't import or export order form items.",
        );
        return;
      }
      setExcelState("ready");
      let authContext = await Office.auth.getAuthContext();
      const email = authContext.userPrincipalName;
      const initials = email.substring(0, 2).toUpperCase();
      form.setValue("ordered_by", initials);
    };

    setTimeout(checkOffice, 1000);
  }, []);

  const downloadRef = React.useRef<HTMLAnchorElement>(null);
  React.useEffect(() => {
    if (exportCount > 0) {
      downloadRef.current?.click();
    }
    setExportCount(0);
  }, [exportText, exportFileName, exportCount]);

  React.useEffect(() => {
    getCompanies().then((data) => setCompanies(data));
  }, []);

  React.useEffect(() => {
    const subscription = form.watch((data, { name }) => {
      switch (name) {
        case "createPO":
          setCreatePO(data.createPO ?? false);
          break;
        case "jc_company":
          if (data.jc_company) {
            form.resetField("po_number");
            form.resetField("first_item_number");
            form.resetField("vendor_number");
            form.resetField("job_number");
            form.resetField("cost_code");
            form.resetField("tax_code");
            form.resetField("ship_location");
            form.resetField("ship_street_address");
            form.resetField("ship_city");
            form.resetField("ship_state");
            form.resetField("ship_zip");
            setCompanySelected(true);
            setJobSelected(false);
            getVendors(data.jc_company ?? "").then((vs) => {
              vs.sort((a, b) => alphaNumCompare(a.Name, b.Name));
              setVendors(
                vs.map((v) => ({
                  value: v.Id.toString(),
                  label: `[${v.Id}] ${v.Name}`,
                  ...v,
                })),
              );
            });
            getJobs(data.jc_company ?? "").then((js) => {
              js.sort((a, b) => alphaNumCompare(a.JobNumber, b.JobNumber));
              setJobs(
                js.map((j) => ({
                  value: j.JobNumber,
                  label: `[${j.JobNumber}] ${j.JobName}`,
                  ...j,
                })),
              );
            });
            setCostCodes([]);
            getTaxCodes(data.jc_company ?? "").then((tcs) => {
              tcs.sort((a, b) => alphaNumCompare(a.Code, b.Code));
              setTaxCodes(
                tcs.map((tc) => ({
                  value: tc.Code,
                  label: `[${tc.Code}] ${tc.Description}`,
                  ...tc,
                })),
              );
            });
            getShipLocs(data.jc_company ?? "").then((sls) => {
              sls.sort((a, b) => alphaNumCompare(a.Code, b.Code));
              setShipLocs(
                sls.map((sl) => ({
                  value: sl.Code,
                  label: `[${sl.Code}] ${sl.Description}`,
                  ...sl,
                })),
              );
            });
          } else {
            form.resetField("po_number");
            form.resetField("first_item_number");
            form.resetField("vendor_number");
            form.resetField("job_number");
            form.resetField("cost_code");
            form.resetField("tax_code");
            form.resetField("ship_location");
            form.resetField("ship_street_address");
            form.resetField("ship_city");
            form.resetField("ship_state");
            form.resetField("ship_zip");
            setCompanySelected(false);
            setJobSelected(false);
            setVendors([]);
            setJobs([]);
            setCostCodes([]);
            setTaxCodes([]);
            setShipLocs([]);
          }
          break;
        case "job_number":
          if (data.job_number) {
            form.resetField("first_item_number");
            form.resetField("cost_code");
            setJobSelected(true);
            getPhaseCodes(data.job_number ?? "")
              .then((pcs) => {
                pcs.sort((a, b) => alphaNumCompare(a.Code, b.Code));
                setCostCodes(
                  pcs.map((pc) => ({
                    value: pc.Code,
                    label: `[${pc.Code}] ${pc.Description}`,
                    ...pc,
                  })),
                );
              })
              .catch((error) => {
                toast.error(
                  `Unable to retrieve cost codes from job number "${data.job_number ?? "(blank)"}"`,
                );
              });
          } else {
            form.resetField("first_item_number");
            form.resetField("cost_code");
            setJobSelected(false);
            setCostCodes([]);
          }
          break;
        case "ship_location":
          if (data.createPO && data.ship_location) {
            let filteredShipLocs = shipLocs.filter(
              (x) => x.Code == data.ship_location,
            );
            let sl = filteredShipLocs[0];
            if (sl.Address) {
              form.setValue("ship_street_address", sl.Address);
            } else {
              form.resetField("ship_street_address");
            }
            if (sl.City) {
              form.setValue("ship_city", sl.City);
            } else {
              form.resetField("ship_city");
            }
            if (sl.State) {
              form.setValue("ship_state", sl.State);
            } else {
              form.resetField("ship_state");
            }
            if (sl.Zip) {
              form.setValue("ship_zip", sl.Zip);
            } else {
              form.resetField("ship_zip");
            }
          }
      }
      form.trigger();
    });
    return () => subscription.unsubscribe();
  }, [form.watch, shipLocs]);

  function formatDate(date?: Date, delimeter: string = "/"): string {
    if (date === undefined) return "";
    return (
      (date.getMonth() + 1).toString().padStart(2, "0") +
      delimeter +
      date.getDate().toString().padStart(2, "0") +
      delimeter +
      date.getFullYear().toString()
    );
  }

  function onExport(data: z.infer<typeof formSchema>) {
    constructText(data).then((text) => {
      setExportText(text);
      setExportFileName(
        `${data.po_description} (${data.createPO ? `JOB ${data.job_number}` : `PO ${data.po_number}`}).csv`,
      );
      setExportCount(exportCount + 1);
    });
    toast.success("Exported! Check your downloads folder.");
  }

  async function constructText(data: z.infer<typeof formSchema>) {
    let today = new Date();

    let header: string = [
      "POHB",
      "1", // reckey
      data.createPO ? "" : (data.po_number ?? ""),
      data.createPO ? (data.vendor_number ?? "") : "",
      data.po_description ?? "",
      data.createPO ? formatDate(data.order_date, "") : "",
      data.createPO ? formatDate(data.expected_date, "") : "",
      data.createPO ? (data.ordered_by ?? "") : "",
      data.jc_company,
      data.job_number,
      data.createPO ? (data.warranty ?? "0") : "",
      data.createPO ? (data.ship_location ?? "") : "",
      data.createPO ? (data.ship_attention ?? "") : "",
      data.createPO ? (data.ship_street_address ?? "") : "",
      data.createPO ? (data.ship_city ?? "") : "",
      data.createPO ? (data.ship_state ?? "") : "",
      data.createPO ? (data.ship_zip ?? "") : "",
      data.createPO ? (data.ship_instructions ?? "") : "",
      formatDate(new Date(today.getFullYear(), today.getMonth()), ""),
    ].join("\t");

    if (typeof lineItems === "string") {
      return header;
    }

    var i = data.createPO ? 1 : (data.first_item_number ?? 1);
    let lines = lineItems.map((x: POLineItem) => {
      return [
        "POIB",
        "1", // reckey
        i++,
        data.jc_company,
        data.job_number,
        data.cost_code,
        x.description,
        x.units,
        x.quantity,
        x.price_per_unit,
        "E",
        data.tax_code ? "1" : "", // tax type: 1 = sales, only applies if there is a tax code
        data.tax_code,
        x.mark_number,
      ].join("\t");
    });

    return header + "\r\n" + lines.join("\r\n");
  }

  function readSheetHeader() {
    let orderForm = new OrderForm();
    orderForm
      .LoadHeaderFromWorkbook()
      .then((success) => {
        if (!success) {
          toast.error("Failed to load data from sheet");
          return;
        }

        if (orderForm.form_type === "metal") {
          setPoType("metal");
          if (orderForm.po_number) {
            form.setValue("createPO", false);
            form.setValue("po_number", orderForm.po_number ?? "");
          } else {
            form.setValue("createPO", true);
          }
          form.setValue("po_description", "Metal Order");
          const [converted, vistaJobNumber] = TryGetVistaJobNumber(
            orderForm.job_number ?? "",
          );
          if (converted) {
            form.setValue("job_number", vistaJobNumber);
          } else {
            form.setValue("job_number", orderForm.job_number ?? "");
          }
          // needs to fill in vendor field
          form.setValue("cost_code", orderForm.cost_code ?? "");
          if (orderForm.ordered_by?.includes(" ")) {
            const words = orderForm.ordered_by.split(" ");
            const initials = words
              .map((w) => w.substring(0, 1))
              .join("")
              .toUpperCase();
            form.setValue("ordered_by", initials);
          } else {
            form.setValue("ordered_by", orderForm.ordered_by ?? "");
          }
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
          form.setValue("warranty", orderForm.warranty ?? "");
          toast.success(
            `Successfully imported sheet data for Metal Order Form (v${orderForm.template_version})`,
          );
          return;
        }

        if (orderForm.form_type === "glass") {
          setPoType("glass");
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

          if (orderForm.po_number) {
            form.setValue("createPO", false);
            form.setValue("po_number", orderForm.po_number ?? "");
          } else {
            form.setValue("createPO", true);
          }
          form.setValue("po_description", desc);
          const [converted, vistaJobNumber] = TryGetVistaJobNumber(
            orderForm.job_number ?? "",
          );
          if (converted) {
            form.setValue("job_number", vistaJobNumber);
          } else {
            form.setValue("job_number", orderForm.job_number ?? "");
          }
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
          toast.success(
            `Successfully imported first sheet data for ${desc} Form (v${orderForm.template_version})`,
          );
          return;
        }
      })
      .then(() =>
        orderForm.GetLineItems().then((result) => {
          if (typeof result === "string") {
            toast.error(result);
            return;
          }
          setLineItems(
            result.map((x) => ({
              ...x,
              price_per_unit: Math.round(x.price_per_unit * 100) / 100,
            })),
          );
        }),
      );
  }

  return (
    <div className="m-8">
      <h1 className="flex items-center space-x-2 scroll-m-20 tracking-tight text-balance mb-8">
        <img src="../../vista256.png" className="inline-block size-6" />
        <span className="text-2xl font-extrabold ">Vista Export</span>
        <HelpLink href="../docs/vista-export-form" />
      </h1>
      <form
        id="export-vista-form"
        onSubmit={(e) => e.preventDefault()}
        className="mb-8"
      >
        <FieldGroup
          className={cn(
            "flex-wrap",
            "sm:max-h-200",
            "*:min-w-[calc((100%-var(--spacing)*7*2)/3)]",
          )}
        >
          <FieldSet key="companySection">
            <FieldLegend>General</FieldLegend>
            <FieldGroup>
              <FormSelect
                name="jc_company"
                control={form.control}
                label="Company"
                items={companies.map((x) => ({
                  value: x.id.toString(),
                  label: x.name,
                }))}
              />
            </FieldGroup>
            <FieldGroup>
              <Button
                variant="outline"
                onClick={readSheetHeader}
                disabled={excelState !== "ready" || !companySelected}
              >
                Import from Excel
              </Button>
            </FieldGroup>
          </FieldSet>
          <FieldSet key="jobSection">
            <FieldLegend>Job Information</FieldLegend>
            <FieldGroup>
              <FormComboSearchBox
                name="job_number"
                control={form.control}
                label="Job"
                items={jobs}
                disabled={!companySelected}
              />
              <FormComboSearchBox
                name="cost_code"
                control={form.control}
                label="Cost Code"
                items={costCodes}
                disabled={!companySelected || !jobSelected}
              />
              <FormComboSearchBox
                name="tax_code"
                control={form.control}
                label="Tax Code"
                items={taxCodes}
                disabled={!companySelected}
              />
            </FieldGroup>
          </FieldSet>
          <FieldSet key="purchasingSection">
            <FieldLegend>Purchasing Information</FieldLegend>
            <FieldGroup>
              <FormSwitch
                name="createPO"
                control={form.control}
                label="Create New Purchase Order"
              />
              <FormTextBox
                name="po_number"
                control={form.control}
                label="PO Number"
                hidden={createPO}
              />
              <FormTextBox
                name="first_item_number"
                control={form.control}
                label="First PO Item Number"
                hidden={createPO}
              />
              <FormTextBox
                name="po_description"
                control={form.control}
                label="Description"
              />
              <FormComboSearchBox
                name="vendor_number"
                control={form.control}
                label="Vendor"
                items={vendors}
                disabled={!companySelected}
                hidden={!createPO}
              />
              <FormDatePicker
                name="order_date"
                control={form.control}
                label="Order Date"
                hidden={!createPO}
              />
              <FormDatePicker
                name="expected_date"
                control={form.control}
                label="Expected Date"
                hidden={!createPO}
              />
              <FormTextBox
                name="ordered_by"
                control={form.control}
                label="Ordered By"
                hidden={!createPO}
              />
              <FormTextBox
                name="warranty"
                control={form.control}
                label="Warranty"
                suffix="years"
                hidden={!createPO}
              />
            </FieldGroup>
          </FieldSet>
          <FieldSet key="shippingSection" hidden={!createPO}>
            <FieldLegend>Shipping</FieldLegend>
            <FieldGroup>
              <FormComboSearchBox
                name="ship_location"
                control={form.control}
                label="Shipping Location"
                items={shipLocs}
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
              />
              <FormTextBox
                name="ship_city"
                control={form.control}
                label="City"
              />
              <FormTextBox
                name="ship_state"
                control={form.control}
                label="State"
              />
              <FormTextBox name="ship_zip" control={form.control} label="Zip" />
            </FieldGroup>
          </FieldSet>
        </FieldGroup>
      </form>
      <div className="my-8">
        <POItemDataTable
          data={lineItems}
          setData={setLineItems}
          showMarkNumber={poType === "glass"}
        />
      </div>
      <Button
        type="submit"
        form="export-vista-form"
        disabled={excelState !== "ready"}
        onClick={form.handleSubmit(onExport)}
      >
        Export
      </Button>
      <a
        ref={downloadRef}
        href={"data:text/plain;charset=utf-8," + encodeURIComponent(exportText)}
        download={exportFileName}
        className="hidden"
      >
        Download
      </a>
    </div>
  );
}
