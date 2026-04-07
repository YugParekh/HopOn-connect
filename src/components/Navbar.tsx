import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Bell, Moon, Sun } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

type Theme = "light" | "dark";

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [theme, setTheme] = useState<Theme>("light");

  const applyTheme = (nextTheme: Theme) => {
    const root = document.documentElement;
    if (nextTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", nextTheme);
    setTheme(nextTheme);
  };

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));

    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (savedTheme === "light" || savedTheme === "dark") {
      applyTheme(savedTheme);
      return;
    }

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(prefersDark ? "dark" : "light");
  }, []);

  const fetchNotifications = async (currentUser: any) => {
    if (!currentUser?._id) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/host/${currentUser._id}/notifications`);
      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  useEffect(() => {
    if (!user?._id) return;

    fetchNotifications(user);
    const interval = setInterval(() => fetchNotifications(user), 30000);
    return () => clearInterval(interval);
  }, [user?._id]);

  const markNotificationsRead = async () => {
    const unreadEventIds = Array.from(
      new Set(
        notifications
          .filter((notification) => !notification.isRead)
          .map((notification) => notification.event?._id)
      )
    );

    try {
      await Promise.all(
        unreadEventIds.map((eventId) =>
          fetch(`${API_BASE_URL}/api/posts/${eventId}/mark-requests-read`, {
            method: "POST",
          })
        )
      );

      setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark notifications read", error);
    }
  };

  const handleOpenNotifications = async () => {
    const nextOpenState = !notificationsOpen;
    setNotificationsOpen(nextOpenState);

    if (nextOpenState && unreadCount > 0) {
      await markNotificationsRead();
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const toggleTheme = () => {
    applyTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <nav className="sticky top-0 z-40 flex justify-between items-center px-6 py-4 border-b border-border bg-background/90 backdrop-blur-md shadow-sm">
      <Link to="/" className="text-xl font-bold tracking-tight">
        HopOn
      </Link>

      <div className="flex items-center gap-6">
        <Link to="/explore" className="text-sm font-medium hover:text-primary transition-colors">
          Explore
        </Link>
        <Link to="/clubs" className="text-sm font-medium hover:text-primary transition-colors">
          Clubs
        </Link>

        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-border bg-card hover:bg-muted transition-colors"
          aria-label="Toggle theme"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {user && (
          <div className="relative">
            <button
              onClick={handleOpenNotifications}
              className="relative p-2 rounded-full border border-border bg-card hover:bg-muted transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-96 max-h-96 overflow-y-auto bg-card border border-border rounded-xl shadow-lg p-3 z-50">
                <p className="text-sm font-semibold mb-2">Notifications</p>
                {notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No join requests yet</p>
                ) : (
                  <div className="space-y-2">
                    {notifications.slice(0, 10).map((notification) => (
                      <Link
                        key={notification.id}
                        to={`/event/${notification.event._id}`}
                        onClick={() => setNotificationsOpen(false)}
                        className="block p-3 rounded-lg border border-border hover:bg-muted transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <img
                            src={notification.requester?.photo || "https://via.placeholder.com/32"}
                            alt={notification.requester?.name || "Requester"}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {notification.requester?.name || notification.requester?.email || "Someone"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              requested to join {notification.event?.title}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {user ? (
          <div className="relative">
            <div
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 cursor-pointer rounded-full"
            >
              <img
                src={user.photo || "https://via.placeholder.com/30"}
                className="w-8 h-8 rounded-full"
                alt="Profile"
              />
            </div>

            {open && (
              <div className="absolute right-0 mt-2 w-52 bg-card border border-border rounded-xl shadow-lg p-2">
                <Link to="/dashboard" className="block px-4 py-2 hover:bg-muted rounded-lg text-sm">
                  Dashboard
                </Link>

                <Link to="/profile" className="block px-4 py-2 hover:bg-muted rounded-lg text-sm">
                  Profile
                </Link>

                <Link to="/chat" className="block px-4 py-2 hover:bg-muted rounded-lg text-sm">
                  Community Chat
                </Link>

                <Link to="/create-event" className="block px-4 py-2 hover:bg-muted rounded-lg text-sm">
                  Create Event
                </Link>

                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 hover:bg-muted rounded-lg text-sm"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">
              Login
            </Link>
            <Link
              to="/signup"
              className="bg-primary text-primary-foreground text-sm px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
