import { Component } from 'react';
import React from 'react';
//import PropTypes from 'prop-types';
import './ViewportOrientationMarkers.styl';

class ViewportOrientationMarkers extends Component {
    render() {
        return (
            <div className="viewportOrientationMarkers noselect">
                <div className="topMid orientationMarker">
                </div>
                <div className="leftMid orientationMarker">
                </div>
            </div>
        );
    }
};

export default ViewportOrientationMarkers;
