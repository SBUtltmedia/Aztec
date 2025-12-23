var socket;
var exceptions = []
var stateReceived = false;
let lockInfo = {};
var gameVars;
var lastStats = [];
var buffer = [];

window.addEventListener('message', function (event) {
    // Verify the origin of the message for security
    // Allow messages from same origin or configured origins
    const allowedOrigins = [window.location.origin];
    if (!allowedOrigins.includes(event.origin)) {
        console.warn('Blocked message from unauthorized origin:', event.origin);
        return;
    }

    if (event.data && event.data.type === 'statsUpdate') {
        const { strength, wisdom, loyalty } = event.data;
        let users = window.SugarCubeState.getVar("$users")
        // let userId=window.SugarCubeState.getVar("$userId")
        var userId = window.SugarCubeState.getVar("$role");
        var user = window.SugarCubeState.getVar("$users")[userId];
        user["stats"]["Strength"] += strength
        user["stats"]["Wisdom"] += wisdom
        user["stats"]["Loyalty"] += loyalty
        // Object.keys(users).array.forEach(element => {
        //     console.log(element)
        // });
showStats()
        //  window.SugarCubeState.setVar("$strength")
        // You can then use these values in your parent application
    }
}, false);

function init() {
    // $('#passages').html($('#passages').html().replace(/<br><br>/gm, ""));

    $("body").addClass("blur")
    $("body").one("click", () => {
        $("body").removeClass("blur")
    });
    // setInterval(checkDif, 1000)
}



/**
 * Loads twine background based on the player's faction
 */
function setBackground() {
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

/**
 * Fade in effect
 * 
 * @param {*} el 
 * @param {*} destination 
 */
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
    init()
    //fade($("#passages"), 1);
})

$(document).ready(() => {
    //fade($("#passages"), 1);
})


/* JavaScript code */

function showMap() {
    // Guard: Check if SugarCube is initialized
    if (!window.SugarCubeState || !window.SugarCubeState.variables) {
        console.warn("SugarCube not initialized yet, cannot show map");
        return;
    }

    var map = $('#map')
    if (!map.length) {
        $('#story').append($('<img/>', {
            "id": "map",
            "name": "map"
        }))
    }

    let roleVar = window.SugarCubeState.variables.role
    let users = window.SugarCubeState.variables['users']

    // Check if role exists and user is defined
    if (!roleVar || !users || !users[roleVar]) {
        return; // Exit silently if user not found (e.g., GOD user)
    }

    let user = users[roleVar]
    let role = user.role
    let faction = user.faction
    var currentMapIndex = parseInt(user.currentMap)
    let currentMap

    if (!currentMapIndex) {
        let currentMapIndex = window.SugarCubeState.getVar(`$${faction}_currentMap`) || 0;
        currentMap = `${faction}_${currentMapIndex}.png`
    } else {
        currentMap = `${role}_${currentMapIndex}.png`
    }

    let map_src = $('#map').attr("src")

    if (map_src != currentMap) {
        $('#map').attr("src", `Twine/images/maps/${currentMap}`)
    }
}

/**
 * Displays player's stats widget
 */
function showStats() {
    // Guard: Check if SugarCube is initialized
    if (!window.SugarCubeState || !window.SugarCubeState.variables) {
        console.warn("SugarCube not initialized yet, cannot show stats");
        return;
    }
    console.log("showStats: Fired");

    var stats = {
        "Strength": 0,
        "Wisdom": 0,
        "Loyalty": 0
    }

    var displayStats = $('<div/>', {
        "id": "displayStats",
    })

    let roleVar = window.SugarCubeState.variables.role
    let users = window.SugarCubeState.variables['users']
    console.log("showStats: roleVar:", roleVar, "users:", users);


    // Check if role exists and user is defined
    if (!roleVar || !users || !users[roleVar]) {
        console.warn("showStats: User or role not found, exiting.", "roleVar:", roleVar, "users:", users);
        return; // Exit silently if user not found (e.g., GOD user)
    }

    let user = users[roleVar];
    console.log("showStats: user object:", user);
    let twineStats = user.stats;
    console.log("showStats: user.stats:", twineStats);
    let faction = user["faction"];

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

    let factions = window.SugarCubeState.variables['factions']
    if (factions && factions[faction] && factions[faction]['stats']) {
        let twineVar = factions[faction]['stats']['Strength'];

        if (twineVar != null) {
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

/**
 * Creates stat picker widget when player gets to pick their stats
 * 
 * @param {object} statsIn: a player's default stats
 */
function makeRoleStats(statsIn) {
    console.log("makeRoleStats: Fired with statsIn:", statsIn);
    let role = window.SugarCubeState.variables.role;
    let users = window.SugarCubeState.variables.users;
    console.log("makeRoleStats: role:", role, "users:", users);
    
    if (!users || !users[role]) {
        console.error("makeRoleStats: User object not found for role:", role);
        return;
    }

    let user = users[role]
    var output = "";

    if(!user["stats"]){
        user["stats"] = {}
    }
    user["stats"] = statsIn;
    console.log("makeRoleStats: Set user.stats to:", user.stats);


    //TODO: try to only send stats of user
    socket.emit('difference', window.SugarCubeState.variables)
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

/**
 * A function to modify a role's stats
 * 
 * @param {string} rolePlay: the role whose stats are being modified
 * @param {object} newStats: the new stat values
 */
function changeStats(rolePlay, newStats) {
    let usersObj = window.SugarCubeState.variables.users;
    let currentUserId = window.SugarCubeState.variables.role
    if (currentUserId == undefined) {
        currentUserId = "NotSeen"
    }
    let currentUser = usersObj[currentUserId]
    let roleStats = currentUser.stats
    Object.keys(roleStats).forEach((stat, idx) => {
        roleStats[stat] = parseInt(newStats[stat]) + parseInt(roleStats[stat])
    });
    window.SugarCubeState.variables.users[currentUserId]["stats"] = roleStats;

    //renaming rolestats to stats so a diff object can be created
    let stats = roleStats
    let diff = { users: { [currentUserId]: { stats } } };

    socket.emit('difference', diff);
}

function fullReset() {
    socket.emit('fullReset', '');
}

function DOMTest() {
    // Note: This function appears to be for testing purposes
    // If async behavior is needed, this should return a Promise
    return $("#passages").children()[0].innerHTML
}








// Returns the role of the current player
function getUser() {
    let userId = window.SugarCubeState.getVar("$role");
    let user = window.SugarCubeState.getVar("$users")[userId];
    return user;
}


//Creates a handler for the state proxy, maintains entire path of var getting set for emitting to webstack
function createHandler(path = []) {
    return {
        get(target, key) {
            if (path.length == 0 && key != `variables`) {
                return target[key];
            }
            if (typeof target[key] === 'object' && Array.isArray(target[key]) == false && target[key] !== null) {
                return new Proxy(target[key], createHandler([...path, key]))
            } else {
                return target[key];
            }
        },
        set(target, key, value) {
            if (target[key] != value) {
                target[key] = value
                path.shift();
                diffSet([...path, key], value)
            }
            return true
        }
    }
}


/**
 * Takes in a pathArr after proxy on setting SugarCubeState is triggered. Will create a difference object with the diffKey
    as the key and it's new value after setting is done. 

    Sends the emits difference with the diff object as the payload to notify serverstore to update

 * @param {Array} pathArr: path followed by proxy to get to value being set
 * @param {*} value: the new value of whatever is being set
 * @returns 
 */
function diffSet(pathArr, value) {
    //find new value after setting is done

    //If an varible that has been labeled an exception is being set, stop
    if (exceptions.includes(pathArr[0])) {
        return;
    }
    let currKey;
    let prevKey = value
    while (pathArr.length > 0) {
        currKey = { [pathArr.pop()]: prevKey };
        prevKey = currKey;
    }

    socket.emit('difference', currKey)
    $(document).trigger(":liveupdate");

}

function initTheyr(lockInfo) {
    console.log("initTheyr: Fired");
    console.log("initTheyr: Initial userData.gameState:", userData.gameState);
    console.log("initTheyr: Initial SugarCube state:", window.SugarCubeState.variables);

    updateSugarCubeState(userData.gameState);
    console.log("initTheyr: SugarCube state after update:", window.SugarCubeState.variables);


    socket = io();
    // Receive state from server upon connecting, then update all other clients that you've connected
    socket.on('connect', () => {
        console.log("Socket.io: Connected");
        socket.emit('new user', socket.id);
        lockInfo.callback(lockInfo.lockId)
    })

    socket.on('new connection', (state) => {
        // console.log("LOAD #2: RECEIEVE STATE");
        // Check if SugarCube is initialized before accessing variables
        if (!window.SugarCubeState || !window.SugarCubeState.variables) {
            console.warn("SugarCube not initialized yet, deferring 'new connection' handler");
            setTimeout(() => {
                socket.emit('new connection', state);
            }, 100);
            return;
        }
        // console.log("Current State:", window.SugarCubeState.variables)
        let combinedState = Object.assign({}, window.SugarCubeState.variables, state)
        // console.log("Combined State", combinedState)
        // If the server's state is empty, set with this client's state
        //    updateSugarCubeState(combinedState);
        $(document).trigger(":liveupdate");
    });

    // Incoming difference, update your state and store
    // Track last received sequence number (Fix #4)
    let lastReceivedSeq = 0;

    socket.on('difference', (payload) => {
        // Handle new format with sequence numbers (Fix #4)
        const diff = payload.diff || payload;
        const seq = payload.seq || 0;
        const clientSeq = payload.clientSeq;

        console.log(`Socket.io: Received difference (seq: ${seq}, clientSeq: ${clientSeq}):`, diff);

        // Detect out-of-order updates (Fix #4)
        if (seq > 0 && seq < lastReceivedSeq) {
            console.warn(`Out-of-order update detected! seq ${seq} after ${lastReceivedSeq}`);
            // Still apply it, but log the issue
        }

        lastReceivedSeq = Math.max(lastReceivedSeq, seq);

        updateSugarCubeState(diff);
        _.merge(buffer, diff);
        $(document).trigger(":liveupdate");
    })

    socket.on('reset', (diff) => {
        resetSugarCubeState(diff)

        $(document).trigger(":liveupdate");
    })

    // Periodic state reconciliation (Fix #3)
    let lastSyncTime = Date.now();
    const SYNC_INTERVAL = 30000; // 30 seconds

    setInterval(() => {
        if (Date.now() - lastSyncTime > SYNC_INTERVAL) {
            requestFullStateSync();
            lastSyncTime = Date.now();
        }
    }, SYNC_INTERVAL);

    function requestFullStateSync() {
        $.ajax({
            url: '/state/full',
            method: 'GET',
            success: function(serverState) {
                console.log('Periodic sync: Reconciling state with server');
                reconcileState(serverState);
            },
            error: function(err) {
                console.warn('Periodic sync failed:', err);
            }
        });
    }

    function reconcileState(serverState) {
        if (!window.SugarCubeState || !window.SugarCubeState.variables) {
            console.warn('SugarCube not ready for reconciliation');
            return;
        }

        const clientState = window.SugarCubeState.variables;
        const differences = findStateDifferences(clientState, serverState);

        if (differences.length > 0) {
            console.warn('State drift detected! Syncing from server:', differences);

            // Merge server state (server wins)
            _.merge(window.SugarCubeState.variables, serverState);
            $(document).trigger(":liveupdate");
        } else {
            console.log('State sync: No drift detected');
        }
    }

    function findStateDifferences(clientState, serverState) {
        const diffs = [];

        // Check critical paths for differences
        const criticalPaths = [
            'users',
            'Start',
            'chatlog'
        ];

        criticalPaths.forEach(path => {
            const clientVal = _.get(clientState, path);
            const serverVal = _.get(serverState, path);

            if (!_.isEqual(clientVal, serverVal)) {
                diffs.push({
                    path,
                    client: clientVal,
                    server: serverVal
                });
            }
        });

        return diffs;
    }
}



// Updates client's SugarCube State when state changes are received from the server
function updateSugarCubeState(new_state) {
    // Check if SugarCube is initialized
    if (!window.SugarCubeState || !window.SugarCubeState.variables) {
        console.warn('SugarCube not initialized yet, deferring state update');
        // Retry after a short delay
        setTimeout(() => updateSugarCubeState(new_state), 100);
        return;
    }

    _.merge(window.SugarCubeState.variables, new_state);

    $(document).trigger(":liveupdate");
}

// Updates client's SugarCube State when state changes are received from the server
function resetSugarCubeState(new_state) {
    // Check if SugarCube is initialized
    if (!window.SugarCubeState || !window.SugarCubeState.variables) {
        console.warn('SugarCube not initialized yet, deferring state reset');
        setTimeout(() => resetSugarCubeState(new_state), 100);
        return;
    }

    for (var member in window.SugarCubeState.variables) delete window.SugarCubeState.variables[member];
    location.reload()
    $(document).trigger(":liveupdate");
}

//Exceptions are global variables that shouldn't be shared between users
function addTheyrException(varName) {
    varName = varName.replace('State.variables.', '')
    exceptions.push(varName);
}