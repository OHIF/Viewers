import { Meteor } from 'meteor/meteor';

Meteor.startup(function() {
    var debug = false;

    if (debug === true) {
        // http://www.meteorpedia.com/read/Debugging_Reactivity

        Meteor.autorun(function(computation) {
            computation.onInvalidate(function() {
                console.trace();
            });
        });

        var wrappedFind = Meteor.Collection.prototype.find;

        Meteor.Collection.prototype.find = function() {
            var cursor = wrappedFind.apply(this, arguments);
            var collectionName = this._name || this._debugName;

            /*cursor.observeChanges({
                added: function(id, fields) {
                    console.log(collectionName, 'added', id, fields);
                },
                changed: function(id, fields) {
                    console.log(collectionName, 'changed', id, fields);
                },
                movedBefore: function(id, before) {
                 console.log(collectionName, 'movedBefore', id, before);
                 },
                removed: function(id) {
                    console.log(collectionName, 'removed', id);
                }
            });*/

            cursor.observe({
                added: function(data) {
                    console.log(collectionName, 'added', data);
                },
                changed: function(data) {
                    console.log(collectionName, 'changed', data);
                },
                removed: function(data) {
                    console.log(collectionName, 'removed', data);
                }
            });

            return cursor;
        };

        function logRenders() {
            Object.keys(Template).forEach(function(name) {
                if (name.indexOf('_') > -1) {
                    return;
                }

                var template = Template[name];
                var oldRender = template.rendered;
                var counter = 0;

                template.rendered = function() {
                    console.log(name, 'render count: ', ++counter);
                    oldRender && oldRender.apply(this, arguments);
                };
            });
        }

        logRenders();
    }
});
