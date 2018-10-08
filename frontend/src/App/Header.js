import React, { Component } from "react";
import { Link } from "react-router-dom";
import "./App.css";
import logo from "./assets/logo.svg";

class Header extends Component {
  render() {
    return (
      <div className="topnav">
        <Link to="/">
          <img className="logo" src={logo} height="24px" alt=""/>
        </Link>
      </div>
    );
  }
}

export default Header;
