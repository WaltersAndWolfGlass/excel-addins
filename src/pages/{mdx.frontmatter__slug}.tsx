import * as React from "react";
import { graphql } from "gatsby";
import type { HeadProps, PageProps } from "gatsby";
import { DocumentLayout } from "@/components/documentlayout";

const DocumentPage = ({
  data,
  children,
}: PageProps<Queries.DocumentPageQuery> & { children: any }) => {
  return <DocumentLayout data={data}>{children}</DocumentLayout>;
};

export const query = graphql`
  query DocumentPage($id: String) {
    mdx(id: { eq: $id }) {
      id
      frontmatter {
        section
        title
        lastupdated
        slug
      }
    }
  }
`;

export const Head = ({ data }: HeadProps<Queries.DocumentPageQuery>) => (
  <>
    <title>{data.mdx?.frontmatter?.title}</title>
  </>
);

export default DocumentPage;
