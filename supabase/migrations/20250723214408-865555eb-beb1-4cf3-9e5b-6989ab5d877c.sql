
-- Add columns to attendance table for replacement tracking
ALTER TABLE public.attendance 
ADD COLUMN replacement_type text CHECK (replacement_type IN ('vendor', 'employee')),
ADD COLUMN replacement_vendor_id uuid REFERENCES public.vendors(id),
ADD COLUMN replacement_employee_id uuid REFERENCES public.employees(id),
ADD COLUMN replacement_notes text,
ADD COLUMN is_overtime boolean DEFAULT false;

-- Add a constraint to ensure only one replacement type is selected
ALTER TABLE public.attendance 
ADD CONSTRAINT check_single_replacement 
CHECK (
  (replacement_type IS NULL) OR
  (replacement_type = 'vendor' AND replacement_vendor_id IS NOT NULL AND replacement_employee_id IS NULL) OR
  (replacement_type = 'employee' AND replacement_employee_id IS NOT NULL AND replacement_vendor_id IS NULL)
);
