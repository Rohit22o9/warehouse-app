(function() {
    // 1. Inject Styles
    const style = document.createElement('style');
    style.innerHTML = `
        :root {
            --green-primary: #1D9E75;
            --green-dark: #27500A;
            --chat-bg: #f5fcf9;
            --user-msg: #e1f5ec;
            --bot-msg: #ffffff;
        }

        #farmer-chatbot-window-container {
            position: fixed;
            bottom: 25px;
            left: 25px;
            z-index: 10000;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        #farmer-chatbot-bubble {
            width: 65px;
            height: 65px;
            background: linear-gradient(135deg, var(--green-primary), var(--green-dark));
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 30px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        #farmer-chatbot-bubble:hover {
            transform: scale(1.1);
        }

        #farmer-chat-window {
            position: absolute;
            bottom: 80px;
            left: 0;
            width: 360px;
            height: 500px;
            background: var(--chat-bg);
            border-radius: 18px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
            display: none;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid rgba(0,0,0,0.05);
            animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .chat-header {
            background: var(--green-primary);
            color: white;
            padding: 15px 20px;
            font-weight: 700;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .chat-header .close-btn {
            cursor: pointer;
            font-size: 20px;
            opacity: 0.8;
            transition: opacity 0.2s;
        }

        .chat-header .close-btn:hover { opacity: 1; }

        .chat-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .message {
            max-width: 85%;
            padding: 10px 14px;
            border-radius: 14px;
            font-size: 14.5px;
            line-height: 1.5;
            word-wrap: break-word;
        }

        .message.user {
            align-self: flex-end;
            background: var(--user-msg);
            color: #1a3a2f;
            border-bottom-right-radius: 2px;
        }

        .message.bot {
            align-self: flex-start;
            background: var(--bot-msg);
            color: #2c3e50;
            border-bottom-left-radius: 2px;
            border: 1px solid #eef2f0;
            box-shadow: 0 2px 5px rgba(0,0,0,0.03);
        }

        .typing-indicator {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
        }

        .chat-input-area {
            padding: 15px;
            background: white;
            display: flex;
            gap: 10px;
            border-top: 1px solid #eee;
        }

        .chat-input-area input {
            flex: 1;
            padding: 10px 15px;
            border-radius: 25px;
            border: 1px solid #ddd;
            outline: none;
            font-size: 14px;
        }

        .chat-input-area input:focus {
            border-color: var(--green-primary);
        }

        .chat-input-area button {
            width: 40px;
            height: 40px;
            background: var(--green-primary);
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            transition: background 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .chat-input-area button:hover {
            background: var(--green-dark);
        }

        /* Markdown-ish formatting for bot responses if needed */
        .message strong { color: var(--green-dark); }
    `;
    document.head.appendChild(style);

    // 2. Build DOM Chat Window
    const container = document.createElement('div');
    container.id = 'farmer-chatbot-window-container';
    container.innerHTML = `
        <div id="farmer-chat-window">
            <div class="chat-header">
                <div>🌾 Kisan Mitra AI</div>
                <div class="close-btn" id="close-chat">&times;</div>
            </div>
            <div class="chat-messages" id="chat-messages">
                <div class="message bot">
                    Namaste! 🙏 I am your Kisan Mitra AI. How can I help you today with your crops, weather, or storage?
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

    // Style the existing bubble and position the container relative to it
    const bubble = document.getElementById('farmer-chatbot-bubble');
    if (bubble) {
        // Move the bubble into the container for better positioning if needed,
        // or just ensure the container is fixed correctly.
        // Let's just make the window absolute to the container which is fixed.
        container.style.position = 'fixed';
        container.style.bottom = '25px';
        container.style.left = '25px';
        container.style.zIndex = '10000';
        container.style.fontFamily = "'Inter', system-ui, -apple-system, sans-serif";
        
        container.appendChild(bubble); // Move the HTML bubble into our managed container
    }

    // 3. Logic
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

    function addMessage(text, side) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${side}`;
        
        // Simple formatting for bold text
        const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        msgDiv.innerHTML = formattedText;
        
        messagesArea.appendChild(msgDiv);
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    async function sendMessage() {
        const text = input.value.trim();
        if (!text || isTyping) return;

        addMessage(text, 'user');
        input.value = '';
        
        // Add typing indicator
        isTyping = true;
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot typing-indicator';
        typingDiv.innerText = '●●●';
        messagesArea.appendChild(typingDiv);
        messagesArea.scrollTop = messagesArea.scrollHeight;

        try {
            const response = await fetch('/api/farmer-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });
            const data = await response.json();
            
            // Remove typing indicator
            messagesArea.removeChild(typingDiv);
            isTyping = false;
            
            addMessage(data.response || "I'm sorry, I encountered an error. Please try again.", 'bot');
        } catch (err) {
            console.error("Chat error:", err);
            messagesArea.removeChild(typingDiv);
            isTyping = false;
            addMessage("Unable to connect to service. Please check your internet connection.", 'bot');
        }
    }

    bubble.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);
    
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

})();
