import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="bg-charcoal text-cream py-16">
    <div className="container mx-auto px-4 md:px-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        <div className="col-span-2 md:col-span-1">
          <span className="font-display text-2xl font-bold">
            Hop<span className="text-primary">On</span>
          </span>
          <p className="mt-3 text-sm text-cream/60 leading-relaxed">
            Discover events you'll love. Join communities that inspire.
          </p>
        </div>
        <div>
          <h4 className="font-sans text-xs font-semibold uppercase tracking-widest text-cream/40 mb-4">Explore</h4>
          <ul className="space-y-2.5">
            {["Events", "Clubs", "Categories", "Nearby"].map((l) => (
              <li key={l}><Link to="/explore" className="text-sm text-cream/70 hover:text-primary transition-colors">{l}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-sans text-xs font-semibold uppercase tracking-widest text-cream/40 mb-4">Company</h4>
          <ul className="space-y-2.5">
            {["About", "Blog", "Careers", "Contact"].map((l) => (
              <li key={l}><Link to="/" className="text-sm text-cream/70 hover:text-primary transition-colors">{l}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-sans text-xs font-semibold uppercase tracking-widest text-cream/40 mb-4">Legal</h4>
          <ul className="space-y-2.5">
            {["Privacy", "Terms", "FAQ"].map((l) => (
              <li key={l}><Link to="/" className="text-sm text-cream/70 hover:text-primary transition-colors">{l}</Link></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-cream/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-cream/40">© 2026 HopOn. All rights reserved.</p>
        <div className="flex gap-6">
          {["Twitter", "Instagram", "LinkedIn"].map((s) => (
            <a key={s} href="#" className="text-xs text-cream/40 hover:text-primary transition-colors">{s}</a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
