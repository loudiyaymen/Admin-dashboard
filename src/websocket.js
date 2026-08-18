import { WebSocketServer, WebSocket } from "ws";

const port = process.env.WS_PORT || 4001;

// Configure WebSocket with Azure-friendly settings
export const wss = new WebSocketServer({
  port,
  // Disable per-message deflate compression for Azure App Service compatibility
  perMessageDeflate: false,
  // Set timeout to prevent connection hanging
  clientTracking: true,
});

// Set ping interval to keep connections alive in Azure
const pingInterval = setInterval(() => {
  wss.clients.forEach((client) => {
    if (client.isAlive === false) {
      client.terminate();
      return;
    }
    client.isAlive = false;
    client.ping();
  });
}, 30000);

wss.on("close", () => {
  clearInterval(pingInterval);
});

export function broadcast(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on("connection", (socket) => {
  socket.isAlive = true;
  socket.send("connected");

  socket.on("pong", () => {
    socket.isAlive = true;
  });

  socket.on("message", (message) => {
    const text = message.toString();
    socket.send(text);
  });

  socket.on("close", () => {
    // Cleanup handled by ws library
  });
});
