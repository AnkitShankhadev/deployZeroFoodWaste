import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export function Stats() {
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

  const displayStats = [
    {
      image: "https://images.unsplash.com/photo-1593113565214-80afcb4d4d6b?auto=format&fit=crop&q=80&w=600",
      value: stats.completedDonations > 0 ? `${(stats.completedDonations * 3).toLocaleString()}kg` : "0",
      label: "Food Saved",
      detail: "From going to waste",
    },
    {
      image: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&q=80&w=600",
      value: stats.totalDonors > 0 ? `${stats.totalDonors.toLocaleString()}+` : "0",
      label: "Active Users",
      detail: "Donors & volunteers",
    },
    {
      image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&q=80&w=600",
      value: stats.totalNGOs > 0 ? `${stats.totalNGOs.toLocaleString()}+` : "0",
      label: "NGO Partners",
      detail: "Local partners",
    },
  ];

  return (
    <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden font-sans">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <img
          src="/image/hero_food_donation.png"
          alt="Background"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/90 via-primary/80 to-primary"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-primary-foreground tracking-tight">Our Impact in Numbers</h2>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-3xl mx-auto font-medium">
            Together, our community is making a real difference in fighting food waste and hunger.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {displayStats.map((stat, index) => (
            <div key={stat.label}>
              <div className="group relative bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden text-center shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:bg-white/20 hover:border-white/30 hover:shadow-black/20">
                <div className="h-48 w-full overflow-hidden relative">
                  <div className="absolute inset-0 bg-black/10 z-10 group-hover:bg-transparent transition-colors duration-300"></div>
                  <img src={stat.image} alt={stat.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" />
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/40 to-transparent z-10"></div>
                </div>
                <div className="p-8 relative z-20 -mt-8 bg-gradient-to-b from-transparent to-black/20">
                  <div className="text-4xl md:text-5xl font-black mb-3 text-white drop-shadow-lg tracking-tight group-hover:text-white transition-colors">{stat.value}</div>
                  <div className="text-sm font-bold mb-2 text-primary-foreground/80 uppercase tracking-widest">{stat.label}</div>
                  <div className="text-sm text-primary-foreground/60 font-medium">{stat.detail}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
