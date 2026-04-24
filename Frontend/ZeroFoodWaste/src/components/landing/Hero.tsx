import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import heroImage from "@/assets/hero_food_donation.png";

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
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16 font-sans">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-soft" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-200/20 rounded-full blur-3xl" />

      {/* Floating shapes */}
      <motion.div
        className="absolute top-32 right-[20%] w-20 h-20 bg-emerald-300/30 rounded-2xl rotate-12"
        animate={{ y: [0, -20, 0], rotate: [12, 20, 12] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-40 left-[15%] w-16 h-16 bg-yellow-300/30 rounded-full"
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium mb-6 border border-emerald-100"
            >

            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-800 leading-tight mb-6 tracking-tight">
              Real people sharing{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">
                good food.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
              Got a little extra? We make it incredibly simple to safely share your surplus food
              with neighbors and local shelters. Let's make sure good food goes to a plate, not a bin.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/auth/register">
                <Button variant="hero" size="xl" className="group w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-8 shadow-lg shadow-emerald-200">
                  Share Your Food
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-6 pt-8 border-t border-slate-100">
              {[
                { value: stats.completedDonations, label: "Meals Redirected" },
                { value: stats.totalDonors, label: "Generous Neighbors" },
                { value: stats.totalNGOs, label: "Local Partners" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="text-center lg:text-left"
                >
                  <div className="text-3xl md:text-4xl font-bold tracking-tight text-emerald-600">
                    {stat.value}
                  </div>
                  <div className="text-sm font-medium text-slate-500 mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Hero Image/Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <div className="relative pl-8">
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-emerald-200/50 border-[8px] border-white z-10 w-full aspect-[4/3] transform transition-transform hover:scale-[1.02] duration-500">
                <img 
                  src={heroImage} 
                  alt="Volunteers sharing food" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Decorative background element behind image */}
              <div className="absolute top-8 -right-4 w-full h-full rounded-[2rem] bg-emerald-100/50 z-0 border border-emerald-200/50"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
