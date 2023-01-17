import express from 'express';
import Db from './db.js'
import Redux from 'redux'
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const database = new Db()

class Webstack {
	constructor(port) {
		this.port=port;
		app.use("/static", express.static('./static/'));
		app.use("/Twine", express.static('./Twine/'));
		this.serverStore = Redux.createStore(this.reducer);
		this.initIO();
		http.listen(this.port, () => console.log(`App listening at http://localhost:${this.port}`));
		this.state=database.getData()
	}

	update(){
		this.state= database.getData();
	}

	get() {
		return {
			app
		}
	}

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
					console.log("gstate", JSON.stringify(gstate))
					io.to(id).emit('new connection', gstate)
				}

			
				else {
					console.log("Retrieving state from JSONFS", database.getData())
					io.to(id).emit('new connection', database.getData())
			
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
				
				database.setData(state) // Updates the database
		
			})
		});
	}
}



export default Webstack;