import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Patient = {
  id: string;
  full_name: string;
  age: number | null;
  medical_record: string;
  admission_day: string | null;
  attention_point: string | null;
  admission_date: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type WoundCategory = {
  id: string;
  name: string;
  parent_id: string | null;
  order_index: number;
  created_at: string;
};

export type WoundRecord = {
  id: string;
  patient_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  is_planned: boolean;
  status: string;
  created_at: string;
  updated_at: string;
};

export type WoundImage = {
  id: string;
  wound_record_id: string;
  image_url: string;
  thumbnail_url: string | null;
  annotations: Annotation[];
  transformations: Transformations;
  order_index: number;
  created_at: string;
};

export type Annotation = {
  id: string;
  type: 'text' | 'shape' | 'draw';
  content: string;
  x: number;
  y: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  color?: string;
  rotation?: number;
};

export type Transformations = {
  rotation?: number;
  flipH?: boolean;
  flipV?: boolean;
  scale?: number;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};
