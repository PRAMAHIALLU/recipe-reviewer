import React from 'react';
import './Header.css';

const Header = () => {
  return (
    <header className="app-header">
      <div className="header-logo left-logo">
        <img 
          src="/Etch Systems Logo.png" 
          alt="Etch Systems Logo" 
          className="logo-image"
        />
      </div>
      <h1>Recipe Reviewer</h1>
      <div className="header-logo right-logo">
        <img 
          src="/Imi Logo.png" 
          alt="IMI Logo" 
          className="logo-image"
        />
      </div>
    </header>
  );
};

export default Header;