// lib/recipegerator-db.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export { supabase };

// =====================
// 타입
// =====================
export type DbRecipe = {
  id: string;
  user_id: string | null;
  name: string;
  source: string;
  time: number;
  cuisine: string;
  thumbnail?: string;
  youtube_url?: string;
  rating: number;
  ingredients: string[];
  ingredient_texts: string[];
  ingredient_alts: Record<string, string[]>;
  steps: { label: string; dur: number; color: string }[];
  is_public: boolean;
  original_recipe_id?: string;
  created_at: string;
};

export type DbFridge = {
  id: string;
  user_id: string;
  name: string;
};

export type DbRecipeRequest = {
  id: string;
  user_id: string;
  youtuber_name: string;
  recipe_name: string;
  message: string;
  status: 'pending' | 'done' | 'rejected';
  created_at: string;
};

// =====================
// 레시피
// =====================

// 공개 레시피 불러오기 (민제 큐레이션)
export async function fetchPublicRecipes(cuisine?: string) {
  let query = supabase
    .from('recipes')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false });
  if (cuisine && cuisine !== '전체') query = query.eq('cuisine', cuisine);
  const { data, error } = await query;
  if (error) throw error;
  return data as DbRecipe[];
}

// 내 레시피 불러오기
export async function fetchMyRecipes() {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as DbRecipe[];
}

// 레시피 저장
export async function saveRecipe(recipe: Omit<DbRecipe, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('recipes')
    .insert(recipe)
    .select()
    .single();
  if (error) throw error;
  return data as DbRecipe;
}

// 레시피 수정
export async function updateRecipe(id: string, patch: Partial<DbRecipe>) {
  const { error } = await supabase
    .from('recipes')
    .update(patch)
    .eq('id', id);
  if (error) throw error;
}

// 레시피 삭제
export async function deleteRecipe(id: string) {
  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// 공개 레시피 복사 → 내 레시피로
export async function copyPublicRecipe(recipe: DbRecipe, userId: string) {
  const { data, error } = await supabase
    .from('recipes')
    .insert({
      user_id: userId,
      name: recipe.name,
      source: recipe.source,
      time: recipe.time,
      cuisine: recipe.cuisine,
      thumbnail: recipe.thumbnail,
      youtube_url: recipe.youtube_url,
      rating: 0,
      ingredients: recipe.ingredients,
      ingredient_texts: recipe.ingredient_texts,
      ingredient_alts: recipe.ingredient_alts,
      steps: recipe.steps,
      is_public: false,
      original_recipe_id: recipe.id,
    })
    .select()
    .single();
  if (error) throw error;
  return data as DbRecipe;
}

// =====================
// 냉장고
// =====================

export async function fetchFridge() {
  const { data, error } = await supabase
    .from('fridges')
    .select('name')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(d => d.name) as string[];
}

export async function addFridgeItem(name: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인 필요');
  const { error } = await supabase
    .from('fridges')
    .insert({ user_id: user.id, name });
  if (error && error.code !== '23505') throw error; // 중복 무시
}

export async function removeFridgeItem(name: string) {
  const { error } = await supabase
    .from('fridges')
    .delete()
    .eq('name', name);
  if (error) throw error;
}

// =====================
// 요청
// =====================

export async function submitRecipeRequest(req: {
  youtuber_name: string;
  recipe_name: string;
  message: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('recipe_requests')
    .insert({ ...req, user_id: user?.id });
  if (error) throw error;
}

// 관리자용: 요청 목록
export async function fetchAllRequests() {
  const { data, error } = await supabase
    .from('recipe_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as DbRecipeRequest[];
}

export async function updateRequestStatus(id: string, status: 'done' | 'rejected') {
  const { error } = await supabase
    .from('recipe_requests')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}
