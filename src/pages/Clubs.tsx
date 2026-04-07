import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const clubs = [
  {
    id: 1,
    name: "Adventure Club",
    desc: "Trekking, hiking and outdoor adventures",
  },
  {
    id: 2,
    name: "Photography Club",
    desc: "Capture moments and learn photography",
  },
  {
    id: 3,
    name: "Fitness Club",
    desc: "Yoga, gym and wellness activities",
  },
  {
    id: 4,
    name: "Food Lovers",
    desc: "Explore cafes and food events",
  },
];

const Clubs = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 container mx-auto px-4 pb-16">
        <h1 className="text-4xl font-bold mb-10">
          CLUBS & COMMUNITIES
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {clubs.map((club) => (
            <div
              key={club.id}
              className="border p-6 rounded-xl"
            >
              <h2 className="font-bold text-lg">
                {club.name}
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                {club.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Clubs;