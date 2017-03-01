import { Meteor } from 'meteor/meteor';
import { comparators } from '../both/lib/comparators';

MatchedProtocols = new Meteor.Collection(null);
MatchedProtocols._debugName = 'MatchedProtocols';

Comparators = new Meteor.Collection(null);
Comparators._debugName = 'Comparators';

comparators.forEach(item => {
    Comparators.insert(item);
});
