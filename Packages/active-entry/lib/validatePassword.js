pwstrengthOptions = {
    common: {
        minChar: 8,
        zxcvbn: true
    },
    ui: {
        showVerdictsInsideProgressBar: true,
        showStatus: true
    }
};

// Validate Password: at least 8 characters in length and contain at least 1 uppercase, 1 lowercase and 1 number and 1 special character
validatePassword = function(password) {
    var result = password.search(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])[0-9a-zA-Z!@#$%^&*]{8,}$/i);
    if (result > -1) {
       return true;
    }
    return false;
};