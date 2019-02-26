import React, { Component } from 'react';

import {PageHeader, Panel, Alert} from 'react-bootstrap';

const About = () => {
  
  return (
    <div className="container content">
      <center>
        <PageHeader>
          About 
        </PageHeader>
      </center>
      <h3>Interpreting the Data</h3>
      <p>
        The <strong>x axis shows the AZ ID</strong> and the <strong>y axis to the left shows the instance type</strong>.
        It is important to be aware that the AZ ID is distinct from the AZ Name.
        We choose to use AZ ID because, according to Amazon, the AZ ID is a "unique and consistent 
        identifier for an availability zone" it will have the same location (corresponds to the same
        physical datacenter) in every account. This is not the case for the AZ Name which is a logical
        identifier, to ensure that resources are "distributed across the availability zones for a given region"
        Amazon independently maps availability zone names for each account. 
        For these reasons we provide data in terms of the AZ ID with the hope that users will be able to apply this data
        to prices they see in their own accounts.
      </p>
      <p>The values in the table are the changes in average price in dollars.</p>
      <p>
        Red colors represent an increase in price and blue colors represent a decrease in price. Some table entries are empty, these are az/insttype
        pairs for which no data is available. This is often the case because an instance type may not be offered in all regions.
      </p>


      <h3>Usage</h3>
      <div style={{'textAlign': 'left'}}>
        <p>
          This <strong>spot price visualizer</strong> is a tool for exploring both long and short
          term trends in the prices of instances on the <a href="https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/how-spot-instances-work.html">spot market</a>
        </p>
        <p>
          Usage:
        </p>
        <ul>
          <li>First, pick a start date for the range of dates you wish to examine by clicking the 'start date' date picker or by typing a value in the box</li>
          <li>Second, pick a stop date by clicking the 'stop date' date picker and entering your value</li>
          <li>
            Finally, play with the threshold slider which will determine how sensative the colorization of the data is to price change, and the 'percentage change' toggle to switch the table between
            showing percentage change and the raw delta in dollars.
          </li>
        </ul>
        <p>
          The spot price visualizer will then fetch the data for the prices on the 'start' and 'stop' dates and will display a heatmap visualization of 
          how the prices have changed between the two points in time.  It
    computes the average price before and after the midpoint between the
          two dates and reports the difference.
          
        </p>
        <p><em>Note: Our archived data goes back to 2015.</em></p>
        {/* <p>This project is made by Gareth George at UC Santa Barbara’s <a href="http://www.cs.ucsb.edu/~ckrintz/racelab.html">RACELab</a></p> */}
      </div>
    </div>
  )
}

export default About;