const telldus = require('telldus');

/**
* model - required
* id - optional
*/
var extractSensor = function(model, id) {
    let sensors = telldus.getSensorsSync();
    let temp = null;
    let humidity = null;
    for (let index = 0; index < sensors.length; index++) {
        if (sensors[index].model === model && (id === null || id === sensors[index].id)) {
            let data = sensors[index].data;
            for (let dIndex = 0; dIndex < data.length; dIndex++) {
                if(data[dIndex].type === 'TEMPERATURE') {
                    let sensorDate = new Date(data[dIndex].timestamp);
                    if ((new Date() - sensorDate) < 1000 * 60 * 60 * 4) {
                        temp = +data[dIndex].value;
                    }
                }
                if(data[dIndex].type === 'HUMIDITY') {
                    let sensorDate = new Date(data[dIndex].timestamp);
                    if ((new Date() - sensorDate) < 1000 * 60 * 60 * 4) {
                        humidity = +(data[dIndex].value.replace('%', ''));
                    }
                }
            }
        }
    }
    return nullOrString(temp) + nullOrString(humidity) + nullOrString(calcAbsHumidity(temp, humidity));
}

var nullOrString = function(value) {
    return (value === null ? '' : value) + ';';
}

var calcAbsHumidity = function(temperature, relativeHumidity) {
    if (temperature === null || relativeHumidity === null) {
        return null;
    }
    let maxHumidity = ((0.000002 * Math.pow(temperature, 4.0)) +
                        (0.0002 * Math.pow(temperature, 3.0)) +
                        (0.0095 * Math.pow(temperature, 2.0)) +
                        (0.337 * temperature) + 4.9034);
    let abs = maxHumidity * (relativeHumidity / 100);
    return Math.round(abs * 100) / 100;
}

/**
* Main function
**/

let entrance = extractSensor('temperaturehumidity', 183);
let basement = extractSensor('temperaturehumidity', 199);
let roof = extractSensor('1A2D', null);
let outside = extractSensor('temperaturehumidity', 135);

console.log(new Date().toISOString() + ';' + roof + outside + entrance + basement);
