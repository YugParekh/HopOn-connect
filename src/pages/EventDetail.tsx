import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { MapPin, Calendar, Clock, ArrowLeft, Users, UserCheck, Trash2, Check, X, Share2, Star, MessageSquare, CreditCard, Eye, Send, Loader } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MAPBOX_TOKEN } from "@/mapbox";
import { API_BASE_URL } from "@/lib/api";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = MAPBOX_TOKEN;

const EventDetail = () => {
  const { id } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [hostRating, setHostRating] = useState(5);
  const [hostComment, setHostComment] = useState("");
  const [hostRatingSummary, setHostRatingSummary] = useState({
    averageHostRating: 0,
    totalHostRatings: 0,
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [requestDetails, setRequestDetails] = useState<any[]>([]);
  const [selectedRequester, setSelectedRequester] = useState<any | null>(null);
  
  // AI Chat state
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiMessages, setAiMessages] = useState<{ role: string; content: string }[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const getEventDateTime = (eventDate?: string, eventTime?: string) => {
    if (!eventDate) return null;
    const combined = eventTime ? `${eventDate}T${eventTime}` : eventDate;
    const parsed = new Date(combined);
    if (!Number.isNaN(parsed.getTime())) return parsed;
    const fallback = new Date(eventDate);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  };

  const fetchRequestDetails = async (eventId: string, hostId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${eventId}/request-details?hostUserId=${hostId}`);
      const data = await response.json();
      setRequestDetails(data.requests || []);
    } catch (err) {
      console.error("Failed to fetch request details", err);
      setRequestDetails([]);
    }
  };

  const fetchEvent = async () => {
    if (!id) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${id}`);
      if (!res.ok) throw new Error("Failed to fetch event");
      const eventData = await res.json();
      if (!eventData) throw new Error("Event not found");
      setEvent(eventData);

      const reviewsRes = await fetch(`${API_BASE_URL}/api/reviews/event/${id}`);
      const reviewsData = await reviewsRes.json();
      setReviews(reviewsData);

      const hostSummaryRes = await fetch(`${API_BASE_URL}/api/reviews/host/${eventData.userId}`);
      if (hostSummaryRes.ok) {
        const hostSummary = await hostSummaryRes.json();
        setHostRatingSummary({
          averageHostRating: hostSummary.averageHostRating || 0,
          totalHostRatings: hostSummary.totalHostRatings || 0,
        });
      }

      if (user._id && user._id === eventData.userId) {
        await fetchRequestDetails(eventData._id, user._id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FETCH EVENT
  useEffect(() => {
    if (id) fetchEvent();
  }, [id]);

  // 🗺️ MAP
  useEffect(() => {
    if (!event?.lat || !event?.lng) return;

    try {
      const map = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/mapbox/streets-v12",
        center: [event.lng, event.lat],
        zoom: 12,
      });

      new mapboxgl.Marker()
        .setLngLat([event.lng, event.lat])
        .addTo(map);

      return () => map.remove();
    } catch (err) {
      console.error("Map error:", err);
    }
  }, [event]);

  // 🔥 JOIN REQUEST
  const handleJoin = async () => {
    if (!user._id) {
      alert("Please login first");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${event._id}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user._id }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data?.error || "Unable to join this event");
        return;
      }

      alert("Request sent ✅");
      // Refresh event
      window.location.reload();
    } catch (err) {
      alert("Error sending request");
    }
  };

  // 🔥 APPROVE
  const approve = async (uid: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/posts/${event._id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: uid }),
      });
      await fetchEvent();
    } catch (err) {
      alert("Error approving");
    }
  };

  // 🔥 REJECT
  const reject = async (uid: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/posts/${event._id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: uid }),
      });
      await fetchEvent();
    } catch (err) {
      alert("Error rejecting");
    }
  };

  // 🔥 DELETE
  const deleteEvent = async () => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      await fetch(`${API_BASE_URL}/api/posts/${event._id}`, {
        method: "DELETE",
      });
      alert("Event deleted");
      window.location.href = "/dashboard";
    } catch (err) {
      alert("Error deleting");
    }
  };

  // 💳 RAZORPAY PAYMENT
  const handlePayment = async () => {
    if (!user._id) {
      alert("Please login first");
      return;
    }

    setProcessingPayment(true);
    try {
      // Load Razorpay script
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => initiatePayment();
      document.body.appendChild(script);
    } catch (err) {
      alert("Error loading payment gateway");
      setProcessingPayment(false);
    }
  };

  const initiatePayment = async () => {
    try {
      // Step 1: Create order on backend
      const orderRes = await fetch(`${API_BASE_URL}/api/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event._id,
          userId: user._id,
          amount: parseInt(event.price),
        }),
      });

      const orderData = await orderRes.json();
      if (!orderData.success) {
        alert(orderData.error || "Failed to create order");
        setProcessingPayment(false);
        return;
      }

      // Step 2: Open Razorpay checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount * 100,
        currency: "INR",
        name: "HopOn",
        description: event.title,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          // Step 3: Verify payment
          const verifyRes = await fetch(`${API_BASE_URL}/api/payments/verify-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              eventId: event._id,
              userId: user._id,
              amount: orderData.amount,
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            alert("✅ Payment successful! You are now an attendee.");
            setShowPaymentModal(false);
            window.location.reload();
          } else {
            alert("Payment verification failed");
          }
        },
        prefill: {
          name: user.name || user.email,
          email: user.email,
        },
        theme: {
          color: "#000000",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
      setProcessingPayment(false);
    } catch (err: any) {
      alert("Payment error: " + err.message);
      setProcessingPayment(false);
    }
  };

  // 🤖 AI CHAT HANDLER
  const sendAIMessage = async () => {
    if (!aiInput.trim() || !event) return;

    const userMessage = aiInput;
    setAiInput("");
    setAiMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setAiLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userMessage,
          eventContext: `Title: ${event.title}\nDescription: ${event.description}\nLocation: ${event.location}\nDate: ${event.date}\nTime: ${event.time || "TBD"}\nPrice: ${event.price}\nCategory: ${event.category}`,
        }),
      });

      if (!response.ok) throw new Error("Failed to get AI response");
      const data = await response.json();

      setAiMessages((prev) => [...prev, { role: "assistant", content: data.text || "I couldn't generate a response. Please try again." }]);
    } catch (err) {
      setAiMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Error getting response. Please try again later." }]);
    } finally {
      setAiLoading(false);
    }
  };

  // 🔥 SUBMIT REVIEW
  const submitReview = async () => {
    if (!user._id) {
      alert("Please login to review");
      return;
    }

    try {
      const reviewData = {
        eventId: event._id,
        userId: user._id,
        username: user.name || user.email,
        rating: reviewRating,
        comment: reviewComment,
        hostRating,
        hostComment,
        eventTitle: event.title
      };

      const submitRes = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewData),
      });

      const submitData = await submitRes.json();
      if (!submitRes.ok) {
        alert(submitData?.error || "Error submitting review");
        return;
      }

      alert("Review submitted!");
      setShowReviewForm(false);
      setReviewComment("");
      setReviewRating(5);
      setHostComment("");
      setHostRating(5);

      // Refresh reviews
      const reviewsRes = await fetch(`${API_BASE_URL}/api/reviews/event/${event._id}`);
      const reviewsData = await reviewsRes.json();
      setReviews(reviewsData);

      const hostSummaryRes = await fetch(`${API_BASE_URL}/api/reviews/host/${event.userId}`);
      if (hostSummaryRes.ok) {
        const hostSummary = await hostSummaryRes.json();
        setHostRatingSummary({
          averageHostRating: hostSummary.averageHostRating || 0,
          totalHostRatings: hostSummary.totalHostRatings || 0,
        });
      }
    } catch (err) {
      alert("Error submitting review");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent"></div>
      </div>
      <Footer />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-muted-foreground">{error}</p>
          <Link to="/explore" className="mt-4 inline-block bg-primary text-primary-foreground px-6 py-2 rounded-full">
            Back to Explore
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );

  const isHost = user._id === event.userId;
  const isAttendee = event.attendees?.includes(user._id);
  const hasRequested = event.requests?.includes(user._id);
  const eventDateTime = getEventDateTime(event.date, event.time);
  const isEventEnded = eventDateTime ? eventDateTime.getTime() < Date.now() : false;
  const hasReviewed = reviews.some((r) => r.userId === user._id);
  const eventAverageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 pt-6 pb-16 max-w-6xl">
        <div className="mb-6">
          <Link to="/explore" className="inline-flex items-center gap-2 bg-card border border-border text-foreground px-4 py-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft size={16} /> Back
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* MAIN CONTENT */}
          <div className="lg:col-span-2 space-y-6">
            {/* TITLE & BASIC INFO */}
            <div className="bg-card p-6 rounded-2xl border">
              <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-5 items-start">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-44 md:h-36 rounded-xl object-cover border border-border"
                />
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{event.title}</h1>
                  <div className="flex flex-wrap gap-4 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span className="text-sm">{event.date || "TBD"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      <span className="text-sm">{event.time || "TBD"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      <span className="text-sm">{event.location || "TBD"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={16} />
                      <span className="text-sm">{event.attendees?.length || 0} / {event.capacity || "Unlimited"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DESCRIPTION */}
            <div className="bg-card p-6 rounded-2xl border">
              <h2 className="text-lg font-semibold mb-3">About This Event</h2>
              <p className="text-muted-foreground leading-relaxed">{event.description}</p>
            </div>

            {/* ATTENDEES */}
            {event.attendees?.length > 0 && (
              <div className="bg-card p-6 rounded-2xl border">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <UserCheck size={18} />
                  Attendees ({event.attendees.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {event.attendees.map((uid: string) => (
                    <div key={uid} className="flex items-center gap-3 p-3 bg-muted rounded-lg border border-border/50">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {uid.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm truncate">{uid}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* REVIEWS */}
            {isEventEnded && (
              <div className="bg-card p-6 rounded-2xl border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Star size={18} />
                    Reviews ({reviews.length})
                  </h2>
                  {isAttendee && !hasReviewed && (
                    <button
                      onClick={() => setShowReviewForm(!showReviewForm)}
                      className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      Write Review
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-muted border border-border/50">
                    <p className="text-xs uppercase text-muted-foreground">Event Rating</p>
                    <p className="text-lg font-semibold">{eventAverageRating ? eventAverageRating.toFixed(1) : "N/A"} / 5</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted border border-border/50">
                    <p className="text-xs uppercase text-muted-foreground">Host Rating</p>
                    <p className="text-lg font-semibold">
                      {hostRatingSummary.totalHostRatings ? hostRatingSummary.averageHostRating.toFixed(1) : "N/A"} / 5
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{hostRatingSummary.totalHostRatings} ratings</p>
                  </div>
                </div>

                {!isAttendee && (
                  <p className="text-sm text-muted-foreground mb-4">Only attendees can submit reviews and host ratings.</p>
                )}

                {/* Review Form */}
                {showReviewForm && (
                  <div className="mb-6 p-4 bg-muted rounded-lg border border-border/50">
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Rating</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="text-2xl"
                          >
                            <Star
                              className={star <= reviewRating ? "text-yellow-400 fill-current" : "text-gray-300"}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Host Rating</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={`host-${star}`}
                            type="button"
                            onClick={() => setHostRating(star)}
                            className="text-2xl"
                          >
                            <Star
                              className={star <= hostRating ? "text-yellow-400 fill-current" : "text-gray-300"}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience..."
                      className="w-full p-3 border border-border rounded-lg resize-none bg-background"
                      rows={3}
                    />

                    <textarea
                      value={hostComment}
                      onChange={(e) => setHostComment(e.target.value)}
                      placeholder="Share feedback about the host..."
                      className="w-full p-3 border border-border rounded-lg resize-none mt-3 bg-background"
                      rows={3}
                    />

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={submitReview}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                      >
                        Submit Review
                      </button>
                      <button
                        onClick={() => setShowReviewForm(false)}
                        className="px-4 py-2 border border-border rounded-full text-sm hover:bg-muted transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Reviews List */}
                {reviews.length === 0 ? (
                  <p className="text-muted-foreground">No reviews yet</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review._id} className="border border-border rounded-lg p-4 bg-card">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {review.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{review.username}</p>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={14}
                                  className={i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                        {review.hostRating ? (
                          <div className="mt-2 p-2 rounded bg-muted/60 border border-border/50">
                            <p className="text-xs font-medium mb-1">Host Rating: {review.hostRating}/5</p>
                            {review.hostComment ? (
                              <p className="text-xs text-muted-foreground">{review.hostComment}</p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* MAP */}
            {event.lat && event.lng && (
              <div className="bg-card p-6 rounded-2xl border">
                <h2 className="text-lg font-semibold mb-4">Location</h2>
                <div id="map" className="w-full h-80 rounded-xl mb-4 border border-border" />
                <a
                  href={`https://www.google.com/maps?q=${event.lat},${event.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <MapPin size={16} />
                  Open in Google Maps
                </a>
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <div className="space-y-5">
            {/* ACTION CARD */}
            <div className="bg-card p-6 rounded-2xl border sticky top-24 space-y-3">
              {!isHost && (
                <div className="space-y-4">
                  {isAttendee ? (
                    <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-200/70 dark:border-emerald-800/60">
                      <Check size={24} className="mx-auto mb-2" />
                      You're attending this event!
                    </div>
                  ) : isEventEnded ? (
                    <div className="text-center p-4 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-lg border border-red-200/70 dark:border-red-800/60">
                      This event has ended. Joining is closed.
                    </div>
                  ) : hasRequested ? (
                    <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-lg border border-amber-200/70 dark:border-amber-800/60">
                      Request pending approval
                    </div>
                  ) : event.priceType === "paid" && event.price ? (
                    <button
                      onClick={handlePayment}
                      disabled={processingPayment}
                      className="w-full bg-emerald-600 text-white py-3 rounded-full font-medium hover:bg-emerald-700 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <CreditCard size={18} />
                      Pay ₹{event.price} to Join
                    </button>
                  ) : (
                    <button
                      onClick={handleJoin}
                      className="w-full bg-primary text-primary-foreground py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
                    >
                      Request to Join
                    </button>
                  )}
                </div>
              )}

              {/* PRICE BADGE */}
              {event.priceType === "paid" && event.price && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 p-3 rounded-lg mb-1">
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    <strong>Price: ₹{event.price}</strong>
                  </p>
                </div>
              )}

              {/* SHARE */}
              <button
                onClick={() => navigator.share?.({ title: event.title, url: window.location.href })}
                className="w-full flex items-center justify-center gap-2 border border-border py-3 rounded-full font-medium hover:bg-muted transition-colors"
              >
                <Share2 size={18} />
                Share Event
              </button>

              {/* ASK AI ABOUT EVENT */}
              <button
                onClick={() => setShowAIChat(!showAIChat)}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 text-white py-3 rounded-full font-medium hover:bg-violet-700 transition-colors"
              >
                <MessageSquare size={18} />
                Ask AI About This Event
              </button>

              {/* EVENT CHAT */}
              <Link
                to={`/chat/${event._id}`}
                className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white py-3 rounded-full font-medium hover:bg-blue-600 transition-colors"
              >
                <MessageSquare size={18} />
                Event Chat
              </Link>
            </div>

            {/* HOST PANEL */}
            {isHost && (
              <div className="bg-card p-6 rounded-2xl border">
                <h3 className="text-lg font-semibold mb-4">Manage Event</h3>

                {/* REQUESTS */}
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Join Requests ({requestDetails.length})</h4>
                  {requestDetails.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No pending requests</p>
                  ) : (
                    <div className="space-y-3">
                      {requestDetails.map((request: any) => (
                        <div key={request.userId} className="p-4 bg-muted rounded-lg space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={request.user?.photo || "https://via.placeholder.com/40"}
                                alt={request.user?.name || "Requester"}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {request.user?.name || request.user?.email || "Unknown user"}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {request.user?.location || "Location not set"}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => setSelectedRequester(request.user)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs border border-border rounded-full hover:bg-background transition-colors"
                            >
                              <Eye size={12} />
                              View Profile
                            </button>
                          </div>

                          {request.user?.interests?.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {request.user.interests.slice(0, 3).map((interest: string) => (
                                <span
                                  key={interest}
                                  className="text-xs px-2 py-1 rounded-full bg-muted border border-border"
                                >
                                  {interest}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex gap-2">
                            <button
                              onClick={() => approve(request.userId)}
                              className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => reject(request.userId)}
                              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* DELETE */}
                <button
                  onClick={deleteEvent}
                  className="w-full flex items-center justify-center gap-2 bg-red-500 text-white py-3 rounded-full font-medium hover:bg-red-600 transition-colors"
                >
                  <Trash2 size={18} />
                  Delete Event
                </button>
              </div>
            )}

            {/* AI CHAT MODAL */}
            {showAIChat && (
              <div className="bg-card p-6 rounded-2xl border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    🤖 Ask AI
                  </h2>
                  <button
                    onClick={() => {
                      setShowAIChat(false);
                      setAiMessages([]);
                      setAiInput("");
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Chat Messages */}
                <div className="bg-muted rounded-lg p-4 mb-4 h-64 overflow-y-auto space-y-3">
                  {aiMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      <p className="mb-2">💬 Ask questions about this event!</p>
                      <p className="text-xs">Examples: "What should I bring?", "Summarize this event", "What's the dress code?"</p>
                    </div>
                  ) : (
                    aiMessages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-background border border-border text-foreground"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))
                  )}
                  {aiLoading && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background border border-border">
                        <Loader size={16} className="animate-spin" />
                        <span className="text-sm text-muted-foreground">Thinking...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !aiLoading && sendAIMessage()}
                    placeholder="Ask something..."
                    disabled={aiLoading}
                    className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  />
                  <button
                    onClick={sendAIMessage}
                    disabled={aiLoading || !aiInput.trim()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
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

      <Footer />
    </div>
  );
};

export default EventDetail;