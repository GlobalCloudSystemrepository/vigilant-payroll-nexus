-- Add working_days_per_month column to customers table
ALTER TABLE public.customers 
ADD COLUMN working_days_per_month integer DEFAULT 30;