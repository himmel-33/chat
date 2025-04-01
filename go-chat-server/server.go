package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

// WebSocket 연결 업그레이더 설정
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // 모든 요청 허용 (보안적으로 개선 가능)
	},
}

// 클라이언트 관리
var clients = make(map[*websocket.Conn]string) // 클라이언트 소켓과 유저명 저장
var broadcast = make(chan Message)             // 메시지 브로드캐스트 채널

// 메시지 구조체 정의 (JSON 변환 가능)
type Message struct {
	Username string `json:"username"`
	Message  string `json:"message"`
}

// WebSocket 연결 처리
func handleConnections(w http.ResponseWriter, r *http.Request) {
	// WebSocket으로 업그레이드
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket 연결 실패:", err)
		return
	}
	defer conn.Close()

	// 유저네임 가져오기 (쿼리 파라미터)
	username := r.URL.Query().Get("username")
	if username == "" {
		username = "익명"
	}
	clients[conn] = username

	// 새로운 유저가 접속했음을 브로드캐스트
	broadcast <- Message{Username: "시스템", Message: fmt.Sprintf("%s님이 입장했습니다.", username)}
	log.Printf("%s님이 접속했습니다.\n", username) // 서버 터미널에 접속 로그 출력

	// 클라이언트 메시지 수신
	for {
		var msg Message
		err := conn.ReadJSON(&msg)
		if err != nil {
			log.Println("메시지 읽기 오류:", err)
			delete(clients, conn)
			broadcast <- Message{Username: "시스템", Message: fmt.Sprintf("%s님이 퇴장했습니다.", username)}
			log.Printf("%s님이 퇴장했습니다.\n", username) // 서버 터미널에 퇴장 로그 출력
			break
		}

		// 메시지 브로드캐스트
		broadcast <- msg
		log.Printf("%s: %s\n", msg.Username, msg.Message) // 서버 터미널에 메시지 내용 출력
	}
}

// 메시지 브로드캐스트 핸들러
func handleMessages() {
	for {
		msg := <-broadcast
		for client := range clients {
			err := client.WriteJSON(msg)
			if err != nil {
				log.Println("메시지 전송 오류:", err)
				client.Close()
				delete(clients, client)
			}
		}
	}
}

func main() {
	// 메시지 브로드캐스트를 비동기 처리
	go handleMessages()

	http.HandleFunc("/ws", handleConnections)

	fmt.Println("✅ WebSocket 서버 실행 중: http://localhost:3000/ws")
	err := http.ListenAndServe(":3000", nil)
	if err != nil {
		log.Fatal("서버 실행 오류:", err)
	}
}