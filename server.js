'use strict';
var http = require('http');
var port = process.env.PORT || 1337;

var express = require('express');
var app = express();

const fs = require('fs');

//register a new user with a random generated ID and the name received
app.all('/register', function (req, res) {
    var name = req.query.name;
    if (!name || name == null || name == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("missing name");
        return;
    }

    //getting users file and adding the new user
    const users = require("./Users");
    var id = generateUserID();
    let user = {
        id: id,
        name: name,
    };
    users.push(user);

    //writing the updated list
    fs.writeFile("Users.json", JSON.stringify(users, null, 2), err => {

        // Checking for errors 
        if (err) {
            res.writeHead(501, { 'Content-Type': 'text/plain' });
            res.end("server encountered an error");
            return;
        }

        // Success
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end("your id: " + id);
    });

});



//associate a facebook ID with an existing user
app.all('/associatefacebook', (req, res) => {
    var id = req.query.id;
    if (!id || id == null || id == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("missing parameter");
        return;
    }

    const users = require("./Users");

    //check if a user with the id received exists
    var userFound = users.find(function (user) {
        return user.id == id;
    });

    if (!userFound || userFound == null || userFound == undefined) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end("user not found");
        return;
    }


    var facebookID = req.query.facebookID;
    if (!facebookID || facebookID == null || facebookID == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("missing parameter");
        return;
    }

    //updating the user with the facebook ID and writing on file
    userFound.facebookID = facebookID;
    fs.writeFile("Users.json", JSON.stringify(users, null, 2), err => {
        // Checking for errors 
        if (err) {
            res.writeHead(501, { 'Content-Type': 'text/plain' });
            res.end("server encountered an error");
            return;
        }

        //association completed
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end("your facebook account has been associated");
    });
});



//start new session for a user at a location
app.all('/startsession', (req, res) => {
    var userid = req.query.userid;
    var locationID = req.query.locationid;
    if (!userid || userid == null || userid == undefined || !locationID || locationID == null || locationID == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("invalid parameters");
        return;
    }

    const users = require('./Users');

    //check if a user with the id received exists
    let elementfound = users.some((user) => {
        return user.id == userid
    });

    if (!elementfound) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end("user not found");
        return;
    }

    const sessions = require('./Sessions');

    //check if the session already exists
    elementfound = sessions.some((session) => {
        return session.userid == userid && session.locationid == locationID;
    });
    if (elementfound) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("session already done");
        return;
    }

    //adding the session
    var sessionid = generateSessionID();
    let session = {
        sessionid: sessionid,
        userid: userid,
        locationid: locationID,
        active: true
    };

    sessions.push(session);


    //writing on file
    fs.writeFile("Sessions.json", JSON.stringify(sessions, null, 2), err => {
        if (err) {
            //error handling
            res.writeHead(501, { 'Content-Type': 'text/plain' });
            res.end("server encountered an error");
            return;
        }

        //success
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end("session started");
    });

});



//end an active session and adds the score to it
app.all('/endsession', (req, res) => {
    var userid = req.query.userid;
    var sessionid = req.query.sessionid;
    if (!userid || userid == null || userid == undefined || !sessionid || sessionid == null || sessionid == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("invalid parameters");
        return;
    }

    const sessions = require('./Sessions');

    //check if the session exists and is associated with the given user
    let sessionfound = sessions.find((session) => {
        return session.sessionid == sessionid && session.userid == userid;
    });

    if (!sessionfound || sessionfound == null || sessionfound == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("this session doesn't exists");
        return;
    }

    
    var score = req.query.score;
    if (!score || score == null || score == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("need the score to end the session");
        return;
    }
    
    //marking session done and adding score
    sessionfound.active = false;
    sessionfound.score = score;

    //writing on file
    fs.writeFile("Sessions.json", JSON.stringify(sessions, null, 2), err => {
        if (err) {
            //error handling
            res.writeHead(501, { 'Content-Type': 'text/plain' });
            res.end("server encountered an error");
            return;
        }

        //success
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end("session ended");
    });

});


app.listen(port, function () {
    console.log("server started");
});


//generation of a random ID for a user
function generateUserID() {
    return Math.ceil(Math.random() * 1000);
}

//generation of a random ID for a session
function generateSessionID() {
    return Math.ceil(Math.random() * 10000);
}