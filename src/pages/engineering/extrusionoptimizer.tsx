import * as React from "react"
import type { HeadFC, PageProps } from "gatsby"
import { Toaster } from "@/components/ui/sonner"

const IndexPage: React.FC<PageProps> = () => {
  return (
    <>
      <main>
      </main>
      <footer>
        <div className="text-right">
          <small className="p-8">
            v0.0.0.0 2026-02-06
          </small>
        </div>
      </footer>
      <Toaster />
    </>
  )
}

export default IndexPage

export const Head: HeadFC = () => (
  <>
    <title>Extrusion Optimizer</title>
    <script
      key="officeapi"
      src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js"
      type="text/javascript"
    />
  </>
)
