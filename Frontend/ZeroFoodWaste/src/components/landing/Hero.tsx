import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
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
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16 font-sans bg-background">
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          <div className="text-center lg:text-left">


            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-6 tracking-tight">
              Real people sharing{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                good food.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
              Got a little extra? We make it incredibly simple to safely share your surplus food
              with neighbors and local shelters. Let's make sure good food goes to a plate, not a bin.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/auth/register">
                <Button variant="hero" size="xl" className="group w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 shadow-lg shadow-primary/20">
                  Share Your Food
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-6 pt-8 border-t border-border">
              {[
                { value: stats.completedDonations, label: "Donations" },
                { value: stats.totalDonors, label: "Volunteers" },
                { value: stats.totalNGOs, label: "NGOs" },
              ].map((stat, i) => (
                <div key={stat.label} className="text-center lg:text-left">
                  <div className="text-3xl md:text-4xl font-bold tracking-tight text-primary">
                    {stat.value}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Image/Illustration */}
          <div className="relative hidden lg:block">
            <div className="relative pl-8">
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-primary/20 border-[8px] border-card z-10 w-full aspect-[4/3] hover-lift image-zoom-container">
                <img
                  src="/image/food donation.avif"
                  alt="Volunteers sharing food"
                  className="w-full h-full object-cover image-zoom"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section >
  );
};
