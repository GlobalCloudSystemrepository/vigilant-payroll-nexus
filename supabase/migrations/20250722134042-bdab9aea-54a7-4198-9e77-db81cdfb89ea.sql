
-- Add schedule_id column to attendance table to link attendance records to specific schedules
ALTER TABLE public.attendance 
ADD COLUMN schedule_id uuid REFERENCES public.schedules(id);

-- Add foreign key constraint for employee_id in attendance table
ALTER TABLE public.attendance 
ADD CONSTRAINT fk_attendance_employee 
FOREIGN KEY (employee_id) REFERENCES public.employees(id);

-- Add foreign key constraints for schedules table
ALTER TABLE public.schedules 
ADD CONSTRAINT fk_schedules_employee 
FOREIGN KEY (employee_id) REFERENCES public.employees(id);

ALTER TABLE public.schedules 
ADD CONSTRAINT fk_schedules_customer 
FOREIGN KEY (customer_id) REFERENCES public.customers(id);
