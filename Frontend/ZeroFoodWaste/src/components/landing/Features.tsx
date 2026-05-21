import { CheckCircle2 } from "lucide-react";

const features = [
  {
    title: "Simple & Fast Donations",
    description: "List your surplus food in seconds. Add photos, quantities, and specify when it can be picked up. We make it effortless to redirect good food before it goes to waste.",
    image: "image/simple andfast donation.jpg",
    benefits: ["Intuitive photo uploads", "Custom expiry tracking", "Instant notifications"]
  },
  {
    title: "Smart Local Matching",
    description: "Our platform instantly alerts nearby NGOs and registered volunteers the moment food is available, ensuring it's rescued while it's still fresh and delicious.",
    image: "image/fast matching.avif",
    benefits: ["Radius-based alerts", "Optimized routing"]
  },
  {
    title: "A Community That Cares",
    description: "Join thousands of donors, businesses, and volunteers all working together. Earn badges, track your environmental impact, and see exactly how many meals you've saved.",
    image: "image/community that cares.jpg",
    benefits: ["Earn rewards & points", "Public leaderboards"]
  }
];

export const Features = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden font-sans">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">

          <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6 tracking-tight">
            Everything You Need to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Make an Impact</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
            A comprehensive platform designed to make food donation simple,
            rewarding, and impactful for everyone involved in the community.
          </p>
        </div>

        <div className="space-y-24">
          {features.map((feature, index) => (
            <div key={feature.title} className={`flex flex-col md:flex-row gap-12 lg:gap-16 items-center ${index % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
              <div className="w-full md:w-1/2">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 hover-lift image-zoom-container group">
                  <img src={feature.image} alt={feature.title} className="w-full h-80 object-cover image-zoom" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                </div>
              </div>

              <div className="w-full md:w-1/2 space-y-6">
                <h3 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">{feature.title}</h3>
                <p className="text-lg text-muted-foreground leading-relaxed font-medium">
                  {feature.description}
                </p>
                <ul className="space-y-4 pt-4">
                  {feature.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-3 text-foreground/80 font-semibold text-lg">
                      <div className="p-1 rounded-full bg-primary/20">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      </div>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
