import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import io from 'socket.io-client';

const socket = io();

function App() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Listen for new chat messages
    socket.on('chatMessage', message => {
      setMessages(messages => [...messages, message]);
    });

    // Load the chat history
    socket.emit('chatHistory', null);
    socket.on('chatHistory', history => {
      setMessages(history);
    });
  }, []);

function handleSubmit(event) {
  event.preventDefault();

  if (!username.trim()) {
    return;
  }


  if (message.trim()) {
    socket.emit('chatMessage', { user, message });
    setMessage('');
  }
}



  return (
    <div className="container">
      <div className="row">
        <div className="col-12 col-md-6 mx-auto">
          <h1 className="my-4">Modern Chat App</h1>

          <div className="card">
            <div className="card-body" style={{ height: 'calc(100vh - 250px)', overflowY: 'scroll' }}>
              {messages.map((message, index) => (
                <div key={index} className="mb-3">
                  <strong>{message.username}</strong>: {message.message}
                </div>
              ))}
            </div>
            <div className="card-footer">
              <form onSubmit={handleSubmit}>
                <div className="input-group">
                  <input type="text" className="form-control" placeholder="Type a message" value={message} onChange={event => setMessage(event.target.value)} />
                  <div className="input-group-append">
                    <button type="submit" className="btn btn-primary">Send</button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="mt-4">
            <input type="text" className="form-control" placeholder="Enter your username" value={username} onChange={event => setUsername(event.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));