import React, { Component } from "react";
import "./App.css";
import Header from "./Header";
import Intro from "./Intro";
import Record from "./Record";

import { BrowserRouter as Router, Route } from "react-router-dom";


class App extends Component {
  render() {
    return (
      <Router onUpdate={() => window.scrollTo(0, 0)}>
        <div className="App">
          <Header />
          <div className="page">
            <Route exact path="/" component={Intro} />
            <Route path="/record" component={Record} />
          </div>
        </div>
      </Router>
    );
  }
}

export default App;
