document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // DOM elements
    const messagesContainer = document.getElementById('messages');
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const typingIndicator = document.getElementById('typing-indicator');
    const newChatButton = document.getElementById('new-chat-btn');
    
    // Initial welcome message
    addMessage('Hello! I\'m Mentality, your mental health companion. How are you feeling today?', 'bot');
    
    // Event listeners
    chatForm.addEventListener('submit', handleSubmit);
    messageInput.addEventListener('keydown', handleKeyDown);
    messageInput.addEventListener('input', toggleSendButton);
    newChatButton.addEventListener('click', startNewChat);
    
    // Toggle send button based on input
    function toggleSendButton() {
      sendButton.disabled = messageInput.value.trim() === '';
    }
    
    // Handle form submission
    function handleSubmit(e) {
      e.preventDefault();
      const message = messageInput.value.trim();
      if (!message) return;
      
      // Add user message to chat
      addMessage(message, 'user');
      
      // Clear input
      messageInput.value = '';
      toggleSendButton();
      
      // Show typing indicator
      showTypingIndicator();
      
      // Simulate bot response after a delay
      setTimeout(() => {
        // Hide typing indicator
        hideTypingIndicator();
        
        // Add bot response
        const botResponse = getBotResponse(message);
        addMessage(botResponse, 'bot');
        
        // Scroll to bottom
        scrollToBottom();
      }, 1500);
      
      // Scroll to bottom
      scrollToBottom();
    }
    
    // Handle key press (Enter to send, Shift+Enter for new line)
    function handleKeyDown(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (messageInput.value.trim() !== '') {
          chatForm.dispatchEvent(new Event('submit'));
        }
      }
    }
    
    // Add message to chat
    function addMessage(content, sender) {
      const messageElement = document.createElement('div');
      messageElement.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`;
      
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      if (sender === 'user') {
        messageElement.innerHTML = `
          <div class="max-w-[80%] rounded-2xl px-4 py-3 bg-teal-600 text-white">
            <p>${content}</p>
            <div class="text-xs mt-1 text-teal-100">${time}</div>
          </div>
        `;
      } else {
        messageElement.innerHTML = `
          <div class="max-w-[80%] rounded-2xl px-4 py-3 bg-white border border-teal-100 text-gray-800">
            <div class="flex items-center gap-2 mb-1">
              <div class="h-6 w-6 rounded-full bg-teal-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                     stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3 text-white">
                  <path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2" />
                  <path d="m6 17 3.13-5.78c.53-.97.43-2.22-.26-3.07A4 4 0 0 1 22 7c-.01.7-.2 1.4-.57 2" />
                  <path d="m18 7-3.13 5.78c-.53.97-.43 2.22.26 3.07" />
                </svg>
              </div>
              <span class="font-medium text-teal-700">Mentality</span>
            </div>
            <p>${content}</p>
            <div class="text-xs mt-1 text-gray-500">${time}</div>
          </div>
        `;
      }
      
      messagesContainer.appendChild(messageElement);
    }
    
    // Show typing indicator
    function showTypingIndicator() {
      typingIndicator.classList.remove('hidden');
      scrollToBottom();
    }
    
    // Hide typing indicator
    function hideTypingIndicator() {
      typingIndicator.classList.add('hidden');
    }
    
    // Scroll to bottom of messages
    function scrollToBottom() {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Start a new chat
    function startNewChat() {
      // Clear all messages except the welcome message
      messagesContainer.innerHTML = '';
      
      // Add welcome message
      addMessage('Hello! I\'m Mentality, your mental health companion. How are you feeling today?', 'bot');
    }
    
    // Get bot response (placeholder responses - replace with actual AI integration later)
    function getBotResponse(userMessage) {
      const responses = [
        "I understand how you're feeling. Would you like to talk more about that?",
        "Thank you for sharing. How long have you been feeling this way?",
        "I'm here to support you. What would help you feel better right now?",
        "That sounds challenging. Let's explore some coping strategies together.",
        "I appreciate you opening up. Would you like to try a quick mindfulness exercise?",
        "Your feelings are valid. Can you tell me more about what triggered this?",
        "I'm listening. Sometimes putting our thoughts into words can help us process them better.",
        "It takes courage to share your feelings. Is there something specific you'd like guidance on?",
        "Let's take a moment to focus on your strengths. What's something you're proud of recently?",
        "Would it help to break down what you're experiencing into smaller, manageable parts?"
      ];
      
      // For a more realistic chatbot, you would analyze the user message and provide relevant responses
      // This is just a simple random response for demonstration
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Initialize
    toggleSendButton();
  });