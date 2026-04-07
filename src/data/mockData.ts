import eventHiking from "@/assets/event-hiking.jpg";
import eventYoga from "@/assets/event-yoga.jpg";
import eventBasketball from "@/assets/event-basketball.jpg";
import eventCoffee from "@/assets/event-coffee.jpg";
import eventArt from "@/assets/event-art.jpg";
import eventPhotography from "@/assets/event-photography.jpg";

export interface EventData {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  price: string;
  image: string;
  category: string;
  description: string;
  capacity: number;
  joined: number;
  rating: number;
  reviews: { user: string; comment: string; rating: number }[];
}

export const events: EventData[] = [
  {
    id: "1",
    title: "Sunrise Mountain Hike",
    date: "Apr 12, 2026",
    time: "6:00 AM",
    location: "Sahyadri Hills, Pune",
    price: "₹499",
    image: eventHiking,
    category: "Adventure",
    description: "Join us for a breathtaking sunrise hike through the Sahyadri hills. Perfect for nature lovers and fitness enthusiasts alike. We'll trek through lush green trails, witness stunning panoramic views, and enjoy a refreshing morning in the mountains.",
    capacity: 30,
    joined: 22,
    rating: 4.8,
    reviews: [
      { user: "Priya S.", comment: "Absolutely stunning views! The guide was very knowledgeable.", rating: 5 },
      { user: "Rahul M.", comment: "Great experience, well organized.", rating: 4 },
    ],
  },
  {
    id: "2",
    title: "Park Yoga Session",
    date: "Apr 14, 2026",
    time: "7:00 AM",
    location: "Cubbon Park, Bangalore",
    price: "Free",
    image: eventYoga,
    category: "Wellness",
    description: "Start your week with a rejuvenating outdoor yoga session in beautiful Cubbon Park. Suitable for all levels – from beginners to advanced practitioners. Mats and water provided.",
    capacity: 50,
    joined: 38,
    rating: 4.9,
    reviews: [
      { user: "Ananya K.", comment: "Such a peaceful experience. Loved the instructor!", rating: 5 },
    ],
  },
  {
    id: "3",
    title: "Street Basketball Tournament",
    date: "Apr 18, 2026",
    time: "4:00 PM",
    location: "Marine Drive Courts, Mumbai",
    price: "₹299",
    image: eventBasketball,
    category: "Sports",
    description: "3v3 street basketball tournament open to all skill levels. Form your team or join one on the spot. Prizes for top 3 teams. Refreshments included.",
    capacity: 48,
    joined: 36,
    rating: 4.6,
    reviews: [
      { user: "Arjun P.", comment: "Incredible energy! Met some amazing players.", rating: 5 },
      { user: "Dev T.", comment: "Well organized tournament, will definitely come again.", rating: 4 },
    ],
  },
  {
    id: "4",
    title: "Artisan Coffee Tasting",
    date: "Apr 20, 2026",
    time: "11:00 AM",
    location: "Third Wave Coffee, Indiranagar",
    price: "₹799",
    image: eventCoffee,
    category: "Food & Drink",
    description: "Explore the world of specialty coffee with expert baristas. Sample single-origin beans from around the world, learn brewing techniques, and discover your perfect cup.",
    capacity: 20,
    joined: 18,
    rating: 4.7,
    reviews: [
      { user: "Sneha R.", comment: "Learned so much about coffee origins. Amazing!", rating: 5 },
    ],
  },
  {
    id: "5",
    title: "Abstract Painting Workshop",
    date: "Apr 22, 2026",
    time: "2:00 PM",
    location: "Art Studio, Koramangala",
    price: "₹1,299",
    image: eventArt,
    category: "Creative",
    description: "Unleash your creativity in this guided abstract painting workshop. No experience needed! All materials provided. Take home your masterpiece at the end.",
    capacity: 15,
    joined: 12,
    rating: 4.9,
    reviews: [
      { user: "Meera L.", comment: "Never knew I could paint! The instructor was phenomenal.", rating: 5 },
      { user: "Vikram S.", comment: "Therapeutic and fun. Highly recommend.", rating: 5 },
    ],
  },
  {
    id: "6",
    title: "Night Photography Walk",
    date: "Apr 25, 2026",
    time: "7:30 PM",
    location: "Connaught Place, Delhi",
    price: "₹599",
    image: eventPhotography,
    category: "Photography",
    description: "Capture the city at night with fellow photography enthusiasts. Learn night photography techniques, light painting, and urban composition from a professional photographer.",
    capacity: 20,
    joined: 15,
    rating: 4.5,
    reviews: [
      { user: "Kiran N.", comment: "Great tips on long exposure photography!", rating: 4 },
    ],
  },
];

export const clubs = [
  {
    id: "1",
    name: "Trail Blazers",
    members: 234,
    description: "A community of hikers and trekkers exploring the best trails across India.",
    image: eventHiking,
    category: "Adventure",
  },
  {
    id: "2",
    name: "Morning Flow Yoga",
    members: 189,
    description: "Daily yoga practitioners building mindfulness and flexibility together.",
    image: eventYoga,
    category: "Wellness",
  },
  {
    id: "3",
    name: "Hoops Nation",
    members: 312,
    description: "Basketball enthusiasts from pickup games to competitive tournaments.",
    image: eventBasketball,
    category: "Sports",
  },
  {
    id: "4",
    name: "Lens & Light",
    members: 156,
    description: "Photographers of all levels sharing knowledge and going on photo walks.",
    image: eventPhotography,
    category: "Photography",
  },
];
