function setupSocket(io) {
  io.on("connection", (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Join admin channel
    socket.on("join_admin", () => {
      socket.join("admins");
      console.log(`[Socket.io] Client ${socket.id} joined admins room`);
    });

    // Leave admin channel
    socket.on("leave_admin", () => {
      socket.leave("admins");
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });
}

module.exports = setupSocket;

