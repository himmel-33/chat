import express from "express";  //ES modules with Express (모듈형식으로 가져온 것)
import ViteExpress from "vite-express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";


const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer); 

io.on("connection", (socket) => {
  // ...
});

httpServer.listen(3000, () => {
    console.log('listening on 3000port')
});

// Express API 경로
app.get("/message", (_, res) => res.send("Hello from express!"));

// Vite 개발 서버 설정 (별도 실행)
async function startVite() {
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
    },
  });
  
  // Vite의 미들웨어를 Express에 연결
  app.use(vite.middlewares);
}

startVite();