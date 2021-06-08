import * as React from 'react';
import { StaticQuery, graphql, Link } from "gatsby"
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
          <Navigation />
          {/* RIGHT - Main */}
          <main
            style={{
              padding: '0 32px'
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

function Navigation() {
  return(<StaticQuery
    query={graphql`
      query {
        allMdx {
          edges {
            node {
              id
              slug
              frontmatter {
                title
              }
            }
          }
        }
      }
    `}
    render={data => (
      <nav style={{ minWidth: '180px', maxWidth: '180px' }}>
        <ul>
          {data.allMdx.edges.map(edge => {
            const lnk = edge.node;
            const title = lnk.frontmatter.title || lnk.slug;

            return (
              <li>
                <Link to={`/${lnk.slug}`}>{title}</Link>
              </li>
            );
          })}
        </ul>
      </nav>
    )}
  />)
}
export default DefaultPageLayout;
