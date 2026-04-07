import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Edit2, Save, X, MapPin, Calendar, Users, Star, MessageCircle, Instagram, Twitter, Facebook, Globe } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { auth } from "@/firebase";

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

    // Fetch user's events and reviews
    fetchUserData(parsedUser._id);
  }, [navigate]);

  const fetchUserData = async (userId: string) => {
    try {
      const [eventsRes, reviewsRes] = await Promise.all([
        fetch("http://localhost:5002/api/posts"),
        fetch(`http://localhost:5002/api/reviews?userId=${userId}`)
      ]);

      const eventsData = await eventsRes.json();
      const reviewsData = await reviewsRes.json();

      const userEvents = eventsData.filter((e: any) => e.userId === userId);
      setEvents(userEvents);
      setReviews(reviewsData);

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
      if (!token) {
        alert("Please login again");
        return;
      }

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

      if (photoDataUrl) {
        payload.photoDataUrl = photoDataUrl;
      }

      const response = await fetch("http://localhost:5002/api/users/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const updatedUser = await response.json();

      // Update localStorage
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
    if (!editForm.interests.includes(interest)) {
      setEditForm(prev => ({
        ...prev,
        interests: [...prev.interests, interest]
      }));
    }
  };

  const removeInterest = (interest: string) => {
    setEditForm(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Profile Header */}
        <div className="bg-card rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative">
              <img
                src={photoPreview || user.photo || "https://via.placeholder.com/120"}
                alt={user.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
              {isEditing && (
                <button
                  onClick={() => photoInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full"
                >
                  <Camera size={16} />
                </button>
              )}
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-3xl font-bold">{user.name}</h1>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 hover:bg-muted rounded-full transition-colors"
                  >
                    <Edit2 size={20} />
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                    >
                      <Save size={16} />
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>


              <p className="text-muted-foreground mb-4">{user.email}</p>

              {/* Social Media Icons */}
              {user.socialMedia && (
                <div className="flex gap-3 mb-4">
                  {user.socialMedia.instagram && user.socialMedia.instagram.trim() && (
                    <a
                      href={user.socialMedia.instagram.startsWith('http') ? user.socialMedia.instagram : `https://instagram.com/${user.socialMedia.instagram.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-muted hover:bg-primary/80 transition-colors text-pink-500"
                      title="Instagram"
                    >
                      <Instagram size={20} />
                    </a>
                  )}
                  {user.socialMedia.twitter && user.socialMedia.twitter.trim() && (
                    <a
                      href={user.socialMedia.twitter.startsWith('http') ? user.socialMedia.twitter : `https://twitter.com/${user.socialMedia.twitter.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-muted hover:bg-primary/80 transition-colors text-sky-500"
                      title="Twitter"
                    >
                      <Twitter size={20} />
                    </a>
                  )}
                  {user.socialMedia.facebook && user.socialMedia.facebook.trim() && (
                    <a
                      href={user.socialMedia.facebook.startsWith('http') ? user.socialMedia.facebook : `https://facebook.com/${user.socialMedia.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-muted hover:bg-primary/80 transition-colors text-blue-600"
                      title="Facebook"
                    >
                      <Facebook size={20} />
                    </a>
                  )}
                  {user.socialMedia.website && user.socialMedia.website.trim() && (
                    <a
                      href={user.socialMedia.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-muted hover:bg-primary/80 transition-colors text-green-700 dark:text-green-400"
                      title="Website"
                    >
                      <Globe size={20} />
                    </a>
                  )}
                </div>
              )}

              {/* Bio */}
              {isEditing ? (
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  className="w-full p-3 border border-border rounded-lg resize-none"
                  rows={3}
                />
              ) : (
                <p className="text-muted-foreground">{user.bio || "No bio yet"}</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Edit Form */}
            {isEditing && (
              <div className="bg-card rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-3 border border-border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Location</label>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full p-3 border border-border rounded-lg"
                      placeholder="City, Country"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Interests</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {editForm.interests.map(interest => (
                        <span key={interest} className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-1">
                          {interest}
                          <X size={14} className="cursor-pointer" onClick={() => removeInterest(interest)} />
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Add interest and press Enter"
                      className="w-full p-3 border border-border rounded-lg"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addInterest((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                        <Instagram size={16} />
                        Instagram
                      </label>
                      <input
                        type="text"
                        value={editForm.instagram}
                        onChange={(e) => setEditForm(prev => ({ ...prev, instagram: e.target.value }))}
                        className="w-full p-3 border border-border rounded-lg"
                        placeholder="@username"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                        <Twitter size={16} />
                        Twitter
                      </label>
                      <input
                        type="text"
                        value={editForm.twitter}
                        onChange={(e) => setEditForm(prev => ({ ...prev, twitter: e.target.value }))}
                        className="w-full p-3 border border-border rounded-lg"
                        placeholder="@username"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                        <Facebook size={16} />
                        Facebook
                      </label>
                      <input
                        type="text"
                        value={editForm.facebook}
                        onChange={(e) => setEditForm(prev => ({ ...prev, facebook: e.target.value }))}
                        className="w-full p-3 border border-border rounded-lg"
                        placeholder="facebook.com/username"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                        <Globe size={16} />
                        Website
                      </label>
                      <input
                        type="url"
                        value={editForm.website}
                        onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))}
                        className="w-full p-3 border border-border rounded-lg"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>

                  {/* 💳 Razorpay Payment Account Setup */}
                  <div className="mt-8 pt-8 border-t border-border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      💳 Payment Account (for hosting paid events)
                    </h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-blue-900">
                        <strong>How it works:</strong> Add your Razorpay API keys to accept payments from attendees. Money will be transferred directly to your Razorpay account.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Razorpay Key ID</label>
                        <input
                          type="password"
                          value={editForm.razorpayKeyId}
                          onChange={(e) => setEditForm(prev => ({ ...prev, razorpayKeyId: e.target.value }))}
                          className="w-full p-3 border border-border rounded-lg font-mono text-xs"
                          placeholder="rzp_live_xxxxxxxxxxxx"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Razorpay Key Secret</label>
                        <input
                          type="password"
                          value={editForm.razorpayKeySecret}
                          onChange={(e) => setEditForm(prev => ({ ...prev, razorpayKeySecret: e.target.value }))}
                          className="w-full p-3 border border-border rounded-lg font-mono text-xs"
                          placeholder="xxxxxxxxxxxxxxxxxxxx"
                        />
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mt-2">
                      Get your keys from <a href="https://dashboard.razorpay.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Razorpay Dashboard</a>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Events Created */}
            <div className="bg-card rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Calendar size={20} />
                Events Created ({events.length})
              </h2>

              {events.length === 0 ? (
                <p className="text-muted-foreground">No events created yet</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events.map(event => (
                    <div key={event._id} className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h3 className="font-medium mb-2">{event.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{event.date} • {event.location}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {event.attendees?.length || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle size={14} />
                          {event.requests?.length || 0}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews Given */}
            <div className="bg-card rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Star size={20} />
                Reviews Given ({reviews.length})
              </h2>

              {reviews.length === 0 ? (
                <p className="text-muted-foreground">No reviews given yet</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map(review => (
                    <div key={review._id} className="border border-border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              className={i < review.rating ? "text-yellow-400 fill-current" : "text-muted-foreground/40"}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">• {review.eventTitle}</span>
                      </div>
                      <p className="text-sm">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Events Created</span>
                  <span className="font-medium">{events.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Events Joined</span>
                  <span className="font-medium">{user.stats?.eventsJoined || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reviews Given</span>
                  <span className="font-medium">{reviews.length}</span>
                </div>
              </div>
            </div>

            {/* Social Media Links */}
            {user.socialMedia && Object.values(user.socialMedia).some(link => link) && (
              <div className="bg-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">Connect</h3>
                <div className="space-y-3">
                  {user.socialMedia.instagram && (
                    <a href={`https://instagram.com/${user.socialMedia.instagram}`} target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors">
                      <Instagram size={20} />
                      <span>Instagram</span>
                    </a>
                  )}
                  {user.socialMedia.twitter && (
                    <a href={`https://twitter.com/${user.socialMedia.twitter}`} target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors">
                      <Twitter size={20} />
                      <span>Twitter</span>
                    </a>
                  )}
                  {user.socialMedia.facebook && (
                    <a href={`https://facebook.com/${user.socialMedia.facebook}`} target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors">
                      <Facebook size={20} />
                      <span>Facebook</span>
                    </a>
                  )}
                  {user.socialMedia.website && (
                    <a href={user.socialMedia.website} target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors">
                      <Globe size={20} />
                      <span>Website</span>
                    </a>
                  )}
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