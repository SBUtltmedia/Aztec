var socket;

var store ={};
var stateReceived = false;
let lockInfo={};
let deferred;
let waitForData = new Promise((resolve, reject) => {
    deferred = {resolve: resolve, reject: reject};
});

// User connects, asks server for game state

// function setLockInfo(lockId,callback)
// {
//     lockInfo={lockId,callback}  
 
// }

function initTheyr(lockInfo, callback){
    updateSugarCubeState(userData.jsonfsState);
    socket= io();
    store ={}
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
    // // let combinedState= _.merge(state,Window.SugarCubeState.variables)
    // console.log("Combined State", combinedState)
    // store=combinedState;
    // // If the server's state is empty, set with this client's state
    // updateSugarCubeState(combinedState);
    $(document).trigger(":liveupdate");
    // socket.emit('difference',store)


});

// Incoming difference, update your state and store
socket.on('difference', (state) => {
    store = state
    updateSugarCubeState(state) 

    $(document).trigger(":liveupdate");
})


// function reducer(state, action){
    


//     switch(action.type){
//         case 'UPDATESTORE':
//             console.log('Updating Store and Other Clients', action.payload)
//             if (!action.noUpdate) {
//                 console.log("Difference emitted")
//                 socket.emit('difference', {...state, ...action.payload})
//             }
//             $(document).trigger(":liveupdate");
//             return _.cloneDeep(Window.SugarCubeState.variables)
//         case 'UPDATEGAME':
//             console.log('Updating Game', action.payload);
//             updateSugarCubeState(action.payload);
//             $(document).trigger(":liveupdate");
//             return
//         default:
//             return state
//     }
// }

setInterval(update, 100)    
function update() {

    var tempVars={...Window.SugarCubeState.variables}
    delete tempVars['userId'] 
    // console.log(tempVars)

    if(Object.keys(difference(tempVars, store)).length){
        let diff = difference(tempVars, store);
        console.log('diff detected', diff)
        store=_.merge( store,tempVars)
        console.log('diff detected', diff,store)
        updateSugarCubeState(store)
        socket.emit('difference',store)
        $(document).trigger(":liveupdate");

    }


 
}


function difference(object, base) {
	function changes(object, base) {
		return _.transform(object, function(result, value, key) {
            try {
                if (!_.isEqual(value, base[key])) {
                    result[key] = (_.isObject(value) && _.isObject(base[key])) ? changes(value, base[key]) : value;
                }
            }
            catch(err) {
                // console.log("Error in diff:", err);
            }
		});
	}
	return changes(object, base);
}

// Updates client's SugarCube State when state changes are received from the server
function updateSugarCubeState(new_state) {
    for (const [key, value] of Object.entries(new_state)) {
        // console.log({key,value})
        Window.SugarCubeState.variables[key] = value
    }
}
}