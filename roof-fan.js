const telldus = require('telldus');
const https = require('https');

console.log('--- About to run: ' + new Date().toISOString() + ' ---');
https.get('https://opendata-download-metanalys.smhi.se/api/category/mesan1g/version/2/geotype/point/lon/15.7416/lat/56.1223/data.json', (resp) => {
  let data = '';

  resp.on('data', (chunk) => {
    data += chunk;
  });

  resp.on('end', () => {
    let json = JSON.parse(data);
    let now = json.timeSeries[0].parameters;

    let temp = getVal(now, 't');
    let strength = getVal(now, 'ws');
    let direction = getVal(now, 'wd');
    let roofTemp = extractRoofTemp(temp);

    if ((roofTemp && roofTemp < -4) || (!roofTemp && temp < 2)) {
        console.log('Decision: To cold - allow no fan');
    } else if (direction >= 0 && direction < 225) {
        console.log('Decision: N, NO, O, SO, S - allow NV fan');
        startNV();
    } else if (direction >= 225) {
        console.log('Decision: SV, V, NV  - allow SO fan');
        startSO();
    } else {
        console.log('Error: fail to make decision');
        console.log('response: %j', json);
        console.log('now: %j', now);
    }
  });

}).on("error", (err) => {
  console.log("Error: failed to load SMHI data: " + err.message);
});

var getVal = function (parameters, name) {
    let val = parameters.find(function(e) {
        return e.name === name;
    }).values[0];
    console.log('Current ' + name + ': %j', val);
    return +val;
}

var extractRoofTemp = function () {
    let sensors = telldus.getSensorsSync();
    for (let index = 0; index < sensors.length; index++) {
        if (sensors[index].model === '1A2D') {
            let data = sensors[index].data;
            for (let dIndex = 0; dIndex < data.length; dIndex++) {
                if(data[dIndex].type === 'TEMPERATURE') {
                    let sensorDate = new Date(data[dIndex].timestamp);
                    if ((new Date() - sensorDate) < 1000 * 60 * 60 * 4) {
                        console.log("Use sensor for roof temp: " + +data[dIndex].value);
                        return +data[dIndex].value;
                    }
                }
            }
        }
    }
    console.log("Failed to fetch temp from sensor %j", sensors);
    return null;
}

var startNV = function () {
    telldus.turnOn(11, function(err) {
        console.log('NV is now on');
    });
    telldus.turnOff(12, function(err) {
        console.log('SO is now off');
    });
}

var startSO = function () {
    telldus.turnOn(12, function(err) {
        console.log('SO is now on');
    });
    telldus.turnOff(11, function(err) {
        console.log('NV is now off');
    });
}
