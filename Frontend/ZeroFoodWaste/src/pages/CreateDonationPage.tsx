import { useState, useRef } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArrowLeft, Upload, Loader2, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const FOOD_TYPES = [
  "Vegetables",
  "Bakery",
  "Cooked Food",
  "Dairy",
  "Fruits",
  "Packaged",
  "Grains",
  "Meat",
  "Seafood",
];

export function CreateDonationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    foodType: "Vegetables",
    quantity: "",
    quantityUnit: "kg",
    expiryDate: "",
    description: "",
    location: "",
  });
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.quantity || !formData.expiryDate || !formData.location) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields (Quantity, Expiry, Location).",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Parse quantity
      const quantityMatch = formData.quantity.match(
        /^(\d+(?:\.\d+)?)\s*(kg|plates|servings|pieces|units|liters)?$/i,
      );
      const quantity = quantityMatch
        ? parseFloat(quantityMatch[1])
        : parseFloat(formData.quantity);
      const quantityUnit =
        quantityMatch?.[2]?.toLowerCase() || formData.quantityUnit;

      // Location
      const location = {
        lat: user?.location?.lat || 28.6139,
        lng: user?.location?.lng || 77.209,
        address: formData.location,
      };

      // Convert images to base64
      const imagePromises = images.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          }),
      );

      const base64Images = await Promise.all(imagePromises);

      const donationData = {
        foodType: formData.foodType,
        quantity,
        quantityUnit,
        expiryDate: new Date(formData.expiryDate).toISOString(),
        description: formData.description,
        location,
        status: "CREATED",
        images: base64Images,
      };

      const response = await api.createDonation(donationData);

      if (response.success) {
        toast({
          title: "Success!",
          description: "Your donation has been created successfully.",
        });
        navigate("/donations");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create donation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file",
          description: `${file.name} is not an image file`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    if (images.length + validFiles.length > 5) {
      toast({
        title: "Too many images",
        description: "You can upload a maximum of 5 images",
        variant: "destructive",
      });
      return;
    }

    setImages([...images, ...validFiles]);

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviews((prev) => [...prev, event.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main className="pt-32 pb-24 container mx-auto px-4 max-w-7xl">
        <div className="mb-12">
          <Link
            to="/donations"
            className="inline-flex items-center text-muted-foreground hover:text-foreground font-bold mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Donations
          </Link>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 text-foreground">
            Create Food Donation
          </h1>
          <p className="text-xl text-muted-foreground font-medium max-w-2xl">
            Provide details about your surplus food to help us find the perfect match. Every contribution counts.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          {/* Left Form Area */}
          <div className="flex-1 space-y-12">
            
            {/* Food Type Selection */}
            <div className="space-y-4">
              <label className="text-xl font-black text-foreground block">
                What type of food are you donating?
              </label>
              <div className="flex flex-wrap gap-3">
                {FOOD_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, foodType: type })}
                    className={`px-6 py-4 rounded-[1.25rem] font-bold text-base transition-all duration-300 border-2 ${
                      formData.foodType === type
                        ? "border-primary bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-105"
                        : "border-border bg-card text-muted-foreground hover:border-primary hover:bg-muted"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity & Expiry */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-xl font-black text-foreground block">
                  Quantity
                </label>
                <input
                  type="text"
                  placeholder="e.g., 10 kg, 50 plates"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  className="w-full h-16 bg-card border-2 border-border rounded-[1.25rem] px-6 font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-lg"
                />
              </div>
              <div className="space-y-4">
                <label className="text-xl font-black text-foreground block">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expiryDate: e.target.value })
                  }
                  className="w-full h-16 bg-card border-2 border-border rounded-[1.25rem] px-6 font-bold text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-lg"
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <label className="text-xl font-black text-foreground block">
                Pickup Location
              </label>
              <input
                type="text"
                placeholder="Enter the full address for pickup"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full h-16 bg-card border-2 border-border rounded-[1.25rem] px-6 font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-lg"
              />
            </div>

            {/* Description */}
            <div className="space-y-4">
              <label className="text-xl font-black text-foreground block">
                Additional Details (Optional)
              </label>
              <textarea
                placeholder="Any special instructions or details about the food..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full min-h-[140px] bg-card border-2 border-border rounded-[1.5rem] p-6 font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-lg resize-y"
              />
            </div>

            {/* Images */}
            <div className="space-y-4">
              <label className="text-xl font-black text-foreground block">
                Images (Optional)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={images.length >= 5}
                className="w-full h-24 border-2 border-dashed border-muted-foreground rounded-[1.5rem] bg-muted hover:bg-border flex items-center justify-center text-muted-foreground font-bold transition-colors text-lg"
              >
                <Upload className="w-6 h-6 mr-3 opacity-50" /> 
                {images.length >= 5 ? "Max 5 images reached" : `Upload Images (${images.length}/5)`}
              </button>

              {/* Image Previews */}
              {previews.length > 0 && (
                <div className="mt-6 grid grid-cols-3 sm:grid-cols-5 gap-4">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative group aspect-square">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover rounded-[1rem] border-2 border-border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground p-1.5 rounded-full shadow-lg hover:scale-110 transition-transform"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Summary Area */}
          <div className="lg:w-[420px]">
            <div className="bg-primary rounded-[2.5rem] p-10 text-primary-foreground sticky top-32 shadow-2xl shadow-primary/30">
              <div className="mb-10">
                <p className="text-primary-foreground/80 font-bold uppercase tracking-widest text-sm mb-2">Live Preview</p>
                <h3 className="text-3xl font-black tracking-tight leading-tight">
                  Donation Summary
                </h3>
              </div>
              
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-primary-foreground/20 pb-5">
                  <span className="font-bold text-primary-foreground/80">Type</span>
                  <span className="font-black text-xl text-right max-w-[60%] truncate">{formData.foodType}</span>
                </div>
                <div className="flex justify-between items-center border-b border-primary-foreground/20 pb-5">
                  <span className="font-bold text-primary-foreground/80">Quantity</span>
                  <span className="font-black text-xl text-right max-w-[60%] truncate">{formData.quantity || "-"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-primary-foreground/20 pb-5">
                  <span className="font-bold text-primary-foreground/80">Expiry</span>
                  <span className="font-black text-xl text-right max-w-[60%] truncate">
                    {formData.expiryDate ? new Date(formData.expiryDate).toLocaleDateString() : "-"}
                  </span>
                </div>
                <div className="flex justify-between items-start border-b border-primary-foreground/20 pb-5">
                  <span className="font-bold text-primary-foreground/80 mr-4">Location</span>
                  <span className="font-black text-lg text-right line-clamp-2 leading-tight">
                    {formData.location || "-"}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => handleSubmit()} 
                disabled={isLoading} 
                className="w-full mt-12 bg-secondary hover:bg-secondary/80 disabled:opacity-70 text-secondary-foreground h-16 rounded-[1.25rem] font-black text-xl transition-all hover:-translate-y-1 hover:shadow-xl shadow-secondary/30 flex items-center justify-center border-2 border-secondary"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin mr-3" />
                    Processing...
                  </>
                ) : (
                  "Submit Donation"
                )}
              </button>
              
              <p className="text-center text-primary-foreground/60 font-bold text-sm mt-6">
                By submitting, you agree to our quality standards.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default CreateDonationPage;
