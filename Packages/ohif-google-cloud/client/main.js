import { Meteor } from 'meteor/meteor';

if (Meteor.settings.public.googleCloud) {
  import '../imports/index.js';
  import '../imports/client/index.js';
}
