import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Leaf, Users, Package } from "lucide-react";
import { api } from "@/lib/api";

export const Hero = () => {
  const [stats, setStats] = useState({
    completedDonations: 0,
    totalDonors: 0,
    totalNGOs: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.getPlatformStats();
        if (res.success) {
          setStats(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch platform stats:", error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="font-sans">
      {/* Announcement Bar */}
      <div className="bg-emerald-600 text-white text-sm font-medium text-center py-2.5 px-4 flex items-center justify-center gap-2">
        <Leaf className="w-4 h-4 flex-shrink-0" />
        <span>
          🌱 Together we've completed{" "}
          <strong>{stats.completedDonations > 0 ? stats.completedDonations.toLocaleString() : "..."}</strong>{" "}
          food donations — and counting!
        </span>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden pt-16">
        {/* Background Image with overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/image/food donation.avif"
            alt="Food sharing community"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        {/* Wavy bottom divider */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="hsl(var(--background))" />
          </svg>
        </div>

        <div className="container mx-auto px-4 relative z-10 py-20">
          <div className="max-w-2xl">



            {/* Main Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6 tracking-tight">
              Don't Waste It.{" "}
              <span className="text-emerald-400">Share It.</span>
            </h1>

            <p className="text-lg md:text-xl text-white/80 mb-10 max-w-lg leading-relaxed font-medium">
              Connect surplus food with people who need it. Simple, fast, and
              free for donors, volunteers, and NGOs working together.
            </p>

            {/* Dual CTA */}
            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <Link to="/auth">
                <Button
                  size="lg"
                  className="group bg-emerald-500 hover:bg-emerald-400 text-white font-bold h-14 px-8 rounded-full shadow-xl shadow-emerald-900/40 transition-all hover:-translate-y-0.5 text-base"
                >
                  Donate Food Today
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            {/* Floating stat bubbles */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3">
                <div>
                  <div className="text-xl font-black text-white leading-none">
                    {stats.completedDonations > 0
                      ? `${(stats.completedDonations * 3).toLocaleString()}kg`
                      : "0 kg"}
                  </div>
                  <div className="text-xs text-white/60 font-medium mt-0.5">Food Saved</div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3">
                <div>
                  <div className="text-xl font-black text-white leading-none">
                    {stats.totalDonors > 0
                      ? `${stats.totalDonors.toLocaleString()}+`
                      : "0"}
                  </div>
                  <div className="text-xs text-white/60 font-medium mt-0.5">Active Users</div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3">
                <div>
                  <div className="text-xl font-black text-white leading-none">
                    {stats.totalNGOs > 0
                      ? `${stats.totalNGOs.toLocaleString()}+`
                      : "0"}
                  </div>
                  <div className="text-xs text-white/60 font-medium mt-0.5">NGO Partners</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
