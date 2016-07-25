export { OHIF } from './ohif.js';

import { Meteor } from 'meteor/meteor';
import { Router } from 'meteor/clinical:router';

import './lib';
import './components';
import './helpers';
import './ui';

Router.route('/playground', function() {
    this.render('componentPlayground');
});
