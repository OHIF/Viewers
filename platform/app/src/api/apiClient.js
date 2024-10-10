import apiEndpoints from './apiEndpoints.js';
import axiosInstance from './axiosInstance.js';

class APIClient {
  constructor() {
    this.requestMethods = {
      GET: axiosInstance.get,
      POST: axiosInstance.post,
      PUT: axiosInstance.put,
      PATCH: axiosInstance.patch,
      DELETE: axiosInstance.delete,
    };

    this.badResponse = {
      success: false,
      error: {
        user_friendly_message: 'Server Error.',
      },
    };

    this.tokens = {
      access: '',
      refresh: '',
    };
  }

  async refreshAccessToken() {}

  async makeRequest(method, url, body = {}, headers = {}, addAuth = false) {
    console.log(url);

    if (addAuth) {
      // Refresh Access token if required
      // Add Auth header

      const accessToken = localStorage.getItem('accessToken');
      console.log('access token: ', accessToken);
      headers.Authorization = `Bearer ${accessToken}`;
    }
    console.log('made it here', headers);
    // try {
    console.log('--------------');
    console.log('');
    console.log('');
    console.log('url');
    console.log(url);
    console.log('headers');
    console.log(headers);
    console.log('body');
    console.log(body);
    console.log('');
    console.log('');
    console.log('--------------');
    const response = await this.requestMethods[method](url, body, headers);
    const responseData = await response.data;
    return responseData;
    // } catch (error) {
    //   if (!error.response) {
    //     return this.badResponse;
    //   }

    //   const contentType = error.response.headers['content-type'];
    //   if (!contentType || !contentType.includes('application/json')) {
    //     return this.badResponse;
    //   }

    //   const errorResponseData = await error.response.data;

    //   console.log(errorResponseData);

    //   if (errorResponseData['success'] === undefined) {
    //     const responseData = {
    //       success: false,
    //       error: errorResponseData,
    //     };
    //     return responseData;
    //   }

    //   return errorResponseData;
    // }
  }

  async requestEmailUserInvite(email) {
    const requestBody = {
      email: email,
    };

    return await this.makeRequest('POST', apiEndpoints.auth.requestEmailUserInvite(), requestBody);
  }

  async getUserDataFromInviteToken(inviteToken) {
    const requestBody = {
      token: inviteToken,
    };

    return await this.makeRequest(
      'POST',
      apiEndpoints.auth.getUserDataFromInviteToken(),
      requestBody
    );
  }

  async signupUsingInviteToken(inviteToken, email, fullName, password) {
    const requestBody = {
      token: inviteToken,
      email: email,
      full_name: fullName,
      password: password,
    };

    return await this.makeRequest('POST', apiEndpoints.auth.signupUsingInviteToken(), requestBody);
  }

  async requestPasswordResetViaEmail(email) {
    const requestBody = {
      email: email,
    };

    return await this.makeRequest(
      'POST',
      apiEndpoints.auth.requestPasswordResetViaEmail(),
      requestBody
    );
  }

  async getUserDataFromPasswordResetToken(passwordResetToken) {
    const requestBody = {
      token: passwordResetToken,
    };

    return await this.makeRequest(
      'POST',
      apiEndpoints.auth.getUserDataFromPasswordResetToken(),
      requestBody
    );
  }

  async resetPasswordUsingPasswordResetToken(passwordResetToken, email, newPassword) {
    const requestBody = {
      token: passwordResetToken,
      email: email,
      new_password: newPassword,
    };

    return await this.makeRequest(
      'PATCH',
      apiEndpoints.auth.resetPasswordUsingPasswordResetToken(),
      requestBody
    );
  }

  async obtainAuthTokenPair(email, password) {
    console.log('obtainTokenPair called');
    const requestBody = {
      email: email,
      password: password,
    };

    const responseData = await this.makeRequest(
      'POST',
      apiEndpoints.auth.obtainAuthTokenPair(),
      requestBody
    );

    console.log(responseData);

    if (!responseData.refresh || !responseData.access) {
      return {
        success: false,
        error: {
          user_friendly_message: 'No account found with the provided credentials.',
        },
      };
    }

    const updatedResponseData = {
      success: true,
      result: {
        tokens: responseData,
      },
    };
    return updatedResponseData;
  }

  async blacklistRefreshToken() {
    const refreshToken = JSON.parse(localStorage.getItem('tokens')).refresh;
    const requestBody = {
      token: refreshToken,
    };

    const responseData = await this.makeRequest(
      'POST',
      apiEndpoints.auth.blacklistRefreshToken(),
      requestBody
    );

    localStorage.clear();

    return responseData;
  }

  async getFoo() {
    const responseData = await this.makeRequest('GET', apiEndpoints.auth.getFoo(), {}, {}, true);

    return responseData;
  }
}

const apiClient = new APIClient();
export default apiClient;
