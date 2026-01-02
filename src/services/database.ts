import { Vendor, Vendors } from "@/data/vendor_data";
import { Job, Jobs } from "@/data/job_data";
import { PhaseCode, PhaseCodes } from "@/data/phasecode_data";
import { TaxCode, TaxCodes } from "@/data/taxcode_data";

export type Company = {
  id: number;
  name: string;
};
export async function getCompanies(): Promise<Company[]> {
  return [{ id: 2, name: "Company 2" }];
}

export type Division = {
  id: number;
  name: string;
};
export async function getDivisions(
  companyId: number | string | undefined
): Promise<Division[]> {
  switch (companyId?.toString()) {
    case "2":
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

export async function getPhaseCodes(
  companyId: number | string,
  job_number: string
): Promise<PhaseCode[]> {
  const company = companyId.toString();
  return PhaseCodes.filter(
    (x) => x.company === company && x.job === job_number
  );
}

export async function getTaxCodes(
  companyId: number | string
): Promise<TaxCode[]> {
  const company = companyId.toString();
  return TaxCodes.filter((x) => x.company === company);
}
