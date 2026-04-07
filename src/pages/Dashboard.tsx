import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Check, X, Trash2, Users, Eye } from "lucide-react";
import Navbar from "@/components/Navbar";

const Dashboard = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [tab, setTab] = useState("my");
  const [requestDetailsMap, setRequestDetailsMap] = useState<Record<string, any[]>>({});
  const [selectedRequester, setSelectedRequester] = useState<any | null>(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // 🔥 FETCH EVENTS
  const fetchEvents = () => {
    fetch("http://localhost:5002/api/posts")
      .then((res) => res.json())
      .then(async (data) => {
        console.log("ALL EVENTS:", data);
        console.log("User _id:", user._id);
        const my = data.filter((e) => e.userId === user._id);
        console.log("My events:", my);
        setEvents(data);

        const detailsEntries = await Promise.all(
          my.map(async (event: any) => {
            try {
              const response = await fetch(`http://localhost:5002/api/posts/${event._id}/request-details?hostUserId=${user._id}`);
              const details = await response.json();
              return [event._id, details.requests || []];
            } catch {
              return [event._id, []];
            }
          })
        );

        setRequestDetailsMap(Object.fromEntries(detailsEntries));
      });
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // 🔥 FILTERS
  const myEvents = events.filter((e) => e.userId === user._id);
  const joinedEvents = events.filter((e) =>
    e.attendees?.includes(user._id)
  );

  // 🔥 DELETE
  const deleteEvent = async (id: string) => {
    await fetch(`http://localhost:5002/api/posts/${id}`, {
      method: "DELETE",
    });
    fetchEvents();
  };

  // 🔥 APPROVE
  const approve = async (eventId: string, uid: string) => {
    await fetch(`http://localhost:5002/api/posts/${eventId}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: uid }),
    });
    fetchEvents();
  };

  // 🔥 REJECT
  const reject = async (eventId: string, uid: string) => {
    await fetch(`http://localhost:5002/api/posts/${eventId}/reject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: uid }),
    });
    fetchEvents();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-bold mb-8">Dashboard</h1>

        {/* 🔘 TABS */}
        <div className="flex gap-4 mb-10">
          <button
            onClick={() => setTab("my")}
            className={`px-5 py-2 rounded-full ${
              tab === "my" ? "bg-foreground text-background" : "bg-muted text-foreground hover:bg-muted/80"
            }`}
          >
            My Events
          </button>

          <button
            onClick={() => setTab("joined")}
            className={`px-5 py-2 rounded-full ${
              tab === "joined" ? "bg-foreground text-background" : "bg-muted text-foreground hover:bg-muted/80"
            }`}
          >
            Joined Events
          </button>

          <button
            onClick={fetchEvents}
            className="px-5 py-2 rounded-full bg-blue-500 text-white"
          >
            Refresh
          </button>
        </div>

        {/* ================= MY EVENTS ================= */}
        {tab === "my" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myEvents.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar size={24} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No events created yet</h3>
                  <p className="text-muted-foreground mb-6">Start by creating your first event to connect with others.</p>
                  <Link to="/create-event" className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity">
                    Create Event
                  </Link>
                </div>
              </div>
            ) : (
              myEvents.map((event) => (
                <div key={event._id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                  {/* IMAGE */}
                  {event.image && (
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="p-6">
                    {/* TITLE */}
                    <h2 className="font-semibold text-lg mb-2 line-clamp-2">{event.title}</h2>

                    {/* DETAILS */}
                    <div className="space-y-1 mb-4 text-sm text-muted-foreground">
                      <p>{event.date} • {event.time}</p>
                      <p>{event.location}</p>
                      <p>{event.attendees?.length || 0} attendees</p>
                    </div>

                    {/* 🔥 REQUESTS */}
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Requests ({(requestDetailsMap[event._id] || []).length})</p>
                      {(requestDetailsMap[event._id] || []).length === 0 ? (
                        <p className="text-xs text-muted-foreground">No pending requests</p>
                      ) : (
                        <div className="space-y-2">
                          {(requestDetailsMap[event._id] || []).slice(0, 2).map((request: any) => (
                            <div key={request.userId} className="bg-muted p-2 rounded-lg space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <img
                                    src={request.user?.photo || "https://via.placeholder.com/24"}
                                    alt={request.user?.name || "Requester"}
                                    className="w-6 h-6 rounded-full object-cover"
                                  />
                                  <span className="text-xs truncate">
                                    {request.user?.name || request.user?.email || "Unknown user"}
                                  </span>
                                </div>
                                <button
                                  onClick={() => setSelectedRequester(request.user)}
                                  className="p-1 border border-border rounded-full hover:bg-muted"
                                >
                                  <Eye size={11} />
                                </button>
                              </div>

                              <div className="flex gap-1">
                                <button
                                  onClick={() => approve(event._id, request.userId)}
                                  className="p-1 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                                >
                                  <Check size={12} />
                                </button>
                                <button
                                  onClick={() => reject(event._id, request.userId)}
                                  className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                          {(requestDetailsMap[event._id] || []).length > 2 && (
                            <p className="text-xs text-muted-foreground">+{(requestDetailsMap[event._id] || []).length - 2} more</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 🔥 ACTIONS */}
                    <div className="flex gap-2">
                      <Link
                        to={`/create-event?id=${event._id}`}
                        className="flex-1 bg-blue-500 text-white px-4 py-2 text-sm rounded-full font-medium text-center hover:bg-blue-600 transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => deleteEvent(event._id)}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ================= JOINED EVENTS ================= */}
        {tab === "joined" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {joinedEvents.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users size={24} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No joined events yet</h3>
                  <p className="text-muted-foreground mb-6">Explore events and send join requests to get started.</p>
                  <Link to="/explore" className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity">
                    Explore Events
                  </Link>
                </div>
              </div>
            ) : (
              joinedEvents.map((event) => (
                <Link
                  key={event._id}
                  to={`/event/${event._id}`}
                  className="group bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  {event.image && (
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h2 className="font-semibold text-lg mb-2 line-clamp-2">{event.title}</h2>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>{event.date} • {event.time}</p>
                      <p>{event.location}</p>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-green-600">
                      <Check size={16} />
                      <span className="text-sm font-medium">You're attending</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      {selectedRequester && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl p-6 relative border border-border">
            <button
              onClick={() => setSelectedRequester(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-4 mb-4">
              <img
                src={selectedRequester.photo || "https://via.placeholder.com/64"}
                alt={selectedRequester.name || "Requester"}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <h3 className="text-lg font-semibold">{selectedRequester.name || "Unknown user"}</h3>
                <p className="text-sm text-muted-foreground">{selectedRequester.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Location</p>
                <p className="text-sm">{selectedRequester.location || "Not specified"}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Bio</p>
                <p className="text-sm">{selectedRequester.bio || "No bio added"}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground mb-2">Interests</p>
                <div className="flex flex-wrap gap-2">
                  {(selectedRequester.interests || []).length === 0 ? (
                    <span className="text-sm text-muted-foreground">No interests listed</span>
                  ) : (
                    selectedRequester.interests.map((interest: string) => (
                      <span key={interest} className="text-xs px-2 py-1 rounded-full bg-muted">
                        {interest}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;