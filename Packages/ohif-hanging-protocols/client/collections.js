import { Meteor } from 'meteor/meteor';
import { comparators } from './lib/comparators';

MatchedProtocols = new Meteor.Collection(null);
MatchedProtocols._debugName = 'MatchedProtocols';

HangingProtocols = new Meteor.Collection(null);
HangingProtocols._debugName = 'HangingProtocols';

Comparators = new Meteor.Collection(null);
Comparators._debugName = 'Comparators';

comparators.forEach(item => {
    Comparators.insert(item);
});
