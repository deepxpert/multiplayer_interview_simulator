// src/MessageInput.jsx
import { useState } from "react";

function MessageInput({ onSend, disabled }) {
  const [text, setText] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  }

  return (
    <form className="input-row" onSubmit={handleSubmit}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={disabled? "time is up..." : "type your answer.."}
        disabled = {disabled}
      />
      <button type="submit" disabled={disabled}>Send</button>
    </form>
  );
}

export default MessageInput;