import { Component } from 'react';
import React from 'react';
//import PropTypes from 'prop-types';
import './ViewportOrientationMarkers.styl';

class ViewportOrientationMarkers extends Component {
    render() {
        return (
            <div class="viewportOrientationMarkers noselect">
                <div class="topMid orientationMarker">
                </div>
                <div class="leftMid orientationMarker">
                </div>
            </div>
        );
    }
};

export default ViewportOrientationMarkers;
