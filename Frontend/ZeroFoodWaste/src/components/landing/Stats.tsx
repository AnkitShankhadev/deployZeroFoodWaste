import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Scale, Users, Building2, Leaf } from "lucide-react";
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
      icon: Scale,
      value: stats.completedDonations > 0 ? `${(stats.completedDonations * 3).toLocaleString()}kg` : "0",
      label: "Food Saved",
      detail: "From going to waste",
      iconColor: "text-emerald-500"
    },
    {
      icon: Users,
      value: stats.totalDonors > 0 ? `${stats.totalDonors.toLocaleString()}+` : "0",
      label: "Active Users",
      detail: "Donors & volunteers",
      iconColor: "text-emerald-500"
    },
    {
      icon: Building2,
      value: stats.totalNGOs > 0 ? `${stats.totalNGOs.toLocaleString()}+` : "0",
      label: "NGO Partners",
      detail: "Local partners",
      iconColor: "text-emerald-500"
    },

  ];

  return (
    <section className="py-20 bg-emerald-600 text-white relative overflow-hidden font-sans">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)`
        }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-white tracking-tight">Our Impact in Numbers</h2>
          <p className="text-lg text-emerald-50 max-w-2xl mx-auto font-medium">
            Together, our community is making a real difference in fighting food waste and hunger.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {displayStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center shadow-xl shadow-black/5 hover:bg-white/20 transition-colors">
                <div className="flex justify-center mb-4">
                  <div className="h-14 w-14 bg-white rounded-full flex items-center justify-center shadow-inner">
                    <stat.icon className={`h-7 w-7 ${stat.iconColor}`} />
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-extrabold mb-2 text-white">{stat.value}</div>
                <div className="text-sm font-bold mb-1 text-emerald-50 uppercase tracking-wider">{stat.label}</div>
                <div className="text-xs text-white/80 font-medium">{stat.detail}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
