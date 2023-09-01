class ChatMessage {
    constructor(text, role, imageSrc) {
      this.text = text;
      this.role = role;
      this.src = imageSrc
      this.timestamp = Date.now();
    }
  
    getFormattedTimestamp() {
      const options = { hour: 'numeric', minute: 'numeric', hour12: true };

      return new Date(this.timestamp).toLocaleString('en-US', options);
    }
  
    render() {
      // create each div that makes our message look nicely structured
      let playerMessage = document.createElement('div');
      playerMessage.classList.add('playerMessage');

      let playerMessageLeft = document.createElement('div');
      playerMessageLeft.classList.add('playerMessageLeft');

      let playerMessageIconImg = document.createElement('img');
      playerMessageIconImg.classList.add('playerMessageIconImg');

      let playerMessageLeftText = document.createElement('div');
      playerMessageLeftText.classList.add('playerMessageLeftText');

      let playerMessageUsername = document.createElement('div');
      playerMessageUsername.classList.add('playerMessageUsername');

      let playerMessageText = document.createElement('div');
      playerMessageText.classList.add('playerMessageText');
  
      // add the time
      let playerMessageTimeStamp = document.createElement('div');
      playerMessageTimeStamp.classList.add('playerMessageTimeStamp');
      playerMessageTimeStamp.textContent = this.getFormattedTimestamp();
      
      // add in the message
      playerMessageText.textContent = this.text;
  
      // add in the players role
      playerMessageUsername.textContent = this.role;

      // adds in the players role icon
      playerMessageIconImg.src = this.src;
  
      // construct the message
      playerMessage.appendChild(playerMessageLeft);
      playerMessage.appendChild(playerMessageText);

      playerMessageLeft.appendChild(playerMessageIconImg);
      playerMessageLeft.appendChild(playerMessageLeftText);

      playerMessageLeftText.appendChild(playerMessageUsername);
      playerMessageLeftText.appendChild(playerMessageTimeStamp);

      $('#chatmessages').prepend(playerMessage);
    }
}



function addChatMessage(textContent, userRole, imgSrc, chatContext) {
  let newChatMessage = new ChatMessage(textContent, userRole, imgSrc)
  newChatMessage.render()
  
  Window.SugarCubeState.variables[`${chatContext}log`].push({textContent, userRole, imgSrc})
  socket.emit('difference',  Window.SugarCubeState.variables)
}

function displayChatMessages(chatlog) {
  setTimeout(() => {
    for (let i = 0; i < chatlog.length; i++) {
      let newChatMessage = new ChatMessage(chatlog[i]['message'], chatlog[i]['user'], "Twine/images/characters/"+chatlog[i]['user']+".svg")
      newChatMessage.render()
    }
  }, 100);
}

// This is what the structure looks like
/*
<div class='playerMessage'> 
  <div class='playerMessageLeft'>
    <img class="playerMessageIconImg" src=imageSrc>
    <div class='playerMessageLeftText'>
      <div class='playerMessageUsername'>
        username
      </div> 
      <div class='playerMessageTimeStamp'> 
        time
      </div> 
    </div>
  </div> 
  <div class='playerMessageText'>
    message
  </div>
</div>
*/