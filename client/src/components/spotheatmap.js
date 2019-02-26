import React, { Component } from 'react';
import './spotheatmap.css';

import SyncLoader from 'react-spinners/SyncLoader';

import {OverlayTrigger, Popover} from 'react-bootstrap';

const {getHeatMapData} = require('../model/spotprices');

const lerpColor = (r1, g1, b1, r2, g2, b2) => {
  return (frac) => {
    if (frac < 0) frac = 0;
    if (frac > 1) frac = 1;
    const c1 = 1 - frac;
    const c2 = frac;
    return `rgb(${Math.round(c1 * r1 + c2 * r2)}, ${Math.round(c1 * g1 + c2 * g2)}, ${Math.round(c1 * b1 + c2 * b2)})`;
  };
}

// spot heat map

class SpotHeatMap extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      data: null,
      threshold: props.threshold,
      percentage: props.percentage,
    }
  }

  componentDidMount() {
    this.componentDidUpdate();
  }

  componentDidUpdate() {
    if (
        this.props.startDate !== this.state.startDate || 
        this.props.stopDate !== this.state.stopDate
    ) {
      // if we determine that what has changed is the date range, then we should fetch the data anew

      const state = Object.assign({}, this.state);
      state.loading = true;
      state.data = null;
      state.all_values = null;
      state.startDate = this.props.startDate;
      state.stopDate = this.props.stopDate;
      this.setState(state);

      // load the data for the heat map
      const props = this.props;
      (async () => {
        const data = await getHeatMapData(props.startDate, props.stopDate);

        const state = Object.assign({}, this.state);
        state.loading = false;
        state.data = data;

        // used for computing color thresholds
        {
          const values = [];
          const datapoints = data.heatmap;
          for (const row of datapoints) {
            for (const datapoint of row) {
              if (datapoint != null) 
                values.push(datapoint.delta);
            }
          }

          // we sort the values to make everything nice
          values.sort();
          state.all_values = values;
        }
        
        // finally update the state
        this.setState(state);
      })();
    }
    
    // if the percentile threshold property changed we do not need a full refresh :) 
    if (this.props.threshold !== this.state.threshold || this.props.percentage !== this.state.percentage) {
      console.log("PERCENTAGE: " , this.props.percentage);
      const state = Object.assign({}, this.state);
      state.threshold = this.props.threshold;
      state.percentage = this.props.percentage;
      this.setState(state);
      this.forceUpdate();
    }
  }

  render() {
    if (this.state.loading) {
      // return <GridLoader loading={true} color={'#415EFF'}></GridLoader>
      return <SyncLoader loading={true} color={'#415EFF'}></SyncLoader>
    } else {

      // calculate the standard deviation, and drop off the high end values

      let colorizeValue;

      const colorNegative = lerpColor(255, 255, 255, 0, 100, 255);
      const colorPositive = lerpColor(255, 255, 255, 255, 0, 0)

      function get_stats(values) {
        let mean = 0;
        for (const value of values) 
          mean += value;
        mean /= values.length ;

        let stddev = 0;
        for (const value of values) 
          stddev += (value - mean) * (value - mean);
        stddev /= values.length - 1;
        stddev = Math.sqrt(stddev);
        
        return {
          'stddev': stddev,
          'mean': mean,
        }
      }

      if (this.state.percentage) {
        // we use the percentage change to decide
        const percentage_changes = [];

        for (const row of this.state.data.heatmap) {
          for (const datapoint of row) {
            if (datapoint != null) {
              percentage_changes.push(datapoint.delta / datapoint.startprice);
            }
          }
        }

        const stats = get_stats(percentage_changes);

        const mag = stats.stddev * this.state.threshold;

        const pUpper = mag;
        const pLower = -mag;

        colorizeValue = (datapoint) => {
          const percentage_change = datapoint.delta / datapoint.startprice;

          if (percentage_change < 0) {
            return colorNegative(percentage_change / pLower);
          } else {
            return colorPositive(percentage_change / pUpper);
          }
        }

      } else {
        let values = this.state.all_values.map((value) => {
          return Math.log2(Math.abs(value) + 1) * Math.sign(value);
        })
  
        const stats = get_stats(values);
        const mag = stats.stddev * this.state.threshold;

        const pUpper = mag;
        const pLower = -mag;

        colorizeValue = (datapoint) => {
          if (datapoint.delta < 0) {
            return colorNegative(datapoint.delta / pLower);
          } else {
            return colorPositive(datapoint.delta / pUpper);
          }
        }
      }


      
      
      
      const rows = this.state.data.heatmap.map((row, index) => {
        const insttype = this.state.data.yLabels[index];
        return (
          <tr key={'row-' + insttype}>
            <td key={insttype}><strong> {insttype} </strong></td>
            {row.map((datapoint, xindex) => {
              const az = this.state.data.xLabels[xindex];
              
              if (datapoint == null) 
                return (<td key={az + '-' + insttype}></td>);
              const value = datapoint.delta;

              const color = colorizeValue(datapoint);
              
              if (this.state.percentage) {
                return <td key={az + '-' + insttype} style={{'backgroundColor': color}}>
                  ${Math.round(datapoint.stopprice * 100) / 100} <small>%{Math.round(datapoint.delta / datapoint.startprice * 100)}</small>
                </td>
              } else {
                return <td key={az + '-' + insttype} style={{'backgroundColor': color}}>
                  ${Math.round(datapoint.stopprice * 100) / 100} <small>${Math.round(value * 100) / 100}</small>
                </td>  
              }
            })}
          </tr>
        )
      });

      const header = this.state.data.xLabels.map((label) => {
        return (
          <th key={label}> {label} </th>
        )
      });

      return (
        <table className="heatmap">
          <tbody>
            <tr>
              <th></th>
              {header}
            </tr>
            {rows}
          </tbody>
        </table>
      );

    }
  }
}

export default SpotHeatMap;