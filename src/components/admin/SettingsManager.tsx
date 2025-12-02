import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Validação de chave PIX
const pixKeySchema = z.string().refine(
  (value) => {
    if (!value) return true; // Campo opcional
    
    // Remove espaços e caracteres especiais para validação
    const cleaned = value.replace(/[.\-/\s]/g, "");
    
    // CPF: 11 dígitos
    if (/^\d{11}$/.test(cleaned)) return true;
    
    // CNPJ: 14 dígitos
    if (/^\d{14}$/.test(cleaned)) return true;
    
    // Email
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return true;
    
    // Telefone: +55 seguido de 10 ou 11 dígitos
    if (/^\+55\d{10,11}$/.test(cleaned)) return true;
    
    // Chave aleatória: UUID format
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return true;
    
    return false;
  },
  {
    message: "Chave PIX inválida. Use CPF, CNPJ, email, telefone (+55...) ou chave aleatória (UUID)",
  }
);

const settingsSchema = z.object({
  phone: z.string().min(1, "Telefone é obrigatório"),
  instagram: z.string().min(1, "Instagram é obrigatório"),
  address: z.string().min(1, "Endereço é obrigatório"),
  banner_image_url: z.string().optional(),
  pix_key: pixKeySchema.optional(),
  pix_recipient_name: z.string().optional(),
  pix_city: z.string().optional(),
});

export const SettingsManager = () => {
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  
  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      phone: "",
      instagram: "",
      address: "",
      banner_image_url: "",
      pix_key: "",
      pix_recipient_name: "",
      pix_city: "João Pessoa",
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .limit(1)
        .single();

      if (error) throw error;
      if (data) {
        form.reset({
          phone: data.phone || "",
          instagram: data.instagram || "",
          address: data.address || "",
          banner_image_url: data.banner_image_url || "",
          pix_key: data.pix_key || "",
          pix_recipient_name: data.pix_recipient_name || "",
          pix_city: data.pix_city || "João Pessoa",
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: z.infer<typeof settingsSchema>) => {
    setLoading(true);

    try {
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .limit(1)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("site_settings")
          .update({
            phone: values.phone,
            instagram: values.instagram,
            address: values.address,
            banner_image_url: values.banner_image_url || null,
            pix_key: values.pix_key || null,
            pix_recipient_name: values.pix_recipient_name || null,
            pix_city: values.pix_city || "João Pessoa",
          })
          .eq("id", existing.id);

        if (error) throw error;
      }

      toast.success("Configurações atualizadas!");
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Erro ao atualizar configurações");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p>Carregando configurações...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações do Site</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="(00) 00000-0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instagram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram</FormLabel>
                  <FormControl>
                    <Input placeholder="@usuario" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, número - Bairro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="banner_image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da Imagem do Banner</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormDescription>
                    Deixe em branco para usar a imagem padrão
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pix_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chave PIX</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="CPF, CNPJ, email, +5583988888888 ou UUID" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Formatos aceitos: CPF (11 dígitos), CNPJ (14 dígitos), email, 
                    telefone (+55XXXXXXXXXXX) ou chave aleatória (UUID)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pix_recipient_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Beneficiário PIX</FormLabel>
                  <FormControl>
                    <Input placeholder="Seu nome completo" {...field} />
                  </FormControl>
                  <FormDescription>
                    Nome que aparecerá no pagamento PIX
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pix_city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade</FormLabel>
                  <FormControl>
                    <Input placeholder="João Pessoa" {...field} />
                  </FormControl>
                  <FormDescription>
                    Cidade do beneficiário
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
