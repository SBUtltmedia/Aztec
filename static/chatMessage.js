class ChatMessage {
    constructor(text) {
      this.text = text;
      this.timestamp = new Date();
    }
  
    getFormattedTimestamp() {
      const options = { hour: 'numeric', minute: 'numeric', hour12: true };
      return this.timestamp.toLocaleString('en-US', options);
    }
  
    render() {
      const messageDiv = document.createElement('div');
      messageDiv.classList.add('chat-message');
      if (this.isSentByUser) {
        messageDiv.classList.add('user-message');
      } else {
        messageDiv.classList.add('bot-message');
      }
  
      const messageText = document.createElement('p');
      messageText.textContent = this.text;
  
      const timestamp = document.createElement('span');
      timestamp.classList.add('timestamp');
      timestamp.textContent = this.getFormattedTimestamp();
  
      messageDiv.appendChild(messageText);
      messageDiv.appendChild(timestamp);
  
      return messageDiv;
    }
  }

function addChatMessage(message, channel) {

}