import { useState, useEffect } from "react";
import { socket } from "./socket";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import "./App.css";


function App(){
  const [roomId, setRoomId] = useState(null);
  const [messages, setMessage] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(()=>{
    function onConnect() { setConnected(true); console.log("Connected: ", socket.id); }
    function onDisconnect() { setConnected(false); }
    function onRoomCreated(id) { setRoomId(id); console.log("room id:", id); }
    function onChatMessage(msg){ setMessage((prev)=>[...prev, msg]); }
    function onError(msg) { console.warn("server error: ", msg); }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room-created", onRoomCreated);
    socket.on("chat-message", onChatMessage);
    socket.on("error-message", onError);

    return ()=>{
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room-created", onRoomCreated);
      socket.off("chat-message", onChatMessage);
      socket.off("error-message", onError);

    };

  },[]);

  function createRoom(){
    socket.emit("create-room");
  }

  function sendMessage(text){
    if (!roomId) return;
    socket.emit("send-message", { message: text, room: roomId });
  }

  return(
    <div className="app">
      <h1>Ai Interview Simulator</h1>
      {!roomId ? (
        <div className="start-screen">
          <p>Ready for your mock interview?</p>
          <button onClick={createRoom} disabled={!connected}>
            {connected ? "Start Interview" : "Connecting…"}
          </button>
        </div>
      ): (
        <div className="chat-screen">
          <p className="room-info">Room: {roomId}</p>
          <MessageList messages={messages} />
          <MessageInput onSend={sendMessage} />
        </div>
      )
    }
    </div>
  );
}
export default App;
