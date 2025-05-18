// the side navigation bar
// this component is used in every internal page
// it purpose is to provide a navigation bar for the user to navigate through the application
// taking the navigation logic and code out of the main component
// and putting it in a separate component

// the general structure of the side navigation bar is as follows:
// it will be located on the left side of the page
// it will have a main area for the main navigation
// which includes :
// the albums , the posts , the main page  and the TODO items
// and a secondary area for the secondary navigation
// which includes:
// the logout and the Info



import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import style from './SideNev.module.css';

const SideNav = ({ onLogout }) => {
  const location = useLocation();
  
  return (
    <nav className={style.sideNav}>
      <div className={style.sideNavLogo}>
        Instagram
      </div>
      
      <div className={style.navLinks}>
        <Link to="/" className={`${style.navItem} ${location.pathname === '/' ? style.active : ''}`}>
          <span className={style.navIcon}>🏠</span> Home
        </Link>
        
        <Link to="/posts" className={`${style.navItem} ${location.pathname === '/posts' ? style.active : ''}`}>
          <span className={style.navIcon}>📸</span> Posts
        </Link>
        
        <Link to="/albums" className={`${style.navItem} ${location.pathname === '/albums' ? style.active : ''}`}>
          <span className={style.navIcon}>🖼️</span> Albums
        </Link>
      </div>
      
      <div className={style.logoutSection}>
        <button onClick={onLogout} className={style.logoutButton}>
          <span className={style.navIcon}>🚪</span> Logout
        </button>
      </div>
    </nav>
  );
};

export default SideNav;