import * as React from "react";
import type { HeadFC, PageProps } from "gatsby";
import { Toaster } from "@/components/ui/sonner";
import { OptimizerForm } from "@/components/optimizer-form";
import { TooltipProvider } from "@/components/ui/tooltip";

const IndexPage: React.FC<PageProps> = () => {
  return (
    <TooltipProvider>
      <main>
        <Toaster />
        <OptimizerForm />
      </main>
      <footer>
        <div className="text-right">
          <small className="p-8">v0.0.1.0 2026-03-08</small>
        </div>
      </footer>
    </TooltipProvider>
  );
};

export default IndexPage;

export const Head: HeadFC = () => (
  <>
    <title>Extrusion Optimizer</title>
    <script
      key="officeapi"
      src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js"
      type="text/javascript"
    />
  </>
);
