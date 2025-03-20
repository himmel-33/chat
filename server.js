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
  console.log(`🔌 사용자 접속함: ${client.id}`);

  client.on("send_message", (message) => {
    console.log(`📩 Message received: ${message}`);
    io.emit("receive_message", message); // 모든 클라이언트에게 전송
  });

  client.on("disconnect", () => {
    console.log(`❌ 사용자가 접속종료함: ${client.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

// ✅ 라우트를 먼저 정의
app.get("/message", (_, res) => res.send("Hello from express!"));
app.get("/api", (_, res) => res.send("Hello from api!"));