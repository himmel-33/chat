import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import "./styles.css";

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [username, setUsername] = useState("");
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false); //connectToChatServer 누를때마다 소켓연결 방지

  useEffect(() => {
    if (username && !socket) return; // username이 설정되지 않으면 소켓 생성 X

    const _socket = io("http://localhost:3000", {
      autoConnect: false,
      query: { username }, //ES6 단축 속성 (키와 값이 같을 때 축약)
    });

    _socket.on("receive_message", (data) => {
      setChat((prev) => [...prev, data]);
    });

    setSocket(_socket);

    return () => {
      _socket.disconnect(); // 컴포넌트가 언마운트될 때 소켓 연결 해제
    };
  }, [username]); // username이 변경될 때마다 새로운 소켓을 생성

  const sendMessage = () => {
    if (message.trim() && socket) {
      socket.emit("send_message", message); //에밋 서버에 데이터 전송 (JSON 형식으로도 가능)
      setMessage("");
    }
  };

  const connectToChatServer = () => {
    if (socket && !isConnected) {
      console.log("connectToChatServer 실행");
      socket.connect();
      setIsConnected(true);
    }
  };
  
  const disconnectToChatServer = () => {
    if (socket && isConnected) {
      console.log("disconnectToChatServer 실행");
      socket.disconnect();
      setIsConnected(false);
    }
  };

  return (
    <div className="border border-blue-400 rounded bg-gray-800 p-4 m-4">
      <h1 className="text-5xl text-white mb-4">Live 채팅방</h1>
      <div className="p-4 border rounded shadow-md">
        <h3 className="text-xl text-amber-50">유저명: {username}</h3>
        <h3 className="text-xl text-amber-50">현재 접속상태: {isConnected ? '접속중' : '미접속'}</h3>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="사용자명 입력" className="border p-2 rounded mt-2 bg-amber-50 mr-2"/>
        <button onClick={connectToChatServer} className="bg-blue-500 text-black p-2 m-2">접속하기</button>
        <button onClick={disconnectToChatServer} className="bg-blue-500 text-black p-2 m-2">접속 종료</button>
      </div>
      <div className="border p-4 mt-4 h-64 overflow-y-auto">
        {chat.map((a, i) => (
          <p key={i}>{a.username} : {a.message}</p>
        ))}
      </div>
      <div className="w-full">
        <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="메시지 입력" className="border p-2 rounded mt-4"/>
        <button onClick={sendMessage}>전송</button>
      </div>
    </div>
  );
}

export default App;
