/** @jsx jsx */
/** @jsxFrag React.Fragment */
import React, { useState, useRef, useEffect } from 'react';
import classnames from 'classnames';

import { jsx } from 'theme-ui';
import { useMenus, useCurrentDoc } from 'docz';

import { NavSearch } from 'gatsby-theme-docz/src/components/NavSearch';
import { NavLink } from 'gatsby-theme-docz/src/components/NavLink';
import { NavGroup } from 'gatsby-theme-docz/src/components/NavGroup';

export const Sidebar = React.forwardRef((props, ref) => {
  const [query, setQuery] = useState('');
  const menus = useMenus({ query });
  const currentDoc = useCurrentDoc();
  const currentDocRef = useRef();
  const handleChange = ev => {
    setQuery(ev.target.value);
  };
  useEffect(() => {
    if (ref.current && currentDocRef.current) {
      ref.current.scrollTo(0, currentDocRef.current.offsetTop);
    }
  }, [ref]);

  return (
    <>
      {props.sidebarOpen && (
        <>
          <div className="block lg:hidden">
            <div
              onClick={() => props.onClick()}
              className="fixed top-81px z-10 left-0 w-full h-full bg-black opacity-80"
            />
          </div>
          <div
            ref={ref}
            data-testid="sidebar"
            className={classnames(
              'min-w-250px p-8 flex-col bg-white top-0 overflow-auto z-10 border-r border-gray-400 hidden fixed top-81px left-0 bottom-0 lg:block lg:sticky lg:h-screen lg:top-0'
            )}
            style={{ display: props.sidebarOpen ? 'block' : 'none' }}
          >
            <NavSearch
              placeholder="Type to search..."
              value={query}
              onChange={handleChange}
            />
            {menus &&
              menus.map(menu => {
                if (!menu.route)
                  return (
                    <NavGroup key={menu.id} item={menu} sidebarRef={ref} />
                  );
                if (menu.route === currentDoc.route) {
                  return (
                    <NavLink key={menu.id} item={menu} ref={currentDocRef}>
                      {menu.name}
                    </NavLink>
                  );
                }
                return (
                  <NavLink key={menu.id} item={menu}>
                    {menu.name}
                  </NavLink>
                );
              })}
          </div>
        </>
      )}
    </>
  );
});
