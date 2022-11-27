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

//connect to mongoDb
mongoose.connect("mongodb+srv://wheatstore:SkyWalker1025@test.tpprf3j.mongodb.net/?retryWrites=true&w=majority", ()=>{
    console.log("connected succesfully")
})

//Root of the server
app.get("/", (req, res)=>{
    console.log(req.session.username, req.session.password)
    if(checkUser(req.session.username)){
        res.sendFile(__dirname + "/index.html")
        console.log("USERNAME IN SESSION: " + req.session.username)
    }
    else{
        res.send("You are not a user")
    }
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
        io.emit("chat message", msg)
        //save the message to MongoDB
        const m = new MessageSchema({content: msg, date: current.toLocaleDateString()})
        await m.save().then((
            console.log(m)
        ))
    })
})

app.get("/login", (req, res)=>{
    res.sendFile(__dirname + "/login.html")
})

//login post section
app.post("/login", (req, res)=>{
    if(checkUserWithPassword(req.body.name, req.body.password)){
        console.log("YESSSS")
        res.redirect("/")
    }
    else{
        res.send("You are not a user")
    }
    console.log(req.body)
})

//register post section
app.post("/register", async (req, res)=>{
    console.log(req.body)
    if(checkUser(req.body.name)){
        res.send("User name already in use")
    }
    else{
        const user = new User({username: req.body.name, password: req.body.password})
        await user.save().then((
        console.log("User saved Succesfully")
    ))
        //create the req session 
        req.session.isLogged = true
        req.session.username = req.body.name
        req.session.viewTimes = 0
        req.session.password = req.body.password
        //prints the session username
        console.log("REQ BODY: " + stringify(req.body))
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

async function checkUser(user){
    const check = await User.find({username: user})
    console.log("RUNNING FUNCTION")
    console.log("ARRAY: " + check)
    if(check.length > 0){
        console.log("CHECK USER: User exists")
        return true
    }
    else if(check.length < 1){
        console.log("User does not exist")
        return false
    }

}
async function checkUserWithPassword(user, password){
    const check = await User.find({username: user, password:password})
    console.log("RUNNING FUNCTION")
    console.log("ARRAY: " + check)
    if(check.length > 0){
        console.log("CHECK USER: User exists")
        return true
    }
    else if(check.length < 1){
        console.log("User does not exist")
        return false
    }

}
