Error: <<script>>: bad evaluation: Unexpected end of input
	<<script>> 	try { 		console.log("Background script starting..."); 		let imageURL = "Home"; // Default to Home 		let role = State.getVar("$role"); 		let users = State.getVar("$users"); 		console.log(`Role: ${role}, Users defined: ${!!users}`); 		// Check what background to use based on context 		if(tags().includes("Control") || tags().includes("Home")){ 			// Home and Control pages always use Home background 			$('.passage').addClass('passage-home'); 			$("#story").addClass("playerList"); 			imageURL = "Home"; 		} else { 			// Regular gameplay pages - use faction-specific backgrounds 			$("#story").removeClass("playerList"); 			// Check for GOD/admin user 			if (role === "God" || role === "GOD") { 				imageURL = "Control"; // Use Control background for admin 			} 			// Otherwise get faction if role and user exist 			else if (role && users && users[role] && users[role]['faction']) { 				imageURL = users[role]['faction']; 			} 			// Fallback to undefined background if nothing else works 			else { 				imageURL = "undefined"; 			} 		} 		console.log(`Setting background for role: ${role}, imageURL: ${imageURL}`); 		$('#story').css({ 			'backgroundImage': `url(Twine/images/Borders/${imageURL}.jpg)` 		}); 		console.log("Background set successfully"); 	} catch (e) { 		console.error("Error setting background:", e); 	} <</script>>
appendError @ ?nick=Cortes&id=1762545532866:15195
value @ ?nick=Cortes&id=1762545532866:15195
handler @ ?nick=Cortes&id=1762545532866:15195
handler @ ?nick=Cortes&id=1762545532866:15195
value @ ?nick=Cortes&id=1762545532866:15195
Wikifier @ ?nick=Cortes&id=1762545532866:15195
enginePlay @ ?nick=Cortes&id=1762545532866:15195
value @ ?nick=Cortes&id=1762545532866:15195
(anonymous) @ ?nick=Cortes&id=1762545532866:15195
Promise.then
(anonymous) @ ?nick=Cortes&id=1762545532866:15195
e @ ?nick=Cortes&id=1762545532866:57
t @ ?nick=Cortes&id=1762545532866:57
setTimeout
(anonymous) @ ?nick=Cortes&id=1762545532866:57
c @ ?nick=Cortes&id=1762545532866:57
fireWith @ ?nick=Cortes&id=1762545532866:57
fire @ ?nick=Cortes&id=1762545532866:57
c @ ?nick=Cortes&id=1762545532866:57
fireWith @ ?nick=Cortes&id=1762545532866:57
ready @ ?nick=Cortes&id=1762545532866:57
B @ ?nick=Cortes&id=1762545532866:57Understand this warning
Client.js:400 updating sugarcube {totalMissing: 0}
Client.js:400 updating sugarcube {god: false}
Client.js:400 updating sugarcube {users: {…}}
Client.js:400 updating sugarcube {users: {…}}
Client.js:400 updating sugarcube {users: {…}}
Client.js:400 updating sugarcube {users: {…}}
Client.js:400 updating sugarcube {users: {…}}
VM7519:17 playing passage Cortes sets sail from Cuba
Client.js:39 Cortes sets sail from Cuba
?nick=Cortes&id=1762545532866:15195 Error: <<script>>: bad evaluation: Unexpected end of input
	<<script>> 	try { 		console.log("Background script starting..."); 		let imageURL = "Home"; // Default to Home 		let role = State.getVar("$role"); 		let users = State.getVar("$users"); 		console.log(`Role: ${role}, Users defined: ${!!users}`); 		// Check what background to use based on context 		if(tags().includes("Control") || tags().includes("Home")){ 			// Home and Control pages always use Home background 			$('.passage').addClass('passage-home'); 			$("#story").addClass("playerList"); 			imageURL = "Home"; 		} else { 			// Regular gameplay pages - use faction-specific backgrounds 			$("#story").removeClass("playerList"); 			// Check for GOD/admin user 			if (role === "God" || role === "GOD") { 				imageURL = "Control"; // Use Control background for admin 			} 			// Otherwise get faction if role and user exist 			else if (role && users && users[role] && users[role]['faction']) { 				imageURL = users[role]['faction']; 			} 			// Fallback to undefined background if nothing else works 			else { 				imageURL = "undefined"; 			} 		} 		console.log(`Setting background for role: ${role}, imageURL: ${imageURL}`); 		$('#story').css({ 			'backgroundImage': `url(Twine/images/Borders/${imageURL}.jpg)` 		}); 		console.log("Background set successfully"); 	} catch (e) { 		console.error("Error setting background:", e); 	} <</script>>
appendError @ ?nick=Cortes&id=1762545532866:15195
value @ ?nick=Cortes&id=1762545532866:15195
handler @ ?nick=Cortes&id=1762545532866:15195
handler @ ?nick=Cortes&id=1762545532866:15195
value @ ?nick=Cortes&id=1762545532866:15195
Wikifier @ ?nick=Cortes&id=1762545532866:15195
enginePlay @ ?nick=Cortes&id=1762545532866:15195
eval @ VM7519:18
setTimeout
eval @ VM7519:16
call.output.output @ ?nick=Cortes&id=1762545532866:15195
evalJavaScript @ ?nick=Cortes&id=1762545532866:15195
handler @ ?nick=Cortes&id=1762545532866:15195
handler @ ?nick=Cortes&id=1762545532866:15195
value @ ?nick=Cortes&id=1762545532866:15195
Wikifier @ ?nick=Cortes&id=1762545532866:15195
value @ ?nick=Cortes&id=1762545532866:15195
value @ ?nick=Cortes&id=1762545532866:15195
(anonymous) @ ?nick=Cortes&id=1762545532866:15195
Promise.then
(anonymous) @ ?nick=Cortes&id=1762545532866:15195
e @ ?nick=Cortes&id=1762545532866:57
t @ ?nick=Cortes&id=1762545532866:57
setTimeout
(anonymous) @ ?nick=Cortes&id=1762545532866:57
c @ ?nick=Cortes&id=1762545532866:57
fireWith @ ?nick=Cortes&id=1762545532866:57
fire @ ?nick=Cortes&id=1762545532866:57
c @ ?nick=Cortes&id=1762545532866:57
fireWith @ ?nick=Cortes&id=1762545532866:57
ready @ ?nick=Cortes&id=1762545532866:57
B @ ?nick=Cortes&id=1762545532866:57Understand this warning
Library.mp3:1  