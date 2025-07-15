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



    // Get all protocols and check if they would match the current display sets
    const protocols = Array.from(hangingProtocolService.protocols.values());

    // Check each protocol against the first display set
    if (displaySets.length > 0) {
        const firstDisplaySet = displaySets[0];

        protocols.forEach(protocol => {
            if (!protocol.displaySetSelectors) {
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


                    if (attribute === 'numImageFrames' && (!value || value <= 0)) {
                        isValid = false;
                        console.warn(`Protocol ${protocol.id} fails because numImageFrames is ${value}`);
                    }
                });
            });

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