const CHAT_RANGE = 150; // Range in pixels for nearby chat
const DISTANT_RANGE = 300; // Range for faded messages
const MESSAGE_COOLDOWN = 1000; // 1 second cooldown between messages
const MAX_MESSAGE_LENGTH = 500; // Maximum message length
let lastMessageTime = 0;
let currentNickname = '';
let chatMinimized = false;
let nicknameModal = null;

function initChat() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeChatSystem);
    } else {
        initializeChatSystem();
    }
}

function initializeChatSystem() {
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendMessage');
    const chatWindow = document.getElementById('chatWindow');

    if (typeof $ !== 'undefined') {
        try {
            $(chatWindow).draggable({
                handle: '.chat-header',
                containment: 'window',
                scroll: false
            });
        } catch (error) {
            console.error('Error initializing draggable:', error);
        }
    }

    document.querySelector('.minimize-chat')?.addEventListener('click', toggleChatMinimize);
    document.querySelector('.maximize-chat')?.addEventListener('click', toggleChatMaximize);

    function initializeModal() {
        try {
            if (typeof bootstrap !== 'undefined') {
                nicknameModal = new bootstrap.Modal(document.getElementById('nicknameModal'), {
                    backdrop: 'static',
                    keyboard: false
                });
                
                currentNickname = localStorage.getItem('nickname');
                if (!currentNickname) {
                    nicknameModal.show();
                } else {
                    updateNicknameDisplay();
                }
                return true;
            } else {
                console.log('Bootstrap not loaded yet, retrying...');
                setTimeout(initializeModal, 100);
                return false;
            }
        } catch (error) {
            console.error('Error initializing modal:', error);
            if (!currentNickname) {
                handleFallbackNicknamePrompt();
            }
            return false;
        }
    }

    const nicknameForm = document.getElementById('nicknameForm');
    if (nicknameForm) {
        nicknameForm.addEventListener('submit', handleNicknameSubmission);
    }

    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }

    if (chatInput) {
        chatInput.addEventListener('keypress', handleMessageKeyPress);
        chatInput.addEventListener('input', validateMessageLength);
    }

    if (typeof socket !== 'undefined') {
        socket.on('chat_message', handleChatMessage);
    } else {
        console.error('Socket.io not initialized');
    }

    initializeModal();
}

function handleFallbackNicknamePrompt() {
    const nickname = prompt('Enter your nickname (3-15 characters):');
    if (nickname && validateNickname(nickname)) {
        currentNickname = nickname;
        localStorage.setItem('nickname', nickname);
        updateNicknameDisplay();
        displaySystemMessage(`Welcome, ${nickname}! You can now chat with nearby players.`);
    } else {
        alert('Invalid nickname! Please try again.');
        handleFallbackNicknamePrompt();
    }
}

function validateNickname(nickname) {
    return nickname.length >= 3 && 
           nickname.length <= 15 && 
           /^[A-Za-z0-9_-]+$/.test(nickname);
}

function handleNicknameSubmission(e) {
    e.preventDefault();
    const nicknameInput = document.getElementById('nickname');
    const nickname = nicknameInput.value.trim();
    
    if (validateNickname(nickname)) {
        currentNickname = nickname;
        localStorage.setItem('nickname', nickname);
        updateNicknameDisplay();
        
        const feedback = document.createElement('div');
        feedback.className = 'alert alert-success mt-2';
        feedback.textContent = 'Nickname saved successfully!';
        nicknameInput.parentNode.appendChild(feedback);
        
        setTimeout(() => {
            feedback.remove();
            if (nicknameModal) {
                nicknameModal.hide();
            }
            displaySystemMessage(`Welcome, ${nickname}! You can now chat with nearby players.`);
        }, 1500);
    }
}

function validateMessageLength(e) {
    const input = e.target;
    const remainingChars = MAX_MESSAGE_LENGTH - input.value.length;
    const sendButton = document.getElementById('sendMessage');
    
    if (remainingChars < 0) {
        input.value = input.value.substring(0, MAX_MESSAGE_LENGTH);
        sendButton.disabled = true;
    } else {
        sendButton.disabled = false;
    }
}

function handleMessageKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function sendMessage() {
    if (!currentNickname) {
        if (nicknameModal) {
            nicknameModal.show();
        }
        return;
    }

    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    const sendButton = document.getElementById('sendMessage');
    
    if (!message || message.length > MAX_MESSAGE_LENGTH || Date.now() - lastMessageTime < MESSAGE_COOLDOWN) {
        return;
    }
    
    sendButton.disabled = true;
    
    try {
        socket.emit('chat_message', {
            sender: currentNickname,
            message: message,
            position: myPosition
        }, (response) => {
            if (response?.error) {
                showMessageError('Failed to send message');
            } else {
                showMessageSuccess();
                chatInput.value = '';
            }
            sendButton.disabled = false;
        });
        
        lastMessageTime = Date.now();
    } catch (error) {
        console.error('Error sending message:', error);
        showMessageError('Failed to send message');
        sendButton.disabled = false;
    }
}

function showMessageSuccess() {
    const sendButton = document.getElementById('sendMessage');
    sendButton.classList.remove('btn-danger');
    sendButton.classList.add('btn-success');
    setTimeout(() => {
        sendButton.classList.remove('btn-success');
    }, 500);
}

function showMessageError(message) {
    const sendButton = document.getElementById('sendMessage');
    sendButton.classList.add('btn-danger');
    const errorToast = document.createElement('div');
    errorToast.className = 'alert alert-danger position-fixed bottom-0 end-0 m-3';
    errorToast.textContent = message;
    document.body.appendChild(errorToast);
    setTimeout(() => {
        errorToast.remove();
        sendButton.classList.remove('btn-danger');
    }, 3000);
}

function toggleChatMinimize() {
    const chatBody = document.querySelector('.chat-body');
    if (!chatMinimized) {
        chatBody.style.display = 'none';
        chatMinimized = true;
    } else {
        chatBody.style.display = 'block';
        chatMinimized = false;
    }
}

function toggleChatMaximize() {
    const chatWindow = document.getElementById('chatWindow');
    chatWindow.classList.toggle('maximized');
}

function updateNicknameDisplay() {
    const currentUser = document.getElementById('currentUser');
    currentUser.innerHTML = `<span class="badge bg-primary">Chatting as: ${currentNickname}</span>`;
}

function displaySystemMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message system-message';
    messageElement.innerHTML = `
        <div class="message-content text-warning">${message}</div>
    `;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleChatMessage(data) {
    const chatMessages = document.getElementById('chatMessages');
    const distance = calculateDistance(myPosition, data.position);
    const messageElement = document.createElement('div');
    
    messageElement.className = 'chat-message';
    if (distance <= CHAT_RANGE) {
        messageElement.classList.add('nearby');
    } else if (distance <= DISTANT_RANGE) {
        messageElement.classList.add('far');
    } else {
        return;
    }
    
    const senderColor = getColorFromString(data.sender);
    
    const timestamp = new Date().toLocaleTimeString();
    messageElement.innerHTML = `
        <div class="message-header">
            <span class="message-sender" style="color: ${senderColor}">${data.sender}</span>
            <span class="message-timestamp">${timestamp}</span>
        </div>
        <div class="message-content">${formatMessage(data.message)}</div>
    `;
    
    messageElement.style.opacity = '0';
    messageElement.style.transform = 'translateX(-20px)';
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    requestAnimationFrame(() => {
        messageElement.style.transition = 'all 0.3s ease';
        messageElement.style.opacity = '1';
        messageElement.style.transform = 'translateX(0)';
    });
    
    if (distance > CHAT_RANGE) {
        messageElement.style.opacity = map(distance, CHAT_RANGE, DISTANT_RANGE, 1, 0.3);
        setTimeout(() => {
            messageElement.style.opacity = '0';
            setTimeout(() => messageElement.remove(), 1000);
        }, 5000);
    }

    if (distance <= CHAT_RANGE) {
        playMessageSound();
    }
}

function formatMessage(message) {
    const dragonEmojis = {
        ':\\)': '🐲',
        ':dragon:': '🐉',
        '<3': '❤️',
        ':fire:': '🔥'
    };
    
    let formattedMessage = message;
    for (const [emoji, replacement] of Object.entries(dragonEmojis)) {
        formattedMessage = formattedMessage.replace(
            new RegExp(emoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
            replacement
        );
    }
    
    formattedMessage = formattedMessage.replace(
        /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g,
        (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
    );
    
    return formattedMessage;
}

function getColorFromString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 60%)`;
}

function calculateDistance(pos1, pos2) {
    if (!pos1 || !pos2) return Infinity;
    return Math.sqrt(
        Math.pow(pos1.x - pos2.x, 2) + 
        Math.pow(pos1.y - pos2.y, 2)
    );
}

function playMessageSound() {
    const audio = new Audio('/static/sounds/message.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {});
}

document.addEventListener('DOMContentLoaded', initChat);