import { useRef } from "react";
import { Hero } from "@/components/Hero";
import { ServicesCarousel } from "@/components/ServicesCarousel";
import { ProductsSection } from "@/components/ProductsSection";
import { BookingForm } from "@/components/BookingForm";
import { Footer } from "@/components/Footer";

const Index = () => {
  const servicesRef = useRef<HTMLDivElement>(null);
  const bookingRef = useRef<HTMLDivElement>(null);

  const scrollToServices = () => {
    servicesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToBooking = () => {
    bookingRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      <Hero onViewServices={scrollToServices} onBookNow={scrollToBooking} />
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
