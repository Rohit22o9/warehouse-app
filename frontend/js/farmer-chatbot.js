(function() {
    // 1. Inject Styles
    const style = document.createElement('style');
    style.innerHTML = `
        :root {
            --green-primary: #1D9E75;
            --green-dark: #27500A;
            --chat-bg: #F8FAF9;
            --user-msg: linear-gradient(135deg, #1D9E75, #27500A);
            --bot-msg: #ffffff;
            --glass-bg: rgba(255, 255, 255, 0.9);
            --shadow-premium: 0 20px 40px rgba(0,0,0,0.12);
        }

        #farmer-chatbot-window-container {
            position: fixed;
            bottom: 30px;
            left: 30px;
            z-index: 10000;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        #farmer-chatbot-bubble {
            width: 70px;
            height: 70px;
            background: linear-gradient(135deg, #1D9E75, #27500A);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            cursor: pointer;
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            border: 2px solid rgba(255,255,255,0.2);
        }

        #farmer-chatbot-bubble:hover {
            transform: scale(1.1) rotate(5deg);
            box-shadow: 0 12px 35px rgba(0,0,0,0.3);
        }

        #farmer-chat-window {
            position: absolute;
            bottom: 85px;
            left: 0;
            width: 380px;
            height: 550px;
            background: var(--chat-bg);
            border-radius: 24px;
            box-shadow: var(--shadow-premium);
            display: none;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid rgba(0,0,0,0.08);
            backdrop-filter: blur(10px);
            animation: slideInPremium 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
        }

        @keyframes slideInPremium {
            from { opacity: 0; transform: translateY(30px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .chat-header {
            background: linear-gradient(90deg, #1D9E75, #27500A);
            color: white;
            padding: 18px 24px;
            font-weight: 700;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .chat-header .title-area {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .chat-header .close-btn {
            cursor: pointer;
            font-size: 24px;
            opacity: 0.8;
            transition: all 0.2s;
            background: rgba(255,255,255,0.1);
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
        }

        .chat-header .close-btn:hover { 
            opacity: 1; 
            background: rgba(255,255,255,0.2);
            transform: rotate(90deg);
        }

        .chat-messages {
            flex: 1;
            padding: 24px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 16px;
            scrollbar-width: thin;
            scrollbar-color: #ddd transparent;
        }

        .chat-messages::-webkit-scrollbar { width: 6px; }
        .chat-messages::-webkit-scrollbar-thumb { background: #ddd; border-radius: 10px; }

        .message {
            max-width: 85%;
            padding: 12px 18px;
            border-radius: 20px;
            font-size: 14.5px;
            line-height: 1.6;
            word-wrap: break-word;
            position: relative;
            animation: msgPop 0.3s ease-out;
        }

        @keyframes msgPop {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }

        .message.user {
            align-self: flex-end;
            background: var(--user-msg);
            color: white;
            border-bottom-right-radius: 4px;
            box-shadow: 0 4px 15px rgba(29, 158, 117, 0.2);
        }

        .message.bot {
            align-self: flex-start;
            background: var(--bot-msg);
            color: #2c3e50;
            border-bottom-left-radius: 4px;
            border: 1px solid rgba(0,0,0,0.05);
            box-shadow: 0 4px 15px rgba(0,0,0,0.03);
        }

        .typing-indicator {
            font-size: 14px;
            color: var(--green-primary);
            font-weight: bold;
            display: flex;
            gap: 4px;
        }

        .chat-input-area {
            padding: 18px 24px;
            background: white;
            display: flex;
            gap: 12px;
            border-top: 1px solid rgba(0,0,0,0.05);
            align-items: center;
        }

        .chat-input-area input {
            flex: 1;
            padding: 12px 20px;
            border-radius: 30px;
            border: 1.5px solid #EEF2F0;
            outline: none;
            font-size: 14px;
            background: #F9FBFA;
            transition: all 0.2s;
        }

        .chat-input-area input:focus {
            border-color: var(--green-primary);
            background: white;
            box-shadow: 0 0 0 4px rgba(29, 158, 117, 0.1);
        }

        .chat-input-area button {
            width: 45px;
            height: 45px;
            background: var(--green-primary);
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 15px rgba(29, 158, 117, 0.3);
        }

        .chat-input-area button:hover {
            background: var(--green-dark);
            transform: scale(1.05) rotate(5deg);
        }

        .message strong { color: var(--green-dark); }

    `;
    document.head.appendChild(style);

    // 2. Build DOM Chat Window
    const container = document.createElement('div');
    container.id = 'farmer-chatbot-window-container';
    container.innerHTML = `
        <div id="farmer-chatbot-bubble">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 32px; height: 32px;">
                <path d="M12 2L14.5 9H21L16 13.5L17.5 21L12 17L6.5 21L8 13.5L3 9H9.5L12 2Z" fill="white" fill-opacity="0.2"/>
                <path d="M2 22C2 22 6 20 12 20C18 20 22 22 22 22M12 2C12 2 3 6 3 13C3 18.5 7 21 12 21C17 21 21 18.5 21 13C21 6 12 2 12 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 6V16" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>
        </div>
        <div id="farmer-chat-window">
            <div class="chat-header">
                <div class="title-area">
                    <span style="font-size: 20px;">🌱</span>
                    <span>Kisan Mitra AI</span>
                </div>
                <div class="close-btn" id="close-chat">&times;</div>
            </div>
            <div class="chat-messages" id="chat-messages">
                <div class="message bot">
                    <strong>Namaste!</strong> 🙏 I am your Kisan Mitra AI advisor. How can I help you today with your crops, weather, or storage?
                </div>
            </div>
            <div class="chat-input-area">
                <input type="text" id="chat-input" placeholder="Type your message..." autocomplete="off">
                <button id="send-chat">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(container);

    // Position the container
    container.style.position = 'fixed';
    container.style.bottom = '30px';
    container.style.left = '30px';
    container.style.zIndex = '10000';
    
    // 3. Logic
    const bubble = document.getElementById('farmer-chatbot-bubble');
    const chatWindow = document.getElementById('farmer-chat-window');
    const closeBtn = document.getElementById('close-chat');
    const sendBtn = document.getElementById('send-chat');
    const input = document.getElementById('chat-input');
    const messagesArea = document.getElementById('chat-messages');

    let isTyping = false;

    function toggleChat() {
        const isOpen = chatWindow.style.display === 'flex';
        chatWindow.style.display = isOpen ? 'none' : 'flex';
        if (!isOpen) {
            input.focus();
        }
    }

    // Connect Sidebar "Get Help" button
    const getHelpBtn = document.querySelector('.help-btn');
    if (getHelpBtn) {
        getHelpBtn.onclick = (e) => {
            e.preventDefault();
            if (chatWindow.style.display !== 'flex') toggleChat();
        };
    }

    function addMessage(text, side) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${side}`;
        
        // Simple formatting for bold text (supports **text**)
        const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        msgDiv.innerHTML = formattedText;
        
        messagesArea.appendChild(msgDiv);
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    // Chat history state
    let chatHistory = [];

    async function sendMessage() {
        const text = input.value.trim();
        if (!text || isTyping) return;

        addMessage(text, 'user');
        input.value = '';
        
        // Add typing indicator
        isTyping = true;
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot typing-indicator';
        typingDiv.innerHTML = '<span>●</span><span>●</span><span>●</span>';
        messagesArea.appendChild(typingDiv);
        messagesArea.scrollTop = messagesArea.scrollHeight;

        try {
            // Task 1 & 2: Use absolute URL for backend on port 5000
            const response = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: text,
                    chatHistory: chatHistory 
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }

            const data = await response.json();
            
            // Task 5 (from previous): Add console logging for debugging
            console.log("AI Response:", data);

            if (typingDiv.parentNode) messagesArea.removeChild(typingDiv);
            isTyping = false;
            
            // Task: Use data.reply as specified by the latest backend schema
            const aiText = data.reply;

            if (aiText) {
                addMessage(aiText, 'bot');
                // Ensure chat history is updated for multi-turn conversations
                if (data.chatHistory) {
                    chatHistory = data.chatHistory;
                }
            } else {
                throw new Error("Invalid response format from server");
            }
        } catch (err) {
            console.error("Chat error details:", err);
            if (typingDiv.parentNode) messagesArea.removeChild(typingDiv);
            isTyping = false;
            
            // Task 6: Better error handling for offline status
            // Network errors (like connection refused) usually manifest as TypeError in fetch
            const isOffline = err instanceof TypeError || err.message.toLowerCase().includes("failed to fetch") || err.message.toLowerCase().includes("network");
            
            if (isOffline) {
                addMessage("Kisan Mitra service is offline. Please ensure the backend is running on port 5000. 🙏", 'bot');
            } else {
                addMessage(`Kisan Mitra busy: ${err.message}`, 'bot');
            }
        }
    }

    bubble.addEventListener('click', toggleChat);
    if (closeBtn) closeBtn.addEventListener('click', toggleChat);
    
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

})();
