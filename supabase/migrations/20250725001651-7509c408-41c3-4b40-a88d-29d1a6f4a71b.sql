
-- Create vendor_payments table
CREATE TABLE public.vendor_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id),
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for vendor_payments
ALTER TABLE public.vendor_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for vendor_payments
CREATE POLICY "Enable read access for all users" ON public.vendor_payments FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.vendor_payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.vendor_payments FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.vendor_payments FOR DELETE USING (true);

-- Create trigger to update updated_at column
CREATE TRIGGER update_vendor_payments_updated_at
    BEFORE UPDATE ON public.vendor_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
