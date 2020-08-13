module.exports = {
  plugins: [
    'gatsby-theme-docz',
    'gatsby-plugin-react-svg',
    'gatsby-plugin-sass',
    `gatsby-plugin-postcss`,
  ],
};

exports.createSchemaCustomization = ({ actions }) => {
  actions.createTypes(`
    type SitePage implements Node @dontInfer {
      path: String!
    }
  `)
}
