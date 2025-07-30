-- Update existing employee_id values to have EMP prefix
UPDATE employees 
SET employee_id = CASE 
  WHEN employee_id NOT LIKE 'EMP%' THEN CONCAT('EMP', LPAD(employee_id, 4, '0'))
  ELSE employee_id
END
WHERE employee_id IS NOT NULL;