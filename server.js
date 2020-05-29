'use strict';
var http = require('http');
var port = process.env.PORT || 1337;

var express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

const { v4: uuidv4 } = require('uuid');
const { v1: uuidv1 } = require('uuid');

const fs = require('fs');

const users = require("./Users");
const sessions = require("./Sessions");


//register a new user with a random generated ID and the username received
app.post('/register', (req, res) => {
    let username = req.body.username;
    if (!username || username == null || username == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("missing username");
        return;
    }

    //getting users file and adding the new user
    //const users = require("./Users");
    generateUserID((id) => {
        let user = {
            id: id,
            username: username,
        };

        //check if there is a facebook id in the request
        let facebookID = req.body.facebookid;
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

});


//associate a facebook ID with an existing user
app.post('/associatefacebook', (req, res) => {
    let userid = req.body.userid;
    if (!userid || userid == null || userid == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("missing parameter");
        return;
    }

    let facebookID = req.body.facebookid;
    if (!facebookID || facebookID == null || facebookID == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("missing parameter");
        return;
    }

    //const users = require("./Users");

    //check if a user with the id received exists
    findUserByID(userid, (userFound) => {
        if (!userFound || userFound == null || userFound == undefined) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end("user not found");
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
});


//start new session for a user at a location
app.post('/startsession', (req, res) => {
    let userid = req.body.userid;
    let locationID = req.body.locationid;
    if (!userid || userid == null || userid == undefined || !locationID || locationID == null || locationID == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("invalid parameters");
        return;
    }

    //const users = require('./Users');

    //check if a user with the id received exists
    existsUserWithID(userid, (existsUser) => {
        if (!existsUser) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end("user not found");
            return;
        }

        //check if the session already exists
        existsActiveSessionForLocation(locationID, userid, (existsSession) => {
            if (existsSession) {
                res.writeHead(422, { 'Content-Type': 'text/plain' });
                res.end("session already done");
                return;
            }

            //adding the session
            generateSessionID((sessionid) => {
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
        });        
    });    
});


//confirm a session setting his state to playing
app.post('/confirmsession', (req, res) => {
    let userid = req.body.userid;
    let locationID = req.body.locationid;
    if (!userid || userid == null || userid == undefined || !locationID || locationID == null || locationID == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("invalid parameters");
        return;
    }

    //const sessions = require('./Sessions');

    findSessionForLocationUserAndState(locationID, userid, "waiting", (sessionFound) => {
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
});


//get a session for the given location that is in state waiting
app.post('/getnewsession', (req, res) => {

    let locationID = req.body.locationid;
    if (!locationID || locationID == null || locationID == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("invalid parameters");
        return;
    }

    //const sessions = require('./Sessions');
    findWaitingSessionForLocation(locationID, (sessionFound) => {
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
});


//end an active session and adds the score to it
app.post('/endsession', (req, res) => {
    let userid = req.body.userid;
    let locationid = req.body.locationid;
    if (!userid || userid == null || userid == undefined || !locationid || locationid == null || locationid == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("invalid parameters");
        return;
    }

    let gameState = req.body.gamestate;
    if (!gameState || gameState == null || gameState == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("need the game state to end the session");
        return;
    }

    //check if the session exists and is associated with the given user
    findSessionForLocationUserAndState(locationid, userid, "playing", (sessionFound) => {
        if (!sessionFound || sessionFound == null || sessionFound == undefined) {
            res.writeHead(422, { 'Content-Type': 'text/plain' });
            res.end("this session doesn't exists or cannot be ended");
            return;
        }

        //marking session done and adding score
        sessionFound.state = "finished";
        sessionFound.GameState = gameState;

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
});



//admin requests
app.get('/getuser', (req, res) => {
    let userid = req.query.userid;
    if (!userid || userid == null || userid == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("user id needed");
        return;
    }

    findUserByID(userid, (userFound) => {
        if (!userFound || userFound == null || userFound == undefined) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end("user not found");
            return;
        }

        //res.setHeader('userData', userFound);
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(JSON.stringify(userFound, null, 2));
    });
});


app.get('/listusers', (req, res) => {
    //res.setHeader('users', users);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(JSON.stringify(users, null, 2));
});


app.post('/updateuser', (req, res) => {
    let userid = req.body.userid;
    if (!userid || userid == null || userid == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("user id needed");
        return;
    }


    findUserByID(userid, (userFound) => {
        if (!userFound || userFound == null || userFound == undefined) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end("user not found");
            return;
        }

        let newData = req.body.facebookid;
        if (newData && newData != null || newData != undefined)
            userFound.facebookID = newData;
        
        newData = req.body.username;
        if (newData && newData != null || newData != undefined)
            userFound.username = newData;

        fs.writeFile("Users.json", JSON.stringify(users, null, 2), err => {
            if (err) {
                //error handling
                res.writeHead(501, { 'Content-Type': 'text/plain' });
                res.end("server encountered an error");
                return;
            }

            //success
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end("user updated");
        });
    });
});


app.post('/adduser', (req, res) => {
    let username = req.body.username;
    if (!username || username == null || username == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("missing username");
        return;
    }

    //getting users file and adding the new user
    //const users = require("./Users");
    generateUserID((id) => {
        let user = {
            id: id,
            username: username,
        };

        //check if there is a facebook id in the request
        let facebookID = req.body.facebookid;
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
            res.end("user added");
        });
    });

});


app.post('/removeuser', (req, res) => {
    let userid = req.body.userid;
    if (!userid || userid == null || userid == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("user id needed");
        return;
    }


    findUserByID(userid, (userFound) => {
        if (!userFound || userFound == null || userFound == undefined) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end("user not found");
            return;
        }

        users.splice(users.indexOf(userFound), 1);

        fs.writeFile("Users.json", JSON.stringify(users, null, 2), err => {
            if (err) {
                //error handling
                res.writeHead(501, { 'Content-Type': 'text/plain' });
                res.end("server encountered an error");
                return;
            }

            //success
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end("user removed");
        });
    });
});


app.get('/getsession', (req, res) => {
    let sessionid = req.query.sessionid;
    if (!sessionid || sessionid == null || sessionid == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("session id needed");
        return;
    }

    findSessionByID(sessionid, (sessionFound) => {
        if (!sessionFound || sessionFound == null || sessionFound == undefined) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end("session not found");
            return;
        }

        //res.setHeader('sessionData', sessionFound);
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(JSON.stringify(sessionFound, null, 2));
    });
});


app.get('/listsessions', (req, res) => {
    //res.setHeader('sessions', sessions);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(JSON.stringify(sessions, null, 2));
});


app.post('/updatesession', (req, res) => {
    let sessionid = req.body.sessionid;
    if (!sessionid || sessionid == null || sessionid == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("session id needed");
        return;
    }


    findSessionByID(sessionid, (sessionFound) => {
        if (!sessionFound || sessionFound == null || sessionFound == undefined) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end("session not found");
            return;
        }

        let newData = req.body.userid;
        if (newData && newData != null || newData != undefined)
            sessionFound.userid = newData;

        newData = req.body.locationid;
        if (newData && newData != null || newData != undefined)
            sessionFound.locationid = newData;

        newData = req.body.state;
        if (newData && newData != null || newData != undefined)
            sessionFound.state = newData;

        newData = req.body.gamestate;
        if (newData && newData != null || newData != undefined)
            sessionFound.GameState = newData;

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
});


app.post('/addsession', (req, res) => {
    let userid = req.body.userid;
    if (!userid || userid == null || userid == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("user id needed");
        return;
    }

    let locationid = req.body.locationid;
    if (!locationid || locationid == null || locationid == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("location id needed");
        return;
    }

    let state = req.body.state;
    if (!state || state == null || state == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("state needed");
        return;
    }

    let gamestate = req.body.gamestate || "";

    existsSessionForLocationAndUser(locationid, userid, (exists) => {
        if (exists) {
            res.writeHead(422, { 'Content-Type': 'text/plain' });
            res.end("a session with this location and user already exists");
            return;
        }

        generateSessionID((sessionid) => {
            let session = {
                sessionid: sessionid,
                userid: userid,
                locationid: locationid,
                state: state,
                GameState: gamestate
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
                res.end("session added");
            });
        });
    });

});


app.post('/removesession', (req, res) => {
    let sessionid = req.body.sessionid;
    if (!sessionid || sessionid == null || sessionid == undefined) {
        res.writeHead(422, { 'Content-Type': 'text/plain' });
        res.end("session id needed");
        return;
    }


    findSessionByID(sessionid, (sessionFound) => {
        if (!sessionFound || sessionFound == null || sessionFound == undefined) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end("session not found");
            return;
        }

        sessions.splice(sessions.indexOf(sessionFound), 1);

        fs.writeFile("Sessions.json", JSON.stringify(sessions, null, 2), err => {
            if (err) {
                //error handling
                res.writeHead(501, { 'Content-Type': 'text/plain' });
                res.end("server encountered an error");
                return;
            }

            //success
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end("session removed");
        });
    });
});


app.listen(port, function () {
    console.log("server started");
});




//generation of a random ID for a user
async function generateUserID(callback) {
    let id = null;
    const users = require("./Users");
    while (id == null) {
        id = uuidv4();
        if (users.some((user) => { return user.id == id }))
            id = null;
    }
    callback(id);
}

//generation of a random ID for a session
async function generateSessionID(callback) {
    let id = null;
    const sessions = require("./Sessions");
    while (id == null) {
        id = uuidv1();
        if (sessions.some((session) => { return session.sessionid == id }))
            id = null;
    }
    callback(id);
}




//users
async function findUserByID(id, callback) {
    let userFound = users.find(function (user) {
        return user.id == id;
    });
    callback(userFound);
}

async function existsUserWithID(id, callback) {
    let exists = users.some((user) => {
        return user.id == id
    });
    callback(exists);
}


//sessions
async function findSessionByID(sessionid, callback) {
    let sessionFound = sessions.find((session) => {
        return session.sessionid == sessionid;
    });
    callback(sessionFound);
}

async function existsActiveSessionForLocation(locationid, userid, callback) {
    let exists = sessions.some((session) => {
        return session.locationid == locationid && (session.userid == userid || session.state != "finished");
    });
    callback(exists);
}

async function existsSessionForLocationAndUser(locationid, userid, callback) {
    let exists = sessions.some((session) => {
        return session.locationid == locationid && session.userid == userid;
    });
    callback(exists);
}

async function findSessionForLocationUserAndState(locationid, userid, state, callback) {
    let sessionFound = sessions.find((session) => {
        return session.userid == userid && session.locationid == locationid && session.state == state;
    });
    callback(sessionFound);
}

async function findWaitingSessionForLocation(locationid, callback) {
    let sessionFound = sessions.find((session) => {
        return session.locationid == locationid && session.state == "waiting";
    });
    callback(sessionFound);
}
