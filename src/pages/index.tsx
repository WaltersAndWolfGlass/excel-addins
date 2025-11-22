import * as React from "react"
import type { HeadFC, PageProps } from "gatsby"
import { VistaExportForm } from "@/components/vista-export-form"

const IndexPage: React.FC<PageProps> = () => {
  return (
    <main>
      <VistaExportForm />
    </main>
  )
}

export default IndexPage

export const Head: HeadFC = () => <title>Vista Export</title>
