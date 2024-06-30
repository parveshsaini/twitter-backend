import { Server } from "socket.io";
import http from "http";
import express from "express";
import { pub, sub } from "../redis";

const app = express();

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
	cors: {
        origin: true,
        methods: ["GET", "POST"]
    }
});

sub.subscribe("MESSAGES")
sub.subscribe("ONLINE_USERS")

export const getReceiverSocketId = (receiverId: string) => {
	return userSocketMap[receiverId];
};

const userSocketMap: { [key: string]: string } = {}; // {userId: socketId}

io.on("connection", (socket) => {
	console.log("a user connected", socket.id);

	const userId = socket.handshake.query.userId as string;

	if (userId) userSocketMap[userId] = socket.id;

	pub.publish("ONLINE_USERS", JSON.stringify(Object.keys(userSocketMap)));

	// io.emit("getOnlineUsers", Object.keys(userSocketMap));

	socket.on("disconnect", () => {
		console.log("user disconnected", socket.id);
		delete userSocketMap[userId];
		// io.emit("getOnlineUsers", Object.keys(userSocketMap));
		pub.publish("ONLINE_USERS", JSON.stringify(Object.keys(userSocketMap)));
	});
});

sub.on("message", async (channel, message) => {
	if (channel === "ONLINE_USERS") {
	  io.emit("getOnlineUsers", JSON.parse(message));
	}

})

export { app, io, httpServer };