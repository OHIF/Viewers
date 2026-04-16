function createTrustAwareServicesManager(
  servicesManager: AppTypes.ServicesManager,
  allowCredentials: boolean
) {
  if (allowCredentials) {
    return servicesManager;
  }

  const originalUserAuthenticationService = servicesManager.services.userAuthenticationService;
  const trustAwareUserAuthenticationService = Object.create(originalUserAuthenticationService);
  trustAwareUserAuthenticationService.getAuthorizationHeader = () => ({});

  return {
    ...servicesManager,
    services: {
      ...servicesManager.services,
      userAuthenticationService: trustAwareUserAuthenticationService,
    },
  };
}

export { createTrustAwareServicesManager };
