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
import { Upload, X } from "lucide-react";

// Validação de chave PIX
const pixKeySchema = z.string().refine(
  (value) => {
    if (!value) return true;
    const cleaned = value.replace(/[.\-/\s]/g, "");
    if (/^\d{11}$/.test(cleaned)) return true;
    if (/^\d{14}$/.test(cleaned)) return true;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return true;
    if (/^\+55\d{10,11}$/.test(cleaned)) return true;
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
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>("");

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
        setBannerPreview(data.banner_image_url || "");
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setBannerPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveBanner = () => {
    setBannerFile(null);
    setBannerPreview("");
    form.setValue("banner_image_url", "");
  };

  const uploadBanner = async (file: File): Promise<string> => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = fileName;

  const { error: uploadError } = await supabase.storage
    .from("salon-images")
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from("salon-images")
    .getPublicUrl(filePath);

  return data.publicUrl;
};


  const handleSubmit = async (values: z.infer<typeof settingsSchema>) => {
  setLoading(true);
  try {
    let bannerUrl = values.banner_image_url;

    // Se o usuário enviou um novo arquivo, faz upload e substitui a URL
    if (bannerFile) {
      bannerUrl = await uploadBanner(bannerFile);
    }

    // 1️⃣ Pega o registro existente
    const { data: existing, error: existingError } = await supabase
      .from("site_settings")
      .select("id")
      .limit(1)
      .single();

    if (existingError) throw existingError;

    // 2️⃣ Faz o UPDATE corretamente
    const { error: updateError } = await supabase
      .from("site_settings")
      .update({
        phone: values.phone,
        instagram: values.instagram,
        address: values.address,
        banner_image_url: bannerUrl || null,
        pix_key: values.pix_key || null,
        pix_recipient_name: values.pix_recipient_name || null,
        pix_city: values.pix_city || "João Pessoa",
      })
      .eq("id", existing.id);

    if (updateError) throw updateError;

    toast.success("Configurações atualizadas!");

    setBannerPreview(bannerUrl || "");
    
  } catch (error) {
    console.error("Error updating settings:", error);
    toast.error("Erro ao atualizar configurações");
  } finally {
    setLoading(false);
  }
};


  if (loading) return <p>Carregando configurações...</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações do Site</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">

            {/* Telefone */}
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

            {/* Instagram */}
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

            {/* Endereço */}
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

            {/* Banner */}
            <FormField
              control={form.control}
              name="banner_image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banner do Site</FormLabel>
                  {bannerPreview ? (
                    <div className="relative mt-2">
                      <img
                        src={bannerPreview}
                        alt="Preview do Banner"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={handleRemoveBanner}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <Input
                        id="banner"
                        type="file"
                        accept="image/*"
                        onChange={handleBannerChange}
                        className="hidden"
                      />
                      <Label
                        htmlFor="banner"
                        className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent"
                      >
                        <Upload className="h-5 w-5" />
                        <span>Clique para fazer upload</span>
                      </Label>
                    </div>
                  )}
                  <FormDescription>Deixe em branco para usar a imagem padrão</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* PIX */}
            <FormField
              control={form.control}
              name="pix_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chave PIX</FormLabel>
                  <FormControl>
                    <Input placeholder="CPF, CNPJ, email, +5583988888888 ou UUID" {...field} />
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
                  <FormDescription>Nome que aparecerá no pagamento PIX</FormDescription>
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
                  <FormDescription>Cidade do beneficiário</FormDescription>
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
