import express from 'express';
import gitApiIO from './gitApiIO.js';
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
		app.use("/audio", express.static('./static/audio'));

		//serverStore stores the current game state and is backed up via gitApiIO because Heroku is ephemeral
		this.serverStore = this.createSimpleStore();
		this.io = io; // Expose io for shared routes
		this.initIO();

		this.gitApi = new gitApiIO(serverConf, this.isTest)
		this.gitApi.retrieveFileAPI().then((gameData) => {
			let state = JSON.parse(gameData)
			this.serverStore.replaceState(state);

			http.listen(this.port, () => {});
		}
		).catch(err => {
			console.error('Error starting server:', err.message);
		})



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

	/**
	 * Creates a simple state store to replace Redux
	 * Provides getState(), setState(), and replaceState() methods
	 */
	createSimpleStore() {
		let state = {};

		return {
			getState() {
				return state;
			},
			setState(updates) {
				// Merge updates into existing state
				state = _.merge(state, updates);
			},
			replaceState(newState) {
				// Completely replace the state
				state = newState;
			}
		};
	}

	shutdown(signal) {
		return (err) => {
			this.updateGit(this.isTest).then(
				() => {
					process.exit(err ? 1 : 0);
				}).catch(err=>{
					process.exit()
				})
		}
	}

	updateGit(isTest) {
		let content = {...this.serverStore.getState()};
		return this.gitApi.uploadFileApi(base64.encode(JSON.stringify(content)), this.isTest)
	}
	
	initIO() {
		io.on("connect_error", (err) => {
		  });
		io.on('connection', (socket) => {
			let gstate = this.serverStore.getState();

			// User connects
			socket.once('new user', (id) => {

			
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
				this.serverStore.setState(diff);
				//sends message to all other clients unless inside theyrPrivateVars
				if(!Object.keys(diff).includes("theyrPrivateVars")){
					socket.broadcast.emit('difference', diff)
				}
			})


			socket.on('fullReset', ()=>{
				this.serverStore.replaceState(Object.assign({}, initVars));
				// Note: /updateGit route is registered in sharedRoutes.js
				// Removed duplicate route registration that was causing memory leak
				socket.emit('reset',{})
				socket.broadcast.emit('reset', {})
			})

		});
	}
}





export default Webstack;