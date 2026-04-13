import { Link } from "react-router-dom";
import { MapPin, Calendar, ArrowRight, Star } from "lucide-react";
import { useEffect, useState } from "react";

interface EventCardProps {
  id: string;
  title: string;
  date: string;
  location: string;
  price: string;
  image: string;
  category: string;
}

const EventCard = ({ id, title, date, location, price, image, category }: EventCardProps) => {
  const [rating, setRating] = useState<{ average: number; count: number } | null>(null);

  useEffect(() => {
    // Fetch event reviews to calculate average rating
    const fetchRating = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5002'}/api/reviews/event/${id}`);
        if (!res.ok) return;
        const reviews = await res.json();
        if (reviews.length === 0) return;
        
        const avgRating = reviews.reduce((sum: number, r: any) => sum + (r.eventRating || 0), 0) / reviews.length;
        setRating({ average: Math.round(avgRating * 10) / 10, count: reviews.length });
      } catch (err) {
        // Silently fail - rating is optional
      }
    };
    fetchRating();
  }, [id]);

  return (
  <Link
    to={`/event/${id}`}
    className="group block bg-card rounded-2xl overflow-hidden border border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
  >
    <div className="aspect-[4/3] overflow-hidden relative">
      <img
        src={image}
        alt={title}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <span className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm text-foreground text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full">
        {category}
      </span>
    </div>
    <div className="p-5">
      <h3 className="font-display text-lg font-semibold text-card-foreground mb-2 group-hover:text-primary transition-colors line-clamp-1">
        {title}
      </h3>
      <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-1">
        <Calendar size={14} />
        <span>{date}</span>
      </div>
      <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-4">
        <MapPin size={14} />
        <span>{location}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-semibold text-foreground">{price}</span>
        {rating && (
          <div className="flex items-center gap-1">
            <Star size={14} className="fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium text-foreground">{rating.average}</span>
            <span className="text-xs text-muted-foreground">({rating.count})</span>
          </div>
        )}
        <span className="flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          View details <ArrowRight size={14} />
        </span>
      </div>
    </div>
  </Link>
);

export default EventCard;
