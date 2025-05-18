import React from "react";
import style from "./HomePage.module.css";

const HomePage = () => {
  return (
    <div className={style.homePage}>
      <h1 className={style.heading}>Welcome to Instagram Clone</h1>
      <div className={style.feedContainer}>
        {/* Your feed content will go here */}
        <p>This is your home feed. Posts will appear here.</p>
      </div>
    </div>
  );
};

export default HomePage;