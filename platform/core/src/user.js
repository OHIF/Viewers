// These should be overridden by the implementation
let user = {
  userLoggedIn: () => false,
  getUserId: () => null,
  getName: () => null,
  getAccessToken: () => null,
  login: () => new Promise((resolve, reject) => reject()),
  logout: () => new Promise((resolve, reject) => reject()),
  getData: key => null,
  setData: (key, value) => null,
};

export default user;
