-- First, find the highest number from existing employee IDs
-- Update all employee_id values to EMP format with proper numbering

-- Create a temporary sequence for updating
DO $$
DECLARE
    max_num INTEGER := 0;
    rec RECORD;
    counter INTEGER := 1;
BEGIN
    -- Find the highest number from all existing IDs
    FOR rec IN 
        SELECT employee_id FROM employees 
        WHERE employee_id ~ '^(EMP|E)?[0-9]+$'
        ORDER BY 
            CASE 
                WHEN employee_id ~ '^EMP[0-9]+$' THEN CAST(SUBSTRING(employee_id FROM 4) AS INTEGER)
                WHEN employee_id ~ '^E[0-9]+$' THEN CAST(SUBSTRING(employee_id FROM 2) AS INTEGER)
                ELSE CAST(employee_id AS INTEGER)
            END DESC
    LOOP
        IF rec.employee_id ~ '^EMP[0-9]+$' THEN
            max_num := GREATEST(max_num, CAST(SUBSTRING(rec.employee_id FROM 4) AS INTEGER));
        ELSIF rec.employee_id ~ '^E[0-9]+$' THEN
            max_num := GREATEST(max_num, CAST(SUBSTRING(rec.employee_id FROM 2) AS INTEGER));
        ELSE
            max_num := GREATEST(max_num, CAST(rec.employee_id AS INTEGER));
        END IF;
    END LOOP;
    
    -- Now update all employee IDs to EMP format, maintaining order by creation date
    FOR rec IN 
        SELECT id, employee_id, created_at FROM employees 
        WHERE employee_id NOT LIKE 'EMP%' OR LENGTH(employee_id) != 7
        ORDER BY created_at ASC
    LOOP
        UPDATE employees 
        SET employee_id = 'EMP' || LPAD(counter::text, 4, '0')
        WHERE id = rec.id;
        counter := counter + 1;
    END LOOP;
END $$;