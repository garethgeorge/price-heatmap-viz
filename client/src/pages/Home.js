import React, { Component } from 'react';
import '../App.css';

// bring in the date picker components
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import {PageHeader, Panel, Alert} from 'react-bootstrap';
import { BrowserRouter as Router, Route, Link, withRouter} from "react-router-dom";

import SpotHeatMap from "../components/spotheatmap";
import queryString from "query-string"


class Home extends Component {
  constructor(props) {
    super(props);

    console.log(this.props.location);
    const query = queryString.parse(this.props.location.search);

    let startDate, stopDate, thresh, percentage = true;
    if (!query["startDate"]) {
      startDate = new Date();
      startDate.setTime(startDate.getTime() - 2 * 7 * 24 * 3600 * 1000);
      startDate.setHours(0);
    } else {
      startDate = new Date(query["startDate"]);
    }

    if (!query["stopDate"]) {
      stopDate = new Date();
      stopDate.setHours(0);
    } else {
      stopDate = new Date(query["stopDate"]);
    }

    if (!query["thresh"]) {
      thresh = 0.5;
    } else {
      thresh = parseFloat(query["thresh"]);
    }

    if (query["percentage"]) {
      percentage = query["percentage"] == "true";
    }

    this.state = {
      "startDate": startDate,
      "stopDate": stopDate,
      "threshold": thresh,
      "percentage": percentage,
    }
  }

  changeStartDate(startDate) {
    if (!startDate) return ;

    const state = Object.assign({}, this.state);
    state.startDate = startDate;
    this.setState(state, this.updateQueryParams.bind(this));
  }

  changeStopDate(stopDate) {
    if (!stopDate) return ;
    const state = Object.assign({}, this.state);
    state.stopDate = stopDate;
    this.setState(state, this.updateQueryParams.bind(this));
  }

  changeThreshold(event) {
    if (this.chngThreshTimeout) {
      clearTimeout(this.chngThreshTimeout);
    }

    const state = Object.assign({}, this.state);
    state.threshold = event.target.value;

    // this.chngThreshTimeout = setTimeout(() => {
      this.setState(state, this.updateQueryParams.bind(this));
    // }, 50);
  }

  updateQueryParams() {
    const search = `?startDate=${this.state.startDate.toISOString()}&stopDate=${this.state.stopDate.toISOString()}&thresh=${this.state.threshold}&percentage=${this.state.percentage}`;
    if (search === this.props.location.search) return ;
    
    // limit update frequency
    this.props.history.push({
      pathname: this.props.location.pathname,
      search: `?startDate=${this.state.startDate.toISOString()}&stopDate=${this.state.stopDate.toISOString()}&thresh=${this.state.threshold}&percentage=${this.state.percentage}`
    })
  }

  render() {
    // create the heatmap only if the dates are valid
    let heatmap = null;
    if (this.state.startDate != null && this.state.stopDate != null) {
      heatmap = (
        <center style={{margin: '20px'}}>
          <SpotHeatMap
            startDate={this.state.startDate}
            stopDate={this.state.stopDate}
            threshold={this.state.threshold}
            percentage={this.state.percentage}
            />
        </center>
      )
    }

    // create the instructions

    return (
      <div className="App">
        <div className="container content">
          <PageHeader>
            <a href="https://federatedcloud.org">Aristotle</a> AWS SpotPrice Visualizer <small>(Beta Version 1.0) </small>
          </PageHeader>

          <h4>For usage instructions see the <Link to="/about">/about</Link> page</h4>

          <hr></hr>

          <span>
            <strong>Start Date: </strong>
            <DatePicker
              selected={this.state.startDate}
              onChange={this.changeStartDate.bind(this)}
            />
          </span>

          <span style={{margin: '10px'}}>
            <strong>Stop Date: </strong>
            <DatePicker
              selected={this.state.stopDate}
              onChange={this.changeStopDate.bind(this)}
            />
          </span>

          <span style={{margin: '10px'}}>
            <strong>Threshold </strong>
            <input type="range" onChange={this.changeThreshold.bind(this)}
              min="0.05" max="2" step="0.05" style={{width: '100px', display: 'inline'}} value={this.state.threshold}></input>
            <input type="number" onChange={this.changeThreshold.bind(this)}
              min="0.05" max="2" step="0.05" value={this.state.threshold}></input> 
            <strong> Show % Change </strong>
            <input type="checkbox" onChange={(event) => {
              const state = Object.assign({}, this.state);
              console.log(event.target.checked);
              state.percentage = event.target.checked;
              this.setState(state, this.updateQueryParams.bind(this));
            }} checked={this.state.percentage}></input>
          </span>
          
          {heatmap}

        </div>
      </div>
    );
  }
}

export default Home;