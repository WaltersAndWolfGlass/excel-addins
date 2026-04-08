import type { GatsbyConfig } from "gatsby";
import { createProxyMiddleware } from "http-proxy-middleware";

const config: GatsbyConfig = {
  siteMetadata: {
    title: `W&W Excel Addins`,
    siteUrl: `https://WaltersAndWolfGlass.github.io/excel-addins/`,
  },
  pathPrefix: `/excel-addins`,
  // More easily incorporate content into your pages through automatic TypeScript type generation and better GraphQL IntelliSense.
  // If you use VSCode you can also use the GraphQL plugin
  // Learn more at: https://gatsby.dev/graphql-typegen
  graphqlTypegen: true,
  plugins: ["gatsby-plugin-postcss", "gatsby-plugin-lodash"],
  developMiddleware: (app) => {
    app.use(
      createProxyMiddleware({
        target: "https://wwweb/portal/desktopModules/ww_Global/API/Nebula",
        pathFilter: "/portalapi",
        pathRewrite: { "/portalapi": "" },
        secure: false,
      }),
    );
  },
};

export default config;
