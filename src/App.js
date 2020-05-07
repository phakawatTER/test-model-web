import React from 'react';
import logo from './logo.svg';
import { useState, useEffect } from "react";
import './App.css';
import { LIVESTREAM_SOCKET_ENDPOINT } from "./link.js"
import { Chart } from "chart.js"
// var randomScalingFactor = function () {
//   return Math.ceil(Math.random() * 10.0) * Math.pow(10, Math.ceil(Math.random() * 5));
// };

var EAR = 0
var MAR = 0
var graphData = {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'EAR',
      backgroundColor: "red",
      borderColor: "red",
      fill: false,
      data: [],
    }, {
      label: 'MAR',
      backgroundColor: "blue",
      borderColor: "blue",
      fill: false,
      data: [],
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    title: {
      display: true,
      text: 'EAR & MAR Overtime'
    },
    scales: {
      xAxes: [{
        display: true,
      }],
    }
  }
};

function App() {
  useEffect(() => {

    var ctx = document.getElementById('canvas').getContext('2d');
    window.myLine = new Chart(ctx, graphData);

    let socket_client = require("socket.io-client")(LIVESTREAM_SOCKET_ENDPOINT)
    socket_client.on("connect", () => {
      console.log("connected to ter's socket")
    })
    socket_client.on(`image_-LrdlygY0H5IzMvDo-bh`, (data) => {
      let { jpg_text, ear, mar, model, timestamp } = data
      let uri = `data:image/jpeg;base64,${jpg_text}`
      let video = document.getElementById("video")
      let videoHeader = document.getElementById("video-header")
      document.getElementById("ear").textContent = "EAR: " + ear.toFixed(4)
      document.getElementById("mar").textContent = "MAR: " + mar.toFixed(4)
      videoHeader.textContent = `Current Model "${model}"`
      graphData.data.labels.push(timestamp)
      graphData.data.datasets[0].data.push(ear)
      graphData.data.datasets[1].data.push(mar)

      window.myLine.update();


      video.src = uri
    })

  })


  return (
    <div className="App">
      <header className="App-header">
        <div style={{ textAlign: "center", }}>
          <b>
            <h1 id={"video-header"}>
              Testing Model Naja 
            </h1>
          </b>
        </div>
       
        <div style={{ display: "flex", width: "100%", flexDirection: "row" }}>

          <div style={{ display: "flexbox", flex: 1, backgroundColor: "black", height: 426, minHeight: 426, position: "relative" }}>
            <div style={{ position: "absolute" }}>
              <span id={"ear"}>0.0000</span>
              <br />
              <span id={"mar"}>0.0000</span>
            </div>
            <img id={"video"} style={{ textAlign: "center" }} />
          </div>
          <div style={{ flex: 1, backgroundColor: "white", height: 450 }}>
            <canvas id={"canvas"} style={{ height: 350 }} />
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
