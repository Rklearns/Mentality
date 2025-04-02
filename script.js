document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('current-year').textContent = new Date().getFullYear();

  const messagesContainer = document.getElementById('messages');
  const chatForm = document.getElementById('chat-form');
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  const typingIndicator = document.getElementById('typing-indicator');
  const newChatButton = document.getElementById('new-chat-btn');

  // Store chat ID for conversation continuity
  let currentChatId = localStorage.getItem('mentality_chat_id') || null;

  // Start with a bot greeting
  addMessage("Hello! I'm Mentality, your mental health companion. How are you feeling today?", 'bot');

  chatForm.addEventListener('submit', handleSubmit);
  messageInput.addEventListener('keydown', handleKeyDown);
  messageInput.addEventListener('input', toggleSendButton);
  newChatButton.addEventListener('click', startNewChat);

  function toggleSendButton() {
      sendButton.disabled = messageInput.value.trim() === '';
  }

  async function handleSubmit(e) {
      e.preventDefault();
      const message = messageInput.value.trim();
      if (!message) return;

      addMessage(message, 'user');
      messageInput.value = '';
      toggleSendButton();
      showTypingIndicator();

      try {
          // Update this URL to your Render deployment URL
          const response = await fetch("https://mentality-3.onrender.com", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json"
              },
              body: JSON.stringify({ 
                  message: message,
                  chat_id: currentChatId
              })
          });

          if (!response.ok) {
              throw new Error(`Server error: ${response.status}`);
          }

          const data = await response.json();
          
          // Save chat ID for future messages
          currentChatId = data.chat_id;
          localStorage.setItem('mentality_chat_id', currentChatId);
          
          hideTypingIndicator();
          addMessage(data.response, 'bot');
      } catch (error) {
          console.error("Error:", error);
          hideTypingIndicator();
          addMessage("I'm sorry, I couldn't process your request. Please try again later.", 'bot');
      }

      scrollToBottom();
  }

  function handleKeyDown(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (messageInput.value.trim() !== '') {
              chatForm.dispatchEvent(new Event('submit'));
          }
      }
  }

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
      scrollToBottom();
  }

  function showTypingIndicator() {
      typingIndicator.classList.remove('hidden');
      scrollToBottom();
  }

  function hideTypingIndicator() {
      typingIndicator.classList.add('hidden');
  }

  function scrollToBottom() {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function startNewChat() {
      // Clear chat ID
      currentChatId = null;
      localStorage.removeItem('mentality_chat_id');
      
      // Clear messages
      messagesContainer.innerHTML = '';
      
      // Add welcome message
      addMessage("Hello! I'm Mentality, your mental health companion. How are you feeling today?", 'bot');
  }

  toggleSendButton();
});