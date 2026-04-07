import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface ClubCardProps {
  id: string;
  name: string;
  members: number;
  description: string;
  image: string;
  category: string;
}

const ClubCard = ({ id, name, members, description, image, category }: ClubCardProps) => (
  <Link
    to={`/club/${id}`}
    className="group relative bg-card rounded-2xl overflow-hidden border border-border hover:shadow-xl transition-all duration-300"
  >
    <div className="aspect-[3/2] overflow-hidden">
      <img
        src={image}
        alt={name}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    </div>
    <div className="p-5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-2 block">
        {category}
      </span>
      <h3 className="font-display text-xl font-semibold text-card-foreground mb-1 group-hover:text-primary transition-colors">
        {name}
      </h3>
      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{description}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{members} members</span>
        <ArrowRight size={16} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  </Link>
);

export default ClubCard;
