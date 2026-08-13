import { WebSocketServer, WebSocket } from 'ws';

const port = process.env.WS_PORT || 4001;

export const wss = new WebSocketServer({ port });

export function broadcast(message) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', socket => {
  socket.send('connected');
  socket.on('message', message => {
    const text = message.toString();
    socket.send(text);
  });
});

