import { useState, useEffect } from "react";
import { auth, provider, storage } from "../config/firebase";
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Cookies from 'universal-cookie';
import { v4 } from "uuid";
import '../styles/Auth.css';
import defaultAvatarUrl from '../pictures/Avatar1.webp'

const cookie = new Cookies();

function Auth(props) {
    const { Setsignin, onSignIn } = props;
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState("");
    const [imageUpload, setImageUpload] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);
                setUsername(user.displayName || "");
                cookie.set("user-token", user.refreshToken);
                cookie.set("username", user.displayName);
                cookie.set("avatar", user.photoURL || defaultAvatarUrl);
                Setsignin(true);
            } else {
                setCurrentUser(null);
            }
        });
    }, [Setsignin]);

    const signInWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            const newUsername = result.user.displayName;
            const newAvatar = result.user.photoURL || defaultAvatarUrl;
            cookie.set("user-token", result.user.refreshToken);
            cookie.set("username", newUsername);
            cookie.set("avatar", newAvatar);
            onSignIn(newUsername, newAvatar);
            Setsignin(true);
        } catch (error) {
            console.error(error);
        }
    };

    const handleImageUpload = async (user) => {
        if (imageUpload) {
            const imageRef = ref(storage, `avatars/${imageUpload.name + v4()}`);
            await uploadBytes(imageRef, imageUpload);
            const imageUrl = await getDownloadURL(imageRef);
            await updateProfile(user, { photoURL: imageUrl });
            return imageUrl;
        }
        return user.photoURL || defaultAvatarUrl;
    };

    const handleEmailSignIn = async (e) => {
        e.preventDefault();
        setError("");

        if (isSignUp) {
            if (password !== confirmPassword) {
                setError("Passwords do not match");
                return;
            }
            if (username.trim() === "") {
                setError("Username is required");
                return;
            }

            // Proceed with sign-up
            try {
                const result = await createUserWithEmailAndPassword(auth, email, password);
                const imageUrl = await handleImageUpload(result.user);
                await updateProfile(result.user, { displayName: username, photoURL: imageUrl });
                onSignIn(username, imageUrl);
                Setsignin(true);
            } catch (error) {
                console.error(error);
                setError(error.message);
            }
        } else {
            // Proceed with sign-in
            try {
                const result = await signInWithEmailAndPassword(auth, email, password);
                const currentUser = auth.currentUser;
                const storedUsername = currentUser.displayName || username;
                const imageUrl = currentUser.photoURL || defaultAvatarUrl;

                // If the username is not set in Firebase, prompt the user to set it
                if (!currentUser.displayName) {
                    await updateProfile(currentUser, { displayName: storedUsername });
                }

                onSignIn(storedUsername, imageUrl);
                Setsignin(true);
            } catch (error) {
                console.error(error);
                setError(error.message);
            }
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        if (currentUser) {
            try {
                const imageUrl = await handleImageUpload(currentUser);
                await updateProfile(currentUser, { displayName: username, photoURL: imageUrl });
                cookie.set("username", username);
                cookie.set("avatar", imageUrl);
                alert("Profile updated successfully");
            } catch (error) {
                console.error(error);
                setError(error.message);
            }
        }
    };

    return (
        <div className='auth-container'>
            {currentUser ? (
                <div className="profile-card">
                    <h3>Update Profile</h3>
                    <form onSubmit={handleProfileUpdate} className="profile-update-form">
                        <div className="profile-field">
                            <label htmlFor="username">Username</label>
                            <input 
                                type="text" 
                                id="username"
                                placeholder="Username" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div className="profile-field">
                            <label htmlFor="avatar">Avatar</label>
                            <input 
                                type="file" 
                                id="avatar"
                                accept="image/*"
                                onChange={(e) => setImageUpload(e.target.files[0])}
                            />
                            <img src={currentUser.photoURL || defaultAvatarUrl} alt="Avatar" className="current-avatar" />
                        </div>
                        <button type="submit">Update Profile</button>
                    </form>
                </div>
            ) : (
                <div className="auth-form">
                    <h3>Sign in with Google to continue!</h3>
                    <button onClick={signInWithGoogle} className="google-signin-btn">Sign in with Google</button>

                    <h3>Or sign in with Email</h3>
                    {error && <p className="error">{error}</p>}
                    <form onSubmit={handleEmailSignIn}>
                        {isSignUp && (
                            <>
                                <input 
                                    type="text" 
                                    placeholder="Username" 
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => setImageUpload(e.target.files[0])}
                                />
                            </>
                        )}
                        <input 
                            type="email" 
                            placeholder="Email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <input 
                            type="password" 
                            placeholder="Password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        {isSignUp && (
                            <input 
                                type="password" 
                                placeholder="Confirm Password" 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        )}
                        <button type="submit" className="auth-btn">
                            {isSignUp ? "Sign Up" : "Sign In"}
                        </button>
                    </form>
                    <button onClick={() => setIsSignUp(!isSignUp)} className="toggle-signup-btn">
                        {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                    </button>
                </div>
            )}
        </div>
    );
}

export default Auth;
