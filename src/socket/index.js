function setupSocket(io) {
  io.on("connection", (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Join admin channels
    socket.on("join_admin", () => {
      socket.join("admin_room");
      socket.join("admins");
      console.log(`[Socket.io] Client ${socket.id} joined admin_room & admins`);
    });

    // Leave admin channels
    socket.on("leave_admin", () => {
      socket.leave("admin_room");
      socket.leave("admins");
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });
}

module.exports = setupSocket;
