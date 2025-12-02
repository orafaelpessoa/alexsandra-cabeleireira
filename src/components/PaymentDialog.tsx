import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import QRCode from "qrcode";
import { Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  customerName: string;
  onPayNow: () => void;
  onPayLater: () => void;
}

export const PaymentDialog = ({
  open,
  onOpenChange,
  amount,
  customerName,
  onPayNow,
  onPayLater,
}: PaymentDialogProps) => {
  const [showPixCode, setShowPixCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [pixKey, setPixKey] = useState("");
  const [pixRecipientName, setPixRecipientName] = useState("");
  const [pixCity, setPixCity] = useState("João Pessoa");
  const [pixCode, setPixCode] = useState("");

  useEffect(() => {
    const fetchPixKey = async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("pix_key, pix_recipient_name, pix_city")
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching PIX settings:", error);
        toast.error("Erro ao carregar configurações PIX");
        return;
      }

      if (data?.pix_key) {
        setPixKey(data.pix_key);
        setPixRecipientName(data.pix_recipient_name || "Salao Alessandra Oliveira");
        setPixCity(data.pix_city || "João Pessoa");
      }
    };

    if (open) {
      fetchPixKey();
    }
  }, [open]);

  useEffect(() => {
    if (pixKey && amount && pixRecipientName) {
      // Helper to format EMV field: ID (2 digits) + Length (2 digits) + Value
      const formatEMV = (id: string, value: string): string => {
        const length = value.length.toString().padStart(2, '0');
        return `${id}${length}${value}`;
      };

      // Remove accents and special characters
      const removeAccents = (str: string): string => {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      };

      // Generate PIX payload (EMV format)
      const merchantName = removeAccents(pixRecipientName.substring(0, 25).toUpperCase());
      const merchantCity = removeAccents(pixCity.substring(0, 15).toUpperCase());
      const txid = `${Date.now()}`.slice(-25); // Transaction ID (max 25 chars)
      
      // Format amount with 2 decimal places
      const amountStr = amount.toFixed(2);
      
      // Build Merchant Account Information (field 26)
      const gui = formatEMV("00", "BR.GOV.BCB.PIX");
      const key = formatEMV("01", pixKey);
      const merchantAccount = formatEMV("26", gui + key);
      
      // Build Additional Data Field Template (field 62)
      const referenceLabel = formatEMV("05", txid);
      const additionalData = formatEMV("62", referenceLabel);
      
      // Build complete payload
      const payload = [
        formatEMV("00", "01"),              // Payload Format Indicator
        merchantAccount,                     // Merchant Account Information
        formatEMV("52", "0000"),            // Merchant Category Code
        formatEMV("53", "986"),             // Transaction Currency (BRL)
        formatEMV("54", amountStr),         // Transaction Amount
        formatEMV("58", "BR"),              // Country Code
        formatEMV("59", merchantName),      // Merchant Name
        formatEMV("60", merchantCity),      // Merchant City
        additionalData,                      // Additional Data Field Template
        "6304"                               // CRC16 placeholder
      ].join("");
      
      // Calculate CRC16 checksum (CCITT)
      const crc16 = (str: string): string => {
        let crc = 0xFFFF;
        for (let i = 0; i < str.length; i++) {
          crc ^= str.charCodeAt(i) << 8;
          for (let j = 0; j < 8; j++) {
            crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
          }
        }
        return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
      };
      
      const finalPayload = payload + crc16(payload);
      setPixCode(finalPayload);
    }
  }, [pixKey, amount, pixRecipientName, pixCity]);

  useEffect(() => {
    if (showPixCode) {
      QRCode.toDataURL(pixCode, { width: 300, margin: 2 })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error(err));
    }
  }, [showPixCode, pixCode]);

  const handleCopyPixCode = () => {
    if (!pixCode) {
      toast.error("Chave PIX não configurada. Entre em contato com o salão.");
      return;
    }
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    toast.success("Código PIX copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePayNow = () => {
    if (!pixKey) {
      toast.error("Chave PIX não configurada. Entre em contato com o salão.");
      return;
    }
    setShowPixCode(true);
  };

  const handleConfirmPayment = () => {
    onPayNow();
    setShowPixCode(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {!showPixCode ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Forma de Pagamento</DialogTitle>
              <DialogDescription className="text-base pt-2">
                Deseja adiantar o pagamento de <span className="font-bold text-primary">R$ {amount.toFixed(2)}</span> via PIX ou pagar presencialmente?
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 pt-4">
              <Button
                onClick={handlePayNow}
                size="lg"
                className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary-dark"
              >
                💵 Sim, pagar agora via PIX
              </Button>
              <Button
                onClick={() => {
                  onPayLater();
                  onOpenChange(false);
                }}
                variant="outline"
                size="lg"
                className="w-full h-14 text-lg font-semibold"
              >
                🏪 Não, pagar presencialmente
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Pagamento via PIX</DialogTitle>
              <DialogDescription className="text-base">
                Escaneie o QR Code ou copie o código abaixo
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              {qrCodeUrl && (
                <div className="rounded-lg border-2 border-primary/20 p-4 bg-white">
                  <img src={qrCodeUrl} alt="QR Code PIX" className="w-64 h-64" />
                </div>
              )}
              <div className="w-full space-y-2">
                <p className="text-sm font-semibold text-center">Código PIX Copia e Cola</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-md bg-muted p-3 text-xs font-mono break-all">
                    {pixCode}
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleCopyPixCode}
                    className="shrink-0"
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="w-full pt-2">
                <Button
                  onClick={handleConfirmPayment}
                  size="lg"
                  className="w-full h-12 font-semibold"
                >
                  Já realizei o pagamento
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Após realizar o pagamento, confirme acima para prosseguir com o agendamento
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
