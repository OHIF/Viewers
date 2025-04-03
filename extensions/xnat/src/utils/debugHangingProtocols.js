/**
 * Debug utility for hanging protocols in XNAT extension
 * Use this in the browser console to diagnose hanging protocol matching issues
 */

export function debugHangingProtocols() {
  const servicesManager = window.ohif.app.servicesManager;
  if (!servicesManager) {
    console.error('OHIF Services manager not found');
    return;
  }

  const { 
    hangingProtocolService, 
    displaySetService, 
    viewportGridService 
  } = servicesManager.services;

  if (!hangingProtocolService || !displaySetService || !viewportGridService) {
    console.error('Required services not found', { 
      hangingProtocolService: !!hangingProtocolService, 
      displaySetService: !!displaySetService, 
      viewportGridService: !!viewportGridService 
    });
    return;
  }

  // Get all display sets
  const displaySets = displaySetService.getActiveDisplaySets();
  console.log('Active Display Sets:', displaySets);
  
  // Check for numImageFrames attribute
  displaySets.forEach(ds => {
    console.log(`Display Set ${ds.displaySetInstanceUID}:`, {
      'Has numImageFrames': 'numImageFrames' in ds,
      'numImageFrames value': ds.numImageFrames,
      'Modality': ds.Modality,
      'SeriesDescription': ds.SeriesDescription,
    });
  });

  // Get all protocols and check if they would match the current display sets
  const protocols = Array.from(hangingProtocolService.protocols.values());
  console.log('Available Protocols:', protocols.map(p => p.id));

  // Check each protocol against the first display set
  if (displaySets.length > 0) {
    const firstDisplaySet = displaySets[0];
    
    protocols.forEach(protocol => {
      if (!protocol.displaySetSelectors) {
        console.log(`Protocol ${protocol.id} has no displaySetSelectors`);
        return;
      }
      
      const selectors = Object.values(protocol.displaySetSelectors);
      let isValid = true;
      
      selectors.forEach(selector => {
        if (!selector.seriesMatchingRules) {
          return;
        }
        
        const requiredRules = selector.seriesMatchingRules.filter(rule => rule.required);
        
        requiredRules.forEach(rule => {
          const { attribute, constraint } = rule;
          const value = firstDisplaySet[attribute];
          
          console.log(`Protocol ${protocol.id} required rule:`, {
            attribute,
            constraint,
            'value in display set': value,
            'display set has attribute': attribute in firstDisplaySet
          });
          
          if (attribute === 'numImageFrames' && (!value || value <= 0)) {
            isValid = false;
            console.warn(`Protocol ${protocol.id} fails because numImageFrames is ${value}`);
          }
        });
      });
      
      console.log(`Protocol ${protocol.id} would match: ${isValid}`);
    });
  }

  return {
    displaySets,
    protocols,
    message: 'Check the logs for detailed hanging protocol debugging information'
  };
}

// Expose function to window for use in browser console
if (typeof window !== 'undefined') {
  window.debugXnatHangingProtocols = debugHangingProtocols;
} 