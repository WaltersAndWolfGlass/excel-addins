import { Vendor } from "@/data/vendor";
import { Job } from "@/data/job";
import { PhaseCode } from "@/data/phasecode";
import { TaxCode } from "@/data/taxcode";
import { ShipLoc } from "@/data/shiploc";
import { TryGetVistaJobNumber } from "@/lib/domain";

export type Company = {
  id: number;
  name: string;
};

export async function getCompanies(): Promise<Company[]> {
  return [
    { id: 1, name: "Walters & Wolf Glass Company" },
    { id: 201, name: "WWG TEST!!!" },
  ];
}

export type Division = {
  id: number;
  name: string;
};

export async function getDivisions(
  companyId: number | string | undefined,
): Promise<Division[]> {
  switch (companyId?.toString()) {
    case "1":
      return [
        { id: 1, name: "Northern California" },
        { id: 2, name: "Southern California" },
        { id: 3, name: "Las Vegas, Nevada" },
      ];
    case "201":
      return [
        { id: 1, name: "Northern California" },
        { id: 2, name: "Southern California" },
        { id: 3, name: "Las Vegas, Nevada" },
      ];
    default:
      return [];
  }
}

const apiBase =
  process.env.NODE_ENV === "development"
    ? "/portalapi"
    : "https://wwweb/portal/desktopModules/ww_Global/API/Nebula";

export async function getVendors(
  companyId: number | string,
): Promise<Vendor[]> {
  let response = await fetch(
    `${apiBase}/GetVendorsByCompany?companyId=${companyId}`,
  );
  if (!response.ok) throw new Error("Fetch Vendors failed.");
  let vendors: Vendor[] = await response.json();
  for (let vendor of vendors) {
    vendor.Name = vendor.Name?.trim();
  }
  return vendors;
}

export async function getJobs(companyId: number | string): Promise<Job[]> {
  const companyIdsToSearch: string[] = [];
  switch (companyId) {
    case 1:
    case "1":
    default:
      // Fremont, LaVerne, and LasVegas jobs... covers old style job numbers and new
      companyIdsToSearch.push("1", "7", "9");
      break;
  }
  const jobs: Job[] = [];
  for (
    let companyIndex = 0;
    companyIndex < companyIdsToSearch.length;
    companyIndex++
  ) {
    const compId = companyIdsToSearch[companyIndex];
    const response = await fetch(
      `${apiBase}/GetJobsByCompany?companyId=${compId}`,
    );
    if (!response.ok) throw new Error("Fetch Jobs failed.");
    const companyJobs: Job[] = await response.json();
    jobs.push(...companyJobs);
  }
  for (let job of jobs) {
    job.JobNumber = job.JobNumber.trim().replace(/-$/, "");
    job.JobName = job.JobName?.trim();
    const [converted, vistaJobNumber] = TryGetVistaJobNumber(job.JobNumber);
    if (converted) {
      job.JobName = job.JobName + ` (${job.JobNumber})`;
      job.JobNumber = vistaJobNumber;
    }
  }
  return jobs;
}

export async function getPhaseCodes(job_number: string): Promise<PhaseCode[]> {
  let response = await fetch(
    `${apiBase}/GetPhasesByJobNumber?jobNumber=${job_number}`,
  );
  if (!response.ok) throw new Error("Fetch Phases failed.");
  let phases: PhaseCode[] = await response.json();
  for (let phase of phases) {
    phase.Code = phase.Code.trim().replace(/-$/, "");
    phase.Description = phase.Description?.trim();
  }
  return phases;
}

export async function getTaxCodes(
  companyId: number | string,
): Promise<TaxCode[]> {
  let response = await fetch(
    `${apiBase}/GetTaxCodesByCompany?companyId=${companyId}`,
  );
  if (!response.ok) throw new Error("Fetch Tax Codes failed.");
  let taxcodes: TaxCode[] = await response.json();
  for (let taxcode of taxcodes) {
    taxcode.Description = taxcode.Description?.trim();
  }
  return taxcodes;
}

export async function getShipLocs(
  companyId: number | string,
): Promise<ShipLoc[]> {
  let response = await fetch(
    `${apiBase}/GetShipLocsByCompany?companyId=${companyId}`,
  );
  if (!response.ok) throw new Error("Fetch ShipLocs failed.");
  let shiplocs: ShipLoc[] = await response.json();
  for (let shiploc of shiplocs) {
    shiploc.Code = shiploc.Code.trim();
    shiploc.Description = shiploc.Description?.trim();
    shiploc.Address = shiploc.Address?.trim();
    shiploc.Address2 = shiploc.Address2?.trim();
    shiploc.City = shiploc.City?.trim();
    shiploc.State = shiploc.State?.trim();
    shiploc.Zip = shiploc.Zip?.trim();
    shiploc.Country = shiploc.Country?.trim();
  }
  return shiplocs;
}
