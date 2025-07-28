import { useState, useEffect } from "react";
import './App.css'; // 반복되는 부분만 사용

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [username, setUsername] = useState("");
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState([]); // 접속자 목록

  const connectToChatServer = () => {
    if (username && !socket) {
      const ws = new WebSocket(`ws://localhost:3000/ws?username=${username}`);
      ws.onopen = () => {
        setSocket(ws);
        setIsConnected(true);
        console.log("WebSocket 연결 성공");
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "users") {
            setUsers(data.users);
          } else {
            setChat((prev) => [...prev, data]);
          }
        } catch (err) {
          console.error("메시지 파싱 오류:", err, event.data);
        }
      };
      ws.onerror = (err) => {
        console.error("WebSocket 에러:", err);
      };
      ws.onclose = (e) => {
        setIsConnected(false);
        setSocket(null);
        console.log("WebSocket 연결 종료", e);
      };
    }
  };

  const disconnectToChatServer = () => {
    if (socket && isConnected) {
      socket.close();
      setIsConnected(false);
      setSocket(null);
    }
  };

  const sendMessage = () => {
    if (message.trim() && socket) {
      const msg = { username, message };
      socket.send(JSON.stringify(msg));
      setMessage("");
    }
  };
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  useEffect(() => {
    console.log("접속자 목록:", users);
  }, [users]);

  return (
    <div className="min-h-screen flex bg-[#23272a]">
      {/* 왼쪽 사이드바 */}
      <div className="w-1/3 bg-[#2c2f33] p-6 flex flex-col border-r border-[#23272a]">
        <img src='logo2.png' alt="로고" className="mb-6"/>
        <div className="mb-6">
          <div className="text-lg text-[#5865f2] font-bold mb-2">유저 정보</div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="사용자명 입력"
            className="d-input mb-2 w-full"
            disabled={isConnected}
          />
          <button onClick={connectToChatServer} className="d-btn mb-2 w-full" disabled={isConnected}>
            접속하기
          </button>
          <button onClick={disconnectToChatServer} className="d-btn w-full" disabled={!isConnected}>
            접속 종료
          </button>
        </div>
        <div>
          <div className="text-md text-[#43b581] font-semibold mb-2">접속자</div>
          <ul className="d-users-list">
            {users.map((user, i) => (
              <li key={i} className="text-white">{user}</li>
            ))}
          </ul>
        </div>
      </div>
      {/* 오른쪽 채팅창 */}
      <div className="w-2/3 flex flex-col p-6">
        <div className="flex-1 bg-[#36393f] rounded-lg p-4 overflow-y-auto mb-4">
          {chat.map((a, i) => (
            <div key={i} className="mb-2">
              <span className="font-bold text-white">{a.username}</span>
              <span className="ml-2 text-[#dcddde]">{a.message}</span>
            </div>
          ))}
        </div>
        <div className="flex">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="메시지 입력"
            className="d-input flex-1 mr-2"
            disabled={!isConnected}
            onKeyDown={handleKeyPress}
          />
          <button onClick={sendMessage} className="d-btn" disabled={!isConnected}>
            전송
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
