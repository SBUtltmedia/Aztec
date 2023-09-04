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
var base64 = require('base-64');




class Webstack {
	constructor(serverConf) {
		this.appIndex = serverConf.appIndex
		this.serverConf = serverConf
		//I'm not sure if this actually saves to GIT because we don't call the function.
		this.port=serverConf.port;
		app.use("/static", express.static('./static/'));
		app.use("/Twine", express.static('./Twine/'));

		//serverStore stores the current game state and is backed up via gitApiIO because Heroku is ephemeral 
		this.serverStore = Redux.createStore(this.reducer);
		this.initIO();

		this.gitApi = new gitApiIO(serverConf, !process.env.port)
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

			let content = {"signal":signal, ...this.serverStore.getState()};
			
			  this.gitApi.uploadFileApi(base64.encode(JSON.stringify(content))).then(
				() => {
					console.log(err)
					process.exit(err ? 1 : 0);
				}).catch(err=>{
					console.log(err)
					process.exit()
				})
			 }
			};
	  
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


			socket.on('fullReset', ()=>{
				console.log("reset start 2")
				this.serverStore.dispatch({
					type: 'REPLACE',
					payload: initVars
				})
				socket.emit('reset', this.serverStore.getState())
				socket.broadcast.emit('reset', this.serverStore.getState())
			})

		});
	}
}





export default Webstack;