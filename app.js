const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const session = require("express-session")
const cookie = require("cookie-parser")

const current = new Date()

const mongoose = require("mongoose");
const User = require("./mongo");
const MessageSchema = require("./message")
const { Socket } = require("engine.io");
const { urlencoded } = require('body-parser');
const cookieParser = require('cookie-parser');
const { stringify } = require('querystring');
const { MongoGridFSChunkError } = require('mongodb');
const { equal } = require('assert');


//active connections variable for 
var activeConnections = 0

//app.use section of code
app.use(urlencoded({extended: false}))
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(cookieParser())
app.set("view engine", "ejs")


//connect to mongoDb
mongoose.connect("mongodb+srv://wheatstore:SkyWalker1025@test.tpprf3j.mongodb.net/?retryWrites=true&w=majority", ()=>{
    console.log("connected succesfully")
})

io.on("connection", (socket)=>{
    //code for when user connects active connections increases by 1
    activeConnections++
    //print the active connections
    console.log("ACTIVE CONNECTIONS: " + activeConnections)
    console.log("____________________________")

    //code when socket/user disconects
    socket.on("disconnect", ()=>{
        io.emit("chat message", "A user disconnected")
        //active users decreases by 1
        activeConnections = activeConnections - 1
        console.log("A user disconnected, " + "ACTIVE CONNECTIONS: " + activeConnections)
    })
    socket.on("chat message", async (msg)=>{
        console.log(msg)
        //emit the message to all users
        var count = 0
        socket.broadcast.emit("chat message", msg)
        
        //save the message to MongoDB
        const m = new MessageSchema({content: msg, date: current.toLocaleDateString()})
        await m.save().then((
            console.log(m)
        ))
    })
})


//Root of the server
app.get("/", async (req, res)=>{
    if(req.session.isLogged === true){
        res.render("index", {name: req.session.username})
        console.log("USERNAME IN SESSION: " + req.session.username)
        
    }
    else{
        res.redirect("/login")
    }
})

//req.login of the server
app.get("/login", (req, res)=>{
    res.sendFile(__dirname + "/login.html")
})

//login post section
app.post("/login", async (req, res)=>{
    //check if the the information entered is in the database
    const check3 = await User.find({username: req.body.name, password: req.body.password})
    //if the length is greater than 0 the information checks out
    console.log("ARRAY LENGTH: " + check3.length)
    if(check3.length > 0){
        //creates the req.sessions to make sure the main server accepts
        req.session.username = req.body.name
        req.session.password = req.body.password
        req.session.isLogged = true
        res.redirect("/")
    }
    else{
        res.send("You are not a user")
        console.log("____________________________")
    }
})

//register post section
app.post("/register", async (req, res)=>{
    //get the length of the array and compare the information with the user
    const check = await User.find({username: req.body.name})
    console.log("ARRAY: " + check)
    console.log("ARRAY LENGTH: " + check.length)
    //check if uesrname is already in use
    if(check.length > 0){
        res.send("User name already in use")
        console.log("____________________________")
    }
    //otherwise let the user register
    else{
        //save the uername into the database
        const user = new User({username: req.body.name, password: req.body.password})
        await user.save().then((
        console.log("User saved Succesfully")
    ))
        //create the req session 
        req.session.isLogged = true
        req.session.username = req.body.name
        req.session.password = req.body.password
        //prints the session username
        //redirect the user to the main page
        console.log("USERNAME: " + req.session.username)
        res.redirect("/")
    }
    
})

app.get("/register", (req, res)=>{
    res.sendFile(__dirname + "/register.html")
    
    
})

server.listen(3000, () =>{
    console.log("[SERVER CONNECTED] on port 3000...")
})
