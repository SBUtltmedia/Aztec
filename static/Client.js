

var socket;
var store = {};
var stateReceived = false;
let lockInfo = {};
var gameVars;
var lastStats = [];

function init() {
    // $('#passages').html($('#passages').html().replace(/<br><br>/gm, ""));
    $("body").on("click", () => {
        $("body").addClass("blur")
        fade($("body"), 1);
    });
    // setInterval(checkDif, 1000)
}


function setBackground(image) {
    // image = image || "paper.jpg"
    let { faction } = getUser();
    let imageURL = `url('Twine/images/Borders/Observer.jpg')`
    if (faction) {
        imageURL = `url('Twine/images/Borders/${faction}.jpg')`
    }

    $(() => {
        $('#story').css({
            'background-image': imageURL,
            'background-position': '30% 70%,0 0',
            'background-size': '100% 100%'
        })
    })
}


function fade(el, destination) {
    $({
        opacity: 1 - destination
    })
        .animate({
            opacity: destination
        }, {
            duration: 2000,
            step: function () {
                $(el).css({
                    opacity: this.opacity
                })
            }
        });
}


$(document).on(':passagestart', (ev) => {

    fade($("#passages"), 1);
})


/* JavaScript code */


function showMap() {
    var map = $('#map')
    if (!map.length) {
        $('#story').append($('<img/>', {
            "id": "map",
            "name": "map"
        }))
    }

    // let { faction, role } = getUser();
   let  faction =  Window.SugarCubeState.variables['users'][Window.SugarCubeState.variables.userId]["faction"]
    var currentMap =  Window.SugarCubeState.variables['users'][Window.SugarCubeState.variables.userId].currentMap
    // let currentMapIndex = 0
    if (!currentMap) {
        let currentMapIndex = Window.SugarCubeState.getVar(`$${faction}_currentMap`) || 0;
        currentMap = `${faction}_${currentMapIndex}.png`
    }
    let map_src = $('#map').attr("src")

    if (map_src != currentMap) {
        $('#map').attr("src", `Twine/images/${currentMap}`)
    }
}

function showStats() {
    let { role, faction } = getUser();
    var stats = {
        "Strength": 0,
        "Wisdom": 0,
        "Loyalty": 0
    }

    var displayStats = $('<div/>', {
        "id": "displayStats",
    })

    let userId =  Window.SugarCubeState.variables.userId
    let twineStats =  Window.SugarCubeState.variables.users[userId].stats



    if (twineStats) {
        Object.keys(stats).forEach((stat, idx) => {
            var twineVar = twineStats[stat]

            displayStats.append(
                $('<div/>', {
                    "class": "stat",
                    "css": { "background-image": `url(Twine/images/Stats/${faction}_${stat}.png)` }
                }).append($('<div/>', {
                    "class": "statNum",
                    "html": twineVar || "0"
                })))
        })

        var dispLayStatsDOM = $('#displayStats')

        if (!dispLayStatsDOM.length) {
            $('#story').append(displayStats)
        }
        else {
            dispLayStatsDOM.replaceWith(displayStats)
        }
    }

    // let twineVar = SugarCube.State.variables[`${faction}_strength`];
    let factions =  Window.SugarCubeState.variables['factions']

    let twineVar = factions[faction]['stats']['Strength'];

    if (twineVar) {
        let statString = `${faction}: ${twineVar} `;
        if (!$('#factionStrength').length) {

            $('#story')
                .append($('<div/>',
                    {
                        "id": "factionStrength",
                    })
                    .append(
                        $('<div/>', {
                            "id": "factionStrengthBar",
                            // "html": statString
                        }))
                ).append($('<div/>', {
                    "id": "factionStrengthLabel",
                    // "html": statString
                }))
        }
        $("#factionStrengthLabel").html(statString);
        setFactionStrength(twineVar)  // set back to twineVar
    }

}


function setFactionStrength(rawValue) {
    var maxValue = 14;
    var value = rawValue / maxValue * 100;
    //console.log({value, rawValue});


    let gradientMask = `linear-gradient(90deg, black 0%, black ${Math.floor(value)}%, transparent ${Math.min(100, value + 10)}%)`;
    let maskStyle = `-webkit-mask-image:${gradientMask};mask-image:${gradientMask};`;
    // console.log(maskStyle)
    $("#factionStrengthBar").attr("style", maskStyle)

}

function makeRoleStats(statsIn) {
    var total = 0;

    let userId = Window.SugarCubeState.variables.userId;
    let user = Window.SugarCubeState.variables.users[userId]
   // let role= Window.SugarCubeState.variables.users[userId]["role"]
    var output = "";

    user["stats"] = statsIn;

    //try to only send stats of user
      socket.emit('difference',  Window.SugarCubeState.variables)
    Object.keys(statsIn).forEach((stat) => {
        val = parseInt(statsIn[stat]);
        // SugarCube.State.variables[`${role}_${stat}`] = val;
        output += `${stat}: ${val}\n`;
    }
    )
    $('#statsPicker').html(output)
  
    showStats()
}


function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function changeStats(rolePlay, newStats) {
    let usersObj= Window.SugarCubeState.variables.users;
    let currentUserId = Object.keys(usersObj).find(userId => usersObj[userId].role == rolePlay)
    if(currentUserId == undefined){
        currentUserId = "test"
    }
    console.log("user:" , currentUserId)
    let currentUser =usersObj[currentUserId]
    let roleStats = currentUser.stats
    Object.keys(roleStats).forEach((stat, idx) => {
        console.log( roleStats[stat])
        roleStats[stat] = parseInt(newStats[stat]) + parseInt(roleStats[stat])
        console.log(newStats[stat])
    });
    Window.SugarCubeState.variables.users[currentUserId]["stats"] =roleStats;
    console.log(currentUser)
}






// Returns the role of the current player
function getUser() {
    let userId = Window.SugarCubeState.getVar("$userId");

    console.log({userId});
    let user =  Window.SugarCubeState.getVar("$users")[userId];
    return user;
}


//Beginning of Old Client.js

// User connects, asks server for game state

// function setLockInfo(lockId,callback)
// {
//     lockInfo={lockId,callback}  

/*
Takes in a diffkey after calling custom twine set macro. Will create a difference object with the diffKey
as the key and it's new value after setting is done. 

Sends the emits difference with the diff object as the payload to notify serverstore to update

Value cannot be read from sugarcube macro call because only twine can read the syntax.
*/
function diffSet(diffKey){
    //find new value after setting is done
    let keys = SugarCubeToJavascript(diffKey);
    let currKey;
    let prevKey = Window.SugarCubeState.getVar(diffKey);
    while(keys.length > 0){
        currKey = {[keys.pop()]: prevKey};
        prevKey = currKey;
    }
    let diff = currKey;
    console.log("diff:", currKey);
    socket.emit('difference',  diff)
}

/*
Converts a Sugarcube string representing a variable accessible via State.getVar()
to the javascript version which is accessible via Window.SugarCubeState['key'].

*/
function SugarCubeToJavascript(key){
    var found;
    var list = []
    var str;
    list.push(((key.includes("[") ? key.substring(0, key.indexOf("[")) : key)).slice(1));
    var reBrackets = /(?<=\[)(?:[^[\]]+|\[[^\]]+\])+/g;
    while(found = reBrackets.exec(key)){
        str = found[0]
        //in the case of nested argument

        if(str.includes("$") || str.substring(0,1) == "_"){
            list.push(Window.SugarCubeState.getVar(str));
        }else{
            str = str.replace(/["']/g, "");
            list.push(str);
        }
    }
    

    return list;
}

function initTheyr(lockInfo) {
    updateSugarCubeState(userData.gameState);
    socket = io();
    store = {}
    // Receive state from server upon connecting, then update all other clients that you've connected
    socket.on('connect', () => {
        socket.emit('new user', socket.id);
        console.log(lockInfo)
        lockInfo.callback(lockInfo.lockId)
    })

    socket.on('new connection', (state) => {
        // console.log("LOAD #2: RECEIEVE STATE");
        // console.log("Connecting state:", state)
        // console.log("Current State:", Window.SugarCubeState.variables)
        let combinedState = Object.assign({}, Window.SugarCubeState.variables,state)
        // console.log("Combined State", combinedState)
        store = combinedState;
        // If the server's state is empty, set with this client's state
    //    updateSugarCubeState(combinedState);
        $(document).trigger(":liveupdate");



    });

    // Incoming difference, update your state and store
    socket.on('difference', (diff) => {
        store = _.merge(store, diff);
        console.log("updating sugarcube", diff);
        updateSugarCubeState(diff)

        $(document).trigger(":liveupdate");
    })



    // setInterval(update, 100)

   function difference(object, base) {
        function changes(object, base) {
            return _.transform(object, function (result, value, key) {
                try {
                    if (!_.isEqual(value, base[key])) {
                        result[key] = (_.isObject(value) && _.isObject(base[key])) ? changes(value, base[key]) : value;
                    }
                }
                catch (err) {
                    // console.log("Error in diff:", err);
                }
            });
        }
        return changes(object, base);
    }

    function update() {

        var tempVars = Object.assign({},Window.SugarCubeState.variables);
       // console.log("SG",JSON.stringify(tempVars.users[tempVars.userId]))

       // console.log("store",JSON.stringify(store.users[tempVars.userId]))
        delete tempVars['userId']
        delete store['userId']
        // console.log(tempVars)

        // if (_.isEqual(tempVars, store)) {
        // if (JSON.stringify(tempVars) != JSON.stringify(store)) {
            let tempStore = Object.assign({},store, {});
        
            let diff = difference(tempVars, tempStore);
            
            if(Object.keys(diff).length){
                // console.log("store", store)
                // console.log("statevars", tempVars)
                // console.log("diff detect:", diff);
                store = tempVars;
                
                // updateSugarCubeState(store)
                socket.emit('difference', diff)
                $(document).trigger(":liveupdate");
            }
        // }
        // }



    }


    // Updates client's SugarCube State when state changes are received from the server
    function updateSugarCubeState(new_state) {
        for (const [key, value] of Object.entries(new_state)) {
            // console.log({key,value})
            Window.SugarCubeState.variables[key] = value
        }
    }
}