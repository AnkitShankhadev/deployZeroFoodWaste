import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

// Earthy Harmony card styles using semantic variables
const cardStyles = [
  "bg-muted text-foreground border-border", // Light Mint
  "bg-accent text-accent-foreground border-ring/20", // Sage
  "bg-secondary text-secondary-foreground border-border", // Sand
  "bg-background text-foreground border-border", // Pearl
  "bg-card text-card-foreground border-border", // White
];

const getTimeRemaining = (expiryDate: string) => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffMs = expiry.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""}`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? "s" : ""}`;
  return "Less than 1 hour";
};

const Donations = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [donations, setDonations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.getDonations();

        if (response.success && response.data.donations) {
          setDonations(response.data.donations);
        } else {
          throw new Error("Failed to load donations");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to load donations. Please try again later.";
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDonations();
  }, []);

  const types = [...new Set(donations.map((d) => d.foodType))].filter(Boolean);

  const filteredDonations = donations.filter((d) => {
    const matchesSearch =
      d.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.foodType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.location?.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.donorId?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = !selectedType || d.foodType === selectedType;
    return matchesSearch && matchesType;
  });

  const handleAcceptDonation = async (id: string) => {
    try {
      const response = await api.acceptDonation(id);
      const updated = response.data?.donation;

      toast({
        title: "Donation accepted",
        description: "You have accepted this donation.",
      });

      setDonations((prev) =>
        prev.map((d) => (d._id === updated._id ? updated : d)),
      );
    } catch (err: any) {
      toast({
        title: "Could not accept donation",
        description: err.message || "Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-3xl md:text-5xl font-black text-foreground mb-4 tracking-tight">
              Food Donations
            </h1>
            <p className="text-l text-muted-foreground font-medium max-w-2xl leading-relaxed">
              Browse available donations near you or create a new listing to share your surplus food with the community.
            </p>
          </div>

          {/* Simple Search & Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-12">
            <input
              placeholder="Search donations by name, food type, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 h-12 bg-card border-2 border-border rounded-[1.25rem] px-6 font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm text-lg"
              disabled={isLoading}
            />
            <div className="flex gap-3 overflow-x-auto pb-4 md:pb-0 scrollbar-hide">
              <button
                onClick={() => setSelectedType(null)}
                className={`h-12 px-8 rounded-[1.25rem] font-bold whitespace-nowrap transition-all shadow-sm text-lg border-2 ${selectedType === null
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  }`}
              >
                All
              </button>
              {types.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`h-12 px-8 rounded-[1.25rem] font-bold whitespace-nowrap transition-all shadow-sm text-lg border-2 ${selectedType === type
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>
            {user?.role !== "NGO" && user?.role !== "VOLUNTEER" && (
              <Link to="/create-donation">
                <button className="h-14 px-8 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-black rounded-[1.25rem] whitespace-nowrap transition-transform hover:-translate-y-1 shadow-lg shadow-secondary/30 text-lg border-2 border-secondary hover:border-secondary/80">
                  Create Donation
                </button>
              </Link>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-2xl font-bold text-muted-foreground/70 animate-pulse">Loading donations...</div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="text-center py-20 bg-destructive/10 rounded-[2rem] border-2 border-destructive/20 max-w-2xl mx-auto">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl font-black text-destructive mb-3">
                Error Loading Donations
              </h3>
              <p className="text-destructive/80 font-medium mb-8 text-lg px-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="h-12 px-8 bg-destructive hover:bg-destructive/80 text-destructive-foreground font-bold rounded-xl transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Donations Grid */}
          {!isLoading && !error && filteredDonations.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDonations.map((donation, index) => {
                // Pick a color based on index
                const cardStyle = cardStyles[index % cardStyles.length];

                return (
                  <motion.div
                    key={donation._id || donation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-6 sm:p-8 rounded-[2rem] border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${cardStyle} flex flex-col h-full`}
                  >
                    {/* Card Image */}
                    {donation.images && donation.images.length > 0 && (
                      <div className="w-full h-48 mb-6 rounded-2xl overflow-hidden shadow-sm border border-foreground/10 flex-shrink-0">
                        <img 
                          src={donation.images[0]} 
                          alt={donation.title || donation.foodType} 
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}

                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-16 h-16 bg-background/60 rounded-[1.25rem] flex items-center justify-center shadow-sm border border-foreground/10 overflow-hidden">
                        {donation.donorId?.profileImage ? (
                          <img src={donation.donorId.profileImage} alt={donation.donorId.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl font-black opacity-50">{donation.donorId?.name?.charAt(0).toUpperCase() || "U"}</span>
                        )}
                      </div>
                      <div className="bg-background/60 px-4 py-1.5 rounded-full font-black text-xs shadow-sm border border-foreground/10 uppercase tracking-widest">
                        {donation.status === "CREATED"
                          ? "Available"
                          : donation.status}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="flex-1">
                      <h3 className="text-2xl sm:text-3xl font-black mb-3 leading-tight tracking-tight">
                        {donation.title || donation.foodType}
                      </h3>
                      <p className="text-base font-semibold opacity-75 mb-6 line-clamp-2 leading-relaxed">
                        {donation.description || "No description provided."}
                      </p>

                      <div className="flex flex-wrap gap-2 text-sm font-bold opacity-90 mb-8">
                        <span className="bg-background/50 px-4 py-2 rounded-xl border border-foreground/10">
                          {donation.quantity} {donation.quantityUnit || "kg"}
                        </span>
                        <span className="bg-background/50 px-4 py-2 rounded-xl border border-foreground/10">
                          Expiry: {donation.expiryDate ? getTimeRemaining(donation.expiryDate) : "N/A"}
                        </span>
                        <span className="bg-background/50 px-4 py-2 rounded-xl border border-foreground/10 truncate max-w-full">
                          {donation.location?.address || "Unknown location"}
                        </span>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="pt-5 border-t border-foreground/10 flex items-end justify-between gap-4 mt-auto">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Donor</p>
                        <p className="font-extrabold text-lg leading-none">{donation.donorId?.name || "Anonymous"}</p>
                      </div>
                      <div className="flex gap-2">
                        {user?.role === "NGO" && donation.status === "CREATED" && (
                          <button
                            className="px-5 py-3 bg-background text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary rounded-xl border border-foreground/20 font-black transition-colors shadow-sm text-sm"
                            onClick={() => handleAcceptDonation(donation._id || donation.id)}
                          >
                            Accept
                          </button>
                        )}
                        <Link to={`/donations/${donation._id || donation.id}`}>
                          <button className="px-5 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-black transition-colors shadow-md text-sm border-2 border-primary">
                            View
                          </button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredDonations.length === 0 && (
            <div className="text-center py-24 bg-card border-2 border-border rounded-[2rem] max-w-3xl mx-auto shadow-sm">
              <div className="text-6xl mb-6">🌱</div>
              <h3 className="text-3xl font-black text-foreground mb-4">
                No donations found
              </h3>
              <p className="text-xl font-medium text-muted-foreground mb-8 px-6">
                {donations.length === 0
                  ? "No donations are available right now. Be the first to share your surplus food!"
                  : "We couldn't find any donations matching your search. Try adjusting the filters."}
              </p>
              {user?.role !== "NGO" && user?.role !== "VOLUNTEER" && (
                <Link to="/create-donation">
                  <button className="h-14 px-8 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-black rounded-2xl transition-transform hover:-translate-y-1 shadow-xl shadow-secondary/20 text-lg border-2 border-secondary">
                    Create Donation
                  </button>
                </Link>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Donations;
