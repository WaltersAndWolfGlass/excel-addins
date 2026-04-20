import * as React from "react";
import type { HeadFC, PageProps } from "gatsby";
import { Toaster } from "@/components/ui/sonner";
import { OptimizerForm } from "@/components/optimization/OptimizerForm";
import { TooltipProvider } from "@/components/ui/tooltip";

const IndexPage: React.FC<PageProps> = () => {
  return (
    <TooltipProvider>
      <main>
        <Toaster position="top-center" />
        <div className="m-8">
          <OptimizerForm />
        </div>
      </main>
      <footer>
        <div className="text-right">
          <small className="p-8">v0.0.1.6 2026-04-20</small>
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
