import { Link } from "react-router-dom";
import { Leaf, Github, Twitter, Linkedin } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-green-900 text-green-100">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-green-300" />
              </div>
              <span className="text-xl font-bold text-green-100">
                Zero<span className="text-green-400">FoodWaste</span>
              </span>
            </Link>
            <p className="text-green-300 text-sm">
              Connecting communities to reduce food waste and fight hunger together.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-green-100 mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {["Home", "Donations", "Map", "Leaderboard"].map((link) => (
                <li key={link}>
                  <Link
                    to={`/${link.toLowerCase() === "home" ? "" : link.toLowerCase()}`}
                    className="text-green-300 hover:text-green-100 transition-colors text-sm"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-green-100 mb-4">Resources</h4>
            <ul className="space-y-2">
              {["How It Works", "For NGOs", "For Volunteers", "FAQ"].map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-green-300 hover:text-green-100 transition-colors text-sm"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-green-100 mb-4">Connect</h4>
            <div className="flex gap-3">
              {[Github, Twitter, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-lg bg-green-800 hover:bg-green-700 flex items-center justify-center transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-green-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-green-400 text-sm">
            © 2024 ZeroFoodWaste. All rights reserved.
          </p>

        </div>
      </div>
    </footer>
  );
};
