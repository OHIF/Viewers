/*!
 * transition-to-from-auto 0.5.2
 * https://github.com/75lb/transition-to-from-auto
 * Copyright 2015 Lloyd Brookes <75pound@gmail.com>
 */

/**
@module
@alias transition
*/
(function(window, document){
    "use strict";

    var getComputedStyle = window.getComputedStyle;
    var isTransition = "data-ttfaInTransition";

    var elements = [];
    var data = [];

    // Transition detecting
    var transitionProp = false;
    var transitionEnd = false;
    var testStyle = document.createElement("a").style;
    var testProp;

    if(testStyle[testProp = "webkitTransition"] !== undefined) {
        transitionProp = testProp;
        transitionEnd = testProp + "End";
    }

    if(testStyle[testProp = "transition"] !== undefined) {
        transitionProp = testProp;
        transitionEnd = testProp + "end";
    }

    function process(options, data) {
        var el = options.element;
        var val = options.val;
        var prop = options.prop;
        var style = el.style;
        var startVal;
        var autoVal;

        if(!transitionProp) {
            return style[prop] = val;
        }

        if(el.hasAttribute(isTransition)) {
            el.removeEventListener(transitionEnd, data.l);
        } else {
            style[transitionProp] = "none";

            startVal = getComputedStyle(el)[prop];
            style[prop] = "auto";
            autoVal = getComputedStyle(el)[prop];

            // Interrupt
            if(startVal === val || val === "auto" && startVal === autoVal) {
                return;
            }

            data.auto = autoVal;
            el.setAttribute(isTransition, 1);

            // Transition
            style[prop] = startVal;
            el.offsetWidth;
            style[transitionProp] = options.style;
        }

        style[prop] = val === "auto" ? data.auto : val;

        data.l = function (e) {
            if(e.propertyName === prop) {
                el.removeAttribute(isTransition);
                el.removeEventListener(transitionEnd, data.l);
                if(val === "auto") {
                    /* avoid transition flashes in Safari */
                    style[transitionProp] = "none";
                    style[prop] = val;
                }
            }
        };

        el.addEventListener(transitionEnd, data.l);
    }

    /**
    @param options {Object}
    @param options.element {string | element} - The DOM element or selector to transition
    @param options.val {string} - The value you want to transition to
    @param [options.prop] {string} - The CSS property to transition, defaults to `"height"`
    @param [options.style] {string} - The desired value for the `transition` CSS property (e.g. `"height 1s"`). If specified, this value is added inline and will override your CSS. Leave this value blank if you already have it defined in your stylesheet.
    @alias module:transition-to-from-auto
    */
    function transition(options){
        var element = options.element;
        var datum;
        var index;

        if(typeof element === "string") {
            element = document.querySelector(element);
        }

        element = options.element = element instanceof Node ? element : false;
        options.prop = options.prop || "height";
        options.style = options.style || "";

        if(element) {
            index = elements.indexOf(element);
            if(~index) {
                datum = data[index];
            } else {
                datum = {};
                elements.push(element);
                data.push(datum);
            }

            process(options, datum);
        }
    }

    /**
    The name of the vendor-specific transition CSS property
    @type {string}
    @example
    el.style[transition.prop + 'Duration'] = '1s';
    */
    transition.prop = transitionProp;

    /**
    * The name of the [transition end event](https://developer.mozilla.org/en-US/docs/Web/Events/transitionend) in the current browser (typically `"transitionend"` or `"webkitTransitionEnd"`)
    * @type {string}
    * @example
    * el.addEventListener(transition.end, function(){
    *     // the transition ended..
    * });
    */
    transition.end = transitionEnd;


    if (typeof module === "object" && module.exports){
        module.exports = transition;
    } else if (typeof define === "function" && define.amd){
        define(function(){
            return transition;
        });
    } else {
        window.transition = transition;
    }
})(window, document);
