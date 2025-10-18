/*
  # Nursing Care Application Schema

  1. New Tables
    - `patients`
      - `id` (uuid, primary key)
      - `full_name` (text)
      - `age` (integer)
      - `medical_record` (text, unique)
      - `admission_day` (text)
      - `attention_point` (text)
      - `admission_date` (timestamptz)
      - `status` (text) - Estado del paciente
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `wound_categories`
      - `id` (uuid, primary key)
      - `name` (text) - Nombre de la categoría (Erosiones, Heridas Contusas, etc.)
      - `parent_id` (uuid) - Para categorías anidadas (Curas > Erosiones)
      - `order_index` (integer)
      - `created_at` (timestamptz)

    - `wound_records`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, foreign key)
      - `category_id` (uuid, foreign key)
      - `title` (text) - Ej: "Herida Quirúrgica"
      - `description` (text)
      - `is_planned` (boolean)
      - `status` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `wound_images`
      - `id` (uuid, primary key)
      - `wound_record_id` (uuid, foreign key)
      - `image_url` (text) - URL de la imagen en Supabase Storage
      - `thumbnail_url` (text)
      - `annotations` (jsonb) - Anotaciones de texto, formas, etc.
      - `transformations` (jsonb) - Rotaciones, recortes, etc.
      - `order_index` (integer)
      - `created_at` (timestamptz)

    - `preset_images`
      - `id` (uuid, primary key)
      - `category_id` (uuid, foreign key)
      - `name` (text)
      - `image_url` (text)
      - `thumbnail_url` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their data
*/

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  age integer,
  medical_record text UNIQUE NOT NULL,
  admission_day text,
  attention_point text,
  admission_date timestamptz DEFAULT now(),
  status text DEFAULT 'Pendiente',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create wound_categories table
CREATE TABLE IF NOT EXISTS wound_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_id uuid REFERENCES wound_categories(id) ON DELETE CASCADE,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create wound_records table
CREATE TABLE IF NOT EXISTS wound_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES wound_categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  is_planned boolean DEFAULT false,
  status text DEFAULT 'Pendiente',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create wound_images table
CREATE TABLE IF NOT EXISTS wound_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wound_record_id uuid REFERENCES wound_records(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  thumbnail_url text,
  annotations jsonb DEFAULT '[]'::jsonb,
  transformations jsonb DEFAULT '{}'::jsonb,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create preset_images table
CREATE TABLE IF NOT EXISTS preset_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES wound_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  image_url text NOT NULL,
  thumbnail_url text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE wound_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE wound_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE wound_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE preset_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patients
CREATE POLICY "Authenticated users can view patients"
  ON patients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert patients"
  ON patients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update patients"
  ON patients FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete patients"
  ON patients FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for wound_categories
CREATE POLICY "Anyone can view wound categories"
  ON wound_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage wound categories"
  ON wound_categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for wound_records
CREATE POLICY "Authenticated users can view wound records"
  ON wound_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert wound records"
  ON wound_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update wound records"
  ON wound_records FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete wound records"
  ON wound_records FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for wound_images
CREATE POLICY "Authenticated users can view wound images"
  ON wound_images FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert wound images"
  ON wound_images FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update wound images"
  ON wound_images FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete wound images"
  ON wound_images FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for preset_images
CREATE POLICY "Anyone can view preset images"
  ON preset_images FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage preset images"
  ON preset_images FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default wound categories
INSERT INTO wound_categories (name, parent_id, order_index) VALUES
  ('Curas', NULL, 1),
  ('Protocolos', NULL, 2)
ON CONFLICT DO NOTHING;

-- Get Curas category id for subcategories
DO $$
DECLARE
  curas_id uuid;
BEGIN
  SELECT id INTO curas_id FROM wound_categories WHERE name = 'Curas' AND parent_id IS NULL;
  
  IF curas_id IS NOT NULL THEN
    INSERT INTO wound_categories (name, parent_id, order_index) VALUES
      ('Erosiones', curas_id, 1),
      ('Heridas Contusas', curas_id, 2),
      ('Heridas Incisas', curas_id, 3),
      ('Quemaduras', curas_id, 4),
      ('Ulceras por decubito', curas_id, 5)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;