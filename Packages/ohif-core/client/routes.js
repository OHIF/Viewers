import { Router } from 'meteor/iron:router';

Router.route('/playground', function() {
    this.render('componentPlayground');
});
