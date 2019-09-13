import { Meteor } from 'meteor/meteor';
import {HTTP} from 'meteor/http';

const POLL_INTERVAL = 15000;
const REST_URL = 'http://localhost:8080/pipelines';

Meteor.publish('pipelines-publication', function () {
    const publishedKeys = [];

    const poll = () => {

        HTTP.get(REST_URL, {
            headers: {
                Accept: 'application/json;charset=UTF-8'
            }
        }, (error, result) => {
            if (!error) {
                result.data._embedded.pipelineEntityList.forEach((pipeline) => {

                    if (publishedKeys[pipeline.id]) {
                        this.changed("Pipelines", pipeline.id, pipeline);
                    } else {
                        publishedKeys[pipeline.id] = true;
                        this.added("Pipelines", pipeline.id, pipeline);
                    }
                });

                publishedKeys.map((value, key) => {
                    if (!result.data._embedded.pipelineEntityList.map(pipeline => pipeline.id).includes(key)) {
                        debugger;
                        this.removed("Pipelines", key);
                    }
                });
                this.ready();
            }
        });
    };
    poll();

    const interval = Meteor.setInterval(poll, POLL_INTERVAL);

    this.onStop(() => {
        Meteor.clearInterval(interval);
    });
});
