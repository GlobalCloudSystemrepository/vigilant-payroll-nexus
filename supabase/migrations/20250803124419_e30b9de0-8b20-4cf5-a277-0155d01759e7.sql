-- Add relieving_cost column to attendance table
ALTER TABLE public.attendance 
ADD COLUMN relieving_cost numeric DEFAULT 0;