const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const fs = require('fs');
const cache = require('memory-cache');
const cacheDuration = 10 * 60 * 1000; // 10 minutes
const compression = require('compression');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const Joi = require('joi');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Load the chat logs from the "chats.json" file, or from cache if available
let chats = cache.get('chats');
if (!chats) {
  try {
    chats = JSON.parse(fs.readFileSync('chats.json'));
    cache.put('chats', chats, cacheDuration);
  } catch (err) {
    console.error(err);
  }
}

const blacklistedUsernames = fs.readFileSync('blacklist.txt', 'utf-8').split('\n').map(line => line.trim()).filter(line => line);

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve the static files in the "public" folder
app.use(express.static('public'));
app.use(compression());

// Listen for new connections
io.on('connection', socket => {
  console.log('User connected:', socket.id);

  // Send the chat history to the new user
  socket.emit('chatHistory', chats);

  // Listen for new chat messages
  socket.on('chatMessage', message => {
    if (blacklistedUsernames.includes(message.username)) {
      return;
    }

    console.log('Received message:', message);

    // Validate the message object
    const messageSchema = Joi.object({
      username: Joi.string().required(),
      message: Joi.string().required()
    });

    const { error } = messageSchema.validate(message);
    if (error) {
      console.error(error.details[0].message);
      return;
    }

    // Sanitize the message text before adding it to the chat log
    const sanitizedMessage = {
      username: DOMPurify.sanitize(message.username),
      message: DOMPurify.sanitize(message.message)
    };

    // Add the message to the chat log
    chats.push(sanitizedMessage);

    // Save the updated chat log to the "chats.json" file
    fs.writeFileSync('chats.json', JSON.stringify(chats));

    // Broadcast the message to all connected clients
    io.emit('chatMessage', sanitizedMessage);
  });

  // Listen for disconnections
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
