import React, { Component } from 'react';
import './App.css';

// bring in the date picker components
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import {PageHeader, Panel} from 'react-bootstrap';

import SpotHeatMap from "./components/spotheatmap";
import { BrowserRouter as Router, Route, Link, withRouter} from "react-router-dom";
import queryString from "query-string"

import About from './pages/About'
import Home from './pages/Home'


const App = () => {
  return (
    <Router >
      <div>
        <Route exact path="/" component={withRouter(Home)} />
        <Route path="/about" component={withRouter(About)} />
      </div>
    </Router>
  )
}

export default App;
