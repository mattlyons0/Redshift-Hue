'use strict';

const fs = require('fs-extra');

const configFile = 'hueRedshiftConfig.json';

const defaultConfig = {
  bridgeID: undefined,
  bridgeIP: undefined,
  username: undefined,
  lightNum: undefined,
};

let currentConfig = readConfigSync();

async function readConfig() {
  try {
    return await fs.readJson(configFile);
  } catch(e){
    return defaultConfig;
  }
}

function readConfigSync() {
  try {
    return fs.readJsonSync(configFile);
  } catch(e){
    return defaultConfig;
  }
}

async function writeConfig() {
  try{
    return await fs.writeJson(configFile, currentConfig);
  } catch(e){
    console.error('Error writing config file',e);
  }
}

module.exports = {
  read: readConfig,
  write: writeConfig,

  currentConfig: currentConfig
};