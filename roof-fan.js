const https = require('https');
 
https.get('https://opendata-download-metanalys.smhi.se/api/category/mesan1g/version/2/geotype/point/lon/15.7416/lat/56.1223/data.json', (resp) => {
  let data = '';
 
  resp.on('data', (chunk) => {
    data += chunk;
  });
 
  resp.on('end', () => {
    console.log('--- About to run: ' + new Date().toISOString() + ' ---');
    let json = JSON.parse(data);
    let now = json.timeSeries[0].parameters;

    let temp = getVal(now, 't');
    let strength = getVal(now, 'ws');
    let direction = getVal(now, 'wd');

    if (temp < 0.5) {
        console.log('Decision: To cold - allow no fan');
        // stop all fan
    } else if (strength < 4) {
        console.log('Decision: No wind - allow all fan');
        // start all fan
    } else if (direction > 330 || direction < 45) {
        console.log('Decision: N or NO - allow all fan'); 
        // start all fan
    } else if (direction >= 45 && direction <= 210) {
        console.log('Decision: East - allow north fan'); 
        // start N fan
    } else if (direction > 210 && direction < 240) {
        console.log('Pure SW');
        if (strength < 10) {
            console.log('Decision: Soft SW - allow all fan');
            // start all fan
        } else if (direction <= 225) {
            console.log('Decision: Strong S/SW - allow N fan');
            // start N fan
        } else if (direction > 225) {
            console.log('Decision: Strong SW/W - allow S fan');
            // start S fan
        }
    } else if (direction >= 240 && direction <= 330) {
        console.log('Decision: West - allow south fan'); 
        // start S fan
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
    return val;
}