import React from "react";
import { Link, useLocation } from "react-router-dom";
import style from "./SideNav.module.css";

const SideNav = ({ onLogout }) => {
  const location = useLocation();

  return (
    <nav className={style.sideNav}>
      <div className={style.sideNavLogo}>Instagram</div>

      <div className={style.navLinks}>
        <Link
          to="/home"
          className={`${style.navItem} ${
            location.pathname === "/home" ? style.active : ""
          }`}
        >
          <span className={style.navIcon}>🏠</span> Home
        </Link>

        <Link
          to="/albums"
          className={`${style.navItem} ${
            location.pathname === "/albums" ? style.active : ""
          }`}
        >
          <span className={style.navIcon}>🖼️</span> Albums
        </Link>

        <Link
          to="/TODO"
          className={`${style.navItem} ${
            location.pathname === "/TODO" ? style.active : ""
          }`}
        >
          <span className={style.navIcon}>✅</span> TODO
        </Link>

        <Link
          to="/my-posts"
          className={`${style.navItem} ${
            location.pathname === "/my-posts" ? style.active : ""
          }`}
        >
          <span className={style.navIcon}>📝</span> My Posts
        </Link>
      </div>

      <Link
        to="/Info"
        className={`${style.navItem} ${
          location.pathname === "/Info" ? style.active : ""
        }`}
      >
        <span className={style.navIcon}>ℹ️</span> Info
      </Link>

      <div className={style.logoutSection}>
        <button onClick={onLogout} className={style.logoutButton}>
          <span className={style.navIcon}>🚪</span> Logout
        </button>
      </div>
    </nav>
  );
};

export default SideNav;
