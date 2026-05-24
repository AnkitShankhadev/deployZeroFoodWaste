import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Clock,
  Scale,
  MapPin,
  User,
  Phone,
  Mail,
  Loader2,
  Check,
  AlertCircle,
  Edit2,
  Trash2,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

// Map food types to emojis
const foodTypeEmojis: Record<string, string> = {
  Vegetables: "🥕",
  Bakery: "🍞",
  "Cooked Food": "🍱",
  Dairy: "🥛",
  Fruits: "🍎",
  Packaged: "🥫",
  Grains: "🌾",
  Meat: "🍖",
  Seafood: "🐟",
};

const statusColors: Record<string, string> = {
  CREATED: "bg-green-100 text-green-700 border-green-300",
  ACCEPTED: "bg-blue-100 text-blue-700 border-blue-300",
  ASSIGNED: "bg-purple-100 text-purple-700 border-purple-300",
  IN_TRANSIT: "bg-orange-100 text-orange-700 border-orange-300",
  DELIVERED: "bg-gray-100 text-gray-700 border-gray-300",
  CANCELLED: "bg-red-100 text-red-700 border-red-300",
  EXPIRED: "bg-yellow-100 text-yellow-700 border-yellow-300",
};

interface Donation {
  _id: string;
  foodType: string;
  quantity: string;
  quantityUnit?: string;
  expiryDate: string;
  description: string;
  images: string[];
  status: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  donorId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
  };
  acceptedBy?: string;
  createdAt: string;
}

const getTimeRemaining = (expiryDate: string) => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffMs = expiry.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""}`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? "s" : ""}`;
  return "Expired or expiring soon";
};

export function DonationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [donation, setDonation] = useState<Donation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteDonation = async () => {
    if (!donation) return;
    if (!window.confirm("Are you sure you want to delete this donation?"))
      return;

    try {
      setIsDeleting(true);
      const response = await api.deleteDonation(donation._id);

      if (response.success) {
        toast({
          title: "Success",
          description: "Donation deleted successfully.",
        });
        navigate("/donations");
      }
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to delete donation.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const fetchDonation = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.getDonation(id!);

        if (response.success && response.data?.donation) {
          setDonation(response.data.donation);
        } else {
          throw new Error("Failed to load donation details");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to load donation details";
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

    if (id) {
      fetchDonation();
    }
  }, [id]);

  const handleAcceptDonation = async () => {
    if (!donation) return;

    try {
      setIsAccepting(true);
      const response = await api.acceptDonation(donation._id);

      if (response.success) {
        setDonation(response.data?.donation || donation);
        await refreshUser();
        toast({
          title: "Success!",
          description: "You have accepted this donation.",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error
            ? err.message
            : "Failed to accept donation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !donation) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {error || "Donation not found"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  This donation may have been removed or is no longer available.
                </p>
                <Button onClick={() => navigate("/donations")} variant="hero">
                  Back to Donations
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/donations")}
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Donations
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images Gallery */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl border border-border overflow-hidden"
            >
              {donation.images && donation.images.length > 0 ? (
                <div className="aspect-video bg-muted relative">
                  <img
                    src={donation.images[0]}
                    alt="Donation"
                    className="w-full h-full object-cover"
                  />
                  {donation.images.length > 1 && (
                    <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      1 of {donation.images.length}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
                  <span className="text-6xl">
                    {foodTypeEmojis[donation.foodType] || "🍽️"}
                  </span>
                </div>
              )}

              {/* Image Thumbnails */}
              {donation.images && donation.images.length > 1 && (
                <div className="p-4 border-t border-border flex gap-2 overflow-x-auto">
                  {donation.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 border-border hover:border-primary cursor-pointer transition-colors"
                    >
                      <img
                        src={img}
                        alt={`Image ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-2xl border border-border overflow-hidden"
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <CardTitle className="text-3xl mb-2">
                      {donation.foodType}
                    </CardTitle>
                    <CardDescription>
                      Posted on{" "}
                      {new Date(donation.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge
                    className={`${
                      statusColors[donation.status] || statusColors.CREATED
                    } border`}
                  >
                    {donation.status === "CREATED"
                      ? "Available"
                      : donation.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    Description
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {donation.description || "No description available"}
                  </p>
                </div>

                {/* Details Grid */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <Scale className="w-4 h-4 text-primary" />
                      <p className="text-xs text-muted-foreground">Quantity</p>
                    </div>
                    <p className="text-lg font-semibold text-foreground">
                      {donation.quantity}{" "}
                      {donation.quantityUnit ? donation.quantityUnit : ""}
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-primary" />
                      <p className="text-xs text-muted-foreground">
                        Expires in
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-foreground">
                      {getTimeRemaining(donation.expiryDate)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(donation.expiryDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-primary" />
                      <p className="text-xs text-muted-foreground">Location</p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {donation.location?.address || "Address not available"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Donor Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-2xl border border-border p-6"
            >
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Donor Information
              </h3>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="font-medium text-foreground">
                      {donation.donorId?.name || "Anonymous"}
                    </p>
                  </div>
                </div>

                {donation.donorId?.email && (
                  <div className="flex items-start gap-3 pt-2 border-t border-border">
                    <Mail className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium text-foreground break-all text-sm">
                        {donation.donorId.email}
                      </p>
                    </div>
                  </div>
                )}

                {donation.donorId?.phone && (
                  <div className="flex items-start gap-3 pt-2 border-t border-border">
                    <Phone className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium text-foreground">
                        {donation.donorId.phone}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Accept Button - Only for NGOs and when donation is CREATED */}
            {user?.role === "NGO" && donation.status === "CREATED" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  onClick={handleAcceptDonation}
                  disabled={isAccepting}
                  className="w-full gap-2 h-12 text-base"
                  variant="hero"
                >
                  {isAccepting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Accepting...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Accept Donation
                    </>
                  )}
                </Button>
              </motion.div>
            )}

            {/* Donor Actions - Only for owner and when donation is CREATED */}
            {user?.id === donation.donorId?._id &&
              donation.status === "CREATED" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex gap-4"
                >
                  <Button
                    onClick={() => navigate(`/donations/${donation._id}/edit`)}
                    className="flex-1 gap-2 h-12 text-base"
                    variant="outline"
                  >
                    <Edit2 className="w-5 h-5" />
                    Edit
                  </Button>
                  <Button
                    onClick={handleDeleteDonation}
                    disabled={isDeleting}
                    variant="destructive"
                    className="flex-1 gap-2 h-12 text-base"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                    Delete
                  </Button>
                </motion.div>
              )}

            {/* Status Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-muted/50 rounded-2xl border border-border p-6"
            >
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Status Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Current Status
                  </p>
                  <Badge
                    className={`${
                      statusColors[donation.status] || statusColors.CREATED
                    } border mt-1`}
                  >
                    {donation.status === "CREATED"
                      ? "Available"
                      : donation.status}
                  </Badge>
                </div>

                {donation.status !== "CREATED" && (
                  <div className="pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-1">
                      Status Details
                    </p>
                    <p className="text-sm text-foreground">
                      This donation has been {donation.status.toLowerCase()}.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default DonationDetailPage;
