import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trash2,
  CheckCircle,
  User,
  Phone,
  Calendar,
  Clock,
  DollarSign,
} from "lucide-react";

interface Booking {
  id: string;
  customer_name: string;
  customer_phone: string;
  booking_date: string;
  booking_time: string;
  status: string;
  payment_status: string;
  notes: string | null;
  services: {
    name: string;
    price: number;
  };
}

export const BookingsManager = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModalId, setOpenModalId] = useState<string | null>(null); // ✅ controla modal aberto

  useEffect(() => {
  const fetchAndSubscribe = () => {
    fetchBookings();

    const channel = supabase
      .channel("bookings-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
        },
        () => {
          fetchBookings().catch(console.error); // captura erro da promise
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  fetchAndSubscribe();
}, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, services(name, price)")
        .order("booking_date", { ascending: false })
        .order("booking_time", { ascending: false });
      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Erro ao carregar agendamentos");
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: status as any })
        .eq("id", id);
      if (error) throw error;
      toast.success("Status atualizado!");
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const updatePaymentStatus = async (id: string, payment_status: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ payment_status: payment_status as any })
        .eq("id", id);
      if (error) throw error;
      toast.success("Status de pagamento atualizado!");
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Erro ao atualizar pagamento");
    }
  };

  const deleteBooking = async (id: string) => {
    try {
      const { error } = await supabase.from("bookings").delete().eq("id", id);
      if (error) throw error;

      toast.success("Agendamento deletado!");
      setOpenModalId(null); // ✅ fecha o modal
      fetchBookings(); // atualiza lista
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast.error("Erro ao deletar agendamento");
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default";
      case "cancelled":
        return "destructive";
      case "completed":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getPaymentStatusVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "default";
      case "refunded":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendente";
      case "confirmed":
        return "Confirmado";
      case "cancelled":
        return "Cancelado";
      case "completed":
        return "Concluído";
      default:
        return status;
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendente";
      case "paid":
        return "Pago";
      case "refunded":
        return "Reembolsado";
      default:
        return status;
    }
  };

  if (loading) return <p>Carregando agendamentos...</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Agendamentos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <p className="text-center text-muted-foreground">
              Nenhum agendamento encontrado
            </p>
          ) : (
            bookings.map((booking) => (
              <Card key={booking.id} className="hover-lift shadow-soft">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          <h3 className="font-semibold text-lg">
                            {booking.customer_name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <p className="text-sm">{booking.customer_phone}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <p className="text-sm">
                            <span className="font-medium">Serviço:</span>{" "}
                            {booking.services.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-primary" />
                          <p className="text-sm">
                            <span className="font-medium">Valor:</span> R${" "}
                            {booking.services.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <p className="text-sm">
                            {format(
                              parseISO(booking.booking_date),
                              "dd 'de' MMMM 'de' yyyy",
                              { locale: ptBR }
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <p className="text-sm">{booking.booking_time}</p>
                        </div>
                      </div>

                      {booking.notes && (
                        <div className="rounded-lg bg-muted p-3">
                          <p className="text-sm">
                            <span className="font-medium">Observações:</span>{" "}
                            {booking.notes}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant={getStatusVariant(booking.status) as any}
                        >
                          {getStatusLabel(booking.status)}
                        </Badge>
                        <Badge
                          variant={
                            getPaymentStatusVariant(
                              booking.payment_status
                            ) as any
                          }
                        >
                          {getPaymentStatusLabel(booking.payment_status)}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 md:min-w-[200px]">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                          Status do Agendamento
                        </label>
                        <Select
                          value={booking.status}
                          onValueChange={(value) =>
                            updateBookingStatus(booking.id, value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="confirmed">
                              Confirmado
                            </SelectItem>
                            <SelectItem value="cancelled">Cancelado</SelectItem>
                            <SelectItem value="completed">Concluído</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                          Status do Pagamento
                        </label>
                        <Select
                          value={booking.payment_status}
                          onValueChange={(value) =>
                            updatePaymentStatus(booking.id, value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="paid">Pago</SelectItem>
                            <SelectItem value="refunded">
                              Reembolsado
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Dialog
                        open={openModalId === booking.id}
                        onOpenChange={(open) =>
                          setOpenModalId(open ? booking.id : null)
                        }
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="gap-2 w-full"
                          >
                            <Trash2 className="h-4 w-4" />
                            Deletar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Confirmar exclusão</DialogTitle>
                            <DialogDescription>
                              Tem certeza que deseja deletar este agendamento
                              de {booking.customer_name}? Esta ação não pode
                              ser desfeita.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="destructive"
                              onClick={async () => {
                                await deleteBooking(booking.id);
                              }}
                            >
                              Confirmar Exclusão
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
