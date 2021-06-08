import * as React from 'react';
import Header from './Header.js';
import './default-page-layout.scss';

function DefaultPageLayout ({ children, ...rest }) {
  return (
    <>
      <Header />
      <div style={{ marginTop: '40px' }}>
        <main className="container">
          {children}
        </main>
      </div>
      <footer>
        Footer
      </footer>
    </>
  )
}

export default DefaultPageLayout;
