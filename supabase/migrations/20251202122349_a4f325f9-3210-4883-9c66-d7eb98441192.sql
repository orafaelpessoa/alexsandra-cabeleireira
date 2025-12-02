-- Add required PIX fields to site_settings table
ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS pix_recipient_name TEXT,
ADD COLUMN IF NOT EXISTS pix_city TEXT DEFAULT 'João Pessoa';

-- Add helpful comment
COMMENT ON COLUMN public.site_settings.pix_recipient_name IS 'Nome do beneficiário da chave PIX';
COMMENT ON COLUMN public.site_settings.pix_city IS 'Cidade do beneficiário para QR code PIX';