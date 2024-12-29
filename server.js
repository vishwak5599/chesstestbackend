const io = require("socket.io")(3001, { 
        cors:{ 
            //origin:"http://localhost:3000", 
            origin:"https://vi-chess-testapp.vercel.app/",
            methods: ["GET", "POST"], 
        }, 
    })

    const userMap = new Map()

    io.on("connection", (socket)=>{ 
        console.log("a user connected") 
        socket.on("register",(userId)=>{
            userMap.set(userId, socket.id);
            console.log(`User registered userId: ${userId} with socketId: ${socket.id}`);
        })
        socket.on("customDisconnect",()=>{
            for(const [userId, socketId] of userMap.entries()){
                if (socketId===socket.id) {
                    userMap.delete(userId);
                    console.log(`User disconnected with userId: ${userId} and socketId: ${socket.id}`);
                    break;
                }
            }
        })
        socket.on("sendRequest",(fromUserId,fromUserName,toUserId,fromPieceColour)=>{
            const toSocketId = userMap.get(toUserId)
            if(fromUserId===toUserId){
                console.log("can not send requests to self")
            }
            else if(toSocketId){
                io.to(toSocketId).emit("gameRequest",{fromUserId,fromUserName,fromPieceColour})
                console.log(`game request sent from ${fromUserId} to ${toUserId} with pieceColour ${fromPieceColour}`)
            }
            else console.log("user does not exist")
        })
        socket.on("acceptRequest", (acceptedUserId, acceptedUserName, requestedUserId, requestedPieceColour) => {
            const socketId = userMap.get(requestedUserId)
            if (socketId) {
                io.to(socketId).emit("requestAccepted", {
                    acceptedUserId,
                    acceptedUserName,
                    requestedPieceColour,
                });
                console.log(`Game request accepted by ${acceptedUserName} with userId ${acceptedUserId}`);
            } else {
                console.log("Requested user does not exist");
            }
        });
        socket.on("updateBoard", (fromUserId, toUserId, board, movesCount) => {
            const socketId = userMap.get(toUserId)
            if (socketId) {
                const boardCopy = board.map(row => row.slice());
                for (let i = 0; i < 4; i++) {
                    for (let j = 0; j < 8; j++) {
                        // Swap element at [i][j] with element at [7-i][7-j]
                        const temp = boardCopy[i][j];
                        boardCopy[i][j] = boardCopy[7 - i][7 - j];
                        boardCopy[7 - i][7 - j] = temp;
                    }
                }
                io.to(socketId).emit("boardUpdated", {
                    board: boardCopy,
                    movesCount: movesCount
                });
                console.log(`${fromUserId} updated board with opponent ${toUserId}`);
            } else {
                console.log("Requested user does not exist");
            }
        });
        socket.on("newMove", (fromUserId, toUserId, move, updatedPiece, lastSquarePreviousPiece) => {
            const socketId = userMap.get(toUserId)
            if (socketId) {
                io.to(socketId).emit("updateMove", {
                    move: move,
                    updatedPiece: updatedPiece,
                    lastSquarePreviousPiece: lastSquarePreviousPiece
                });
                console.log(`${fromUserId} sent move with to ${toUserId}`);
            } else {
                console.log("Requested user does not exist");
            }
        });
    })