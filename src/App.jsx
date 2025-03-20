import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000",{ //io에 url 및 옵션 넣기
  autoConnect: false //자동연결 비활성화 후 특정 시점에 연결을 시작
}); 

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  useEffect(() => {
    socket.on("receive_message", (msg) => {
      setChat((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("receive_message");
    };
  }, []);

  const sendMessage = () => {
    if (message.trim()) { //텍스트 입력 필드에 값이 있는 경우
      socket.emit("send_message", message);
      setMessage("");
    }
  };

  const connectToChatServer = () => {
    console.log('connectToChatServer 함수 실행');
    socket.connect(); //특정시점에 연결
  }
  const disconnectToChatServer = () => {
    console.log('disconnectToChatServer 함수 실행');
    socket?.disconnect(); // Optional Chaining으로 socket이 있을때만 실행
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>💬 실시간 채팅</h1>
      <button onClick={connectToChatServer}>접속하기</button>
      <button onClick={disconnectToChatServer}>접속종료</button>
      <div style={{ border: "1px solid gray", padding: "10px", height: "200px", overflowY: "auto" }}>
        {chat.map((msg, index) => (
          <p key={index}>{msg}</p>
        ))}
      </div>
      <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="메시지를 입력하세요..." />
      <button onClick={sendMessage}>전송</button>
    </div>
  );
}

export default App;