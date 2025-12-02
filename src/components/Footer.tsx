import { motion } from "framer-motion";
import { MapPin, Phone, Instagram } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SiteSettings {
  phone: string;
  instagram: string;
  address: string;
}

export const Footer = () => {
  const [settings, setSettings] = useState<SiteSettings>({
    phone: "(83) 98888-8888",
    instagram: "@alexsandraoliveira",
    address: "R. Francisco Tavares de Oliveira, 16 - Mangabeira III",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("phone, instagram, address")
        .limit(1)
        .single();

      if (error) throw error;
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const handleAddressClick = () => {
    const encodedAddress = encodeURIComponent(settings.address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, "_blank");
  };

  const handlePhoneClick = () => {
    const phoneNumber = settings.phone.replace(/\D/g, "");
    window.open(`https://wa.me/55${phoneNumber}`, "_blank");
  };

  const handleInstagramClick = () => {
    const username = settings.instagram.replace("@", "");
    window.open(`https://www.instagram.com/${username}`, "_blank");
  };

  return (
    <footer className="bg-primary py-12 px-4 text-primary-foreground">
      <div className="container mx-auto">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Address */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center text-center md:items-start md:text-left"
          >
            <MapPin className="mb-3 h-6 w-6" />
            <h3 className="mb-2 font-semibold">Endereço</h3>
            <button
              onClick={handleAddressClick}
              className="transition-opacity hover:opacity-80 underline"
            >
              {settings.address}
            </button>
          </motion.div>

          {/* Phone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col items-center text-center md:items-start md:text-left"
          >
            <Phone className="mb-3 h-6 w-6" />
            <h3 className="mb-2 font-semibold">Telefone</h3>
            <button
              onClick={handlePhoneClick}
              className="transition-opacity hover:opacity-80 underline"
            >
              {settings.phone}
            </button>
          </motion.div>

          {/* Instagram */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col items-center text-center md:items-start md:text-left"
          >
            <Instagram className="mb-3 h-6 w-6" />
            <h3 className="mb-2 font-semibold">Instagram</h3>
            <button
              onClick={handleInstagramClick}
              className="transition-opacity hover:opacity-80 underline"
            >
              {settings.instagram}
            </button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 border-t border-primary-light pt-8 text-center"
        >
          <p className="text-sm opacity-90">
            © {new Date().getFullYear()} Salão de Beleza Alexsandra Oliveira. Todos os direitos reservados.
          </p>
        </motion.div>
      </div>
    </footer>
  );
};
