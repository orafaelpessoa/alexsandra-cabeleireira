import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Clock, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  image_url: string | null;
  description: string | null;
}

export const ServicesCarousel = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="mb-12 text-center text-4xl font-bold">Nossos Serviços</h2>
          <div className="flex justify-center">
            <p className="text-muted-foreground">Carregando serviços...</p>
          </div>
        </div>
      </section>
    );
  }

  if (services.length === 0) {
    return (
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="mb-12 text-center text-4xl font-bold">Nossos Serviços</h2>
          <div className="flex justify-center">
            <p className="text-muted-foreground">Nenhum serviço disponível no momento.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="services" className="py-20 px-4 bg-secondary/30">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="mb-12 text-center text-4xl font-bold">Nossos Serviços</h2>
        </motion.div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 4000,
            }),
          ]}
          className="mx-auto max-w-6xl"
        >
          <CarouselContent>
            {services.map((service, index) => (
              <CarouselItem key={service.id} className="md:basis-1/2 lg:basis-1/3">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden hover-lift shadow-soft">
                    <div className="aspect-[4/3] overflow-hidden">
                      {service.image_url ? (
                        <img
                          src={service.image_url}
                          alt={service.name}
                          className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-card flex items-center justify-center">
                          <p className="text-muted-foreground">Sem imagem</p>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-6">
                      <h3 className="mb-3 text-xl font-semibold">{service.name}</h3>
                      {service.description && (
                        <p className="mb-4 text-sm text-muted-foreground">
                          {service.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{service.duration} min</span>
                        </div>
                        <div className="flex items-center gap-1 text-lg font-semibold text-primary">
                          <DollarSign className="h-5 w-5" />
                          <span>{service.price.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      </div>
    </section>
  );
};
