import { Vendor } from "@/data/vendor";
import { Job } from "@/data/job";
import { PhaseCode } from "@/data/phasecode";
import { TaxCode } from "@/data/taxcode";
import { ShipLoc } from "@/data/shiploc";

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
      return [
        { id: 1, name: "Northern California" },
        { id: 2, name: "Southern California" },
        { id: 3, name: "Las Vegas, Nevada" },
      ];
    case "3":
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

const apiBase = "https://wwweb/portal/desktopModules/ww_Global/API/Nebula";

export async function getVendors(
  companyId: number | string
): Promise<Vendor[]> {
  let response = await fetch(
    `${apiBase}/GetVendorsByCompany?companyId=${companyId}`
  );
  if (!response.ok) throw new Error("Fetch Vendors failed.");
  let vendors: Vendor[] = await response.json();
  return vendors;
}

export async function getJobs(companyId: number | string): Promise<Job[]> {
  let response = await fetch(
    `${apiBase}/GetJobsByCompany?companyId=${companyId}`
  );
  if (!response.ok) throw new Error("Fetch Jobs failed.");
  let jobs: Job[] = await response.json();
  for (let job of jobs) {
    job.JobNumber = job.JobNumber.trim().replace(/-$/, "");
  }
  return jobs;
}

export async function getPhaseCodes(job_number: string): Promise<PhaseCode[]> {
  let response = await fetch(
    `${apiBase}/GetPhasesByJobNumber?jobNumber=${job_number}`
  );
  if (!response.ok) throw new Error("Fetch Phases failed.");
  let phases: PhaseCode[] = await response.json();
  for (let phase of phases) {
    phase.Code = phase.Code.trim().replace(/-$/, "");
  }
  return phases;
}

export async function getTaxCodes(
  companyId: number | string
): Promise<TaxCode[]> {
  let response = await fetch(
    `${apiBase}/GetTaxCodesByCompany?companyId=${companyId}`
  );
  if (!response.ok) throw new Error("Fetch Tax Codes failed.");
  return await response.json();
}

export async function getShipLocs(
  companyId: number | string
): Promise<ShipLoc[]> {
  let response = await fetch(
    `${apiBase}/GetShipLocsByCompany?companyId=${companyId}`
  );
  if (!response.ok) throw new Error("Fetch ShipLocs failed.");
  return await response.json();
}
