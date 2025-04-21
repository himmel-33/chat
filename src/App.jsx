import { useState } from "react";
import './App.css'

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [username, setUsername] = useState("");
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false); // 연결 상태 관리

  // WebSocket 연결을 useEffect에서 처리하지 않고 버튼 클릭 시 처리
  const connectToChatServer = () => {
    if (username && !socket) {
      const ws = new WebSocket(`wss://chat-backend-go.onrender.com/ws?username=${username}`);
      
      ws.onopen = () => {
        setSocket(ws);
        setIsConnected(true); // 연결 성공 시 상태 변경
        console.log("WebSocket 연결 성공");
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setChat((prev) => [...prev, data]); // 서버로부터 메시지 받기
      };

      ws.onerror = (error) => {
        console.log("WebSocket 오류:", error);
      };

      ws.onclose = () => {
        console.log("WebSocket 연결 종료");
        setIsConnected(false); // 연결 종료 시 상태 변경
      };
    }
  };

  const disconnectToChatServer = () => {
    if (socket && isConnected) {
      socket.close(); // WebSocket 연결 종료
      setIsConnected(false);
    }
  };

  const sendMessage = () => {
    if (message.trim() && socket) {
      const msg = { username, message };
      socket.send(JSON.stringify(msg)); // WebSocket으로 메시지 전송
      setMessage(""); // 메시지 입력란 비우기
    }
  };

  return (
    <>
    <div className="m-4 p-4 border rounded-2xl">
      <div className="p-4 bg-blue-600 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="text-4xl text-white mb-4">
            Live 채팅방 
          </div>
          <img src ="check.png" alt="checkimg" />
        </div>
        <div className="mt-4 p-4 border border-white rounded">
          <div className="text-xl text-amber-50">
            유저명: {username}
          </div>
          <div className="text-xl text-amber-50">
            현재 접속상태: {isConnected ? '접속중' : '미접속'}
          </div>
          <div className="flex gap-4 mt-4">
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="사용자명 입력" className="border p-2 rounded bg-white"/>
            <button onClick={connectToChatServer} className="">접속하기</button>
            <button onClick={disconnectToChatServer} className="">접속 종료</button>
          </div>
        </div>
      </div>    
      <div className="border p-4 h-64 rounded-b-2xl overflow-y-auto">
        {chat.map((a, i) => (
          <p key={i}>{a.username} : {a.message}</p>
        ))}
      </div>
      <div className="flex justify-between mt-4">
        <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="메시지 입력" className="border rounded w-5/6"/>
        <button onClick={sendMessage}>전송</button>
      </div>
    </div>     
    </>
  );
}

export default App;
