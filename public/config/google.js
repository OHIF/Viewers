window.config = {
  routerBasename: '/',
  relativeWebWorkerScriptsPath: '',
  enableGoogleCloudAdapter: true,
  servers: {
    // This is an array, but we'll only use the first entry for now
    dicomWeb: [],
  },
  // This is an array, but we'll only use the first entry for now
  oidc: [
    {
      // ~ REQUIRED
      // Authorization Server URL
      authority: 'https://accounts.google.com',
      client_id: 'YOURCLIENTID.apps.googleusercontent.com',
      redirect_uri: '/callback', // `OHIFStandaloneViewer.js`
      response_type: 'id_token token',
      scope: 'email profile openid https://www.googleapis.com/auth/cloudplatformprojects.readonly https://www.googleapis.com/auth/cloud-healthcare', // email profile openid
      // ~ OPTIONAL
      post_logout_redirect_uri: '/logout-redirect.html',
      revoke_uri: 'https://accounts.google.com/o/oauth2/revoke?token=',
      automaticSilentRenew: true,
      revokeAccessTokenOnSignout: true,
      metadata: {
        issuer: "https://accounts.google.com",
        authorization_endpoint: "https://accounts.google.com/o/oauth2/v2/auth",
        token_endpoint: "https://www.googleapis.com/oauth2/v4/token",
        userinfo_endpoint: "https://www.googleapis.com/oauth2/v3/userinfo",
        jwks_uri: "https://www.googleapis.com/oauth2/v3/certs",
      },
      signingKeys: [
        {
          "kid": "6e5508d27965ad7907c232212defa48ed763727e",
          "e": "AQAB",
          "kty": "RSA",
          "alg": "RS256",
          "n": "vOsmJlsBscTxCcOLa6IfCuUnvXI5cBC-o-NIDC1R5O782U_BC67p9dtMLL2UHpQ1wj_b6I4R8cHzddPrPDZ7eTKJw5q18pZU4B5hCmFe9A0JvzyQe3VFPYhKSI5LV_6UIwWdGWjJic8tCJ05AJaVOogSUCn17ss_8KQHSbs66zVbwls9p_ObdHGuzLQE-Y-fkxO5aD9S09DB5dNKuZNL76wgZAhc-HEyo1HkTbDaGAPCk-EpoqfjjoPY2FZGHg5QRCUMdxnYoebjzyO6oaJ8yVniVpOkf-MNF6HltRBbOzE3u6Y2VGjWoj_W0AUidrLC_KQ57URkcAfk1BhMUVJekQ",
          "use": "sig"
        },
        {
          "use": "sig",
          "kid": "84f294c45160088d079fee68138f52133d3e228c",
          "e": "AQAB",
          "kty": "RSA",
          "alg": "RS256",
          "n": "iyzj9wpDDZLCbgbr2zKv3bs8zqjflcVEd7PYMjKGYpoaY2LdqfjFxrwTqd9Ea4m3NIR2giOx9JLQhtqqSSpBJpBBpHmaEd2FCPwd4GQTKJurEP6Ho9HWAuRTMhs8W04pd__HQ0Bc22AEamieGLtzcYfIaAc9g5RCxZdRVbGK0Z0vSOAwN1PC_S76nWGphouHukU40EiwjqC-D9G2xYFbKNb0_NJMxJ5UCenN85FjEii5-oW0wCBmt_1Sr76Q_e0INxfGu6dRf0vGXPvqxkINz2knjl9ec2SvOK2hnmRN4O9zToKH70_DBrsZE0ePDScTOWPHJU2wOyE6gzkL6FdaFQ"
        }
      ]
    },
  ],
}
