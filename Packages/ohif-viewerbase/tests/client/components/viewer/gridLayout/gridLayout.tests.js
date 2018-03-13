import { Template } from 'meteor/templating';
import '../../../../../client/components/viewer/gridLayout/gridLayout.html';
import '../../../../../client/components/viewer/gridLayout/gridLayout.js';
import { Session } from 'meteor/session';
import { sinon } from 'meteor/practicalmeteor:sinon';
chai.should();

describe('GridLayout', function() {
    describe('Helpers', function() {
        before(function() {
            Template.instance = function() {
                return {
                    data: {
                        rows: 2,
                        columns: 2,
                        viewportData: []
                    }
                }
            }
        });

        it('should get the height percentage of each viewport', function() {
            const percentage = Template.gridLayout.__helpers[' height']();

            percentage.should.be.eq(50);
        });

        it('should get the width percentage of each viewport', function() {
            const percentage = Template.gridLayout.__helpers[' height']();

            percentage.should.be.eq(50);
        });
    })

    after(function() {
        Meteor.sendCoverage(function() { });
    });

    // describe('Testing getClass() Helper', function () {
    //     it('should return priorDropdown', function () {
    //         Session.set('isPrior', true);
    //         Template.priorDropdown.__helpers.get('getClass')()
    //             .should.equal('priorDropdown');
    //     });

    //     it('should return empty string', function () {
    //         Session.set('isPrior', false);
    //         Template.priorDropdown.__helpers.get('getClass')()
    //             .should.equal('');
    //     });
    // });

    // describe('Testing dropdown change event', function () {

    //     let openPriorStudyWindowStub;
    //     let test;

    //     before(function () {

    //         Template.instance = function () { return { openPriorStudyWindow: sinon.spy() } };

    //         $.fn.select2 = function () {
    //             return [{
    //                 selectedIndex: 0,
    //                 options: [{
    //                     text: 'Attrial Septum'
    //                 }]
    //             }]
    //         };
    //     });

    //     it('should return priorDropdown', function () {
    //         Template.priorDropdown.fireEvent('change #studySelect');
    //         // TODO: spy is not working
    //     });
    // });
});