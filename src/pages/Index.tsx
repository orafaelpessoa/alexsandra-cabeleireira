import { useRef, useEffect, useState } from "react";
import { Hero } from "@/components/Hero";
import { ServicesCarousel } from "@/components/ServicesCarousel";
import { ProductsSection } from "@/components/ProductsSection";
import { BookingForm } from "@/components/BookingForm";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-salon.jpg"; // imagem padrão

const Index = () => {
  const servicesRef = useRef<HTMLDivElement>(null);
  const bookingRef = useRef<HTMLDivElement>(null);
  const [bannerUrl, setBannerUrl] = useState<string>("");

  const scrollToServices = () => {
    servicesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToBooking = () => {
    bookingRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("banner_image_url")
          .limit(1)
          .single();

        if (error) {
          console.error("Erro ao buscar banner:", error);
          return;
        }

        if (data?.banner_image_url) {
          setBannerUrl(data.banner_image_url);
        }
      } catch (err) {
        console.error("Erro inesperado ao buscar banner:", err);
      }
    };

    fetchBanner();
  }, []);

  return (
    <div className="min-h-screen">
      <Hero
        bannerImageUrl={bannerUrl || heroImage} // fallback para imagem padrão
        onViewServices={scrollToServices}
        onBookNow={scrollToBooking}
      />
      <div ref={servicesRef}>
        <ServicesCarousel />
      </div>
      <ProductsSection />
      <div ref={bookingRef}>
        <BookingForm />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
