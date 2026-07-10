// lib/fridge-db.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export { supabase };

// =====================
// 타입
// =====================
export type FridgeStep = { label: string; dur: number };

export type DbFridgeRecipe = {
  id: string;
  user_id: string;
  name: string;
  source: string | null;
  ingredients: string[];
  steps: FridgeStep[];
  total_time: number;
  youtube_url: string | null;
  cuisine: string | null;
  pairing: string | null;
  created_at: string;
};

export type DbFridgeStockItem = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

// =====================
// 냉장고 재고
// =====================

export async function fetchFridgeStock() {
  const { data, error } = await supabase
    .from('fridge_stock')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as DbFridgeStockItem[];
}

export async function addFridgeStockItem(name: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인 필요');
  const { error } = await supabase
    .from('fridge_stock')
    .insert({ user_id: user.id, name });
  if (error && error.code !== '23505') throw error; // 중복 무시
}

export async function removeFridgeStockItem(name: string) {
  const { error } = await supabase
    .from('fridge_stock')
    .delete()
    .eq('name', name);
  if (error) throw error;
}

// =====================
// 레시피
// =====================

export async function fetchMyRecipes() {
  const { data, error } = await supabase
    .from('fridge_recipes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as DbFridgeRecipe[];
}

export async function saveRecipe(recipe: {
  name: string;
  source: string | null;
  ingredients: string[];
  steps: FridgeStep[];
  total_time: number;
  youtube_url?: string | null;
  cuisine?: string | null;
  pairing?: string | null;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인 필요');
  const { data, error } = await supabase
    .from('fridge_recipes')
    .insert({ ...recipe, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data as DbFridgeRecipe;
}

export async function updateRecipe(id: string, patch: Partial<{
  name: string;
  source: string | null;
  ingredients: string[];
  steps: FridgeStep[];
  total_time: number;
  youtube_url: string | null;
  cuisine: string | null;
  pairing: string | null;
}>) {
  const { error } = await supabase
    .from('fridge_recipes')
    .update(patch)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteRecipe(id: string) {
  const { error } = await supabase
    .from('fridge_recipes')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
