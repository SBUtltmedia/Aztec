var socket ;;

var store 
var stateReceived = false;
let lockInfo={};
let deferred;
let waitForData = new Promise((resolve, reject) => {
    deferred = {resolve: resolve, reject: reject};
});

// User connects, asks server for game state

function setLockInfo(lockId,callback)
{
    lockInfo={lockId,callback}  
 
};
function initTheyr(){
    socket= io();
    store = Redux.createStore(reducer);
// Receive state from server upon connecting, then update all other clients that you've connected
socket.on('connect', () => {
    socket.emit('new user', socket.id);
    console.log(lockInfo)
    lockInfo.callback(lockInfo.lockId)
})

socket.on('new connection', (state) => {
    console.log("LOAD #2: RECEIEVE STATE");
    console.log("Connecting state:", state)
    console.log("Current State:", Window.SugarCubeState.variables)

    // If the server's state is empty, set with this client's state
    if (_.isEqual(state, {})) {
        state = Window.SugarCubeState.variables
    }



    store.dispatch({type: 'UPDATEGAME', payload: state, connecting: true})
    store.dispatch({type: 'UPDATESTORE', payload: state, connecting: true})
    stateReceived = true;

    deferred.resolve("");

});

// Incoming difference, update your state and store
socket.on('difference', (state) => {
    console.log("Difference received from the server")
    store.dispatch({type: 'UPDATEGAME', payload:state})
    store.dispatch({type: 'UPDATESTORE', payload: state, noUpdate: true})
})


function reducer(state, action){
    
    // Checks for undefined to prevent feedback loop. Skips undefined check if connecting to the game (updates game as soon as client joins)
    // if(state === undefined && action.connecting !== undefined) {
    //     console.log("State is undefined")
    //     return {...state, ...Window.SugarCubeState.variables}
    // }

    switch(action.type){
        case 'UPDATESTORE':
            console.log('Updating Store and Other Clients', action.payload)
            if (!action.noUpdate) {
                console.log("Difference emitted")
                socket.emit('difference', {...state, ...action.payload})
            }
            $(document).trigger(":liveupdate");
            // if (!action.self && !action.connecting && lastUpdate < new Date() - 1000) {
            //     reloadPassage();
            // }
            return _.cloneDeep(Window.SugarCubeState.variables)
        case 'UPDATEGAME':
            console.log('Updating Game', action.payload);
            updateSugarCubeState(action.payload);
            $(document).trigger(":liveupdate");
            return
        default:
            return state
    }
}

setInterval(update, 100)    // Check for differences and send a socket event to the server with your current state if differences are found 

// If differences between SugarCube state and store detected, update your store and the other clients
function update() {
    if(!_.isEqual(Window.SugarCubeState.variables, store.getState())){
        let diff = difference(Window.SugarCubeState.variables, store.getState());
        console.log('diff detected', diff)
        store.dispatch({type: 'UPDATESTORE', payload: diff, self: true});
    }
}

// Finds the difference between 2 different objects (Used to compare SugarCube State and Store)
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
        console.log({key,value})
        Window.SugarCubeState.variables[key] = value
    }
}
}