import { useEffect, useMemo, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Send, MessageCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "@/lib/api";

const API_CANDIDATES = [API_BASE_URL]
  .filter(Boolean)
  .filter((value, index, array) => array.indexOf(value) === index) as string[];

const checkBackendHealth = async (baseUrl: string) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1800);
    const response = await fetch(`${baseUrl}/`, { signal: controller.signal });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
};

const resolveApiBaseUrl = async () => {
  for (const candidate of API_CANDIDATES) {
    const healthy = await checkBackendHealth(candidate);
    if (healthy) return candidate;
  }

  return API_CANDIDATES[0] || "";
};

interface Message {
  _id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  eventId?: string;
}

const Chat = () => {
  const { eventId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(API_CANDIDATES[0] || "");
  const [event, setEvent] = useState<any>(null);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = useMemo(() => JSON.parse(localStorage.getItem("user") || "{}"), []);
  const userId = user?._id || "";
  const username = user?.name || user?.email || "";

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const resolvedUrl = await resolveApiBaseUrl();
      if (!cancelled) {
        setApiBaseUrl(resolvedUrl);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!apiBaseUrl || !userId || !username) return;

    // Fetch event if eventId provided
    if (eventId) {
      fetch(`${apiBaseUrl}/api/posts/${eventId}`)
        .then(res => res.json())
        .then(data => {
          setEvent(data || null);
        })
        .catch(err => console.error("Error fetching event:", err));
    }

    // Fetch messages
    const url = eventId ? `${apiBaseUrl}/api/messages?eventId=${eventId}` : `${apiBaseUrl}/api/messages`;
    fetch(url)
      .then(res => res.json())
      .then(data => setMessages(data))
      .catch(err => console.error("Error fetching messages:", err));

    // Connect to Socket.IO
    const socket = io(apiBaseUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      setConnectionStatus("Connected");
      socket.emit("joinChat", { userId, username, eventId });
    });

    socket.on("connect_error", () => {
      setIsConnected(false);
      setConnectionStatus(`Connection failed (${apiBaseUrl}). Retrying...`);
    });

    socket.on("reconnect_attempt", (attempt) => {
      setConnectionStatus(`Reconnecting... (${attempt})`);
    });

    socket.on("reconnect", () => {
      setIsConnected(true);
      setConnectionStatus("Reconnected");
      socket.emit("joinChat", { userId, username, eventId });
    });

    socket.on("chat:error", (payload: { message?: string }) => {
      setConnectionStatus(payload?.message || "Chat error occurred");
    });

    socket.on("message", (message: Message) => {
      if (!eventId || message.eventId === eventId) {
        setMessages(prev => [...prev, message]);
      }
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      setConnectionStatus("Disconnected. Trying to reconnect...");
    });

    return () => {
      socket.disconnect();
    };
  }, [eventId, apiBaseUrl, userId, username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current) return;

    socketRef.current.emit("sendMessage", {
      message: newMessage,
      userId,
      username,
      eventId
    });

    setNewMessage("");
  };

  const handleReconnect = () => {
    if (socketRef.current && !socketRef.current.connected) {
      setConnectionStatus("Reconnecting...");
      socketRef.current.connect();
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <MessageCircle size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Please login to chat</h2>
          <p className="text-muted-foreground">You need to be logged in to participate in the community chat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-card rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-6">
            <div className="flex items-center gap-3">
              {eventId && (
                <Link to={`/event/${eventId}`} className="p-2 hover:bg-black/20 rounded-full">
                  <ArrowLeft size={20} />
                </Link>
              )}
              <MessageCircle size={24} />
              <div>
                <h1 className="text-2xl font-bold">
                  {eventId ? `${event?.title || "Event"} Chat` : "Community Chat"}
                </h1>
                <p className="text-sm opacity-90">
                  {isConnected ? "🟢 Connected" : "🔴 Disconnected"} • {messages.length} messages
                </p>
                <p className="text-xs opacity-80 mt-1">{connectionStatus}</p>
              </div>
              {!isConnected && (
                <button
                  type="button"
                  onClick={handleReconnect}
                  className="ml-auto px-3 py-1.5 text-xs rounded-full border border-white/40 hover:bg-black/20"
                >
                  Retry
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex ${msg.userId === userId ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      msg.userId === userId
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">{msg.username}</span>
                      <span className="text-xs opacity-70">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm">{msg.message}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={!isConnected}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || !isConnected}
                className="p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;