function EffectController(c, t, o, p) {
    this.setColor(c);
    this.setTransparent(t);
    this.setOpacity(o);
    this.setPosition(p);

    return this;
}

Object.assign(EffectController.prototype, {
    color: 0, transparent: false, opacity: 1.0, position: 1,

    getColor: function () {
        return this.color;
    },

    setColor: function (c) {
        this.color = c;
    },

    getTransparent: function () {
        return this.transparent;
    },

    setTransparent: function (t) {
        this.transparent = t;
    },

    getOpacity: function () {
        return this.opacity;
    },

    setOpacity: function (o) {
        this.opacity = o;
    },

    getPosition: function () {
        return this.position;
    },

    setPosition: function (p) {
        this.position = p;
    },

    copy: function (ec) {
        this.setColor(ec.getColor());
        this.setTransparent(ec.getTransparent());
        this.setOpacity(ec.getOpacity());
        this.setPosition(ec.getPosition());
    }
});

export { EffectController };