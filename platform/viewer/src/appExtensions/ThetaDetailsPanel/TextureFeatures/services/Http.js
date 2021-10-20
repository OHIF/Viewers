import axios from 'axios';

const url = 'https://radcadapi.thetatech.ai';

const HTTP = props => {
  console.log({ UserProps: props.user });

  const Http = axios.create({
    baseURL: url,
    timeout: 90000,
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  Http.interceptors.request.use(config => {
    config.headers.Authorization = `Bearer ${localStorage.access_token}`;
    return config;
  });
};

const mapStateToProps = state => {
  return {
    user: state.oidc.user,
  };
};

const ConnectedHTTP = connect(
  mapStateToProps,
  null
)(HTTP);

export default ConnectedHTTP;
