import React from "react";

const HeadComponents = [
  <script
    src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js"
    type="text/javascript"
  />,
];

const onRenderBody = ({ setHeadComponents }) => {
  setHeadComponents(HeadComponents);
};

export { onRenderBody };
