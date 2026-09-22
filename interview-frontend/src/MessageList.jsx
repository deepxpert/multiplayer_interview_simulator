// src/MessageList.jsx
// src/MessageList.jsx
function MessageList({ messages }) {
  return (
    <ul className="messages">
      {messages.map((msg, index) => (
        <li
          key={index}
          className={msg.sender === "ai" ? "ai-msg" : "user-msg"}
        >
          {msg.sender === "ai" ? "🤖 " : "🧑 "}
          {msg.message}
        </li>
      ))}
    </ul>
  );
}

export default MessageList;