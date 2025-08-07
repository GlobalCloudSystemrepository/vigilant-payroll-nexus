-- Create departments table
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create designations table
CREATE TABLE public.designations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(department_id, name)
);

-- Enable Row Level Security
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designations ENABLE ROW LEVEL SECURITY;

-- Create policies for departments
CREATE POLICY "Enable all operations for departments" 
ON public.departments 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create policies for designations
CREATE POLICY "Enable all operations for designations" 
ON public.designations 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Add trigger for timestamps
CREATE TRIGGER update_departments_updated_at
BEFORE UPDATE ON public.departments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_designations_updated_at
BEFORE UPDATE ON public.designations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key columns to employees table
ALTER TABLE public.employees 
ADD COLUMN department_id UUID REFERENCES public.departments(id),
ADD COLUMN designation_id UUID REFERENCES public.designations(id);

-- Insert default departments and designations
INSERT INTO public.departments (name, description) VALUES
('Security Department', 'Security guards and supervisors'),
('Administration', 'Administrative and management roles'),
('Operations', 'Operational support roles');

INSERT INTO public.designations (department_id, name, description) 
SELECT 
  d.id,
  designation.name,
  designation.description
FROM public.departments d,
(VALUES 
  ('Security Department', 'Security Guard', 'Front-line security personnel'),
  ('Security Department', 'Senior Security Guard', 'Experienced security personnel'),
  ('Security Department', 'Security Supervisor', 'Security team supervisor'),
  ('Security Department', 'Security Manager', 'Security department manager'),
  ('Security Department', 'Material Handler', 'Material handling and logistics'),
  ('Administration', 'HR Manager', 'Human resources management'),
  ('Administration', 'Admin Executive', 'Administrative support'),
  ('Administration', 'Account Manager', 'Financial and accounting management'),
  ('Operations', 'Operations Manager', 'Operations oversight'),
  ('Operations', 'Site Coordinator', 'Site coordination and management')
) AS designation(dept_name, name, description)
WHERE d.name = designation.dept_name;