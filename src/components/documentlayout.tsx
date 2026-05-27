import * as React from "react";
import { useStaticQuery, graphql } from "gatsby";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { MDXProvider } from "@mdx-js/react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DocumentCard } from "@/components/document-card";
import { StaticImage } from "gatsby-plugin-image";
import { Kbd } from "@/components/ui/kbd";

const intoId = (props: any) => {
  if (typeof props?.children === "string") {
    return props.children.replace(/\W+/g, "-");
  }
  return "";
};
const shortcodes = {
  DocumentCard,
  Kbd,
  StaticImage,
  h1(props: any) {
    return (
      <h1
        id={intoId(props)}
        className="text-2xl mb-4 mt-18 first:mt-0"
        {...props}
      />
    );
  },
  h2(props: any) {
    return (
      <h2
        id={intoId(props)}
        className="text-xl mb-4 mt-12 first:mt-0"
        {...props}
      />
    );
  },
  h3(props: any) {
    return (
      <h3
        id={intoId(props)}
        className="text-lg mb-4 mt-12 first:mt-0"
        {...props}
      />
    );
  },
  p(props: any) {
    return <p className="mb-4" {...props} />;
  },
  ol(props: any) {
    return <ol className="list-decimal list-inside mb-4" {...props} />;
  },
  ul(props: any) {
    return <ul className="list-disc list-inside mb-4" {...props} />;
  },
  li(props: any) {
    return <li className="mb-4 last:mb-0" {...props} />;
  },
};

export function DocumentLayout({
  data,
  children,
}: {
  data: Queries.DocumentPageQuery;
  children: any;
}) {
  const path = data.mdx?.frontmatter?.slug?.split("/") ?? [""];
  const department = path[0];
  const nodeData: Queries.DocNodesQuery = useStaticQuery(graphql`
    query DocNodes {
      allMdx(sort: { frontmatter: { order: ASC } }) {
        nodes {
          id
          frontmatter {
            section
            title
            slug
          }
        }
      }
    }
  `);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <h1>
            <img
              src={
                path.map((_) => "../").join("") +
                (department === "purchasing"
                  ? "wwpurchasing80.png"
                  : "wwengineering80.png")
              }
              className="inline-block size-8 mr-1"
            />
            Walters &amp; Wolf Excel Addins
          </h1>
        </SidebarHeader>
        <SidebarContent>
          {nodeData.allMdx.nodes
            .filter((n) => n.frontmatter?.slug?.startsWith(department + "/"))
            .reduce(
              (groups, n) => {
                let group;
                if (
                  groups.length === 0 ||
                  groups[groups.length - 1].groupTitle !==
                    n.frontmatter?.section
                ) {
                  group = {
                    groupTitle: n.frontmatter?.section ?? "",
                    items: [],
                  };
                  groups.push(group);
                } else {
                  group = groups[groups.length - 1];
                }
                group.items.push({
                  id: n.id,
                  title: n.frontmatter?.title ?? "",
                  url: path.map((_) => "../").join("") + n.frontmatter?.slug,
                });
                return groups;
              },
              [] as {
                groupTitle: string;
                items: { id: string; title: string; url: string }[];
              }[],
            )
            .map(({ groupTitle, items }) => (
              <SidebarGroup key={groupTitle}>
                <SidebarGroupLabel>{groupTitle}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {items.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={item.id === data.mdx?.id}
                        >
                          <a href={item.url}>{item.title}</a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem
                key={data.mdx?.frontmatter?.section}
                className="hidden md:block"
              >
                <BreadcrumbPage>
                  {data.mdx?.frontmatter?.section}
                </BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{data.mdx?.frontmatter?.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
        </header>
        <div className="p-4">
          <div className="text-xs italic opacity-75 mb-4">
            Updated:{" "}
            {data.mdx?.frontmatter?.lastupdated &&
              new Date(data.mdx?.frontmatter?.lastupdated).toLocaleDateString()}
          </div>
          <h1 className="text-2xl mb-4">{data.mdx?.frontmatter?.title}</h1>
          <MDXProvider components={shortcodes}>{children}</MDXProvider>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
