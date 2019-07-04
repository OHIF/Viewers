import React from 'react';
import './NotFound.css';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className={'not-found'}>
      <div>
        <h4>Sorry, this page does not exist.</h4>
        <h5>
          <Link to={'/'}>Go back to the Study List</Link>
        </h5>
      </div>
    </div>
  );
}
