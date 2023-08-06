const express=require('express');
const mongoose=require('mongoose');
const cors=require('cors');
const app=express();
var bodyParser = require('body-parser')
const fetch = require("node-fetch");
const globalobj=require('../../globalobj')


const connection=mongoose.connect('mongodb://localhost:27017/broker')
.then(()=>{
    console.log('Mongo is connected');
})
.catch((err)=>{
    console.log(err);
})

app.use(cors())
app.use(express.json())

// app.use((req,res,next)=>{
//     console.log(req.session);
//     next();
// })

// var portnum=8888;

// var globalobj={};

app.get('/healthcheck',(req,res)=>{
    res.sendStatus(200);
})

app.post('/api/producer',(req,res)=>{

    var name=req.query.testtopic;
    const {message}=req.body; 
    // console.log('message',message);
    // console.log('name',name);

    var establishedModels = {};
    function createModelForName(name) {
        if (!(name in establishedModels)) {
            try{
            var Any = new mongoose.Schema({ message : {type: String }});
            establishedModels[name] = mongoose.model(name, Any);
            }
            catch(error){
                establishedModels[name] = mongoose.model(name);                
            }
        }
        return establishedModels[name];
    
    }
    // console.log(establishedModels);

    var Model = createModelForName(name); // Create the model.
    var model = Model({message}); // Create a model instance.
    model.save(function (err) { // Save
        if (err) {
            console.log(err);
        }
    });    
    
    // console.log('arrayyy',globalobj);

    for(port in globalobj[name])
    {
        // console.log('port numbers',globalobj[name][port]);
        try{
            fetch(`http://localhost:${globalobj[name][port]}/message?mess=${message}`)
            .then(data => console.log(data));
        }
        catch{
            return null;
        }

    }


    // console.log('added..');
    res.send('done');
})


app.get('/portmessage',(req,res)=>{


    const portnum=req.query.portnum;
    const testtopicname=req.query.testtopic;
    const allflag=req.query.allflag;

    var establishedModels = {};
    function createModelForName(name) {
        if (!(name in establishedModels)) {
            try{
            var Any = new mongoose.Schema({ message : {type: String }});
            establishedModels[name] = mongoose.model(name, Any);
            }
            catch(error){
                establishedModels[name] = mongoose.model(name);                
            }
        }
        return establishedModels[name];
    
    }
    // console.log(establishedModels);

    var Model = createModelForName(testtopicname); // Create the model.


    // console.log(portnum,testtopicname,allflag);

    // if(!(testtopicname in testarr))
    // {
    //     testarr[testtopicname]=[]
    //     testarr[testtopicname].push(parseInt(portnum));
    // }
    // else{
    //     testarr[testtopicname].push(parseInt(portnum));
    // }
    // console.log('array',testarr);

    if(!(testtopicname in globalobj))
    {
        globalobj[testtopicname]=[]
        globalobj[testtopicname].push(parseInt(portnum));
    }
    else{
        globalobj[testtopicname].push(parseInt(portnum));
    }
    // console.log('array',globalobj);

    if(allflag==='true')
    {
        // console.log('innn');
        Model.find({},function(err,docs){
            if(err)
            {
                console.log(err);
                res.status(400).json({err});
                return;
            }
            else{
                // console.log(docs);
                res.json(docs);
                return;
            }
        }
        )
    }    
})


app.listen(5000,()=>{
    console.log('PORT NUMBER 5000 HAS STARTED');
})