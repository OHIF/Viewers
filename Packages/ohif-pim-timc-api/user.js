
const STRING = 'string';

export class User {

    constructor(params) {
        this.name = null;
        this.password = null;
        if (params) {
            this.initWithParams(params);
        }
    }

    initWithParams(params) {
        if (params instanceof Object) {
            this.setName(params.name);
            this.setPassword(params.password);
        }
    }

    setName(name) {
        this.name = typeof name === STRING && name.length > 0 ? name : null;
    }

    setPassword(password) {
        this.password = typeof password === STRING && password.length > 0 ? password : null;
    }

    getName() {
        return this.name;
    }

    getPassword() {
        return this.password;
    }

    isValid() {
        return (typeof this.name === STRING
                && this.name.length > 0
                && typeof this.password === STRING
                && this.password.length > 0);
    }

}
