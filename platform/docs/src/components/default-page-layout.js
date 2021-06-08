import * as React from 'react';
import Header from './header.js';
import Footer from './footer.js';
import './default-page-layout.scss';

function DefaultPageLayout ({ children, ...rest }) {
  return (
    <>
      <Header />

      {/* POSITIONING */}
      <div className="container" style={{ marginTop: '40px' }}>
        {/* LAYOUT */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
        }}>
          {/* LEFT - Nav */}
          <nav style={{ width: '180px' }}
          >

          </nav>
          {/* RIGHT - Main */}
          <main
            style={{
              padding: '8px'
            }}
          >
            {children}
          </main>
        </div>
      </div>

      <Footer />
    </>
  )
}

export default DefaultPageLayout;
