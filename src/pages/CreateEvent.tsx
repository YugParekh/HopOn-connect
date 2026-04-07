import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Sparkles, Loader, UploadCloud, ImagePlus, Search, MapPin, X } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { auth } from "@/firebase";
import { generateEventDescription, generateEventTitle } from "@/lib/aiDescriptionGenerator";
import { MAPBOX_TOKEN } from "@/mapbox";
import { buildApiUrl } from "@/lib/api";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = MAPBOX_TOKEN;

const CreateEvent = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    price: "",
    priceType: "free", // free or paid
    category: "",
    description: "",
    capacity: "",
  });

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string>("");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [aiIdea, setAiIdea] = useState("");
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [generatingTitle, setGeneratingTitle] = useState(false);

  const categories = ["Adventure", "Wellness", "Sports", "Creative", "Food & Drink", "Photography", "Technology", "Music", "Concerts", "Workshops", "Business", "Education", "Art", "Gaming", "Fitness", "Networking", "Social", "Charity"];

  // Check if editing
  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setIsEditing(true);
      setEventId(id);
      // Fetch event data
      fetch(buildApiUrl(`/api/posts/${id}`))
        .then(res => res.json())
        .then(data => {
          setForm({
            title: data.title || "",
            date: data.date || "",
            time: data.time || "",
            location: data.location || "",
            price: data.price || "",
            priceType: data.priceType || "free",
            category: data.category || "",
            description: data.description || "",
            capacity: data.capacity?.toString() || "",
          });
          setExistingImageUrl(data.image || "");
          setSelectedCoords(data.lat && data.lng ? { lat: data.lat, lng: data.lng } : null);
        })
        .catch(err => console.error("Error fetching event:", err));
    }
  }, [searchParams]);

  // 🗺️ MAP
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [77.5946, 12.9716],
      zoom: 10,
    });

    map.addControl(new mapboxgl.NavigationControl());
    mapRef.current = map;

    map.on("click", (e) => {
      const { lng, lat } = e.lngLat;

      setSelectedCoords({ lat, lng });

      setForm((prev) => ({
        ...prev,
        location: `${lat}, ${lng}`,
      }));

      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      } else {
        markerRef.current = new mapboxgl.Marker()
          .setLngLat([lng, lat])
          .addTo(map);
      }
    });

    return () => map.remove();
  }, []);

  // 🔍 FIXED SEARCH (NO CRASH)
  const searchLocation = async (query: string) => {
    try {
      if (!query || query.length < 3) {
        setResults([]);
        return;
      }

      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_TOKEN}`
      );

      const data = await res.json();

      if (data?.features) {
        setResults(data.features);
      } else {
        setResults([]);
      }

    } catch (err) {
      console.error(err);
      setResults([]);
    }
  };

  // 🤖 GENERATE DESCRIPTION WITH AI
  const handleGenerateDescription = async () => {
    if (!aiIdea.trim()) {
      alert("Please enter your event idea first");
      return;
    }

    setGeneratingDescription(true);
    try {
      const description = await generateEventDescription(aiIdea);
      setForm(prev => ({ ...prev, description }));
      setAiIdea("");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setGeneratingDescription(false);
    }
  };

  // 🤖 GENERATE TITLE WITH AI
  const handleGenerateTitle = async () => {
    if (!aiIdea.trim()) {
      alert("Please enter your event idea first");
      return;
    }

    setGeneratingTitle(true);
    try {
      const title = await generateEventTitle(aiIdea);
      setForm(prev => ({ ...prev, title }));
      setAiIdea("");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setGeneratingTitle(false);
    }
  };

  // 🖼️ IMAGE
  const uploadImage = async () => {
    if (!image) return "";

    const formData = new FormData();
    formData.append("file", image);
    formData.append("upload_preset", "hopon_upload");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dmuy4q2cb/image/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();
    return data.secure_url;
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    if (!selectedFile) return;

    setImage(selectedFile);
    setExistingImageUrl("");
    setImagePreview(URL.createObjectURL(selectedFile));
  };

  const removeSelectedImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImage(null);
    setImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // 🚀 SUBMIT (FIXED MAIN ISSUE)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      console.log("User in CreateEvent:", user);

      if (!user._id) {
        alert("Please login first");
        navigate("/login");
        return;
      }

      if (!form.category) {
        alert("Please select a category");
        return;
      }

      const imageUrl = await uploadImage();

      const body = {
        title: form.title,
        description: form.description,
        location: form.location,
        image: imageUrl || undefined,

        date: form.date,
        time: form.time,
        price: form.priceType === "free" ? "Free" : form.price,
        priceType: form.priceType,
        category: form.category,
        capacity: form.capacity,

        lat: selectedCoords?.lat,
        lng: selectedCoords?.lng,

        userId: user._id,
      };

      if (isEditing && eventId) {
        await fetch(buildApiUrl(`/api/posts/${eventId}`), {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
        alert("Event created 🚀");
      } else {
        await fetch(buildApiUrl("/api/posts"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
        alert("Event created 🚀");
      }

      navigate("/dashboard");

    } catch (err) {
      console.error(err);
      alert("Error ❌");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 container mx-auto px-4 max-w-3xl pb-16">
        <Link to="/" className="inline-flex items-center gap-2 mb-6 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={14} /> Back
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{isEditing ? "EDIT EVENT" : "CREATE EVENT"}</h1>
          <p className="text-muted-foreground">Fill in event details to publish an engaging listing.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-card border border-border rounded-2xl p-5 md:p-6 shadow-sm">

          {/* INPUTS */}
          {[
            { label: "Title", key: "title", type: "text" },
            { label: "Date", key: "date", type: "date" },
            { label: "Time", key: "time", type: "time" },
            { label: "Capacity", key: "capacity", type: "number" },
          ].map((f) => (
            <div key={f.key} className="space-y-2">
              <label className="text-sm font-medium">{f.label}</label>
              <input
                type={f.type}
                placeholder={f.label}
                value={form[f.key as keyof typeof form]}
                onChange={(e) =>
                  setForm({ ...form, [f.key]: e.target.value })
                }
                className="w-full px-4 py-3 border border-border bg-background rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                required
              />
            </div>
          ))}

          {/* PRICE TYPE */}
          <div>
            <label className="block text-sm font-medium mb-2">Event Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer bg-background border border-border px-3 py-2 rounded-lg">
                <input
                  type="radio"
                  name="priceType"
                  value="free"
                  checked={form.priceType === "free"}
                  onChange={(e) => setForm({ ...form, priceType: e.target.value, price: "" })}
                />
                <span>Free</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer bg-background border border-border px-3 py-2 rounded-lg">
                <input
                  type="radio"
                  name="priceType"
                  value="paid"
                  checked={form.priceType === "paid"}
                  onChange={(e) => setForm({ ...form, priceType: e.target.value })}
                />
                <span>Paid</span>
              </label>
            </div>
          </div>

          {/* PRICE (if paid) */}
          {form.priceType === "paid" && (
            <input
              type="number"
              placeholder="Price (₹)"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full px-4 py-3 border border-border bg-background rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              required
            />
          )}

          {/* LOCATION & MAP */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-base">Choose Event Location</h3>
                <p className="text-sm text-muted-foreground">Search a place or click directly on the map</p>
              </div>
              {selectedCoords && (
                <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-3 py-1 rounded-full border border-green-200 dark:border-green-700">
                  Pin selected
                </span>
              )}
            </div>

            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search location (e.g. Koramangala, Bengaluru)"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  searchLocation(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-3 border border-border bg-background rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            {Array.isArray(results) && results.length > 0 && (
              <div className="border border-border rounded-xl bg-card max-h-52 overflow-y-auto">
                {results.map((place: any) => (
                  <button
                    type="button"
                    key={place.id}
                    className="w-full text-left p-3 hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => {
                      const [lng, lat] = place.center;

                      setSearch(place.place_name);
                      setResults([]);
                      setSelectedCoords({ lat, lng });

                      setForm((prev) => ({
                        ...prev,
                        location: place.place_name,
                      }));

                      mapRef.current?.flyTo({ center: [lng, lat], zoom: 14 });

                      if (markerRef.current) {
                        markerRef.current.setLngLat([lng, lat]);
                      } else {
                        markerRef.current = new mapboxgl.Marker()
                          .setLngLat([lng, lat])
                          .addTo(mapRef.current!);
                      }
                    }}
                  >
                    {place.place_name}
                  </button>
                ))}
              </div>
            )}

            <div ref={mapContainerRef} className="h-80 rounded-xl border" />

            <div className="p-3 rounded-xl bg-muted/60 border border-border text-sm text-muted-foreground flex items-start gap-2">
              <MapPin size={16} className="mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Selected Location</p>
                <p>{form.location || "No location selected yet"}</p>
              </div>
            </div>
          </div>

          {/* IMAGE UPLOAD */}
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3">
            <div>
              <h3 className="font-semibold text-base">Event Cover Image</h3>
              <p className="text-sm text-muted-foreground">Upload a high-quality image to make your event stand out</p>
            </div>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />

            {imagePreview || existingImageUrl ? (
              <div className="border border-border rounded-xl overflow-hidden">
                <img
                  src={imagePreview || existingImageUrl}
                  alt="Event preview"
                  className="w-full h-56 object-cover"
                />
                <div className="p-3 flex items-center justify-between gap-2 bg-muted/50">
                  <p className="text-sm text-muted-foreground truncate">
                    {image?.name || "Current event image"}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-background"
                    >
                      Replace
                    </button>
                    {(imagePreview || image) && (
                      <button
                        type="button"
                        onClick={removeSelectedImage}
                        className="text-xs px-3 py-1.5 rounded-full border border-red-300 text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 inline-flex items-center gap-1"
                      >
                        <X size={12} /> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary hover:bg-muted/40 transition-colors"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <UploadCloud size={22} className="text-muted-foreground" />
                  </div>
                  <p className="font-medium">Click to upload image</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, WEBP recommended</p>
                </div>
              </button>
            )}
          </div>

          {/* 🤖 AI DESCRIPTION & TITLE GENERATOR */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 p-5 rounded-xl border border-purple-200 dark:border-purple-800/40">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-purple-600" />
              AI Event Generator
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Describe your event idea, and AI will generate a professional title & description
            </p>
            
            <div className="space-y-3">
              <textarea
                placeholder="E.g., A tech meetup about AI and machine learning for beginners"
                value={aiIdea}
                onChange={(e) => setAiIdea(e.target.value)}
                className="w-full px-4 py-2 border border-purple-200 dark:border-purple-700 bg-background rounded-lg text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                rows={2}
              />
              
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleGenerateTitle}
                  disabled={generatingTitle || !aiIdea.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
                >
                  {generatingTitle ? <Loader size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  Generate Title
                </button>
                
                <button
                  type="button"
                  onClick={handleGenerateDescription}
                  disabled={generatingDescription || !aiIdea.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
                >
                  {generatingDescription ? <Loader size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  Generate Description
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              placeholder="Describe your event"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full px-4 py-3 border border-border bg-background rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              required
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm font-medium">Category</label>
              {form.category && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-primary/15 text-primary font-medium">
                  Selected: {form.category}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const isActive = form.category === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setForm({ ...form, category })}
                    className={`px-3 py-2 rounded-full text-sm border transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-background text-foreground border-border hover:border-primary/50 hover:bg-muted"
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          <button className="w-full bg-primary text-primary-foreground py-3 rounded-full font-medium hover:opacity-90 transition-opacity">
            {isEditing ? "Update Event" : "Create Event"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;