const CHAT_RANGE = 150; // Range in pixels for nearby chat
const DISTANT_RANGE = 300; // Range for faded messages
const MESSAGE_COOLDOWN = 1000; // 1 second cooldown between messages
let lastMessageTime = 0;
let currentNickname = '';
let chatMinimized = false;
let nicknameModal = null;

function initChat() {
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendMessage');
    const chatWindow = document.getElementById('chatWindow');

    // Initialize chat window dragging
    if (typeof $ !== 'undefined') {
        $(chatWindow).draggable({
            handle: '.chat-header',
            containment: 'window',
            scroll: false
        });
    }

    // Initialize minimize/maximize functionality
    document.querySelector('.minimize-chat').addEventListener('click', toggleChatMinimize);
    document.querySelector('.maximize-chat').addEventListener('click', toggleChatMaximize);

    // Wait for Bootstrap to load before initializing modal
    function initializeModal() {
        try {
            if (typeof bootstrap !== 'undefined') {
                nicknameModal = new bootstrap.Modal(document.getElementById('nicknameModal'), {
                    backdrop: 'static',
                    keyboard: false
                });
                
                // Check for saved nickname
                currentNickname = localStorage.getItem('nickname');
                if (!currentNickname) {
                    nicknameModal.show();
                } else {
                    updateNicknameDisplay();
                }
            } else {
                setTimeout(initializeModal, 100);
            }
        } catch (error) {
            console.error('Error initializing modal:', error);
            // Fallback to simple prompt if modal fails
            if (!currentNickname) {
                currentNickname = prompt('Enter your nickname (3-15 characters):');
                if (currentNickname) {
                    localStorage.setItem('nickname', currentNickname);
                    updateNicknameDisplay();
                }
            }
        }
    }

    initializeModal();

    // Handle nickname form submission
    document.getElementById('nicknameForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const nicknameInput = document.getElementById('nickname');
        currentNickname = nicknameInput.value.trim();
        if (currentNickname.length >= 3 && currentNickname.length <= 15) {
            localStorage.setItem('nickname', currentNickname);
            updateNicknameDisplay();
            if (nicknameModal) {
                nicknameModal.hide();
            }
            // Show welcome message
            displaySystemMessage(`Welcome, ${currentNickname}! You can now chat with nearby players.`);
        }
    });

    // Send message on button click
    sendButton.addEventListener('click', sendMessage);

    // Send message on Enter key
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Listen for incoming messages
    socket.on('chat_message', handleChatMessage);
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

function sendMessage() {
    if (!currentNickname) {
        if (nicknameModal) {
            nicknameModal.show();
        }
        return;
    }

    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    
    // Check for cooldown and empty messages
    if (!message || Date.now() - lastMessageTime < MESSAGE_COOLDOWN) {
        return;
    }
    
    lastMessageTime = Date.now();
    
    socket.emit('chat_message', {
        sender: currentNickname,
        message: message,
        position: myPosition
    });
    
    chatInput.value = '';

    // Visual feedback for sent message
    const sendButton = document.getElementById('sendMessage');
    sendButton.classList.add('btn-success');
    setTimeout(() => {
        sendButton.classList.remove('btn-success');
    }, 500);
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
    
    // Add sender color based on their name
    const senderColor = getColorFromString(data.sender);
    
    // Create message content with timestamp and animations
    const timestamp = new Date().toLocaleTimeString();
    messageElement.innerHTML = `
        <div class="message-header">
            <span class="message-sender" style="color: ${senderColor}">${data.sender}</span>
            <span class="message-timestamp">${timestamp}</span>
        </div>
        <div class="message-content">${formatMessage(data.message)}</div>
    `;
    
    // Add entrance animation
    messageElement.style.opacity = '0';
    messageElement.style.transform = 'translateX(-20px)';
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Trigger animation
    requestAnimationFrame(() => {
        messageElement.style.transition = 'all 0.3s ease';
        messageElement.style.opacity = '1';
        messageElement.style.transform = 'translateX(0)';
    });
    
    // Add fade-out animation for distant messages
    if (distance > CHAT_RANGE) {
        messageElement.style.opacity = map(distance, CHAT_RANGE, DISTANT_RANGE, 1, 0.3);
        setTimeout(() => {
            messageElement.style.opacity = '0';
            setTimeout(() => messageElement.remove(), 1000);
        }, 5000);
    }

    // Play notification sound for nearby messages
    if (distance <= CHAT_RANGE) {
        playMessageSound();
    }
}

function formatMessage(message) {
    // Replace emojis with dragon-themed alternatives
    const dragonEmojis = {
        ':)': '🐲',
        ':dragon:': '🐉',
        '<3': '❤️',
        ':fire:': '🔥'
    };
    
    let formattedMessage = message;
    for (const [emoji, replacement] of Object.entries(dragonEmojis)) {
        formattedMessage = formattedMessage.replace(new RegExp(emoji, 'g'), replacement);
    }
    
    // Make URLs clickable
    formattedMessage = formattedMessage.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    
    return formattedMessage;
}

function getColorFromString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate HSL color with good saturation and lightness for visibility
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
    audio.play().catch(() => {}); // Ignore errors if sound can't play
}

// Initialize chat when the document is loaded
document.addEventListener('DOMContentLoaded', initChat);
