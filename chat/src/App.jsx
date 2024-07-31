import  { useState, useRef, useEffect } from "react";
import Auth from "./components/Auth";
import Cookies from 'universal-cookie';
import Chat from "./components/Chat";
import { AppWrapper } from "./components/AppWrapper";
import "./styles/App.css";
import { auth } from "./config/firebase";

const cookies = new Cookies();

function App() {
  const [isAuth, setIsAuth] = useState(cookies.get("user-token"));
  const [isInChat, setIsInChat] = useState(localStorage.getItem("isInChat") === "true");
  const [room, setRoom] = useState(localStorage.getItem("room") || "");
  const [username, setUsername] = useState(cookies.get("username") || "");
  const [avatar, setAvatar] = useState(cookies.get("avatar") || "");
  const roomReference = useRef(null);

  const welcomeMessage = isInChat ? `Welcome back, ${username}!` : `Welcome, ${username}!`;

  useEffect(() => {
    const token = cookies.get("user-token");
    const storedUsername = cookies.get("username");
    const storedAvatar = cookies.get("avatar");

    if (token) {
      setIsAuth(true);
      setUsername(storedUsername);
      setAvatar(storedAvatar);
    } else {
      setIsAuth(false);
    }

    const isInChatStored = localStorage.getItem("isInChat") === "true";
    setIsInChat(isInChatStored);

    if (isInChatStored) {
      const storedRoom = localStorage.getItem("room");
      setRoom(storedRoom);
    }
  }, [setIsAuth, setUsername, setAvatar, setIsInChat, setRoom]);

  useEffect(() => {
    if (isInChat) {
      localStorage.setItem("isInChat", "true");
      localStorage.setItem("room", room);
    } else {
      localStorage.removeItem("isInChat");
      localStorage.removeItem("room");
    }
  }, [isInChat, room]);

  const handleSignIn = (newUsername, newAvatar) => {
    setUsername(newUsername);
    setAvatar(newAvatar);
    setIsAuth(true);

    // Set cookies after login
    cookies.set("username", newUsername);
    cookies.set("avatar", newAvatar);
    cookies.set("user-token", auth.currentUser.refreshToken);
  };

  if (!isAuth) {
    return (
      <AppWrapper isAuth={isAuth} setIsAuth={setIsAuth} setIsInChat={setIsInChat}>
        <Auth Setsignin={setIsAuth} onSignIn={handleSignIn} />
      </AppWrapper>
    );
  }

  return (
    <AppWrapper isAuth={isAuth} setIsAuth={setIsAuth} setIsInChat={setIsInChat}>
      <div className="welcome-message">
        <img src={avatar} alt="Avatar" className="avatar"/>
        <h2>{welcomeMessage}</h2>
      </div>
      {!isInChat ? (
        <div className="room">
          <label>Enter Room Name: </label>
          <input 
            type="text" 
            id="roomName" 
            ref={roomReference} 
            value={room} 
            onChange={(e) => setRoom(e.target.value)} 
          />
          <button 
            onClick={() => setIsInChat(true)}
            disabled={!room.trim()}
           className="enter">
            Enter Chat
          </button>
        </div>
      ) : (
        <div>
          <Chat room={room} username={username} avatar={avatar} />
          <button onClick={() => setIsInChat(false)} className="leave-chat-button">
            Leave Chat
          </button>
        </div>
      )}
    </AppWrapper>
  );
}

export default App;
