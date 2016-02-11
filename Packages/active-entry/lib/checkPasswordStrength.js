passwordValidationSettings = {};

function getPasswordValidationSettings () {
    var ActiveEntryConfiguration = Session.get('Photonic.ActiveEntry');
    var validationSettings = {};

    validationSettings.showPasswordStrengthIndicator =  ActiveEntryConfiguration && ActiveEntryConfiguration.passwordOptions && ActiveEntryConfiguration.passwordOptions.showPasswordStrengthIndicator || false;
    validationSettings.requireRegexValidation =  ActiveEntryConfiguration && ActiveEntryConfiguration.passwordOptions && ActiveEntryConfiguration.passwordOptions.requireRegexValidation || false;

    if (validationSettings.showPasswordStrengthIndicator) {
        // Set password strength meter options
        validationSettings.pwstrengthOptions = {
            common: {
                minChar: 8
            },
            ui: {
                showVerdictsInsideProgressBar: true,
                showStatus: true
            }
        };
    }

    // Check if codetheweb:zxcvbn is defined
    if (typeof(zxcvbn) === typeof(Function)) {
        validationSettings.requireStrongPasswords =  ActiveEntryConfiguration && ActiveEntryConfiguration.passwordOptions && ActiveEntryConfiguration.passwordOptions.requireStrongPasswords || false;
        // Set zxcvbn in pw strength meter
        if (validationSettings.showPasswordStrengthIndicator) {
            validationSettings.pwstrengthOptions.common.zxcvbn = passwordValidationSettings.requireStrongPasswords;
        }
    }

    return validationSettings;
}

Meteor.startup(function() {
    passwordValidationSettings = getPasswordValidationSettings();
});

checkPasswordStrength = function(password) {
    if (passwordValidationSettings.requireStrongPasswords) {
        // Check zxcvbn
        var zxcvbnResult = zxcvbn(password);
        if (zxcvbnResult && zxcvbnResult.score > 2) {
            return true;
        }

        return false;
    } else if (passwordValidationSettings.requireRegexValidation) {
        // Apply validation rule
        var result = password.search(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])[0-9a-zA-Z!@#$%^&*]{8,}$/i);
        if (result > -1) {
            return true;
        }

        return false;
    }

    return true;
};