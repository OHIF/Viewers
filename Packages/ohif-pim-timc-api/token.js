
const STRING = 'string';

/**
 * The Token object used by Connector instances for authenticated requests
 *
 * @param none
 */

export class Token {

    constructor(params) {
        this.type = null;
        this.expires = null;
        this.keys = {
            access: null,
            refresh: null
        }
        if (params) {
            this.initWithParams(params);
        }
    }

    /**
     * Initialize Token instance with dictionary values
     *
     * @param params Object {
     *      token_type: string,
     *      expires_in: number,
     *      access_token: string,
     *      refresh_token: string
     *  }
     */
    initWithParams(params) {
        if (params instanceof Object) {
            this.setType(params.token_type);
            this.setExpire(params.expires_in);
            this.setAccessKey(params.access_token);
            this.setRefreshKey(params.refresh_token);
        }
    }

    setType(type) {
        if (typeof type === STRING) {
            // capitalize type string
            this.type = type.replace( /^\s*([a-z])/, (m, s) => s.toUpperCase() );
        } else {
            this.type = null;
        }
    }

    getType() {
        return this.type;
    }

    setExpire(seconds) {
        var expires, milliseconds = +seconds * 1000;
        if (milliseconds > 0) {
            expires = new Date();
            expires.setTime(expires.getTime() + milliseconds);
            this.expires = expires;
        } else {
            this.expires = null;
        }
    }

    setAccessKey(key) {
        this.keys.access = typeof key === STRING ? key : null;
    }

    getAccessKey() {
        return this.keys.access;
    }

    setRefreshKey(key) {
        this.keys.refresh = typeof key === STRING ? key : null;
    }

    getRefreshKey() {
        return this.keys.refresh;
    }

    isValid() {
        var now = new Date();
        return (typeof this.type === STRING
                && this.type.length > 0
                && typeof this.keys.access === STRING
                && this.expires instanceof Date
                && this.expires.getTime() > now.getTime());
    }

}
