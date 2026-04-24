import { motion } from "framer-motion";
import { Camera, MapPin, Truck, Heart } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "List Your Food",
    description: "Snap a photo, add details about quantity and expiry. Our simple interface makes it easy to log surplus food in less than a minute. Real-time updates ensure your listing is visible instantly.",
    color: "from-green-400 to-green-600",
    image: "/images/landing/step1.png",
    bgAccent: "bg-green-100",
    textColor: "text-green-600",
  },
  {
    number: "02",
    title: "Get Matched",
    description: "Our intelligent geography-based system instantly finds nearby NGOs and community centers who can accept and distribute your donation quickly, minimizing transit times and maximizing freshness.",
    color: "from-blue-400 to-blue-600",
    image: "/images/landing/step2.png",
    bgAccent: "bg-blue-100",
    textColor: "text-blue-600",
  },
  {
    number: "03",
    title: "Easy Pickup",
    description: "A registered volunteer picks up the food at your convenience. You can track the entire journey of your donation from your doorstep to its final destination with full transparency.",
    color: "from-purple-400 to-purple-600",
    image: "/images/landing/step3.png",
    bgAccent: "bg-purple-100",
    textColor: "text-purple-600",
  },
  {
    number: "04",
    title: "Make Impact",
    description: "Your surplus food reaches those in need, fostering community support and reducing landfill waste. Earn platform points and watch your personal positive impact grow over time.",
    color: "from-amber-400 to-amber-600",
    image: "/images/landing/step4.png",
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
                  <div className="relative group rounded-3xl overflow-hidden shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10" />
                    <img
                      src={step.image}
                      alt={step.title}
                      className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700"
                    />


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
                    <div className="text-6xl font-black text-muted select-none">
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
