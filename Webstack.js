import express from 'express';
import gitApiIO from './gitApiIO.js';
import Redux from 'redux'
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
var base64 = require('base-64');




class Webstack {
	constructor(port, appIndex,config) {
		
		config.fileName = `aztec-${appIndex}.json`
		this.appIndex = appIndex
		this.config = config
		//I'm not sure if this actually saves to GIT because we don't call the function.
		this.port=port;
		app.use("/static", express.static('./static/'));
		app.use("/Twine", express.static('./Twine/'));
		this.serverStore = Redux.createStore(this.reducer);
		this.initIO();
		http.listen(this.port, () => console.log(`App listening at http://localhost:${this.port}`));
		//this.state=database.getData()
		
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

	shutdown(signal) {
		return (err) => {
		 console.log('doing stuff')
		let content = {"signal":signal,...this.serverStore.getState()}
		 this.saveJSON = new gitApiIO({content: base64.encode(JSON.stringify(content)), 
			fileName: `aztec-${this.appIndex}.json`,
			...this.config})
		  this.saveJSON.uploadFileApi().then(
			() => {
				console.log(err)
				process.exit(err ? 1 : 0);
			}).catch(err=>{
				console.log(err)
				process.exit()})
		 }
		};
	  
	reducer(state, action) {
		switch (action.type) {
			case 'UPDATE':
				return {
					...state, ...action.payload
				}
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
			
				}
			})

	
			socket.on('difference', (state) => {
				// console.log(state)
				delete state['userId'] // Removes userId from the global state (Prevents users overriding each other's userId variables)
				this.serverStore.dispatch({
					type: 'UPDATE',
					payload: state
				})
				socket.broadcast.emit('difference', state)
		
			})

		});
	}
}





export default Webstack;