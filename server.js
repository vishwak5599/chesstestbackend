const express = require("express");
const { Server } = require("socket.io");
const http = require("http");

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["https://vi-chess-testapp.vercel.app", "http://localhost:3000"],
    methods: ["GET", "POST"],
  },
});

const userMap = new Map();

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("register", (userId) => {
    userMap.set(userId, socket.id);
    console.log(`User registered: ${userId} with socketId: ${socket.id}`);
  });

  socket.on("customDisconnect", () => {
    for (const [userId, socketId] of userMap.entries()) {
      if (socketId === socket.id) {
        userMap.delete(userId);
        console.log(`User disconnected: ${userId} with socketId: ${socket.id}`);
        break;
      }
    }
  });

  socket.on("sendRequest", (fromUserId, fromUserName, toUserId, fromPieceColour) => {
    const toSocketId = userMap.get(toUserId);
    if (fromUserId === toUserId) {
      console.log("Cannot send requests to self");
    } else if (toSocketId) {
      io.to(toSocketId).emit("gameRequest", { fromUserId, fromUserName, fromPieceColour });
      console.log(`Game request sent from ${fromUserId} to ${toUserId} with pieceColour ${fromPieceColour}`);
    } else {
      console.log("User does not exist");
    }
  });

  socket.on("acceptRequest", (acceptedUserId, acceptedUserName, requestedUserId, requestedPieceColour) => {
    const socketId = userMap.get(requestedUserId);
    if (socketId) {
      io.to(socketId).emit("requestAccepted", { acceptedUserId, acceptedUserName, requestedPieceColour });
      console.log(`Game request accepted by ${acceptedUserName} with userId ${acceptedUserId}`);
    } else {
      console.log("Requested user does not exist");
    }
  });

  socket.on("updateBoard", (fromUserId, toUserId, board, movesCount) => {
    const socketId = userMap.get(toUserId);
    if (socketId) {
      const boardCopy = board.map((row) => row.slice());
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 8; j++) {
          const temp = boardCopy[i][j];
          boardCopy[i][j] = boardCopy[7 - i][7 - j];
          boardCopy[7 - i][7 - j] = temp;
        }
      }
      io.to(socketId).emit("boardUpdated", { board: boardCopy, movesCount });
      console.log(`${fromUserId} updated board with opponent ${toUserId}`);
    } else {
      console.log("Requested user does not exist");
    }
  });

  socket.on("newMove", (fromUserId, toUserId, move, updatedPiece, lastSquarePreviousPiece) => {
    const socketId = userMap.get(toUserId);
    if (socketId) {
      io.to(socketId).emit("updateMove", { move, updatedPiece, lastSquarePreviousPiece });
      console.log(`${fromUserId} sent move to ${toUserId}`);
    } else {
      console.log("Requested user does not exist");
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
