package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

// upgrader 정의 및 cors 설정
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // 모든 요청을 허용 (CORS 관련, 실제 배포 시 제한 필요)
	},
}

var clients = make(map[*websocket.Conn]string) // *websocket.Conn : ws 연결 객체의 포인터
var broadcast = make(chan Message)             // channel 사용

type Message struct {
	Username string `json:"username"`
	Message  string `json:"message"`
	Type     string `json:"type,omitempty"`
}

// WebSocket 연결 처리 함수
func handleConnections(w http.ResponseWriter, r *http.Request) {
	// http 요청을 WebSocket으로 업그레이드
	conn, err := upgrader.Upgrade(w, r, nil) //conn.ReadJSON(), conn.WriteJSON() 등을 통해 메시지를 주고받을 수 있게 됨
	if err != nil {
		log.Println("WebSocket 연결 실패:", err)
		return
	}
	defer conn.Close()

	// url 쿼리파라미터로 유저네임 받기
	username := r.URL.Query().Get("username")
	if username == "" {
		username = "익명"
	}
	clients[conn] = username

	sendUserList() // 모든 클라이언트에 접속자 목록 전송
	log.Printf("%s님이 접속했습니다.\n", username)

	// 메세지 수신 for 무한 루프(웹소켓 연결이 열려 있는 동안 계속 반복)
	for {
		var msg Message
		err := conn.ReadJSON(&msg) //클라이언트가 JSON 메시지를 보낼 때까지 기다리는 블로킹 함수(메시지오면 json을 디코딩하여 msg에 넣음)
		if err != nil { //오류 및 퇴장 처리
			delete(clients, conn)
			sendUserList() // 퇴장 시에도 접속자 목록 전송
			log.Printf("%s님이 퇴장했습니다.\n", username) 
			break
		}

		// 디코딩된 msg -> 브로드캐스트
		broadcast <- Message{Username: msg.Username, Message: msg.Message, Type: "chat"}
		log.Printf("%s: %s\n", msg.Username, msg.Message)
	}
}

func sendUserList() {
    userList := []string{}
    for _, name := range clients {
        userList = append(userList, name)
    }
    for client := range clients {
        client.WriteJSON(map[string]interface{}{
            "type":  "users",
            "users": userList,
        })
    }
}

// 메시지 브로드캐스트 핸들러
func handleMessages() {
    for {
        msg := <-broadcast
        for client := range clients { 
            err := client.WriteJSON(msg)
            if err != nil { //오류처리
                log.Println("메시지 전송 오류:", err)
                client.Close()
                delete(clients, client)
                sendUserList() // 연결 끊길 때 접속자 목록 갱신
            }
        }
    }
}

func main() {
	// 메시지 브로드캐스트를 비동기 처리(채널로 들어온 메세지를 모든 클라이언트에서 전파하는 무한루프이기에 고루틴으로 비동기 실행)
	go handleMessages() //고루틴이 아니라면  handleMessages()가 끝나기 전까진 http.HandleFunc()이나 http.ListenAndServe()로 절대 안 넘어감.
						// "실시간 메시지 브로드캐스트 처리기" 를 서버 실행과 병렬로 처리하기 위함
	http.HandleFunc("/ws", handleConnections)

	fmt.Println("✅ WebSocket 서버 실행 중: http://localhost:3000/ws")
	err := http.ListenAndServe(":3000", nil)
	if err != nil {
		log.Fatal("서버 실행 오류:", err)
	}
}