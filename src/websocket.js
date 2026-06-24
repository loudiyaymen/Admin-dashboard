import { WebSocketServer } from 'ws';

const port = process.env.WS_PORT || 4001;

const wss = new WebSocketServer({ port });

wss.on('connection', socket => {
  socket.send('connected');
  socket.on('message', message => {
    const text = message.toString();
    socket.send(text);
  });
});

