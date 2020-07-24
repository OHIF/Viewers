import { connect } from 'react-redux';

function ReduxOIDCClientToUserAuthenticationService({service, user}) {
  if (!user) {
    console.warn('User not set yet...');
    return null;
  }

  console.warn('Updating UserAuthenticationService from Redux');

  service.setUser(user);

  const getAuthorizationHeader = () => {
    return {
      Authorization: `Bearer ${user.access_token}`
    };
  }

  service.setServiceImplementation({
    getAuthorizationHeader
  });

  return null;
}

const mapStateToProps = state => {
  return {
    user: state.user,
  };
};

const ConnectedOidcClientToUserAuthenticationService = connect(
  mapStateToProps,
  null
)(ReduxOIDCClientToUserAuthenticationService);

export default ConnectedOidcClientToUserAuthenticationService;
