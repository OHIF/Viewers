/**
 * Global user information, to be replaced with a  specific version which
 * applies the methods.
 */
export let user = {
  userLoggedIn: (): boolean => false,
  getUserId: () => null,
  getName: () => null,
  getAccessToken: () => null,
  login: () => new Promise((resolve, reject) => reject()),
  logout: () => new Promise((resolve, reject) => reject()),
  getData: key => null,
  setData: (key, value) => null,
};

/**
 * Interface to clearly present the expected fields to linters when passing the user account
 * struct.
 */
export interface UserAccountInterface {
  userLoggedIn?: () => boolean;
  getUserId?: () => null;
  getName?: () => null;
  getAccessToken?: () => null;
  login?: () => Promise<any>;
  logout?: () => Promise<any>;
  getData?: (key: any) => null;
  setData?: (key: any, value: any) => null;
}

export default user;
