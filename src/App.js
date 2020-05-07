import React from 'react';
import logo from './logo.svg';
import { useState, useEffect } from "react";
import './App.css';
import { LIVESTREAM_SOCKET_ENDPOINT, API_GET_MODEL_LIST, API_RUN_MODEL } from "./link.js"
import { Chart } from "chart.js"
import moment from "moment-timezone"
import axios from "axios"
// var randomScalingFactor = function () {
//   return Math.ceil(Math.random() * 10.0) * Math.pow(10, Math.ceil(Math.random() * 5));
// };
var prev_update_tmstp = null
var TIMESTAMP = []
var EAR = []
var MAR = []
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

var waitingNewModel = false

function App() {
  var timeoutFunction = null
  var [waiting, setWaiting] = useState(false)
  var [model, setModel] = useState([])
  var [targetModel, setTargetModel] = useState()
  const getModelList = () => {
    axios.get(API_GET_MODEL_LIST).then(res => {
      console.log(res.data.data)
      setModel(res.data.data)
    }).catch(err => {
      alert("failed to get model list")
    })
  }
  let socket_client = require("socket.io-client")(LIVESTREAM_SOCKET_ENDPOINT) // connect to socket
  socket_client.on("connect", () => {
    console.log("connected to ter's socket")
  })

  useEffect(() => {
    getModelList()
    var ctx = document.getElementById('canvas').getContext('2d');
    window.myLine = new Chart(ctx, graphData);



    socket_client.on(`image_-LrdlygY0H5IzMvDo-bh`, (data) => {
      if (document.getElementById("dimmer").style["display"] != "none" && !waitingNewModel)
        document.getElementById("dimmer").style["display"] = "none"
      let { jpg_text, ear, mar, model, timestamp } = data
      let uri = `data:image/jpeg;base64,${jpg_text}`
      let video = document.getElementById("video")
      let videoHeader = document.getElementById("video-header")
      document.getElementById("ear").textContent = "EAR: " + ear.toFixed(4)
      document.getElementById("mar").textContent = "MAR: " + mar.toFixed(4)
      videoHeader.textContent = `Current Model "${model}"`
      video.src = uri

      if (!prev_update_tmstp) prev_update_tmstp = timestamp
      else {
        let timediff = moment(timestamp).diff(prev_update_tmstp)
        if (timediff >= 500) {
          prev_update_tmstp = timestamp
          // GRAPH STUFF
          TIMESTAMP.push(timestamp)
          EAR.push(ear)
          MAR.push(mar)
          graphData.data.labels = TIMESTAMP.reverse().slice(0, 5).reverse()
          graphData.data.datasets[0].data = EAR.reverse().slice(0, 5).reverse()
          graphData.data.datasets[1].data = MAR.reverse().slice(0, 5).reverse()
          window.myLine.update();
        }
        clearTimeout(timeoutFunction)
        timeoutFunction = setTimeout(() => {
          graphData.data.labels = TIMESTAMP
          graphData.data.datasets[0].data = EAR
          graphData.data.datasets[1].data = MAR
          window.myLine.update();
        }, 2000)
      }


    })

  }, [setModel, waiting, setWaiting])


  const runModel = () => {
    let m = targetModel
    if (!targetModel) {
      m = model[0]
    }
    axios.get(`${API_RUN_MODEL}/${m}`).then(res => {
      waitingNewModel = true
      document.getElementById("dimmer").style["display"] = "flex"
      setTimeout(() => { waitingNewModel = false }, 2000)
    }).catch(err => { alert("Failed to run model...") })
  }


  const renderDimmer = () => (
    <div id={"dimmer"} style={{ position: "absolute", alignItems: "center", zIndex: "100000", justifyContent: "center", display: "none", width: "100vw", height: '100vh', backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div style={{ flex: 1, color: "white", fontWeight: "bold" }}>
        <h1 className="animate-loading">Waiting for streaming</h1>
      </div>
    </div>
  )


  return (
    <div className="App">
      {renderDimmer()}
      <header className="App-header">
        <div style={{ textAlign: "center", }}>
          <b>
            <h3 id={"video-header"}>
              Testing Model Naja
            </h3>
          </b>
        </div>
        <div style={{ display: "flex" }}>
          <div style={{ flex: 1 }}>
            <select onChange={(e) => {
              setTargetModel(e.target.value)
            }}>
              {
                model.map((m, index) => <option key={`model-option-${index}`} >{m}</option>)
              }
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <button onClick={runModel}>Run Model!</button>
          </div>
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
