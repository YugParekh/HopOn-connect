import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Edit2, Save, X, MapPin, Calendar, Users, Star, MessageCircle, Instagram, Twitter, Facebook, Globe, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { auth } from "@/firebase";
import { buildApiUrl } from "@/lib/api";

interface UserProfile {
  _id: string;
  email: string;
  name: string;
  photo: string;
  bio?: string;
  location?: string;
  interests?: string[];
  socialMedia?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    website?: string;
  };
  stats?: {
    eventsCreated: number;
    eventsJoined: number;
    reviewsGiven: number;
  };
  trustScore?: number;
}

interface TrustScoreData {
  score: number;
  level: string;
  eventsAttended: number;
  eventsCancelled: number;
  hostRating: number;
  attendeeRating: number;
}

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [trustScore, setTrustScore] = useState<TrustScoreData | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const [editForm, setEditForm] = useState({
    name: "",
    bio: "",
    location: "",
    interests: [] as string[],
    instagram: "",
    twitter: "",
    facebook: "",
    website: "",
    razorpayKeyId: "",
    razorpayKeySecret: "",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    setEditForm({
      name: parsedUser.name || "",
      bio: parsedUser.bio || "",
      location: parsedUser.location || "",
      interests: parsedUser.interests || [],
      instagram: parsedUser.socialMedia?.instagram || "",
      twitter: parsedUser.socialMedia?.twitter || "",
      facebook: parsedUser.socialMedia?.facebook || "",
      website: parsedUser.socialMedia?.website || "",
      razorpayKeyId: parsedUser.razorpayKeyId || "",
      razorpayKeySecret: parsedUser.razorpayKeySecret || "",
    });

    fetchUserData(parsedUser._id);
  }, [navigate]);

  const fetchUserData = async (userId: string) => {
    try {
      const [eventsRes, reviewsRes, trustRes] = await Promise.all([
        fetch(buildApiUrl("/api/posts")),
        fetch(buildApiUrl(`/api/reviews?userId=${userId}`)),
        fetch(buildApiUrl(`/api/users/trust-score/${userId}`))
      ]);

      const eventsData = await eventsRes.json();
      const reviewsData = await reviewsRes.json();
      const trustData = trustRes.ok ? await trustRes.json() : null;

      const userEvents = eventsData.filter((e: any) => e.userId === userId);
      setEvents(userEvents);
      setReviews(reviewsData);
      if (trustData) setTrustScore(trustData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) { alert("Please login again"); return; }

      const payload: Record<string, unknown> = {
        name: editForm.name,
        bio: editForm.bio,
        location: editForm.location,
        interests: editForm.interests,
        socialMedia: {
          instagram: editForm.instagram,
          twitter: editForm.twitter,
          facebook: editForm.facebook,
          website: editForm.website,
        },
        razorpayKeyId: editForm.razorpayKeyId,
        razorpayKeySecret: editForm.razorpayKeySecret,
      };
      if (photoDataUrl) payload.photoDataUrl = photoDataUrl;

      const response = await fetch(buildApiUrl("/api/users/update"), {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to update profile");
      const updatedUser = await response.json();
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setPhotoDataUrl(null);
      setPhotoPreview(null);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile");
    }
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPhotoDataUrl(result);
      setPhotoPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const addInterest = (interest: string) => {
    const trimmed = interest.trim();
    if (trimmed && !editForm.interests.includes(trimmed)) {
      setEditForm(prev => ({ ...prev, interests: [...prev.interests, trimmed] }));
    }
  };

  const removeInterest = (interest: string) => {
    setEditForm(prev => ({ ...prev, interests: prev.interests.filter(i => i !== interest) }));
  };

  const trustColor = (score: number) =>
    score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-blue-500" : score >= 40 ? "bg-amber-500" : "bg-red-400";

  const trustLevelColor = (level: string) =>
    level === "Verified" ? "text-emerald-600 bg-emerald-50 border-emerald-200" :
    level === "Trusted"  ? "text-blue-600 bg-blue-50 border-blue-200" :
    level === "Regular"  ? "text-amber-600 bg-amber-50 border-amber-200" :
                           "text-muted-foreground bg-muted border-border";

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16">

        {/* ─── Profile Header Card ─────────────────────────────── */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">

            {/* Avatar */}
            <div className="relative shrink-0">
              <img
                src={photoPreview || user.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&size=128&background=random&color=fff`}
                alt={user.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-border shadow-sm"
              />
              {isEditing && (
                <button
                  onClick={() => photoInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1.5 rounded-full shadow hover:opacity-90 transition"
                >
                  <Camera size={13} />
                </button>
              )}
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{user.name}</h1>

                {/* Trust level pill */}
                {trustScore && (
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${trustLevelColor(trustScore.level)}`}>
                    <ShieldCheck size={12} />
                    {trustScore.level}
                  </span>
                )}

                {/* Edit / Save / Cancel */}
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="ml-auto flex items-center gap-1.5 text-sm font-medium px-4 py-1.5 rounded-full border border-border hover:bg-muted transition-colors"
                  >
                    <Edit2 size={13} /> Edit Profile
                  </button>
                ) : (
                  <div className="ml-auto flex gap-2">
                    <button onClick={handleSave} className="flex items-center gap-1.5 text-sm font-medium px-4 py-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition">
                      <Save size={13} /> Save
                    </button>
                    <button onClick={() => setIsEditing(false)} className="flex items-center gap-1.5 text-sm font-medium px-4 py-1.5 rounded-full border border-border hover:bg-muted transition-colors">
                      <X size={13} /> Cancel
                    </button>
                  </div>
                )}
              </div>

              <p className="text-sm text-muted-foreground">{user.email}</p>

              {user.location && (
                <p className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                  <MapPin size={13} /> {user.location}
                </p>
              )}

              {/* Bio */}
              {!isEditing && user.bio && (
                <p className="text-sm text-muted-foreground leading-relaxed mt-3">{user.bio}</p>
              )}

              {/* Interests */}
              {!isEditing && user.interests && user.interests.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {user.interests.map(i => (
                    <span key={i} className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
                      {i}
                    </span>
                  ))}
                </div>
              )}

              {/* Social icons */}
              {user.socialMedia && (
                <div className="flex gap-2 mt-3">
                  {user.socialMedia.instagram?.trim() && (
                    <a href={user.socialMedia.instagram.startsWith("http") ? user.socialMedia.instagram : `https://instagram.com/${user.socialMedia.instagram.replace(/^@/, "")}`}
                       target="_blank" rel="noopener noreferrer"
                       className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-pink-100 dark:hover:bg-pink-900/30 text-pink-500 transition-colors">
                      <Instagram size={15} />
                    </a>
                  )}
                  {user.socialMedia.twitter?.trim() && (
                    <a href={user.socialMedia.twitter.startsWith("http") ? user.socialMedia.twitter : `https://twitter.com/${user.socialMedia.twitter.replace(/^@/, "")}`}
                       target="_blank" rel="noopener noreferrer"
                       className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-sky-100 dark:hover:bg-sky-900/30 text-sky-500 transition-colors">
                      <Twitter size={15} />
                    </a>
                  )}
                  {user.socialMedia.facebook?.trim() && (
                    <a href={user.socialMedia.facebook.startsWith("http") ? user.socialMedia.facebook : `https://facebook.com/${user.socialMedia.facebook}`}
                       target="_blank" rel="noopener noreferrer"
                       className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 transition-colors">
                      <Facebook size={15} />
                    </a>
                  )}
                  {user.socialMedia.website?.trim() && (
                    <a href={user.socialMedia.website} target="_blank" rel="noopener noreferrer"
                       className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 transition-colors">
                      <Globe size={15} />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Main 2-col layout ───────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left (main) ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Edit Form */}
            {isEditing && (
              <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
                <h2 className="text-lg font-semibold">Edit Profile</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Name</label>
                    <input type="text" value={editForm.name}
                      onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Bio</label>
                    <textarea value={editForm.bio}
                      onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))}
                      placeholder="Tell people about yourself…"
                      rows={3}
                      className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Location</label>
                    <input type="text" value={editForm.location} placeholder="City, Country"
                      onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Interests</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {editForm.interests.map(interest => (
                        <span key={interest} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full">
                          {interest}
                          <X size={12} className="cursor-pointer opacity-70 hover:opacity-100" onClick={() => removeInterest(interest)} />
                        </span>
                      ))}
                    </div>
                    <input type="text" placeholder="Type interest and press Enter"
                      className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addInterest((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = "";
                        }
                      }} />
                  </div>

                  {/* Social media */}
                  {[
                    { key: "instagram", icon: <Instagram size={14} />, placeholder: "@username" },
                    { key: "twitter",   icon: <Twitter   size={14} />, placeholder: "@username" },
                    { key: "facebook",  icon: <Facebook  size={14} />, placeholder: "facebook.com/username" },
                    { key: "website",   icon: <Globe     size={14} />, placeholder: "https://yoursite.com" },
                  ].map(({ key, icon, placeholder }) => (
                    <div key={key}>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                        {icon} {key.charAt(0).toUpperCase() + key.slice(1)}
                      </label>
                      <input type="text" value={(editForm as any)[key]} placeholder={placeholder}
                        onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))}
                        className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
                    </div>
                  ))}
                </div>

                {/* Razorpay */}
                <div className="pt-5 border-t border-border">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">💳 Payment Account <span className="text-xs font-normal text-muted-foreground">(for hosting paid events)</span></h3>
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg px-4 py-3 mb-4 text-xs text-blue-800 dark:text-blue-300">
                    Add your Razorpay API keys to accept payments. Money goes directly to your account.
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Key ID</label>
                      <input type="password" value={editForm.razorpayKeyId} placeholder="rzp_live_xxxx"
                        onChange={e => setEditForm(p => ({ ...p, razorpayKeyId: e.target.value }))}
                        className="w-full px-3 py-2.5 text-sm font-mono border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Key Secret</label>
                      <input type="password" value={editForm.razorpayKeySecret} placeholder="xxxxxxxxxxxx"
                        onChange={e => setEditForm(p => ({ ...p, razorpayKeySecret: e.target.value }))}
                        className="w-full px-3 py-2.5 text-sm font-mono border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/40" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Get keys from <a href="https://dashboard.razorpay.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Razorpay Dashboard →</a>
                  </p>
                </div>
              </div>
            )}

            {/* Events Created */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                <Calendar size={17} className="text-muted-foreground" />
                Events Created
                <span className="ml-auto text-xs font-normal text-muted-foreground">{events.length} total</span>
              </h2>

              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No events created yet</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {events.map(event => (
                    <a key={event._id} href={`/event/${event._id}`}
                       className="group block rounded-xl border border-border p-4 hover:border-primary/50 hover:shadow-sm transition-all">
                      <h3 className="font-medium text-sm mb-1 line-clamp-1 group-hover:text-primary transition-colors">{event.title}</h3>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{event.date} · {event.location}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Users size={12} />{event.attendees?.length || 0}</span>
                        <span className="flex items-center gap-1"><MessageCircle size={12} />{event.requests?.length || 0} requests</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews Given */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                <Star size={17} className="text-muted-foreground" />
                Reviews Given
                <span className="ml-auto text-xs font-normal text-muted-foreground">{reviews.length} total</span>
              </h2>

              {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No reviews given yet</p>
              ) : (
                <div className="space-y-3">
                  {reviews.map(review => (
                    <div key={review._id} className="rounded-xl border border-border p-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14}
                              className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"} />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground truncate max-w-[160px]">{review.eventTitle}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right (sidebar) ── */}
          <div className="space-y-5">

            {/* Trust Score */}
            {trustScore && (
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <ShieldCheck size={16} className="text-primary" /> Trust Score
                  </h3>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${trustLevelColor(trustScore.level)}`}>
                    {trustScore.level}
                  </span>
                </div>

                <div className="mb-3">
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-bold">{trustScore.score.toFixed(0)}</span>
                    <span className="text-sm text-muted-foreground">/100</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-2 rounded-full transition-all duration-700 ${trustColor(trustScore.score)}`}
                         style={{ width: `${trustScore.score}%` }} />
                  </div>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-border">
                  {[
                    { label: "Events Attended", value: trustScore.eventsAttended },
                    { label: "Cancellations",   value: trustScore.eventsCancelled, danger: true },
                    { label: "Host Rating",     value: `${trustScore.hostRating.toFixed(1)} / 5` },
                    { label: "Attendee Rating", value: `${trustScore.attendeeRating.toFixed(1)} / 5` },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className={`font-medium ${row.danger && row.value > 0 ? "text-red-500" : ""}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 className="text-sm font-semibold mb-4">Activity</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Created",  value: events.length },
                  { label: "Joined",   value: user.stats?.eventsJoined || 0 },
                  { label: "Reviews",  value: reviews.length },
                ].map(stat => (
                  <div key={stat.label} className="bg-muted/50 rounded-xl py-3 px-2">
                    <p className="text-xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Interests (view-only when not editing) */}
            {!isEditing && user.interests && user.interests.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-5">
                <h3 className="text-sm font-semibold mb-3">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {user.interests.map(i => (
                    <span key={i} className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
                      {i}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Profile;
