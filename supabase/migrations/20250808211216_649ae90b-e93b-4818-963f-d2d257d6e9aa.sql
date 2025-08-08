-- Add foreign key constraint between designations and departments
ALTER TABLE public.designations 
ADD CONSTRAINT fk_designations_department 
FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;