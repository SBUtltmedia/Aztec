import express from 'express';
import gitApiIO from './gitApiIO.js';
import Redux from 'redux'
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const _ = require("lodash"); 
const initVars = require("./initVars.json");
var base64 = require('js-base64');




class Webstack {
	constructor(serverConf) {
		this.appIndex = serverConf.appIndex
		this.serverConf = serverConf
		this.isTest = !process.env.port;
		//I'm not sure if this actually saves to GIT because we don't call the function.
		this.port=serverConf.port;
		app.use("/static", express.static('./static/'));
		app.use("/Twine", express.static('./Twine/'));
		app.use("/UnityWebGL", express.static('./UnityWebGL/', {
			setHeaders: (res, path) => {
				if (path.endsWith('.br')) {
					res.setHeader('Content-Encoding', 'br');
				}
				if (path.endsWith('.data.br')) {
					res.setHeader('Content-Type', 'application/octet-stream');
				}
				if (path.endsWith('.wasm.br')) {
					res.setHeader('Content-Type', 'application/wasm');
				}
				if (path.endsWith('.js.br')) {
					res.setHeader('Content-Type', 'application/javascript');
				}
			}
		}));
		app.use("/audio", express.static('./static/audio'));

		//serverStore stores the current game state and is backed up via gitApiIO because Heroku is ephemeral 
		this.serverStore = Redux.createStore(this.reducer);
		this.initIO();

		this.gitApi = new gitApiIO(serverConf, this.isTest)
		this.gitApi.retrieveFileAPI().then((gameData) => {
			let state = JSON.parse(gameData)
			this.serverStore.dispatch({
				type: 'UPDATE',
				payload: state
			})
	
			http.listen(this.port, () => console.log(`App listening at http://localhost:${this.port}`));
		}
		).catch(err => {
			console.log(err.message);
			response.write(err.message, 'utf8', () => {
				console.log(err.message);
			})
		})


	
			console.log("port exists")
			process
				.on('SIGTERM', this.shutdown('SIGTERM'))
				.on('SIGINT', this.shutdown('SIGINT'))
				.on('uncaughtException', this.shutdown('uncaughtException'));

	}


	get() {
		return {
			app
		}
	}

	// shutdown(signal) {
	// 	return (err) => {
	// 	 console.log('doing stuff')
	// 	  this.saveJSON = new gitApiIO({content: base64.encode(JSON.stringify(this.serverStore.getState())), 
	// 		fileName: `aztec-${this.appIndex}.json`,
	// 	...this.config})
	// 	  this.saveJSON.uploadFileApi().then(
	// 		() => {
	// 			process.exit(err ? 1 : 0);
	// 		})
	// 	 }
	// 	};

		shutdown(signal) {
		return (err) => {
			console.log('shutting down', signal)

		
		
		this.updateGit(this.isTest).then(
			() => {
				console.log(err)
				process.exit(err ? 1 : 0);
			}).catch(err=>{
				console.log(err)
				process.exit()
			})
			}
		}

		updateGit(isTest, ){
			let content = {...this.serverStore.getState()};
			console.log("is Test:", this.isTest)
			return this.gitApi.uploadFileApi(base64.encode(JSON.stringify(content)),this.isTest)

		}
	  
	//Controller for serverStore
	reducer(state, action) {
		// console.log({state})
		// console.log(JSON.stringify({action}));
		switch (action.type) {
			case 'UPDATE':
				let temp = _.merge(state, action.payload);
				// console.log("temp:", JSON.stringify(temp.users))
				return temp;

			case 'REPLACE':
				console.log("replacing everything with:", action.payload)
				return action.payload;
			default:
				return state
		}
	}
	
	initIO() {
		io.on("connect_error", (err) => {
			console.log(`connect_error due to ${err.message}`);
		  });
		io.on('connection', (socket) => {
			let gstate = this.serverStore.getState();

			// User connects 
			socket.once('new user', (id) => {
				console.log("SERVER RECEIVES NEW USER:", id);

			
				if (typeof gstate !== 'undefined') {
					//console.log("gstate", JSON.stringify(gstate))
					io.to(id).emit('new connection', gstate)
				}

			
				else {
					//console.log("Retrieving state from JSONFS", database.getData())
					io.to(id).emit('new connection', {})
				}
			})

			// When a client detects a variable being changed they send the difference signal which is
			// caught here and sent to other clients
			socket.on('difference', (diff) => {
				this.serverStore.dispatch({
					type: 'UPDATE',
					payload: diff
				})
				//sends message to all other clients unless inside theyrPrivateVars
				if(!Object.keys(diff).includes("theyrPrivateVars")){
					socket.broadcast.emit('difference', diff)
				}
			})

			// Handle stateUpdate from th-set macro (EngineDemo)
			socket.on('stateUpdate', (data) => {
				console.log('[SERVER] Received stateUpdate:', data);

				// Extract variable name without $ prefix for server store
				const varName = data.variable.startsWith('$') ? data.variable.substring(1) : data.variable;

				// Handle nested paths like users[alice].score
				const diff = {};
				_.set(diff, varName, data.value);

				// Update server store
				this.serverStore.dispatch({
					type: 'UPDATE',
					payload: diff
				})

				// Broadcast to all other clients
				console.log('[SERVER] Broadcasting stateUpdate to other clients');
				socket.broadcast.emit('difference', diff);
			})

			// Handle Atomic Updates (Math on Server) to prevent race conditions
			socket.on('atomicUpdate', (data) => {
				// data = { variable: 'sharedCounter', operation: 'add', value: 1 }
				// console.log('[SERVER] Atomic Update:', data);

				const varName = data.variable.startsWith('$') ? data.variable.substring(1) : data.variable;
				let currentState = this.serverStore.getState();
				
				// Get current value from deep path (e.g. users.alice.score)
				let currentValue = _.get(currentState, varName);

				// If undefined, assume 0 for math operations
				if (currentValue === undefined || currentValue === null) currentValue = 0;
				
				// Force numeric conversion for safety
				currentValue = Number(currentValue);
				let operand = Number(data.value);
				let newValue = currentValue;

				switch(data.operation) {
					case 'add': newValue += operand; break;
					case 'subtract': newValue -= operand; break;
					case 'multiply': newValue *= operand; break;
					case 'divide': newValue /= operand; break;
					case 'modulus': newValue %= operand; break;
					case 'set': newValue = data.value; break; // Fallback for absolute sets
					default: return; // Unknown op
				}

				// Create the diff object to update the store
				const diff = {};
				_.set(diff, varName, newValue);

				// Dispatch update
				this.serverStore.dispatch({
					type: 'UPDATE',
					payload: diff
				})

				// Broadcast to EVERYONE (including sender, so they get the authoritative result)
				socket.emit('difference', diff);
				socket.broadcast.emit('difference', diff);
			});

			socket.on('fullReset', ()=>{
				console.log("reset start 2")
				this.serverStore.dispatch({
					type: 'REPLACE',
					payload: Object.assign({}, initVars)
				})
				app.post('/updateGit',(req, res) => {
					res.send({})
				  })
				socket.emit('reset',{})
				socket.broadcast.emit('reset', {})
			})

		});
	}
}





export default Webstack;