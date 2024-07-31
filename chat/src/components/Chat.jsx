import { useState, useEffect, useRef } from "react";
import { db, storage } from "../config/firebase";
import {
  collection,
  addDoc,
  where,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import EmojiPicker from 'emoji-picker-react';
import "../styles/Chat.css";
import defaultAvatar from '../pictures/Avatar1.webp';

const Chat = ({ room, username, avatar }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [file, setFile] = useState(null);
  const messagesRef = collection(db, "chats");
  const endRef = useRef(null);

  useEffect(() => {
    const queryMessages = query(
      messagesRef,
      where("room", "==", room),
      orderBy("createdAt")
    );
    const unsubscribe = onSnapshot(queryMessages, (snapshot) => {
      let messages = [];
      snapshot.forEach((doc) => {
        messages.push({ ...doc.data(), id: doc.id });
      });
      setMessages(messages);
      // Scroll to the bottom after updating messages
      setTimeout(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    return () => unsubscribe();
  }, [room]);

  const handleEmoji = (emojiObject) => {
    setNewMessage((previous) => previous + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (newMessage === "" && !file) return;

    let fileUrl = null;
    let fileType = null;
    if (file) {
      const fileRef = ref(storage, `chat-files/${file.name + Date.now()}`);
      const snapshot = await uploadBytes(fileRef, file);
      fileUrl = await getDownloadURL(snapshot.ref);
      fileType = file.type.startsWith("image/") ? "image" : "file";
      setFile(null);
    }

    await addDoc(messagesRef, {
      text: newMessage,
      createdAt: serverTimestamp(),
      user: username,
      userPhotoURL: avatar || defaultAvatar,
      room,
      fileUrl, 
      fileType, 
      fileName: file ? file.name : null, 
    });

    setNewMessage("");
    // Scroll to the bottom after sending a message
    setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleDownload = (fileUrl, fileName) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  };

  return (
    <div className="chat-app">
      <div className="header">
        <h1>Welcome to: {room.toUpperCase()}</h1>
      </div>
      <div className="messages">
        {messages.map((message) => (
          <div key={message.id} className="message">
            <div className="message-header">
              <img src={message.userPhotoURL || defaultAvatar} alt={message.user} className="avatar" />
              <span className="user">{message.user}</span>
              <span className="timestamp">
                {message.createdAt?.toDate().toLocaleString()}
              </span>
            </div>
            <div className="message-text">
              {message.text}
              {message.fileUrl && (
                <div className="file-container">
                  {message.fileType === "image" ? (
                    <div className="file-image">
                      <img src={message.fileUrl} alt={message.fileName} className="message-image" />
                    </div>
                  ) : null}
                  <button
                    className="download-button"
                    onClick={() => handleDownload(message.fileUrl, message.fileName)}
                  >
                    Download {message.fileName}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef}></div>
      </div>
      <form onSubmit={handleSubmit} className="new-message-form">
        <input
          type="text"
          value={newMessage}
          onChange={(event) => setNewMessage(event.target.value)}
          className="new-message-input"
          placeholder="Type your message here..."
        />
        <input
          type="file"
          id="fileInput"
          style={{ display: 'none' }}
          onChange={(event) => setFile(event.target.files[0])}
        />
        <label htmlFor="fileInput" className="file-input-label">
          📎
        </label>
        <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="emoji-button">
          😊
        </button>
        <button type="submit" className="send-button">
          Send
        </button>
      </form>
      {showEmojiPicker && (
        <div className="emoji-picker-container">
          <EmojiPicker onEmojiClick={handleEmoji} />
        </div>
      )}
      {file && (
        <div className="file-preview">
          <p>File to be sent: {file.name}</p>
        </div>
      )}
    </div>
  );
};

export default Chat;
