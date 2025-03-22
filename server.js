import express from "express";
import * as http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // React 서버 주소
    methods: ["GET", "POST"],
  },
});

const PORT = 3000;

app.use(cors()); // CORS 설정 추가

io.on("connection", (client) => {
  //console.log(client.handshake.query); //handshake안 query내용
  const connectedClientUsername = client.handshake.query.username; //handshake.query.username 가져오기
  console.log(`${connectedClientUsername} 접속함`);
  // 접속 메시지를 유저의 메시지로 보내기
  io.emit("receive_message", { username: "관리자", message: `${connectedClientUsername}님이 접속했습니다.` });

  client.on("send_message", (message) => {
    console.log(`${connectedClientUsername}: ${message}`);
    io.emit("receive_message", {username: connectedClientUsername, message}); //에밋 (모든 사용자에게 보냄) 데이터를 보낼때 JSON 형식으로도 가능
  });

  client.on("disconnect", () => {
    console.log(`${connectedClientUsername}가 접속종료함`);
    io.emit("receive_message", { username: "관리자", message: `${connectedClientUsername}님이 접속했습니다.` });
  });
});

httpServer.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});