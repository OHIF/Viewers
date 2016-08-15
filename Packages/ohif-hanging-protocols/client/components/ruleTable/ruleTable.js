Template.ruleTable.helpers({
    /**
     * Retrieve validation data on each rule for the active viewport
     *
     * @returns {boolean} Whether or not the current rule passed for the active viewport
     */
    rulePassed: function() {
        // Retrieve the latest match details given the active viewport index
        var viewportIndex = Session.get('activeViewport');
        var details = ProtocolEngine.matchDetails[viewportIndex];

        // If no match was found, stop here
        if (!details || !details.bestMatch) {
            return;
        }

        // Retrieve the list of failed rules for this Viewport
        var failed = details.bestMatch.matchDetails.failed;

        // Check if the current rule failed or not
        var rule = this;
        var hasPassed = true;
        failed.forEach(function(failedRuleData) {
            var failedRule = failedRuleData.rule;
            if (failedRule.id === rule.id) {
                hasPassed = false;
                return false;
            }
        });

        // Return a boolean representing whether or not the rule passed
        return hasPassed;
    }
});

Template.ruleTable.events({
    /**
     * Opens the Rule Entry dialog to allow the user to create a new rule
     * Specifies attributes and rule level for the Rule Entry dialog
     * based on the data given to this template.
     */
    'click .addRule': function() {
        // Get the current template data
        var data = Template.currentData();

        // Retrieve the rule attributes and level (e.g. study / series / instance)
        var attributes = data.attributes;
        var level = data.level;

        // Open the Rule Entry Dialog with the attributes, level, and rule
        openRuleEntryDialog(attributes, level);
    },
    /**
     * Opens the Rule Entry dialog to allow the user to edit an existing
     * rule. Passes rule details to the dialog so its current properties
     * can be displayed.
     *
     * Specifies attributes and rule level for the Rule Entry dialog
     * based on the data given to this template.
     */
    'click .editRule': function() {
        // Get the current template data
        var data = Template.currentData();

        // Retrieve the rule attribtes and level (e.g. study / series / instance)
        var attributes = data.attributes;
        var level = data.level;

        // Get the properties of the current rule
        var rule = this;

        // Open the Rule Entry Dialog with the attributes, level, and rule
        openRuleEntryDialog(attributes, level, rule);
    },
    /**
     * Removes a rule from the current Viewport or Protocol depending on
     * the type of rule
     */
    'click .deleteRule': function() {
        // Get the properties of the current rule
        var rule = this;

        if (rule instanceof HP.ProtocolMatchingRule) {
            // If this Rule is evaluated at the protocol level,
            // remove it from the current Protocol
            ProtocolEngine.protocol.removeProtocolMatchingRule(rule);
        } else {
            // If this Rule is evaluated at the Viewport level,
            // remove it from the active viewport model
            var viewport = getActiveViewportModel();
            viewport.removeRule(rule);
        }

        // Instruct the Protocol Engine to update the Layout Manager with new data
        var viewportIndex = Session.get('activeViewport');
        ProtocolEngine.updateViewports(viewportIndex);
    },
    /**
     * Updates a Rule's weight in response to user input
     *
     * @param event The input change event
     */
    'change .ruleWeight': function(event) {
        // Get the properties of the current rule
        var rule = this;

        // Update the value of the rule weight
        rule.weight = $(event.currentTarget).val();

        // Instruct the Protocol Engine to update the Layout Manager with new data
        var viewportIndex = Session.get('activeViewport');
        ProtocolEngine.updateViewports(viewportIndex);
    },
    /**
     * Updates a Rule's 'required' property in response to user input
     *
     * @param event The input change event
     */
    'change .ruleRequired': function(event) {
        // Get the properties of the current rule
        var rule = this;

        // Update the value of the 'required' property
        rule.required = $(event.currentTarget).prop('checked');

        // Instruct the Protocol Engine to update the Layout Manager with new data
        var viewportIndex = Session.get('activeViewport');
        ProtocolEngine.updateViewports(viewportIndex);
    }
});
