import * as React from "react";
import type { HeadFC, PageProps } from "gatsby";
import { Toaster } from "@/components/ui/sonner";
import { VistaExportForm } from "@/components/vista-export-form";

const IndexPage: React.FC<PageProps> = () => {
  return (
    <>
      <main>
        <Toaster position="top-center" />
        <VistaExportForm />
      </main>
      <footer>
        <div className="text-right">
          <small className="p-8">v0.3.0.2 2026-04-13</small>
        </div>
      </footer>
    </>
  );
};

export default IndexPage;

export const Head: HeadFC = () => (
  <>
    <title>Vista Export</title>
    <script
      key="officeapi"
      src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js"
      type="text/javascript"
    />
  </>
);
