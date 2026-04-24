import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Leaf } from "lucide-react";

export const CTA = () => {
  return (
    <section className="py-24 relative overflow-hidden font-sans">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <div className="bg-emerald-900 rounded-[3rem] p-10 md:p-16 lg:p-20 shadow-2xl relative overflow-hidden">
            {/* Organic decorative background elements */}
            <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-emerald-800/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-teal-800/40 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
            
            {/* Grid pattern overlay */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '32px 32px'
            }}></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="w-full md:w-3/5 text-center md:text-left">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", duration: 0.6 }}
                  className="w-16 h-16 rounded-2xl bg-emerald-800/80 backdrop-blur-md flex items-center justify-center mb-8 border border-emerald-700 mx-auto md:mx-0 shadow-lg"
                >
                  <Leaf className="w-8 h-8 text-emerald-300" />
                </motion.div>

                <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 tracking-tight leading-tight">
                  Ready to Make a <span className="text-emerald-300">Difference?</span>
                </h2>
                <p className="text-xl text-emerald-100/80 mb-0 max-w-xl mx-auto md:mx-0 font-medium leading-relaxed">
                  Join thousands of food heroes who are already rescuing meals and fighting hunger. 
                  Every single donation counts.
                </p>
              </div>

              <div className="w-full md:w-2/5 flex flex-col gap-4">
                <Link to="/auth?mode=register&role=donor" className="w-full">
                  <Button size="xl" className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-lg h-16 rounded-full shadow-xl shadow-emerald-900/50 transition-all hover:-translate-y-1 group">
                    Become a Donor
                    <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <Link to="/auth?mode=register&role=ngo" className="w-full">
                    <Button variant="outline" size="lg" className="w-full border-emerald-700/50 text-emerald-100 hover:bg-emerald-800 hover:text-white rounded-2xl h-14 backdrop-blur-sm bg-black/10">
                      Register as NGO
                    </Button>
                  </Link>
                  <Link to="/auth?mode=register&role=volunteer" className="w-full">
                    <Button variant="outline" size="lg" className="w-full border-emerald-700/50 text-emerald-100 hover:bg-emerald-800 hover:text-white rounded-2xl h-14 backdrop-blur-sm bg-black/10">
                      Be a Volunteer
                    </Button>
                  </Link>
                </div>
                
                <p className="mt-4 text-sm text-emerald-300/60 text-center font-medium">
                  Free forever for all donors & volunteers
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
