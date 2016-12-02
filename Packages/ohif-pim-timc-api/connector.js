import { HTTP } from 'meteor/http'
import { User } from './user';
import { Token } from './token';

const STRING = 'string';

/**
 * This class encapsulates all the logic necessary to send requests to TIMC Server.
 *
 * @param none
 */

export class Connector {

    static relativePath(path) {
        return typeof path === STRING ? path.replace(/^\/+|\/+$/g, '') : '';
    }

    static filterOptions(options) {
        var item,
            result = {},
            optionRegex = /^(content|data|query|params|headers|timeout)$/;
        if (options instanceof Object) {
            for (item in options) {
                if (optionRegex.test(item)) {
                    result[item] = options[item];
                }
            }
        }
        return result;
    }

    constructor(params) {
        this.protocol = 'http'; // default
        this.host = null;
        this.user = null;
        this.token = null;
        this.baseURL = null;
        if (params) {
            this.initWithParams(params);
        }
    }

    initWithParams(params) {
        if (params instanceof Object) {
            this.protocol = params.protocol || this.protocol;
            this.host = params.host || this.host;
            if (params.user) {
                this.setUser(params.user);
            }
            if (params.token) {
                this.setToken(params.token);
            }
            // invalidate baseURL instance variable in case any parameter has changed...
            this.baseURL = null;
        }
    }

    setToken(token) {
        this.token = token instanceof Token ? token : null;
    }

    setUser(user) {
        this.user = user instanceof User ? user : null;
    }

    getUser() {
        return this.user;
    }

    isValid() {
        var protocolRegex = /^https?$/i,
            hostRegex = /^[\w\.\-]+(?:\:\d+)?$/;
        return (typeof this.protocol === STRING
                && protocolRegex.test(this.protocol)
                && typeof this.host === STRING
                && hostRegex.test(this.host));
    }

    getBaseURL() {
        // lazy initialization of baseURL
        if (typeof this.baseURL !== STRING && this.isValid()) {
            this.baseURL = this.protocol.toLowerCase() + '://' + this.host.toLowerCase();
        }
        return this.baseURL;
    }

    request(method, path, options) {
        return new Promise((resolve, reject) => {

            var opts, auth, url = this.getBaseURL();

            if (typeof url !== STRING || url.length < 8) { // 8 is the minimun... http://a :)
                reject({
                    name: 'INVALID_CONNECTOR_STATE',
                    message: 'Invalid Connector State'
                });
                return;
            }

            // with isAuthRequired set to FALSE (as in "authenticate()" method),
            // ... this whole code section will never be executed.
            if (options && options.isAuthRequired) {
                if (this.token && this.token.isValid()) {
                    // if a token is available, add it to request header
                    auth = this.token.getType() + ' ' + this.token.getAccessKey();
                    if (options.headers instanceof Object) {
                        options.headers['Authorization'] = auth;
                    } else {
                        options.headers = { 'Authorization': auth };
                    }
                } else {
                    // last resort in order to prevent loops...
                    // ... if this one does not work: BOOM!
                    if (options.isAuthLoop) {
                        reject({
                            name: 'AUTH_LOOP_DETECTED',
                            message: 'Authentication loop detected and prevented. For some reason, the auth token has been invalidated.'
                        });
                    } else {
                        // call "authenticate()" method which itself calls this very method AGAIN!
                        // ... Exactly! It will call "request()" method AGAIN!
                        // ... We need all these conditionals to prevent authenctication loops!
                        this.authenticate().then((success) => {
                            // retry request
                            if (success) {
                                // last resort on preventing infinite auth loops...
                                // ... with this aditional option set this branch will
                                // ... never be executed! =)
                                options.isAuthLoop = true;
                                this.request(method, path, options).then(resolve).catch(reject);
                            } else {
                                reject({
                                    name: 'AUTH_UNEXPECTED_RESULT',
                                    message: 'Authentication returned an unexpected result.'
                                });
                            }
                        }).catch(reject);
                    }
                    return;
                }
            }

            // create fully qualified url
            url += '/' + this.constructor.relativePath(path);
            opts = this.constructor.filterOptions(options);

            // execute HTTP request
            HTTP.call(method, url, opts, function (error, result) {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });

        });
    }

    /**
     * If current instance does not have a valid access token, one requested...
     *
     * @param none
     */
    authenticate() {
        return new Promise((resolve, reject) => {

            var user = this.getUser();

            if (!(user instanceof User) || !user.isValid()) {
                reject({
                    name: 'AUTH_INVALID_USER',
                    message: 'Authentication process cannot continue without a valid user.'
                });
                return;
            }

            // send API request
            this.request('POST', 'api/v1/tokens', {
                // Important! In order to prevent infinite loops, this must be set to FALSE!
                isAuthRequired: false,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                params: {
                    client_id: 'TIMC',
                    grant_type: 'password',
                    username: user.getName(),
                    password: user.getPassword()
                }
            }).then((result) => {
                var error, token;
                if (result instanceof Object && result.data instanceof Object) {
                    token = new Token(result.data);
                    if (token.isValid()) {
                        this.setToken(token);
                    } else {
                        error = {
                            name: 'AUTH_INVALID_TOKEN',
                            message: 'Authentication request returned an invalid token.'
                        };
                    }
                } else {
                    error = {
                        name: 'AUTH_INVALID_RESPONSE',
                        message: 'Authentication request returned an invalid response.'
                    };
                }
                if (error) {
                    reject(error);
                } else {
                    // passing true here is important...
                    resolve(true);
                }
            }).catch(reject);

        });
    }

}
