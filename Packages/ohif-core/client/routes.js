import { Router } from 'meteor/clinical:router';

Router.route('/playground', function() {
    this.render('componentPlayground');
});
