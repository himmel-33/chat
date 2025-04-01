package main

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Client struct {
	Conn *websocket.Conn
	Send chan string
}

var clients = make(map[*Client]bool)
var broadcast = make(chan string)

func handleConnections(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		fmt.Println("WebSocket 연결 실패:", err)
		return
	}
	sender := &Client{Conn: conn, Send: make(chan string)}
	clients[sender] = true

	defer func() {
		delete(clients, sender)
		conn.Close()
	}()

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			break
		}
		broadcast <- string(msg)
	}
}

func handleMessages() {
	for {
		msg := <-broadcast
		for client := range clients {
			client.Conn.WriteMessage(websocket.TextMessage, []byte(msg))
		}
	}
}

func main() {
	r := gin.Default()
	r.GET("/ws", handleConnections)
	go handleMessages()

	r.Run(":3000")
}