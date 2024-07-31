import { auth } from "../config/firebase";
import { signOut } from "firebase/auth";
import Cookies from "universal-cookie";

const cookies = new Cookies();

export const AppWrapper = ({ children, isAuth, setIsAuth, setIsInChat }) => {
  const signUserOut = async () => {
    await signOut(auth);
    cookies.remove("user-token");
    setIsAuth(false);
    setIsInChat(false);
  };

  return (
    <div className="App">
      <div className="app-header">
        <h1>Chat App</h1>
      </div>

      <div className="app-container">{children}</div>
      {isAuth && (
        <div className="sign-out"
        >
          <button onClick={signUserOut} >Sign Out</button>
        </div>
      )}
    </div>
  );
};
