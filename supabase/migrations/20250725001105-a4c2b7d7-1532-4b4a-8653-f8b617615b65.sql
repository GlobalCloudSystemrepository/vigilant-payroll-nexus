
-- Create a table for cash advances
CREATE TABLE public.cash_advances (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL,
  amount numeric NOT NULL,
  date_requested date NOT NULL,
  date_approved date,
  status text NOT NULL DEFAULT 'pending',
  reason text,
  approved_by text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.cash_advances ENABLE ROW LEVEL SECURITY;

-- Create policy for cash advances
CREATE POLICY "Enable all operations for cash_advances" 
  ON public.cash_advances 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_cash_advances_updated_at
  BEFORE UPDATE ON public.cash_advances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
