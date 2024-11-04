const CHAT_RANGE = 150;
const DISTANT_RANGE = 300;
const MESSAGE_COOLDOWN = 1000;
let lastMessageTime = 0;
let isChatInitialized = false;

function initChat() {
    if (isChatInitialized) return;

    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendMessage');

    if (!chatInput || !sendButton) {
        console.error('Chat elements not found');
        return;
    }

    // Wait for socket connection before initializing chat
    document.addEventListener('socketConnected', () => {
        setupChatListeners(chatInput, sendButton);
        isChatInitialized = true;
    });
}

function setupChatListeners(chatInput, sendButton) {
    // Send message on button click
    sendButton.addEventListener('click', () => {
        try {
            sendMessage(chatInput);
        } catch (error) {
            console.error('Error sending message:', error);
            showChatError('Failed to send message');
        }
    });

    // Send message on Enter key
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            try {
                sendMessage(chatInput);
            } catch (error) {
                console.error('Error sending message:', error);
                showChatError('Failed to send message');
            }
        }
    });

    // Listen for incoming messages
    if (socket) {
        socket.on('chat_message', handleChatMessage);
    }
}

function sendMessage(chatInput) {
    if (!socket?.connected) {
        showChatError('Not connected to chat server');
        return;
    }

    const message = chatInput.value.trim();
    
    if (!message) return;
    
    if (Date.now() - lastMessageTime < MESSAGE_COOLDOWN) {
        showChatError('Please wait before sending another message');
        return;
    }
    
    const currentUser = window.getCurrentUser?.();
    if (!currentUser) {
        showChatError('Please log in to chat');
        return;
    }

    lastMessageTime = Date.now();
    
    socket.emit('chat_message', {
        sender: currentUser.username,
        message: message,
        position: myPosition
    });
    
    chatInput.value = '';
}

function handleChatMessage(data) {
    try {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        const distance = calculateDistance(myPosition, data.position);
        if (distance > DISTANT_RANGE) return;

        const messageElement = createMessageElement(data, distance);
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
        console.error('Error handling chat message:', error);
    }
}

function createMessageElement(data, distance) {
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${distance <= CHAT_RANGE ? 'nearby' : 'far'}`;
    
    const timestamp = new Date().toLocaleTimeString();
    messageElement.innerHTML = `
        <div class="message-header">
            <span class="message-sender">${escapeHtml(data.sender)}</span>
            <span class="message-timestamp">${timestamp}</span>
        </div>
        <div class="message-content">${escapeHtml(data.message)}</div>
    `;
    
    if (distance > CHAT_RANGE) {
        setTimeout(() => {
            messageElement.style.opacity = '0.5';
        }, 5000);
    }

    return messageElement;
}

function calculateDistance(pos1, pos2) {
    if (!pos1 || !pos2) return Infinity;
    return Math.sqrt(
        Math.pow(pos1.x - pos2.x, 2) + 
        Math.pow(pos1.y - pos2.y, 2)
    );
}

function showChatError(message) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    const errorElement = document.createElement('div');
    errorElement.className = 'chat-error alert alert-danger';
    errorElement.textContent = message;
    chatMessages.appendChild(errorElement);
    
    setTimeout(() => {
        errorElement.remove();
    }, 3000);
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Initialize chat when the document is loaded
document.addEventListener('DOMContentLoaded', initChat);
