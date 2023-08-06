const fetch = require("node-fetch");
const cors=require('cors');
const fs = require("fs");
const os = require("os");
const path=require('path');
// require('dotenv').config({path:'.././.env'});



function setEnvValue(key, value) {

    // read file from hdd & split if from a linebreak to a array
    const ENV_VARS = fs.readFileSync(path.join(__dirname,'../.env'), "utf8").split(os.EOL);

    // find the env we want based on the key
    const target = ENV_VARS.indexOf(ENV_VARS.find((line) => {
        return line.match(new RegExp(key));
    }));

    // replace the key/value with the new value
    ENV_VARS.splice(target, 1, `${key}=${value}`);

    // write everything back to the file system
    fs.writeFileSync(path.join(__dirname,'../.env'), ENV_VARS.join(os.EOL));

}

// setEnvValue("BROKERPORT", 5002);

const brokerarr=[5000,5001,5002];
var  stat=400;
var PORTINDEX=0;
var PORT=brokerarr[PORTINDEX];
// try{

function  zookeeper(){

    fetch(`http://localhost:${brokerarr[0]}/healthcheck`)
    .then(data => {
        setEnvValue("BROKERPORT", 5000);
        console.log(data)
    }
    )
    .catch((err)=>{
        fetch(`http://localhost:${brokerarr[1]}/healthcheck`)
        .then((data) => {
            // PORTINDEX=1;
            setEnvValue("BROKERPORT", brokerarr[1]);
            console.log(data);
        }
        )
        .catch((err)=>{
            fetch(`http://localhost:${brokerarr[2]}/healthcheck`)
            .then(data => {
                // PORTINDEX=2;
                setEnvValue("BROKERPORT", brokerarr[2]);
                console.log(data);        
            })
            .catch((err)=>{                
                console.log(err);
            }
            )
            console.log(err);
        }
        )
        // console.log(err);
    }
    );


}

setInterval(function() { zookeeper() }, 5000);//for sending polling message every 5 seconds