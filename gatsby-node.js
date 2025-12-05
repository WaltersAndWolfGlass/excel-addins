const path = require("path");

exports.onCreateWebpackConfig = ({ actions }) => {
  actions.setWebpackConfig({
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@content": path.resolve(__dirname, "content"),
        "@static": path.resolve(__dirname, "static"),
      },
    },
  });
};
