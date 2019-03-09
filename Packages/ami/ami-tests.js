// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by ami.js.
import { THREE, AMI } from "meteor/gtajesgenga:ami";

// Write your tests here!
// Here is an example.
Tinytest.add('ami - example', function (test) {
  console.log(THREE);
  console.log(AMI);
});
