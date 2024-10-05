const apiEndpoints = {
  auth: {
    // User Invitation and Signup
    requestEmailUserInvite: () => '/auth/request-email-user-invite/',
    getUserDataFromInviteToken: () => '/auth/get-user-data-from-invite-token/',
    signupUsingInviteToken: () => '/auth/signup-using-invite-token/',

    // Password Reset
    requestPasswordResetViaEmail: () => '/auth/request-password-reset-via-email/',
    getUserDataFromPasswordResetToken: () => '/auth/get-user-data-from-password-reset-token/',
    resetPasswordUsingPasswordResetToken: () => '/auth/reset-password-using-password-reset-token/',

    // Access and Refresh Tokens
    obtainAuthTokenPair: () => '/auth/login/',
    refreshAccessToken: () => '/auth/token/refresh/',
    blacklistRefreshToken: () => '/auth/logout/',

    getFoo: () => '/auth/get-foo/',
  },
};

export default apiEndpoints;
