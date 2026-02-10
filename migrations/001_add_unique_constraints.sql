-- Migration: Add unique constraints to prevent duplicate registrations

-- Add unique constraint to children table on id_number
ALTER TABLE children ADD CONSTRAINT unique_child_id_number UNIQUE (id_number);

-- Add unique constraint to pregnant_women table on id_number
ALTER TABLE pregnant_women ADD CONSTRAINT unique_pregnant_woman_id_number UNIQUE (id_number);