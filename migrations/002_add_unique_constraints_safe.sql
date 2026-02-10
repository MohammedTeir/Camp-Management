-- Migration: Add unique constraints to prevent duplicate registrations

DO $$ 
BEGIN
  -- Add unique constraint to children table on id_number if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'children_id_number_unique' 
    AND table_name = 'children'
  ) THEN
    ALTER TABLE children ADD CONSTRAINT children_id_number_unique UNIQUE (id_number);
  END IF;

  -- Add unique constraint to pregnant_women table on id_number if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'pregnant_women_id_number_unique' 
    AND table_name = 'pregnant_women'
  ) THEN
    ALTER TABLE pregnant_women ADD CONSTRAINT pregnant_women_id_number_unique UNIQUE (id_number);
  END IF;
END $$;