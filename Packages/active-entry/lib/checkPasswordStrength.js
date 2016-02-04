passwordValidationSettings = {};
var ActiveEntryConfiguration;
Meteor.startup(function() {
    ActiveEntryConfiguration = Session.get('Photonic.ActiveEntry');
    var showPasswordStrengthIndicator = (ActiveEntryConfiguration && ActiveEntryConfiguration.passwordOptions && ActiveEntryConfiguration.passwordOptions.showPasswordStrengthIndicator || false);
    passwordValidationSettings.requireStrongPasswords = (ActiveEntryConfiguration && ActiveEntryConfiguration.passwordOptions && ActiveEntryConfiguration.passwordOptions.requireStrongPasswords || false);
    passwordValidationSettings.showPasswordStrengthIndicator = showPasswordStrengthIndicator;

    passwordValidationSettings.pwstrengthOptions = {
        common: {
            minChar: 8,
            zxcvbn: showPasswordStrengthIndicator
        },
        ui: {
            showVerdictsInsideProgressBar: true,
            showStatus: true
        },
        rules: {
            activated: {
                wordNotEmail: true,
                wordTwoCharacterClasses: true,
                wordRepetitions: true
            }
        }
    };
});

// Check Password Strength: at least 8 characters in length and contain at least 1 uppercase, 1 lowercase and 1 number and 1 special character
checkPasswordStrength = function(password) {
    var iszxcvbnActive = (ActiveEntryConfiguration && ActiveEntryConfiguration.passwordOptions && ActiveEntryConfiguration.passwordOptions.showPasswordStrengthIndicator || false);
    if (iszxcvbnActive) {
        // Check zxcvbn rule
        var zxcvbnResult = zxcvbn(password);
        if (zxcvbnResult.score > 2) {
            return true;
        }
    } else{
        // Apply validation rule
        var result = password.search(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])[0-9a-zA-Z!@#$%^&*]{8,}$/i);
        if (result > -1) {
            return true;
        }
    }

    return false;
};