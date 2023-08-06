const express = require('express');
const cors = require('cors');
const app = express();
const fetch = require("node-fetch");
const readline = require("readline-sync");
require('dotenv').config({path:'.././.env'});


app.use(cors());

if(process.argv.length>4){

    var PORT = process.env.BROKERPORT;
    var envtt = process.argv[2].split('=');
    var envport = process.argv[3].split('=');

    var TESTTOPIC=envtt[1];
    var message = process.argv[4];
    var MES = message;
    var PORT1=parseInt(envport[1]);
}
else{
    throw new Error('Enter Command like : node producerindex.js TESTTOPIC="myTopic" PORT=8080 "Hello Message"');
}




app.listen(PORT1, (req, res) => {
    try {
        fetch(`http://127.0.0.1:${PORT}/api/producer?testtopic=${TESTTOPIC}`, {
            method: 'POST', // or 'PUT'
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: MES }),
        }).then(data => console.log(data));
    } catch {
        return null;
    }
    console.log(`PORT NUMBER ${PORT1} HAS STARTED`);
})
