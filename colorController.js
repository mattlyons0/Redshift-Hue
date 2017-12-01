'use strict';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const hue = require('node-hue-api');
const HueApi = hue.HueApi;
const lightState = hue.lightState;
const prompt = require('prompt-promise');
const _ = require('lodash');

let configUtil = require('./config');
let redshiftReader = require('./redshiftReader');

let config = configUtil.currentConfig;
let api;
let stop;

async function register(){
  console.log('Searching for Bridges...');
  let bridges = await hue.upnpSearch(5000);
  let selectedBridge;
  console.log('Bridges Found: ',bridges);
  if(bridges.length < 0) {
    console.error('No bridges found');
    process.exit(1);
  } else if(bridges.length === 1){
    console.log('Using bridge 1');
    selectedBridge = bridges[0];
  } else {
    let selection = await prompt('Which bridge would you like to use? (Enter a number 1-'+bridges.length+')');
    try{
      selection = Number(selection);
      selectedBridge = bridges[selection];
    } catch(e){
      console.error('That is not a valid choice');
      process.exit(2);
    }
  }
  //selectedBridge is defined by here
  config.bridgeID = selectedBridge.id;
  config.bridgeIP = selectedBridge.ipaddress;
  await configUtil.write();

  try {
    api = new HueApi(config.bridgeIP, config.bridgeID);
    await api.config();
    console.log('Press link button to register application... (You have 15 seconds)');
    await delay(15000);
    config.username = await api.registerUser(config.bridgeIP);
    await configUtil.write();
    console.log('Application Registered');
  } catch(e){
    console.error('Error connecting to Hue',e);
  }
}

async function init() {
  if(!config.bridgeIP || !config.bridgeID || !config.username){
    await register();
  }

  try {
    api = new HueApi(config.bridgeIP, config.username);
    await api.getVersion();
    console.log('Successfully Connected');
  } catch(e){
    console.error(e);
  }

  if(!config.lightNum){
    let lights = await api.getLights();
    lights.lights.forEach((val, index) => {
      lights.lights[index] = (index+1) + ': ' + val.name;
    });
    console.log('Connected Lights:',lights.lights);
    let num = await prompt('What light number would you like to control?');
    let selectedLight;
    try{
      num = Number(num);
      selectedLight = lights.lights[num]; //Bound check
    } catch(e){
      console.error('Entered value is not a light number');
      process.exit(3);
    }

    console.log('Controlling Light #'+num);
    config.lightNum = num;
    await configUtil.write();
  }

  resume();
}

async function resume() {
  console.log('Resuming Redshift');
  if(stop)
    clearInterval(stop);

  let currentState = await getLightState();
  let lastState = {
    on: true,
    colormode: 'ct',
    effect: 'none',
    alert: 'none'
  };

  let state = lightState.create().on().transitionTime(10); //1 second

  if(currentState.effect !== 'none'){
    state.effect('none');
    await api.setLightState(config.lightNum, state);
    await delay(1000);
  }

  let changeColor = async (initialRun) => {
    currentState = await getLightState();
    if(initialRun || stateUnchanged(lastState, currentState)){
      let newColor = await redshiftReader.getColor();
      newColor = kelvinToMired(newColor);
      if (Number.isInteger(newColor) && (initialRun || newColor !== currentState.ct)) {
        console.log(miredToKelvin(newColor)+'k');
        state.ct(newColor);
        let result = await api.setLightState(config.lightNum, state);
      } else if(!Number.isInteger(newColor)) {
        console.error('Invalid Integer Generated as color:', newColor);
      }

      lastState.ct = newColor;
    } else {
      if(stop) { //Stop if state has changed
        clearInterval(stop);
        console.log('Stopping Redshift, change in state occurred between updates');
      }
    }
  };

  await changeColor(true);
  stop = setInterval(async () => {
    await changeColor();
  },60 * 1000); //Every Minute update color if applicable
}

function stateUnchanged(lastState, currentState){
  let compareFields = ['on', 'colormode', 'effect', 'alert', 'ct'];
  for(let field of compareFields){
    if((typeof currentState[field] != 'object' && lastState[field] != currentState[field] ) ||
      (typeof currentState[field] == 'object' && !_.isEqual(currentState[field], lastState[field]))) {
      console.log(field + ' doesnt match',currentState[field], lastState[field])
      return false;
    }
  }

  return true;
}

async function getLightState(){
  let status = await api.lightStatus(config.lightNum);
  return status.state;
}

function kelvinToMired(kelvinVal){
  return Math.round(1000000/kelvinVal);
}
function miredToKelvin(miredVal){
  return Math.round(1000000/miredVal);
}

module.exports = {
  init: init,
  resume: resume
};
