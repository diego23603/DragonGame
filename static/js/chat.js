const CHAT_RANGE = 150; // Range in pixels for nearby chat
const DISTANT_RANGE = 300; // Range for faded messages
const MESSAGE_COOLDOWN = 1000; // 1 second cooldown between messages
let lastMessageTime = 0;

function initChat() {
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendMessage');

    // Send message on button click
    sendButton.addEventListener('click', sendMessage);

    // Send message on Enter key
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Listen for incoming messages
    socket.on('chat_message', handleChatMessage);
}

function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    
    // Check for cooldown and empty messages
    if (!message || Date.now() - lastMessageTime < MESSAGE_COOLDOWN) {
        return;
    }
    
    lastMessageTime = Date.now();
    
    socket.emit('chat_message', {
        sender: currentUsername || 'Anonymous',
        message: message,
        position: myPosition
    });
    
    chatInput.value = '';
}

function handleChatMessage(data) {
    const chatMessages = document.getElementById('chatMessages');
    const distance = calculateDistance(myPosition, data.position);
    const messageElement = document.createElement('div');
    
    // Set message class based on distance
    messageElement.className = 'chat-message';
    if (distance <= CHAT_RANGE) {
        messageElement.classList.add('nearby');
    } else if (distance <= DISTANT_RANGE) {
        messageElement.classList.add('far');
    } else {
        return; // Don't show messages from users too far away
    }
    
    // Create message content
    const timestamp = new Date().toLocaleTimeString();
    messageElement.innerHTML = `
        <div class="message-header">
            <span class="message-sender">${data.sender}</span>
            <span class="message-timestamp">${timestamp}</span>
        </div>
        <div class="message-content">${data.message}</div>
    `;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Add fade-out animation for distant messages
    if (distance > CHAT_RANGE) {
        setTimeout(() => {
            messageElement.style.opacity = '0.5';
        }, 5000);
    }
}

function calculateDistance(pos1, pos2) {
    if (!pos1 || !pos2) return Infinity;
    return Math.sqrt(
        Math.pow(pos1.x - pos2.x, 2) + 
        Math.pow(pos1.y - pos2.y, 2)
    );
}

// Initialize chat when the document is loaded
document.addEventListener('DOMContentLoaded', initChat);
