const steps = [
  {
    number: "01",
    title: "List Your Food",
    description:
      "Snap a photo, add details about quantity and expiry. Our simple interface makes it easy to log surplus food in less than a minute. Real-time updates ensure your listing is visible instantly.",
    color: "from-primary/60 to-primary",
    image: "images/landing/step1.png",
    bgAccent: "bg-primary/20",
    textColor: "text-primary",
  },
  {
    number: "02",
    title: "Get Matched",
    description:
      "Our intelligent geography-based system instantly finds nearby NGOs and community centers who can accept and distribute your donation quickly, minimizing transit times and maximizing freshness.",
    color: "from-secondary/60 to-secondary",
    image: "images/landing/step2.png",
    bgAccent: "bg-secondary/30",
    textColor: "text-secondary-foreground",
  },
  {
    number: "03",
    title: "Easy Pickup",
    description:
      "A registered volunteer picks up the food at your convenience. You can track the entire journey of your donation from your doorstep to its final destination with full transparency.",
    color: "from-accent/60 to-accent",
    image: "images/landing/step3.png",
    bgAccent: "bg-accent/20",
    textColor: "text-accent-foreground",
  },
  {
    number: "04",
    title: "Make Impact",
    description:
      "Your surplus food reaches those in need, fostering community support and reducing landfill waste. Earn platform points and watch your personal positive impact grow over time.",
    color: "from-primary/60 to-primary",
    image: "image/vegiees.avif",
    bgAccent: "bg-primary/20",
    textColor: "text-primary",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-secondary/30 rounded-full blur-3xl opacity-50" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Donate Food in <span className="text-primary">4 Simple Steps</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We've made it incredibly easy to share your surplus food and make a
            tangible difference in someone's life, all through an intuitive
            process.
          </p>
        </div>

        <div className="flex flex-col gap-24">
          {steps.map((step, index) => {
            const isEven = index % 2 === 0;

            return (
              <div
                key={step.number}
                className={`flex flex-col ${isEven ? "lg:flex-row" : "lg:flex-row-reverse"} items-center gap-12 lg:gap-20`}
              >
                {/* Image Section */}
                <div className="w-full lg:w-1/2">
                  <div className="relative image-zoom-container rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 border-8 border-background hover-lift">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10 pointer-events-none" />
                    <img
                      src={step.image}
                      alt={step.title}
                      className="w-full h-72 lg:h-80 object-cover image-zoom"
                    />
                  </div>
                </div>

                {/* Text Content Section */}
                <div className="w-full lg:w-1/2 flex flex-col justify-center">
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className={`text-5xl font-black select-none ${step.textColor} opacity-20`}
                    >
                      {step.number}
                    </div>
                  </div>

                  <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                    {step.title}
                  </h3>

                  <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
