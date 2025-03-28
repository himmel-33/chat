import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import './App.css'

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
    <>
    <div className="m-4 p-4 border rounded-2xl">
      <div className="p-4 bg-blue-600 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="text-4xl text-white mb-4">
            Live 채팅방 
          </div>
          <img src ="public/check.png" alt="checkimg" />
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
