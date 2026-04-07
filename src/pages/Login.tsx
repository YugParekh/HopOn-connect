import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";

import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const provider = new GoogleAuthProvider();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      const token = await firebaseUser.getIdToken();

      // 🔗 sync with backend
      const res = await fetch("http://localhost:5002/api/users/sync", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      // ✅ NORMALIZE USER (VERY IMPORTANT)
      const user = {
        _id: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        photo: firebaseUser.photoURL,
        ...data, // optional backend fields
      };

      localStorage.setItem("user", JSON.stringify(user));

      alert("Login successful 🚀");

      window.location.href = "/";

    } catch (err) {
      console.error("Google Login Error:", err);
      alert("Login failed ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      const token = await firebaseUser.getIdToken();

      // 🔗 sync with backend
      const res = await fetch("http://localhost:5002/api/users/sync", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      // ✅ NORMALIZE USER
      const user = {
        _id: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        photo: firebaseUser.photoURL,
        ...data,
      };

      localStorage.setItem("user", JSON.stringify(user));

      alert("Login successful 🚀");

      window.location.href = "/";

    } catch (err: any) {
      console.error("Email Login Error:", err);
      alert(err.message || "Login failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 flex items-center justify-center px-4 min-h-[80vh]">
        <div className="w-full max-w-md">
          <h1 className="text-4xl font-bold text-center mb-2">
            Welcome back
          </h1>

          <p className="text-center text-muted-foreground mb-8">
            Log in to your HopOn account
          </p>

          {/* GOOGLE LOGIN */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 border rounded-full py-3 hover:bg-muted transition-colors disabled:opacity-50"
          >
            {loading ? "Loading..." : "Continue with Google"}
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-3 border rounded-xl"
              required
              disabled={loading}
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 border rounded-xl"
              required
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-full disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="text-center mt-6 text-sm">
            Don't have an account?{" "}
            <Link to="/signup" className="underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;