import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-salon.jpg";
import { Link } from "react-router-dom";

interface HeroProps {
  onViewServices: () => void;
  onBookNow: () => void;
  bannerImageUrl?: string;
}

export const Hero = ({ onViewServices, onBookNow, bannerImageUrl }: HeroProps) => {
  return (
    <section className="relative h-screen w-full overflow-hidden">

      <Link
        to="/admin"
        className="fixed top-1 right-1 z-[9999] h-14 w-14 opacity-0 cursor-pointer"

      />

      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${bannerImageUrl || heroImage})`,
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-hero" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full items-center justify-center px-4">
        <div className="text-center text-white">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-6 text-5xl font-bold md:text-7xl"
          >
            Salão de Beleza
            <br />
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Alexsandra Oliveira
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-8 text-lg md:text-xl"
          >
            Beleza e Cuidado Profissional
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col gap-4 sm:flex-row sm:justify-center"
          >
            <Button
              size="lg"
              onClick={onViewServices}
              className="bg-primary hover:bg-primary-dark transition-all duration-300"
            >
              Ver Serviços
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={onBookNow}
              className="border-2 border-white bg-transparent text-white hover:bg-white hover:text-primary transition-all duration-300"
            >
              Agende seu Horário
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="h-12 w-8 rounded-full border-2 border-white p-2">
          <motion.div
            animate={{ y: [0, 16, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="h-2 w-2 rounded-full bg-white"
          />
        </div>
      </motion.div>
    </section>
  );
};
