import { Session } from 'meteor/session';
import { Router } from 'meteor/iron:router';

Router.configure({
    layoutTemplate: 'layout',
    loadingTemplate: 'layout'
});

Router.onBeforeAction('loading');
Router.onBeforeAction(function() {
    this.next();
});

Router.route('/', function() {
    this.render('ohifViewer');
});

Router.route('/viewer/:_id', {
    layoutTemplate: 'layout',
    name: 'viewer',
    onBeforeAction: function() {
        var studyInstanceUid = this.params._id;

        this.render('ohifViewer', {
            data: function() {
                return {
                    studyInstanceUid: studyInstanceUid
                };
            }
        });
    }
});
