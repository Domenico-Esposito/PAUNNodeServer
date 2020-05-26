'use strict';
var http = require('http');
var port = process.env.PORT || 1337;

var express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

const fs = require('fs');


//get requests implemented only for testing


//register a new user with a random generated ID and the username received
app.get('/register', function (req, res) {
    var username = req.query.username;
    if (!username || username == null || username == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("missing username");
        return;
    }

    //getting users file and adding the new user
    const users = require("./Users");
    var id = generateUserID();
    let user = {
        id: id,
        username: username,
    };

    //check if there is a facebook id in the request
    var facebookID = req.query.facebookid;
    if (facebookID && facebookID != null && facebookID != undefined)
        user.facebookID = facebookID;

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
        res.set("id", id);
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end("user registration completed");
    });

});

app.post('/register', function (req, res) {
    var username = req.body.username;
    if (!username || username == null || username == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("missing username");
        return;
    }

    //getting users file and adding the new user
    const users = require("./Users");
    var id = generateUserID();
    let user = {
        id: id,
        username: username,
    };

    //check if there is a facebook id in the request
    var facebookID = req.body.facebookid;
    if (facebookID && facebookID != null && facebookID != undefined)
        user.facebookID = facebookID;

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
        res.set("id", id);
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end("user registration completed");
    });

});



//associate a facebook ID with an existing user
app.get('/associatefacebook', (req, res) => {
    var id = req.query.userid;
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


    var facebookID = req.query.facebookid;
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

app.post('/associatefacebook', (req, res) => {
    var id = req.body.userid;
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


    var facebookID = req.body.facebookid;
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
app.get('/startsession', (req, res) => {
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
        return session.locationid == locationID && (session.userid == userid || session.state != "finished");
    });
    if (elementfound) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("cannot create a new session for this location");
        return;
    }

    //adding the session
    var sessionid = generateSessionID();
    let session = {
        sessionid: sessionid,
        userid: userid,
        locationid: locationID,
        state: "waiting"
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
        res.set("sessionid", sessionid);
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end("session started");
    });

});

app.post('/startsession', (req, res) => {
    var userid = req.body.userid;
    var locationID = req.body.locationid;
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
        return session.locationid == locationID && (session.userid == userid || session.state != "finished");
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
        state: "waiting"
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
        res.set("sessionid", sessionid);
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end("session started");
    });

});


//confirm a session setting his state to playing
app.get('/confirmsession', (req, res) => {
    var userid = req.query.userid;
    var locationID = req.query.locationid;
    if (!userid || userid == null || userid == undefined || !locationID || locationID == null || locationID == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("invalid parameters");
        return;
    }

    const sessions = require('./Sessions');

    let sessionFound = sessions.find((session) => {
        return session.userid == userid && session.locationid == locationID && session.state == "waiting";
    });
    if (!sessionFound || sessionFound == null || sessionFound == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("session doesn't exist or has been already confirmed");
        return;
    }

    sessionFound.state = "playing";

    fs.writeFile("Sessions.json", JSON.stringify(sessions, null, 2), err => {
        if (err) {
            //error handling
            res.writeHead(501, { 'Content-Type': 'text/plain' });
            res.end("server encountered an error");
            return;
        }

        //success
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end("session updated");
    });
});

app.post('/confirmsession', (req, res) => {
    var userid = req.body.userid;
    var locationID = req.body.locationid;
    if (!userid || userid == null || userid == undefined || !locationID || locationID == null || locationID == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("invalid parameters");
        return;
    }

    const sessions = require('./Sessions');

    let sessionFound = sessions.find((session) => {
        return session.userid == userid && session.locationid == locationID && session.state == "waiting";
    });
    if (!sessionFound || sessionFound == null || sessionFound == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("session doesn't exist or has been already confirmed");
        return;
    }

    sessionFound.state = "playing";

    fs.writeFile("Sessions.json", JSON.stringify(sessions, null, 2), err => {
        if (err) {
            //error handling
            res.writeHead(501, { 'Content-Type': 'text/plain' });
            res.end("server encountered an error");
            return;
        }

        //success
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end("session updated");
    });
});



app.get('/getnewsession', (req, res) => {

    var locationID = req.query.locationid;

    const sessions = require('./Sessions');
    let sessionFound = sessions.find((session) => {
        return session.locationid == locationID && session.state == "waiting";
    });

    if (!sessionFound || sessionFound == null || sessionFound == undefined) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end("no waiting sessions found");
        return;
    }

    res.set("userid", sessionFound.userid);
    res.set("sessionid", sessionFound.sessionid);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("waiting session found");

});

app.post('/getnewsession', (req, res) => {

    var locationID = req.body.locationid;
    if (!locationID || locationID == null || locationID == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("invalid parameters");
        return;
    }

    const sessions = require('./Sessions');
    let sessionFound = sessions.find((session) => {
        return session.locationid == locationID && session.state == "waiting";
    });

    if (!sessionFound || sessionFound == null || sessionFound == undefined) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end("no waiting sessions found");
        return;
    }

    res.set("userid", sessionFound.userid);
    res.set("sessionid", sessionFound.sessionid);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("waiting session found");

});



//end an active session and adds the score to it
app.get('/endsession', (req, res) => {
    var userid = req.query.userid;
    var locationid = req.query.locationid;
    if (!userid || userid == null || userid == undefined || !locationid || locationid == null || locationid == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("invalid parameters");
        return;
    }

    const sessions = require('./Sessions');

    //check if the session exists and is associated with the given user
    let sessionfound = sessions.find((session) => {
        return session.locationid == locationid && session.userid == userid;
    });

    if (!sessionfound || sessionfound == null || sessionfound == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("this session doesn't exists");
        return;
    }


    var gameState = req.query.gamestate;
    if (!gameState || gameState == null || gameState == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("need the game state to end the session");
        return;
    }

    //marking session done and adding score
    sessionfound.state = "finished";
    sessionfound.GameState = gameState;

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

app.post('/endsession', (req, res) => {
    var userid = req.body.userid;
    var locationid = req.body.locationid;
    if (!userid || userid == null || userid == undefined || !locationid || locationid == null || locationid == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("invalid parameters");
        return;
    }

    const sessions = require('./Sessions');

    //check if the session exists and is associated with the given user
    let sessionfound = sessions.find((session) => {
        return session.locationid == locationid && session.userid == userid;
    });

    if (!sessionfound || sessionfound == null || sessionfound == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("this session doesn't exists");
        return;
    }


    var gameState = req.body.gamestate;
    if (!gameState || gameState == null || gameState == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("need the game state to end the session");
        return;
    }

    //marking session done and adding score
    sessionfound.state = "finished";
    sessionfound.GameState = gameState;

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
