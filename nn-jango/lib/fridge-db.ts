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
export type FridgeIngredient = { name: string; amount: string; unit: string };

export type DbFridgeRecipe = {
  id: string;
  user_id: string;
  name: string;
  source: string | null;
  ingredients: string[];
  ingredient_items: FridgeIngredient[];
  steps: FridgeStep[];
  total_time: number;
  youtube_url: string | null;
  link: string | null;
  cuisine: string | null;
  pairing: string | null;
  category: string | null;
  carbs: number | null;
  protein: number | null;
  fat: number | null;
  rating: number | null;
  kid_friendly: boolean;
  created_at: string;
};

// 읽기 API(/api/public-recipes)가 반환하는 안전한 필드만 (user_id 제외)
export type RecipeView = Omit<DbFridgeRecipe, "user_id">;

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

// 읽기: 로그인 + rate limit + service_role이 걸린 서버 API로만 (직접 테이블 조회 X = 크롤링 방어)
// 관리자 레시피 전체를 페이지 끝까지 모아 반환.
export async function fetchAllRecipes(): Promise<RecipeView[]> {
  const all: RecipeView[] = [];
  for (let page = 0; page < 40; page++) { // 안전 상한
    const res = await fetch(`/api/public-recipes?page=${page}`, { cache: "no-store" });
    if (res.status === 401) throw new Error("로그인이 필요해요.");
    if (res.status === 429) throw new Error("요청이 너무 많아요. 잠시 후 다시 시도해주세요.");
    if (!res.ok) throw new Error("불러오기에 실패했어요.");
    const data = await res.json();
    all.push(...((data.recipes ?? []) as RecipeView[]));
    if (!data.hasMore) break;
  }
  return all;
}

// 쓰기: 직접 client + RLS (관리자만 통과)
export async function saveRecipe(recipe: {
  name: string;
  source: string | null;
  ingredients: string[];
  ingredient_items?: FridgeIngredient[];
  steps: FridgeStep[];
  total_time: number;
  youtube_url?: string | null;
  link?: string | null;
  cuisine?: string | null;
  pairing?: string | null;
  category?: string | null;
  carbs?: number | null;
  protein?: number | null;
  fat?: number | null;
  rating?: number | null;
  kid_friendly?: boolean;
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
  ingredient_items: FridgeIngredient[];
  steps: FridgeStep[];
  total_time: number;
  youtube_url: string | null;
  link: string | null;
  cuisine: string | null;
  pairing: string | null;
  category: string | null;
  carbs: number | null;
  protein: number | null;
  fat: number | null;
  rating: number | null;
  kid_friendly: boolean;
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
