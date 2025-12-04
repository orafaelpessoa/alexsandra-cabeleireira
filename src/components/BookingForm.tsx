import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parse, addMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PaymentDialog } from "./PaymentDialog";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface Booking {
  booking_date: string;
  booking_time: string;
  service_id: string;
}

const TIME_SLOTS = [
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
];

export const BookingForm = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [pendingBookingData, setPendingBookingData] = useState<any>(null);
  const [whatsappNumber, setWhatsappNumber] = useState<string>("");

  // new: set of occupied slots for the selectedDate (strings "HH:mm")
  const [occupiedSlots, setOccupiedSlots] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSiteSettings();
    fetchServices();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchBookings(selectedDate);
    } else {
      // if no date selected, clear bookings and occupiedSlots
      setBookings([]);
      setOccupiedSlots(new Set());
    }
  }, [selectedDate]);

  // recompute occupied slots whenever bookings, services or date change
  useEffect(() => {
    computeOccupiedSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, services, selectedDate]);

  // -------------------- FETCH SITE SETTINGS (WhatsApp) --------------------
  const fetchSiteSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("phone")
        .single();

      if (error) throw error;
      setWhatsappNumber(data?.phone || "");
    } catch (error) {
      console.error("Erro ao buscar site settings:", error);
    }
  };
  // ----------------------------------------------------------------------

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, duration, price")
        .order("name");

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  const fetchBookings = async (date: Date) => {
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("bookings")
        .select("booking_date, booking_time, service_id")
        .eq("booking_date", dateStr)
        .in("status", ["pending", "confirmed"]);

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h${mins}min`;
  };

  // -------------------- isTimeSlotOccupied (robust final) --------------------
  const isTimeSlotOccupied = (time: string, duration: number) => {
  if (!selectedDate) return false;

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  // Normaliza o slot selecionado para HH:mm:00
  const slotWithSeconds = `${time}:00`;

  const timeDate = parse(
    `${dateStr} ${slotWithSeconds}`,
    "yyyy-MM-dd HH:mm:ss",
    new Date()
  );

  if (isNaN(timeDate.getTime())) return false;

  const currentEnd = addMinutes(timeDate, duration);

  // Verifica cada agendamento existente
  for (const booking of bookings) {
    if (booking.booking_date !== dateStr) continue;

    let bookingTimeClean = booking.booking_time;
    if (bookingTimeClean.length === 5) {
      bookingTimeClean = `${bookingTimeClean}:00`;
    }

    const bookedStart = parse(
      `${booking.booking_date} ${bookingTimeClean}`,
      "yyyy-MM-dd HH:mm:ss",
      new Date()
    );

    if (isNaN(bookedStart.getTime())) continue;

    const bookedService = services.find((s) => s.id === booking.service_id);
    if (!bookedService) continue;

    const bookedEnd = addMinutes(bookedStart, bookedService.duration);

    // AQUI está a lógica correta (sempre pra frente)
    const overlap =
      (timeDate >= bookedStart && timeDate < bookedEnd) ||
      (currentEnd > bookedStart && currentEnd <= bookedEnd) ||
      (timeDate <= bookedStart && currentEnd >= bookedEnd);

    if (overlap) return true;
  }

  return false;
};


  // ----------------------------------------------------------------------

  const isTimeSlotAvailable = (time: string) => {
    if (!selectedService) {
      // if no service selected, availability is false only if slot is already occupied by any booking
      return !occupiedSlots.has(time);
    }
    const service = services.find((s) => s.id === selectedService);
    if (!service) {
      return !occupiedSlots.has(time);
    }
    // both checks: not globally occupied AND not overlapping with selected service duration
    return (
      !occupiedSlots.has(time) && !isTimeSlotOccupied(time, service.duration)
    );
  };

  const isDateAvailable = (date: Date) => {
    // disable Sundays(0) and Mondays(1)
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 1) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return false;

    // compute if fully occupied
    const dateStr = format(date, "yyyy-MM-dd");
    // count unique occupied slots for that date
    if (selectedDate && format(selectedDate, "yyyy-MM-dd") === dateStr) {
      return occupiedSlots.size < TIME_SLOTS.length;
    }

    // if not the selectedDate, we could fetch bookings for that date on hover — but keep default true
    return true;
  };

  // -------------------- generateSlotsBetween & computeOccupiedSlots --------------------
  const generateSlotsBetween = (start: Date, end: Date) => {
    const slots: string[] = [];
    let cur = start;
    // keep generating slots while cur < end
    while (cur < end) {
      slots.push(format(cur, "HH:mm"));
      cur = addMinutes(cur, 30); // step 30 minutes
    }
    return slots;
  };

  const computeOccupiedSlots = () => {
    const occupied = new Set<string>();
    if (!selectedDate) {
      setOccupiedSlots(occupied);
      return;
    }
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    for (const booking of bookings) {
      if (!booking.booking_date || !booking.booking_time) continue;
      if (booking.booking_date !== dateStr) continue;

      const bookedService = services.find((s) => s.id === booking.service_id);
      if (!bookedService) continue;

      let bookingTimeClean = booking.booking_time;
      if (bookingTimeClean.length === 5) {
        bookingTimeClean = `${bookingTimeClean}:00`;
      }
      const bookedStart = parse(
        `${booking.booking_date} ${bookingTimeClean}`,
        "yyyy-MM-dd HH:mm:ss",
        new Date()
      );

      const bookedEnd = addMinutes(bookedStart, bookedService.duration);
      const slots = generateSlotsBetween(bookedStart, bookedEnd);
      for (const slot of slots) {
        occupied.add(slot);
      }
    }

    setOccupiedSlots(occupied);
  };
  // ----------------------------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Final validation to avoid race conditions: re-check availability of the selected slot
    if (selectedTime && selectedService) {
      const svc = services.find((s) => s.id === selectedService);
      if (svc && isTimeSlotOccupied(selectedTime, svc.duration)) {
        toast.error(
          "Desculpe — esse horário acabou de ser reservado. Escolha outro horário."
        );
        return;
      }
    }

    if (
      !selectedService ||
      !customerName ||
      !customerPhone ||
      !selectedDate ||
      !selectedTime
    ) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    // Prepare booking data
    const bookingData = {
      service_id: selectedService,
      customer_name: customerName,
      customer_phone: customerPhone,
      booking_date: format(selectedDate, "yyyy-MM-dd"),
      booking_time: selectedTime,
      status: "pending" as const,
      payment_status: "pending" as const,
    };

    setPendingBookingData(bookingData);
    setShowPaymentDialog(true);
  };

  const completeBooking = async (paymentStatus: "pending" | "paid") => {
    if (!pendingBookingData) return;

    setLoading(true);

    try {
      const { error } = await supabase.from("bookings").insert({
        ...pendingBookingData,
        payment_status: paymentStatus,
      });

      if (error) throw error;

      const service = services.find((s) => s.id === selectedService);
      const paymentText =
        paymentStatus === "paid"
          ? "\n\n✅ *Pagamento:* Pago via PIX"
          : "\n\n💳 *Pagamento:* Será realizado presencialmente";

      // use dynamic whatsapp number
      const formattedNumber = (whatsappNumber || "").replace(/\D/g, "");
      const message = `Olá! Gostaria de agendar:\n\n*Serviço:* ${
        service?.name
      }\n*Data:* ${format(selectedDate!, "dd/MM/yyyy", {
        locale: ptBR,
      })}\n*Horário:* ${selectedTime}\n*Nome:* ${customerName}\n*Telefone:* ${customerPhone}${paymentText}`;
      const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(
        message
      )}`;
      window.open(whatsappUrl, "_blank");

      toast.success(
        "Agendamento realizado! Você será redirecionado para o WhatsApp."
      );

      // Reset form
      setSelectedService("");
      setCustomerName("");
      setCustomerPhone("");
      setSelectedDate(undefined);
      setSelectedTime("");
      setPendingBookingData(null);

      // refresh bookings for the date to update occupied slots immediately
      if (selectedDate) {
        fetchBookings(selectedDate);
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error("Erro ao realizar agendamento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="booking" className="py-20 px-4 bg-secondary/30">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="mb-12 text-center text-4xl font-bold">
            Agende seu Horário
          </h2>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          onSubmit={handleSubmit}
          className="glass-effect rounded-2xl p-8 shadow-medium"
        >
          <div className="space-y-6">
            {/* Service Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Label htmlFor="service" className="text-base font-semibold">
                Serviço
              </Label>
              <Select
                value={selectedService}
                onValueChange={(v: string) => {
                  setSelectedService(v);
                  setSelectedTime("");
                }}
              >
                <SelectTrigger className="mt-2 h-12 border-2 hover:border-primary/40 transition-colors">
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - R$ {service.price.toFixed(2)} (
                      {formatDuration(service.duration)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>

            {/* Customer Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid gap-6 md:grid-cols-2"
            >
              <div>
                <Label htmlFor="name" className="text-base font-semibold">
                  Nome Completo
                </Label>
                <Input
                  id="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="mt-2 h-12 border-2 hover:border-primary/40 transition-colors"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-base font-semibold">
                  Telefone
                </Label>
                <Input
                  id="phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="mt-2 h-12 border-2 hover:border-primary/40 transition-colors"
                />
              </div>
            </motion.div>

            {/* Date Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <Label className="text-base font-semibold">Escolha a Data</Label>
              <div className="flex justify-center rounded-lg border-2 border-primary/20 bg-card p-4 hover:border-primary/40 transition-colors shadow-soft">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => {
                    // Desabilitar domingos e segundas
                    const dayOfWeek = date.getDay();
                    if (dayOfWeek === 0 || dayOfWeek === 1) return true;
                    // Desabilitar datas passadas
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (date < today) return true;
                    // Desabilitar datas totalmente ocupadas
                    return !isDateAvailable(date);
                  }}
                  className="rounded-md pointer-events-auto"
                  locale={ptBR}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center bg-accent/20 rounded-md py-2 px-3">
                📅 Atendimento: Terça a Sábado, 08:30 às 18:00
              </p>
            </motion.div>

            {/* Time Selection */}
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-3"
              >
                <Label className="text-base font-semibold">
                  Escolha o Horário
                </Label>
                <div className="mt-2 grid grid-cols-3 gap-2 md:grid-cols-6 lg:grid-cols-9">
                  {TIME_SLOTS.map((time) => {
                    const occupied = occupiedSlots.has(time); // global occupancy
                    const serviceSpecificBlocked = !isTimeSlotAvailable(time); // respects selected service duration
                    const available = !occupied && !serviceSpecificBlocked;

                    return (
                      <Button
                        key={time}
                        type="button"
                        variant={selectedTime === time ? "default" : "outline"}
                        disabled={!available}
                        onClick={() => setSelectedTime(time)}
                        className={`
                          transition-all hover:scale-105
                          ${
                            !available
                              ? "opacity-50 cursor-not-allowed bg-red-100 text-red-700"
                              : ""
                          }
                          ${
                            selectedTime === time
                              ? "ring-2 ring-primary ring-offset-2"
                              : ""
                          }
                        `}
                      >
                        {time}
                      </Button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Submit */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-4 pt-4"
            >
              <Button
                type="submit"
                size="lg"
                className="w-full bg-primary hover:bg-primary-dark text-primary-foreground font-semibold h-14 text-lg shadow-medium hover:shadow-strong transition-all hover:scale-[1.02]"
                disabled={loading}
              >
                {loading ? "Agendando..." : "Agendar via WhatsApp"}
              </Button>

              <div className="space-y-2 rounded-lg bg-accent/30 border-2 border-primary/10 p-4">
                <p className="text-center text-sm font-semibold text-foreground">
                  💳 Formas de Pagamento
                </p>
                <p className="text-center text-xs text-muted-foreground leading-relaxed">
                  💰 Dinheiro em espécie (presencial)
                  <br />
                  💳 Cartão de crédito/débito (presencial)
                  <br />
                  💵 PIX (pelo site ou presencial - você escolhe!)
                </p>
              </div>
            </motion.div>
          </div>
        </motion.form>

        <PaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          amount={services.find((s) => s.id === selectedService)?.price || 0}
          customerName={customerName}
          onPayNow={() => completeBooking("paid")}
          onPayLater={() => completeBooking("pending")}
        />
      </div>
    </section>
  );
};
