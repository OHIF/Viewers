const path = require('path');

/**
 * The copy pattern of the optional split rules of @cornerstonejs/metadata
 * (`rules/optional/<id>.jsonc`, bare rule data). The pattern wraps each file as
 * a customization module, `?customization=split/optional/<id>`, that turns on
 * the new split and `$merge`s the rules into `splitRules`. The wrap is text, so
 * the comments of the file stay. A metadata version without the files copies
 * nothing. Used by webpack.pwa.js and rsbuild.config.ts.
 */
module.exports = function optionalSplitRulesCopyPattern(distDir) {
  return {
    from: path.resolve(__dirname, '../../../node_modules/@cornerstonejs/metadata/rules/optional'),
    to: path.join(distDir, 'customizations/split/optional'),
    toType: 'dir',
    noErrorOnMissing: true,
    transform: content =>
      '{"requires":["split/enableNewSplit"],"global":{"useMetadataDisplaySet":' +
      '{"splitRules":{"$merge":\n' +
      content +
      '\n}}}}',
  };
};
