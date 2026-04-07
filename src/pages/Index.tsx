import { Search, MapPin, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import destTemple from "@/assets/dest-temple.jpg";
import destMountains from "@/assets/dest-mountains.jpg";
import eventHiking from "@/assets/event-hiking.jpg";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventCard from "@/components/EventCard";
import { useEffect, useState } from "react";
import { buildApiUrl } from "@/lib/api";

const categories = ["All", "Adventure", "Wellness", "Sports", "Creative", "Food & Drink", "Photography"];

const Index = () => {
    const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch(buildApiUrl("/api/posts"));
      if (!res.ok) {
        console.error("Failed to fetch events:", res.status);
        setEvents([]);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        // Filter out past events
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcomingEvents = data.filter((event: any) => {
          const eventDate = new Date(event.date);
          return eventDate >= today;
        });
        setEvents(upcomingEvents);
      } else {
        console.error("Invalid data format:", data);
        setEvents([]);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      setEvents([]);
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section – editorial style like reference */}
      <section className="relative pt-16">
        <div className="relative h-[85vh] min-h-[600px] overflow-hidden">
          <img
            src={heroBg}
            alt="Discover events"
            width={1920}
            height={1080}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/30 to-transparent" />
          <div className="relative h-full container mx-auto px-4 md:px-8 flex flex-col justify-end pb-16">
            <h1 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-cream leading-[0.9] mb-6 animate-fade-up max-w-4xl">
              DISCOVER YOUR NEXT ADVENTURE
            </h1>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-end justify-between">
              <p className="text-cream/80 text-base md:text-lg max-w-md leading-relaxed animate-fade-up" style={{ animationDelay: "0.1s" }}>
                Find events you'll love. From mountain hikes to art workshops — your next experience is just a click away.
              </p>
              <Link
                to="/explore"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full font-medium text-sm hover:opacity-90 transition-opacity animate-fade-up"
                style={{ animationDelay: "0.2s" }}
              >
                Explore events <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-warm-yellow">
        <div className="container mx-auto px-4 md:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-charcoal/10">
            {[
              { label: "SOLO OR GROUP", value: "1 OR MORE", desc: "Join with your friends or go solo — we make every experience comfortable" },
              { label: "EXPERIENCES", value: "70+ EVENTS", desc: "From lush gardens to mountain peaks, adventures and workshops galore" },
              { label: "COMMUNITY", value: "PRO HOSTS", desc: "Curated by passionate community hosts who craft unforgettable experiences" },
            ].map((s, i) => (
              <div key={i} className="px-6 py-4 md:py-0 text-center md:text-left">
                <h3 className="font-display text-2xl md:text-3xl font-bold text-charcoal mb-2">{s.value}</h3>
                <p className="text-sm text-charcoal/60 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Search / Filter Bar */}
      <section className="container mx-auto px-4 md:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search events, workshops, meetups..."
              className="w-full pl-11 pr-4 py-3.5 rounded-full border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
            />
          </div>
          <div className="relative w-full md:w-auto">
            <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Location"
              className="w-full md:w-52 pl-11 pr-4 py-3.5 rounded-full border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-6 flex-wrap">
          {categories.map((cat, i) => (
            <button
              key={cat}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                i === 0
                  ? "bg-charcoal text-cream"
                  : "bg-muted text-foreground hover:bg-charcoal hover:text-cream"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Events Grid */}
      <section className="container mx-auto px-4 md:px-8 pb-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">UPCOMING EVENTS</h2>
            <p className="text-muted-foreground mt-2">Find your perfect experience today.</p>
          </div>
          <Link to="/explore" className="hidden md:inline-flex items-center gap-2 bg-charcoal text-cream px-6 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
            View all events <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event: any) => (
            <Link
              key={event._id}
              to={`/event/${event._id}`}
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
                  <span>{event.date || "TBD"}</span>
                  <span>{event.attendees?.length || 0} attending</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-8 md:hidden text-center">
          <Link to="/explore" className="inline-flex items-center gap-2 bg-charcoal text-cream px-6 py-3 rounded-full text-sm font-medium">
            View all events <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Our Events For – carousel style like reference */}
      <section className="bg-card py-20">
        <div className="container mx-auto px-4 md:px-8">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-12">OUR EVENTS FOR</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: "01", label: "Individuals", desc: "Solo adventures curated for personal growth and exploration.", img: destMountains },
              { num: "02", label: "Friends", desc: "Create unforgettable memories with your best friends. Group activities designed for fun and bonding.", img: eventHiking },
              { num: "03", label: "Families", desc: "Family-friendly events that everyone can enjoy together.", img: destTemple },
            ].map((item) => (
              <div key={item.num} className="group cursor-pointer">
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-4">
                  <img src={item.img} alt={item.label} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-4 left-4 text-3xl font-display font-bold text-cream">{item.num}</div>
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-1">{item.label}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations section – warm pink bg */}
      <section className="bg-warm-pink py-20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="font-display text-4xl md:text-6xl font-bold text-foreground leading-tight">
                POPULAR<br />DESTINATIONS
              </h2>
              <p className="text-muted-foreground mt-4 max-w-sm">
                From breathtaking mountains to vibrant cities — discover events happening at the most popular spots.
              </p>
              <Link to="/explore" className="inline-flex items-center gap-2 bg-charcoal text-cream px-6 py-3 rounded-full text-sm font-medium mt-6 hover:opacity-90 transition-opacity">
                View all tours <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { tag: "PUNE, INDIA", name: "Sahyadri Hills", rating: 4.9, desc: "Trek through the serene Western Ghats with stunning views and lush trails.", img: destMountains },
                { tag: "BANGALORE, INDIA", name: "Cubbon Park", rating: 4.8, desc: "The city's green lung — perfect for yoga, jogging, and weekend meetups.", img: destTemple },
              ].map((d) => (
                <div key={d.name} className="bg-card rounded-2xl overflow-hidden border border-border">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={d.img} alt={d.name} loading="lazy" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">{d.tag}</span>
                    <h3 className="font-display text-lg font-semibold text-card-foreground mt-1">{d.name}</h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{d.desc}</p>
                    <Link to="/explore" className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-3 hover:underline">
                      View events <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services / Features */}
      <section className="container mx-auto px-4 md:px-8 py-20">
        <div className="flex flex-col md:flex-row gap-12 items-start">
          <div className="md:w-1/3">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground leading-tight">OUR SERVICES</h2>
            <p className="text-muted-foreground mt-4">
              From the moment you book to the end of your experience, we've got you covered.
            </p>
            <Link to="/explore" className="inline-flex items-center gap-2 bg-charcoal text-cream px-6 py-3 rounded-full text-sm font-medium mt-6 hover:opacity-90 transition-opacity">
              View all services <ArrowRight size={14} />
            </Link>
          </div>
          <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { title: "CURATED EVENTS", desc: "Handpicked experiences by local hosts and experts." },
              { title: "EASY BOOKING", desc: "Quick and hassle-free booking with instant confirmation." },
              { title: "COMMUNITY CLUBS", desc: "Join clubs to meet like-minded people and attend regular events." },
              { title: "REVIEWS & RATINGS", desc: "Honest reviews from real participants to help you choose." },
            ].map((s) => (
              <div key={s.title} className="group border border-border rounded-2xl p-6 hover:border-primary/30 transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-display text-xl font-bold text-foreground">{s.title}</h3>
                  <ArrowRight size={18} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
