'use strict';

const exec = require('child-process-promise').exec;

async function getColor(){ //Must return between 2000k and 6500k
  let resp;
  try {
    resp = await exec('redshift -vo -m dummy -t 6500:3000');
    let lines = resp.stdout.split('\n');
    for (let line of lines) {
      if (line.toLowerCase().startsWith('temperature: ')) {
        return Number(line.split(':')[1].trim());
      }
    }
  } catch(e){
    console.error('Error running redshift command.');
    console.error('Stderr:',resp.stderr,'Stdout:',resp.stdout);
    console.error('Error:',e);
  }

}

module.exports = {
  getColor: getColor
};