import { useState, useEffect } from "react";
import { Search, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { buildApiUrl } from "@/lib/api";

const categories = ["All", "Adventure", "Wellness", "Sports", "Creative", "Food & Drink", "Photography", "Technology", "Music", "Concerts", "Workshops", "Business", "Education", "Art", "Gaming", "Fitness", "Networking", "Social", "Charity"];
const priceFilters = ["All", "Free", "Paid"];

const Explore = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPrice, setSelectedPrice] = useState("All");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // 🔥 FETCH EVENTS
  useEffect(() => {
    fetch(buildApiUrl("/api/posts"))
      .then(res => res.json())
      .then(data => {
        // Keep all events for now so event listing always shows created events.
        // This avoids hiding items due to date parsing and uses category/price filters only.
        setEvents(data);
      })
      .catch(err => console.error(err));
  }, []);

  // 🔥 FILTER LOGIC (SAFE)
  const filtered = events.filter((e) => {
    if (selectedCategory !== "All" && e.category && e.category !== selectedCategory) return false;
    if (selectedPrice === "Free" && e.price && e.price !== "Free") return false;
    if (selectedPrice === "Paid" && e.price && e.price === "Free") return false;

    if (
      search &&
      !e.title?.toLowerCase().includes(search.toLowerCase()) &&
      !e.location?.toLowerCase().includes(search.toLowerCase())
    ) return false;

    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 container mx-auto px-4 md:px-8">
        <h1 className="font-display text-4xl md:text-6xl font-bold mb-2">
          EXPLORE EVENTS
        </h1>

        <p className="text-muted-foreground mb-8">
          Find your perfect experience today.
        </p>

        {/* 🔍 SEARCH + FILTER TOGGLE */}
        <div className="mb-8">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="text"
                placeholder="Search events..."
                className="w-full pl-11 pr-4 py-3 rounded-full border border-border"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-all flex items-center gap-2"
            >
              <Filter size={18} />
              <span className="text-sm font-medium">Filters</span>
            </button>
          </div>
        </div>

        {/* FILTER SECTION - COLLAPSIBLE */}
        {showFilters && (
        <div className="bg-muted/50 rounded-2xl p-6 mb-8 animation-in fade-in">
          <h2 className="text-lg font-semibold mb-6">FILTERS</h2>
          
          {/* CATEGORY FILTER */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Category</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === cat
                      ? "bg-foreground text-background"
                      : "bg-card border border-border text-foreground hover:bg-muted"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* PRICE FILTER */}
          <div className="mb-0">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Price</h3>
            <div className="flex gap-2">
              {priceFilters.map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPrice(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedPrice === p
                      ? "bg-foreground text-background"
                      : "bg-card border border-border text-foreground hover:bg-muted"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
        )}

        {/* 🎯 EVENTS */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-16">
            {filtered.map((event: any) => (
              <Link
                to={`/event/${event._id}`}
                key={event._id}
                className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
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
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">{event.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {event.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{event.location || "TBD"}</span>
                    <span>{event.attendees?.length || 0} attending</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No events found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Explore;