import { Vendor, Vendors } from "@/data/vendor_data";
import { Job, Jobs } from "@/data/job_data";
import { PhaseCode, PhaseCodes } from "@/data/phasecode_data";
import { TaxCode, TaxCodes } from "@/data/taxcode_data";

export type Company = {
  id: number;
  name: string;
};
export async function getCompanies(): Promise<Company[]> {
  return [
    { id: 1, name: "W&W Glass" },
    { id: 2, name: "W&W Interiors" },
    { id: 3, name: "W&W Curtain Wall (Seattle)" },
    { id: 201, name: "Testing 201" },
    { id: 202, name: "Testing 202" },
    { id: 203, name: "Testing 203" },
    { id: 204, name: "Testing 204" },
    { id: 205, name: "Testing 205" },
    { id: 206, name: "Testing 206" },
  ];
}

export type Division = {
  id: number;
  name: string;
};
export async function getDivisions(
  companyId: number | string | undefined
): Promise<Division[]> {
  switch (companyId?.toString()) {
    case "1":
      return [
        { id: 1, name: "Northern California" },
        { id: 2, name: "Southern California" },
        { id: 3, name: "Las Vegas, Nevada" },
      ];
    case "2":
      return [{ id: 1, name: "Fremont Interiors" }];
    case "3":
      return [{ id: 1, name: "Mulkiteo" }];
    case "201":
      return [
        { id: 1, name: "Northern California" },
        { id: 2, name: "Southern California" },
        { id: 3, name: "Las Vegas, Nevada" },
      ];
    case "202":
      return [
        { id: 1, name: "Northern California" },
        { id: 2, name: "Southern California" },
        { id: 3, name: "Las Vegas, Nevada" },
      ];
    case "203":
      return [
        { id: 1, name: "Northern California" },
        { id: 2, name: "Southern California" },
        { id: 3, name: "Las Vegas, Nevada" },
      ];
    case "204":
      return [
        { id: 1, name: "Northern California" },
        { id: 2, name: "Southern California" },
        { id: 3, name: "Las Vegas, Nevada" },
      ];
    case "205":
      return [
        { id: 1, name: "Northern California" },
        { id: 2, name: "Southern California" },
        { id: 3, name: "Las Vegas, Nevada" },
      ];
    case "206":
      return [
        { id: 1, name: "Northern California" },
        { id: 2, name: "Southern California" },
        { id: 3, name: "Las Vegas, Nevada" },
      ];
    default:
      return [];
  }
}

export async function getVendors(
  companyId: number | string
): Promise<Vendor[]> {
  const company = companyId.toString();
  return Vendors.filter((x) => x.company === company);
}

export async function getJobs(companyId: number | string): Promise<Job[]> {
  const company = companyId.toString();
  return Jobs.filter((x) => x.company === company);
}

export async function getPhaseCodes(job_number: string): Promise<PhaseCode[]> {
  return PhaseCodes.filter((x) => x.job === job_number);
}

export async function getTaxCodes(
  companyId: number | string
): Promise<TaxCode[]> {
  const company = companyId.toString();
  return TaxCodes.filter((x) => x.company === company);
}
