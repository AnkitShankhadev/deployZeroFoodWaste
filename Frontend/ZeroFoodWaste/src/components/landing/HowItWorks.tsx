import { motion } from "framer-motion";
import { Camera, MapPin, Truck, Heart } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "List Your Food",
    description: "Snap a photo, add details about quantity and expiry. Our simple interface makes it easy to log surplus food in less than a minute. Real-time updates ensure your listing is visible instantly.",
    color: "from-green-400 to-green-600",
    image: "https://images.unsplash.com/photo-1615897277884-a130f1d0639e?auto=format&fit=crop&q=80&w=800",
    bgAccent: "bg-green-100",
    textColor: "text-green-600",
  },
  {
    number: "02",
    title: "Get Matched",
    description: "Our intelligent geography-based system instantly finds nearby NGOs and community centers who can accept and distribute your donation quickly, minimizing transit times and maximizing freshness.",
    color: "from-emerald-400 to-emerald-600",
    image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&q=80&w=800",
    bgAccent: "bg-emerald-100",
    textColor: "text-emerald-600",
  },
  {
    number: "03",
    title: "Easy Pickup",
    description: "A registered volunteer picks up the food at your convenience. You can track the entire journey of your donation from your doorstep to its final destination with full transparency.",
    color: "from-teal-400 to-teal-600",
    image: "https://images.unsplash.com/photo-1594708767771-a7502209ff51?auto=format&fit=crop&q=80&w=800",
    bgAccent: "bg-teal-100",
    textColor: "text-teal-600",
  },
  {
    number: "04",
    title: "Make Impact",
    description: "Your surplus food reaches those in need, fostering community support and reducing landfill waste. Earn platform points and watch your personal positive impact grow over time.",
    color: "from-amber-400 to-amber-600",
    image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&q=80&w=800",
    bgAccent: "bg-amber-100",
    textColor: "text-amber-600",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-24 bg-card relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-green-200/30 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-200/20 rounded-full blur-3xl opacity-50" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-4">
            How It Works
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Donate Food in{" "}
            <span className="text-primary">4 Simple Steps</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We've made it incredibly easy to share your surplus food and make a tangible difference in someone's life, all through an intuitive process.
          </p>
        </motion.div>

        <div className="flex flex-col gap-24">
          {steps.map((step, index) => {
            const isEven = index % 2 === 0;

            return (
              <div
                key={step.number}
                className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12 lg:gap-20`}
              >
                {/* Image Section */}
                <motion.div
                  initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6 }}
                  className="w-full lg:w-1/2"
                >
                  <div className="relative image-zoom-container rounded-3xl overflow-hidden shadow-2xl shadow-emerald-100/40 border-8 border-white hover-lift">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10 pointer-events-none" />
                    <img
                      src={step.image}
                      alt={step.title}
                      className="w-full h-72 lg:h-80 object-cover image-zoom"
                    />
                    {/* Step number badge */}
                    <div className="absolute top-4 left-4 z-20 w-12 h-12 rounded-2xl bg-white/90 backdrop-blur flex items-center justify-center shadow-lg">
                      <span className={`text-base font-black ${step.textColor}`}>{step.number}</span>
                    </div>
                  </div>
                </motion.div>

                {/* Text Content Section */}
                <motion.div
                  initial={{ opacity: 0, x: isEven ? 50 : -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="w-full lg:w-1/2 flex flex-col justify-center"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`text-5xl font-black select-none ${step.textColor} opacity-20`}>
                      {step.number}
                    </div>
                    <div className="h-0.5 w-12 bg-border"></div>
                  </div>

                  <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                    {step.title}
                  </h3>

                  <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                    {step.description}
                  </p>

                  {/* Optional small detail/features list could go here. For now, a subtle line. */}
                  <div className={`w-24 h-1.5 rounded-full bg-gradient-to-r ${step.color}`} />
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
