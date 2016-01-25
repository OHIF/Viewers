
/**
 * @summary Determines if a block of code should be displayed based on whether the logo is set to be displayed.
 * @locus Client
 * @memberOf Entry
 * @name {{logoIsDisplayed}}
 * @version 1.2.3
 * @returns {Boolean}
 * @example
 * ```html
 * {{#if logoIsDisplayed}}
*    <div class="entryLogo" style="background-image: url('{{logoUrl}}')"></div>
 * {{/if}}
 * ```
 */
Template.registerHelper("logoIsDisplayed", function (argument){
  var config = Session.get('Photonic.ActiveEntry');
  if(config && config.logo && config.logo.displayed){
    return config.logo.displayed;
  }else{
    return false;
  }
});


/**
 * @summary Retruns the Url of the logo asset.
 * @locus Client
 * @memberOf Entry
 * @name {{logoUrl}}
 * @version 1.2.3
 * @returns {String}
 * @example
 * ```html
 * {{#if logoIsDisplayed}}
*    <div class="entryLogo" style="background-image: url('{{logoUrl}}')"></div>
 * {{/if}}
 * ```
 */
Template.registerHelper("logoUrl", function (argument){
  var config = Session.get('Photonic.ActiveEntry');
  if(config && config.logo && config.logo.url){
    return config.logo.url;
  }else{
    return "";
  }
});


Template.registerHelper("getButtonColor", function (argument){
  return "background-color: " + Theme.getPaletteColor("colorB") + "; ";
});
