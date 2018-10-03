import React, { Component } from "react";
import "./App.css";
import Header from "./Header";
import Intro from "./Intro";
import Record from "./Record";
import Tutorial from "./Tutorial";
import { getUUID, createUUID } from "./api/localstorage";

import { BrowserRouter as Router, Route } from "react-router-dom";


class App extends Component {
  componentDidMount(){
    if (!getUUID()){
      createUUID()
    }
  }

  render() {
    return (
      <Router onUpdate={() => window.scrollTo(0, 0)}>
        <div className="App">
          <Header />
          <div className="page">
            <Route exact path="/" component={Intro} />
            <Route path="/record" component={Record} />
            <Route path="/tutorial" component={Tutorial} />
          </div>
        </div>
      </Router>
    );
  }
}

export default App;
