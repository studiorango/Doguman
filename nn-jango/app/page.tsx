// app/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { Icon } from "@iconify/react";
import AuthButton from "@/components/auth/AuthButton";
import {
  supabase,
  fetchFridgeStock,
  addFridgeStockItem,
  removeFridgeStockItem,
  fetchAllRecipes,
  saveRecipe,
  updateRecipe,
  deleteRecipe,
  type FridgeStep,
  type FridgeIngredient,
} from "@/lib/fridge-db";

// 관리자 UID (비밀값 아님 — 마이그레이션 017에도 동일 값이 박혀 있음).
// env가 있으면 그 값, 없으면 내장 기본값으로 폴백해 설정 누락에도 관리자 인식이 깨지지 않게 함.
const ADMIN_USER_ID =
  process.env.NEXT_PUBLIC_ADMIN_USER_ID ?? "bfdca7d2-aca3-4e0d-a12f-057dd412c27c";

type Tab = "stock" | "recipe" | "search" | "timetable";
type Recipe = {
  id: string;
  name: string;
  source: string;
  ingredients: string[];
  ingredientItems: FridgeIngredient[];
  steps: FridgeStep[];
  totalTime: number;
  youtubeUrl: string;
  link: string;
  cuisine: string;
  pairings: string[];
  category: string;
  carbs: number | null;
  protein: number | null;
  fat: number | null;
  rating: number;
  kidFriendly: boolean;
};
type IngRow = { name: string; amount: string; unit: string; alts: string[]; altDraft: string };
type StepRow = { label: string; unit: "min" | "sec"; value: number };
type Video = { id: string; title: string; thumbnail: string; publishedAt: string };
type YtChannel = {
  channelId: string;
  channelTitle: string;
  channelThumb: string;
  subCount: string;
  videos: Video[];
  nextPageToken: string | null;
  prevPageToken: string | null;
  totalResults: number;
};

const STEP_SHADES = ["#18181B", "#3F3F46", "#52525B", "#71717A", "#A1A1AA", "#D4D4D8"];
const YT_PRESETS = ["냉부해", "승우아빠", "은수저", "육식맨", "이원일", "정호영"];
const CUISINES = ["한식", "중식", "일식", "양식", "동남아식", "인도식", "멕시코식", "미국식"];
const PAIRINGS = ["소주", "맥주", "막걸리", "청주·사케", "레드와인", "화이트와인", "하이볼", "위스키", "고량주", "논알콜"];
const UNITS = ["개", "마리", "g", "kg", "ml", "L", "큰술", "작은술", "컵", "조각", "장", "줌", "꼬집", "대", "쪽", "톨", "봉", "캔", "병", "박스", "약간"];
const CATEGORIES = ["밥요리", "면요리", "빵·베이커리", "국물요리", "고기요리", "생선·해산물", "볶음·구이", "튀김", "찜·조림", "샐러드·채소", "죽·스프", "반찬", "디저트", "음료", "기타"];

// 재료 분류 사전 (냉장고 목록·레시피 재료 체크를 종류별로 묶는 데 사용).
// 정확히 일치하는 이름만 분류하고, 없는 재료는 "기타"로.
const INGREDIENT_GROUPS: { label: string; items: string[] }[] = [
  { label: "육류", items: ["삼겹살","목살","앞다리살","뒷다리살","돼지갈비","등갈비","항정살","오겹살","족발","돼지껍데기","순대","가브리살","안심","등심","채끝","소갈비","양지","사태","홍두깨","우삼겹","꽃등심","차돌박이","곱창","대창","막창","소꼬리","부채살","토시살","업진살","치마살","닭가슴살","닭다리","닭날개","닭발","닭목","닭안심","닭볶음용","오리고기","오리훈제","닭껍질","양갈비","양고기","다짐육","돼지고기","소고기","닭고기","베이컨","햄","소시지"] },
  { label: "해산물", items: ["고등어","삼치","꽁치","전갱이","멸치","정어리","방어","참치","갈치","조기","가자미","광어","우럭","돔","연어","대구","명태","동태","황태","코다리","아귀","새우","꽃게","대게","킹크랩","랍스터","바지락","홍합","모시조개","전복","소라","굴","가리비","대합","꼬막","오징어","낙지","문어","한치","갑오징어","주꾸미","미역","다시마","김","파래","톳","어묵","게맛살","명란","연어알","날치알"] },
  { label: "채소·버섯", items: ["양파","대파","쪽파","실파","부추","상추","깻잎","시금치","아욱","근대","쑥갓","청경채","배추","양배추","봄동","얼갈이","로메인","루꼴라","바질","민트","파슬리","고수","감자","고구마","당근","무","연근","우엉","마","도라지","더덕","비트","셀러리","토란","토마토","방울토마토","오이","애호박","단호박","가지","피망","파프리카","고추","청양고추","꽈리고추","옥수수","아보카도","표고버섯","팽이버섯","새송이버섯","느타리버섯","양송이버섯","목이버섯","브로콜리","콜리플라워","아스파라거스","두릅","고사리","숙주","콩나물","완두콩","마늘","생마늘","생강"] },
  { label: "과일", items: ["레몬","라임","오렌지","귤","유자","사과","배","복숭아","포도","청포도","딸기","블루베리","바나나","파인애플","망고","키위","수박","참외","자두","체리"] },
  { label: "두부·콩제품", items: ["두부","순두부","연두부","막두부","유부","두부면","콩비지","청국장","낫토","템페","두유","콩가루"] },
  { label: "계란·유제품", items: ["계란","달걀","메추리알","우유","생크림","휘핑크림","사워크림","연유","버터","크림치즈","리코타치즈","모짜렐라치즈","체다치즈","파마산치즈","고다치즈","브리치즈","블루치즈","요거트","요구르트","치즈"] },
  { label: "면·곡물·빵", items: ["소면","중면","칼국수면","우동면","냉면면","당면","쌀국수","메밀면","라면","스파게티","파스타","쌀","현미","찹쌀","보리","귀리","밀가루","박력분","강력분","중력분","전분","옥수수전분","감자전분","빵가루","식빵","바게트","토르티야","떡","떡국떡","가래떡","라이스페이퍼"] },
  { label: "김치·절임", items: ["배추김치","김치","깍두기","총각김치","갓김치","열무김치","오이소박이","파김치","동치미","백김치","장아찌","단무지","피클","올리브"] },
  { label: "장·양념·향신료", items: ["된장","고추장","쌈장","간장","국간장","양조간장","진간장","미소","춘장","두반장","굴소스","피시소스","소금","굵은소금","설탕","황설탕","흑설탕","올리고당","물엿","매실청","꿀","참기름","들기름","고춧가루","고추씨","후추","통후추","깨","참깨","들깨","식초","사과식초","발사믹식초","올리브오일","식용유","포도씨유","마요네즈","케첩","머스터드","미림","맛술","청주","와사비","카레","커민","계피","다시다","미원"] },
  { label: "견과·건과일", items: ["아몬드","호두","피칸","캐슈넛","피스타치오","잣","은행","밤","땅콩","해바라기씨","호박씨","건포도","크랜베리","대추","곶감"] },
  { label: "주류·육수·소스", items: ["소주","맥주","막걸리","사케","화이트와인","레드와인","사골육수","닭육수","채소육수","멸치육수","가쓰오다시","치킨스톡","페스토","토마토소스","바비큐소스","데리야키소스"] },
  { label: "통조림·가공", items: ["참치캔","꽁치캔","스팸","런천미트","옥수수캔","토마토캔","홀토마토","코코넛밀크","올리브캔","콘"] },
];
const INGREDIENT_CATEGORY: Record<string, string> = {};
INGREDIENT_GROUPS.forEach((g) => g.items.forEach((it) => { INGREDIENT_CATEGORY[it] = g.label; }));
const GROUP_ORDER = [...INGREDIENT_GROUPS.map((g) => g.label), "기타"];
function categorizeIngredient(name: string): string {
  return INGREDIENT_CATEGORY[name] ?? "기타";
}
// 이름 목록을 분류별로 묶어 [{label, names}] 반환 (비어있는 분류는 제외, 지정 순서대로)
function groupIngredients(names: string[]): { label: string; names: string[] }[] {
  const map = new Map<string, string[]>();
  names.forEach((n) => {
    const c = categorizeIngredient(n);
    if (!map.has(c)) map.set(c, []);
    map.get(c)!.push(n);
  });
  return GROUP_ORDER.filter((c) => map.has(c)).map((c) => ({ label: c, names: map.get(c)! }));
}

const cardCls = "bg-white rounded-[14px] border border-zinc-200 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 mb-4";
const inputCls = "w-full bg-zinc-50 border border-zinc-200 rounded-[10px] px-3 py-2.5 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 transition-colors";
const btnPrimaryCls = "bg-zinc-900 text-white rounded-[10px] px-4 py-2.5 text-[13px] font-bold hover:bg-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed";
const btnSecondaryCls = "bg-white text-zinc-700 border border-zinc-200 rounded-[8px] px-3 py-1.5 text-[12px] font-semibold hover:border-zinc-400 transition-colors";
const btnDestructiveCls = "text-[11px] font-semibold text-zinc-400 hover:text-red-600 transition-colors";

function emptyIngRows(): IngRow[] {
  return [{ name: "", amount: "", unit: "", alts: [], altDraft: "" }];
}
function itemsToIngRows(items: FridgeIngredient[], names: string[]): IngRow[] {
  if (items.length) return items.map((it) => ({ name: it.name, amount: it.amount ?? "", unit: it.unit ?? "", alts: it.alts ?? [], altDraft: "" }));
  if (names.length) return names.map((n) => ({ name: n, amount: "", unit: "", alts: [], altDraft: "" }));
  return emptyIngRows();
}
// 냉장고에 name 또는 alts 중 하나라도 있으면 있는 것으로 판단
function itemAvailable(it: { name: string; alts?: string[] }, stockNames: Set<string>) {
  if (stockNames.has(it.name)) return true;
  return (it.alts ?? []).some((a) => stockNames.has(a));
}
// 매칭·표시에 쓸 재료 항목 (ingredient_items 우선, 없으면 이름만)
function recipeItems(r: Recipe): { name: string; amount: string; unit: string; alts: string[] }[] {
  if (r.ingredientItems.length) return r.ingredientItems.map((it) => ({ name: it.name, amount: it.amount ?? "", unit: it.unit ?? "", alts: it.alts ?? [] }));
  return r.ingredients.map((n) => ({ name: n, amount: "", unit: "", alts: [] }));
}
function emptyStepRows(): StepRow[] {
  return [{ label: "", unit: "min", value: 1 }];
}
function videoUrl(id: string) {
  return `https://youtube.com/watch?v=${id}`;
}
function toggleStepUnit(row: StepRow): StepRow {
  if (row.unit === "min") return { ...row, unit: "sec", value: Math.round(row.value * 60) };
  return { ...row, unit: "min", value: Math.max(0, Math.round(row.value / 60)) };
}
function stepRowDurMinutes(row: StepRow): number {
  return row.unit === "min" ? row.value : row.value / 60;
}
function stepsToStepRows(steps: FridgeStep[]): StepRow[] {
  if (!steps.length) return emptyStepRows();
  return steps.map((s) => {
    const totalSeconds = Math.round(s.dur * 60);
    if (totalSeconds % 60 === 0) return { label: s.label, unit: "min" as const, value: totalSeconds / 60 };
    return { label: s.label, unit: "sec" as const, value: totalSeconds };
  });
}

function matchPct(recipe: Recipe, stockNames: Set<string>) {
  const items = recipeItems(recipe);
  if (!items.length) return 0;
  const matched = items.filter((it) => itemAvailable(it, stockNames)).length;
  return Math.round((matched / items.length) * 100);
}

function PctBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-bold text-zinc-900 flex-shrink-0 min-w-[58px]">{pct}% 준비됨</span>
      <div className="flex-1 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
        <div className="h-full bg-zinc-900 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StarRating({ value, onChange, size = 28 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  const readOnly = !onChange;
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = value >= i ? 1 : value >= i - 0.5 ? 0.5 : 0;
          return (
            <div key={i} className="relative" style={{ width: size, height: size }}>
              <Icon icon="solar:star-bold" className="absolute inset-0 text-zinc-200" width={size} height={size} />
              <div className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Icon icon="solar:star-bold" className="text-zinc-900" width={size} height={size} />
              </div>
              {!readOnly && (
                <>
                  <button type="button" aria-label={`${i - 0.5}점`} onClick={() => onChange!(i - 0.5)} className="absolute left-0 top-0 w-1/2 h-full" />
                  <button type="button" aria-label={`${i}점`} onClick={() => onChange!(i)} className="absolute right-0 top-0 w-1/2 h-full" />
                </>
              )}
            </div>
          );
        })}
      </div>
      {!readOnly && value > 0 && (
        <button type="button" onClick={() => onChange!(0)} className="text-[11px] font-semibold text-zinc-400 hover:text-zinc-900 ml-1">지우기</button>
      )}
    </div>
  );
}

export default function FridgePage() {
  const [tab, setTab] = useState<Tab>("stock");
  const [userId, setUserId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [stock, setStock] = useState<string[]>([]);
  const [stockInput, setStockInput] = useState("");

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formSource, setFormSource] = useState("");
  const [formYoutubeUrl, setFormYoutubeUrl] = useState("");
  const [formLink, setFormLink] = useState("");
  const [formCuisine, setFormCuisine] = useState("");
  const [formPairings, setFormPairings] = useState<string[]>([]);
  const [formCategory, setFormCategory] = useState("");
  const [formCarbs, setFormCarbs] = useState("");
  const [formProtein, setFormProtein] = useState("");
  const [formFat, setFormFat] = useState("");
  const [formRating, setFormRating] = useState(0);
  const [formKidFriendly, setFormKidFriendly] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Recipe | null>(null);
  const [recipeError, setRecipeError] = useState("");
  const [ingRows, setIngRows] = useState<IngRow[]>(emptyIngRows());
  const [stepRows, setStepRows] = useState<StepRow[]>(emptyStepRows());
  const [focusedIngRow, setFocusedIngRow] = useState<number | null>(null);
  const [unitPickerRow, setUnitPickerRow] = useState<number | null>(null);

  const [selectedTT, setSelectedTT] = useState<Set<string>>(new Set());

  const [ytQuery, setYtQuery] = useState("");
  const [ytLoading, setYtLoading] = useState(false);
  const [ytError, setYtError] = useState("");
  const [ytChannel, setYtChannel] = useState<YtChannel | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) { setUserId(data.user.id); loadAll(); }
      else setLoaded(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) { setUserId(session.user.id); loadAll(); }
      else { setUserId(null); setStock([]); setRecipes([]); setLoaded(true); }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const loadAll = async () => {
    setRecipeError("");
    // 냉장고 재고: 개인(직접 client). 레시피: 보호 API 경유.
    try {
      const stockData = await fetchFridgeStock();
      setStock(stockData.map((s) => s.name));
    } catch { /* 재고 로드 실패는 조용히 무시 */ }
    try {
      const recipeData = await fetchAllRecipes();
      setRecipes(recipeData.map((r) => ({
        id: r.id, name: r.name, source: r.source ?? "", ingredients: r.ingredients ?? [],
        ingredientItems: r.ingredient_items ?? [],
        steps: r.steps ?? [], totalTime: r.total_time, youtubeUrl: r.youtube_url ?? "",
        link: r.link ?? "",
        cuisine: r.cuisine ?? "", pairings: r.pairing ? r.pairing.split(",").map((s) => s.trim()).filter(Boolean) : [],
        category: r.category ?? "", carbs: r.carbs, protein: r.protein, fat: r.fat,
        rating: r.rating ?? 0, kidFriendly: r.kid_friendly ?? false,
      })));
    } catch (e) {
      setRecipes([]);
      setRecipeError(e instanceof Error ? e.message : "레시피를 불러오지 못했어요.");
    }
    setLoaded(true);
  };

  const isAdmin = !!userId && userId === ADMIN_USER_ID;
  const stockNames = useMemo(() => new Set(stock), [stock]);
  const registeredUrls = useMemo(() => new Set(recipes.map((r) => r.youtubeUrl).filter(Boolean)), [recipes]);
  const stockGroups = useMemo(() => groupIngredients(stock), [stock]);

  const addStock = async () => {
    const name = stockInput.trim();
    if (!userId || !name || stockNames.has(name)) return;
    setStock((prev) => [...prev, name]);
    setStockInput("");
    await addFridgeStockItem(name);
  };

  const removeStock = async (name: string) => {
    setStock((prev) => prev.filter((n) => n !== name));
    await removeFridgeStockItem(name);
  };

  // 냉장고 탭에서 레시피 재료를 체크 → 내 냉장고에 있음/없음 토글
  const toggleStockItem = async (name: string) => {
    if (!userId) return;
    if (stockNames.has(name)) await removeStock(name);
    else {
      setStock((prev) => (prev.includes(name) ? prev : [...prev, name]));
      await addFridgeStockItem(name);
    }
  };

  // 등록된 레시피들에 쓰인 재료 이름(대체 재료 포함, 중복 제거)
  const recipeIngredientNames = useMemo(() => {
    const set = new Set<string>();
    recipes.forEach((r) => recipeItems(r).forEach((it) => {
      if (it.name) set.add(it.name);
      it.alts.forEach((a) => a && set.add(a));
    }));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ko"));
  }, [recipes]);
  const recipeIngredientGroups = useMemo(() => groupIngredients(recipeIngredientNames), [recipeIngredientNames]);

  const resetExtraFields = () => {
    setFormCategory(""); setFormCarbs(""); setFormProtein(""); setFormFat("");
    setFormRating(0); setFormKidFriendly(false);
  };
  const numToStr = (n: number | null) => (n === null || n === undefined ? "" : String(n));

  const openNewForm = () => {
    setEditingId(null);
    setFormName(""); setFormSource(""); setFormYoutubeUrl(""); setFormLink("");
    setFormCuisine(""); setFormPairings([]);
    resetExtraFields();
    setIngRows(emptyIngRows()); setStepRows(emptyStepRows());
    setShowForm(true);
  };

  const openEditForm = (r: Recipe) => {
    setEditingId(r.id);
    setFormName(r.name); setFormSource(r.source); setFormYoutubeUrl(r.youtubeUrl || ""); setFormLink(r.link || "");
    setFormCuisine(r.cuisine || ""); setFormPairings(r.pairings ?? []);
    setFormCategory(r.category || ""); setFormCarbs(numToStr(r.carbs)); setFormProtein(numToStr(r.protein)); setFormFat(numToStr(r.fat));
    setFormRating(r.rating || 0); setFormKidFriendly(r.kidFriendly || false);
    setIngRows(itemsToIngRows(r.ingredientItems, r.ingredients));
    setStepRows(stepsToStepRows(r.steps));
    setShowForm(true);
  };

  const openFormFromVideo = (v: Video, channelTitle: string) => {
    setEditingId(null);
    setFormName(v.title); setFormSource(channelTitle); setFormYoutubeUrl(videoUrl(v.id)); setFormLink("");
    setFormCuisine(""); setFormPairings([]);
    resetExtraFields();
    setIngRows(emptyIngRows()); setStepRows(emptyStepRows());
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingId(null); setFocusedIngRow(null); setUnitPickerRow(null); };

  const submitForm = async () => {
    if (!userId || !formName.trim() || submitting) return; // 중복 클릭 방지
    setSubmitting(true);
    const ingredientItems: FridgeIngredient[] = ingRows
      .filter((r) => r.name.trim())
      .map((r) => {
        const alts = r.alts.map((a) => a.trim()).filter(Boolean);
        return { name: r.name.trim(), amount: r.amount.trim(), unit: r.unit, ...(alts.length ? { alts } : {}) };
      });
    const ingredients = ingredientItems.map((it) => it.name);
    const steps: FridgeStep[] = stepRows
      .filter((r) => r.label.trim())
      .map((r) => ({ label: r.label.trim(), dur: stepRowDurMinutes(r) }));
    const totalTime = Math.round(steps.reduce((sum, s) => sum + s.dur, 0));
    const youtubeUrl = formYoutubeUrl.trim() || null;
    const link = formLink.trim() || null;
    const cuisine = formCuisine || null;
    const pairing = formPairings.length ? formPairings.join(",") : null;
    const category = formCategory || null;
    const parseNum = (s: string) => { const n = parseFloat(s); return isNaN(n) ? null : n; };
    const carbs = parseNum(formCarbs);
    const protein = parseNum(formProtein);
    const fat = parseNum(formFat);
    const rating = formRating > 0 ? formRating : null;
    const kidFriendly = formKidFriendly;
    const payload = { name: formName.trim(), source: formSource.trim() || null, ingredients, ingredient_items: ingredientItems, steps, total_time: totalTime, youtube_url: youtubeUrl, link, cuisine, pairing, category, carbs, protein, fat, rating, kid_friendly: kidFriendly };

    try {
      if (editingId) {
        await updateRecipe(editingId, payload);
        setRecipes((prev) => prev.map((r) => r.id === editingId
          ? { ...r, name: payload.name, source: payload.source ?? "", ingredients, ingredientItems, steps, totalTime, youtubeUrl: youtubeUrl ?? "", link: link ?? "", cuisine: cuisine ?? "", pairings: [...formPairings], category: category ?? "", carbs, protein, fat, rating: rating ?? 0, kidFriendly }
          : r));
      } else {
        const saved = await saveRecipe(payload);
        setRecipes((prev) => [{ id: saved.id, name: saved.name, source: saved.source ?? "", ingredients, ingredientItems, steps, totalTime, youtubeUrl: saved.youtube_url ?? "", link: saved.link ?? "", cuisine: saved.cuisine ?? "", pairings: saved.pairing ? saved.pairing.split(",").map((s) => s.trim()).filter(Boolean) : [], category: saved.category ?? "", carbs: saved.carbs, protein: saved.protein, fat: saved.fat, rating: saved.rating ?? 0, kidFriendly: saved.kid_friendly ?? false }, ...prev]);
      }
      closeForm();
    } catch (e) {
      alert(e instanceof Error ? e.message : "저장에 실패했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  const removeRecipe = async (id: string) => {
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    setSelectedTT((prev) => { const next = new Set(prev); next.delete(id); return next; });
    await deleteRecipe(id);
  };

  const toggleTT = (id: string) => {
    setSelectedTT((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const searchChannel = async () => {
    if (!ytQuery.trim()) return;
    setYtLoading(true); setYtError(""); setYtChannel(null);
    try {
      const res = await fetch("/api/search-channel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: ytQuery }) });
      const data = await res.json();
      if (data.error) setYtError(data.error);
      else setYtChannel(data);
    } catch {
      setYtError("검색 실패. 다시 시도해주세요.");
    } finally {
      setYtLoading(false);
    }
  };

  const pageChannel = async (pageToken: string | null) => {
    if (!pageToken || !ytChannel) return;
    setYtLoading(true);
    try {
      const res = await fetch("/api/search-channel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channelId: ytChannel.channelId, pageToken }) });
      const data = await res.json();
      if (!data.error) setYtChannel({ ...data, channelTitle: ytChannel.channelTitle, channelThumb: ytChannel.channelThumb, subCount: ytChannel.subCount });
    } finally {
      setYtLoading(false);
    }
  };

  const ttRecipes = recipes.filter((r) => selectedTT.has(r.id) && r.totalTime > 0);
  const maxTime = ttRecipes.length ? Math.max(...ttRecipes.map((r) => r.totalTime)) : 0;

  // 유튜버 검색은 등록용이라 관리자에게만 노출
  const tabDef: { key: Tab; label: string; desc: string }[] = [
    { key: "stock", label: "냉장고", desc: "재고 관리" },
    { key: "recipe", label: "레시피", desc: isAdmin ? "등록 & 매칭" : "레시피 보기" },
    ...(isAdmin ? [{ key: "search" as Tab, label: "유튜버 검색", desc: "영상에서 등록" }] : []),
    { key: "timetable", label: "타임테이블", desc: "동시 완성 계획" },
  ];

  return (
    <div className="min-h-[100dvh] bg-zinc-50">
      <header
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-[12px] border-b border-zinc-200"
      >
        <div className="max-w-[720px] mx-auto px-5 h-14 flex items-center justify-between">
          <span className="text-[15px] font-bold tracking-tight text-zinc-900">냉장고 정리</span>
          <AuthButton />
        </div>
      </header>

      <main className="max-w-[720px] mx-auto px-5 pb-20 pt-6">
        <h1 className="text-[20px] font-extrabold tracking-tight text-zinc-900 break-keep mb-1">냉장고 레시피 관리</h1>
        <p className="text-[13px] text-zinc-500 break-keep mb-5">재고를 등록하고, 만들 수 있는 레시피를 확인하고, 동시에 완성할 타임테이블을 짜보세요.</p>

        {!userId && loaded && (
          <div className="mb-5 p-3 bg-zinc-100 border border-zinc-200 rounded-[10px] flex items-center gap-2">
            <Icon icon="solar:lock-keyhole-linear" className="text-zinc-500 flex-shrink-0" width={16} />
            <p className="text-[12px] font-semibold text-zinc-600 break-keep">로그인하면 냉장고와 레시피를 저장할 수 있어요.</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mb-6">
          {tabDef.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="text-center rounded-[14px] py-5 px-3 border-2 transition-all duration-150"
              style={{
                background: tab === t.key ? "#18181B" : "#fff",
                borderColor: tab === t.key ? "#18181B" : "#E4E4E7",
              }}
            >
              <div className="text-[14px] font-bold tracking-tight" style={{ color: tab === t.key ? "#fff" : "#18181B" }}>{t.label}</div>
              <div className="text-[11px] mt-1" style={{ color: tab === t.key ? "rgba(255,255,255,0.6)" : "#A1A1AA" }}>{t.desc}</div>
            </button>
          ))}
        </div>

        {tab === "stock" && (
          <div>
            <div className={cardCls}>
              <p className="text-[11px] font-bold text-zinc-400 tracking-wider mb-3">재료 추가</p>
              <div className="flex gap-2">
                <input
                  className={inputCls}
                  placeholder={userId ? "재료명 입력 후 Enter" : "로그인 후 사용 가능"}
                  disabled={!userId}
                  value={stockInput}
                  onChange={(e) => setStockInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addStock()}
                />
                <button onClick={addStock} disabled={!userId} className={btnPrimaryCls}>추가</button>
              </div>
            </div>
            {recipeIngredientGroups.length > 0 && (
              <div className={cardCls}>
                <p className="text-[11px] font-bold text-zinc-400 tracking-wider mb-1">레시피 재료 체크</p>
                <p className="text-[12px] text-zinc-400 break-keep mb-3">레시피에 쓰인 재료예요. 가지고 있는 것을 체크하면 내 냉장고에 담겨요.</p>
                <div className="flex flex-col gap-3">
                  {recipeIngredientGroups.map((g) => (
                    <div key={g.label}>
                      <p className="text-[11px] font-bold text-zinc-500 mb-1.5">{g.label}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {g.names.map((name) => {
                          const has = stockNames.has(name);
                          return (
                            <button
                              key={name}
                              onClick={() => toggleStockItem(name)}
                              disabled={!userId}
                              className={`inline-flex items-center gap-1.5 rounded-full pl-2.5 pr-3 py-1 text-[12px] font-semibold border transition-colors disabled:opacity-40 ${has ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"}`}
                            >
                              <span className={`w-4 h-4 rounded-[5px] border flex items-center justify-center flex-shrink-0 ${has ? "bg-white border-white" : "border-zinc-300"}`}>
                                {has && <Icon icon="solar:check-read-linear" className="text-zinc-900" width={11} />}
                              </span>
                              {name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className={cardCls}>
              <p className="text-[11px] font-bold text-zinc-400 tracking-wider mb-3">냉장고 목록 ({stock.length})</p>
              {stock.length === 0 ? (
                <p className="text-[12px] text-zinc-400 break-keep">아직 등록된 재료가 없어요.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {stockGroups.map((g) => (
                    <div key={g.label}>
                      <p className="text-[11px] font-bold text-zinc-500 mb-1.5">{g.label}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {g.names.map((name) => (
                          <div key={name} className="flex items-center gap-1 bg-zinc-100 border border-zinc-200 rounded-full pl-3 pr-1 py-1">
                            <span className="text-[12px] font-semibold text-zinc-900">{name}</span>
                            <button
                              onClick={() => removeStock(name)}
                              className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
                            >✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "recipe" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-extrabold text-zinc-900">{isAdmin ? "레시피 관리" : "레시피"} ({recipes.length})</h2>
              {isAdmin && (
                <button onClick={openNewForm} className={btnPrimaryCls}>+ 레시피 등록</button>
              )}
            </div>

            {!userId ? (
              <div className={cardCls}>
                <p className="text-[13px] text-zinc-500 break-keep">로그인하면 레시피를 볼 수 있어요.</p>
              </div>
            ) : recipeError ? (
              <div className={cardCls}>
                <p className="text-[13px] text-zinc-600 break-keep mb-3">{recipeError}</p>
                <button onClick={loadAll} className={btnSecondaryCls}>다시 시도</button>
              </div>
            ) : recipes.length === 0 ? (
              <div className="text-center py-16 text-[13px] text-zinc-400 break-keep">아직 등록된 레시피가 없어요.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {recipes.map((r) => {
                  const pct = matchPct(r, stockNames);
                  return (
                    <div key={r.id} className={cardCls}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-[14px] font-bold text-zinc-900">{r.name}</p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            {r.source ? `${r.source} · ` : ""}{r.totalTime > 0 ? `${r.totalTime}분` : "시간 미정"}
                          </p>
                          {r.rating > 0 && (
                            <div className="mt-1"><StarRating value={r.rating} size={14} /></div>
                          )}
                          <div className="flex gap-2">
                            {r.youtubeUrl && (
                              <a href={r.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-zinc-400 hover:text-zinc-900 hover:underline">
                                영상 보기
                              </a>
                            )}
                            {r.link && (
                              <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-[11px] text-zinc-400 hover:text-zinc-900 hover:underline">
                                링크 열기
                              </a>
                            )}
                          </div>
                        </div>
                        {isAdmin && (
                          <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => openEditForm(r)} className={btnSecondaryCls}>수정</button>
                            <button onClick={() => setDeleteTarget(r)} className={btnDestructiveCls}>삭제</button>
                          </div>
                        )}
                      </div>
                      <PctBar pct={pct} />
                      {(r.cuisine || r.category || r.pairings.length > 0 || r.kidFriendly) && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {r.cuisine && (
                            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">{r.cuisine}</span>
                          )}
                          {r.category && (
                            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">{r.category}</span>
                          )}
                          {r.pairings.map((p) => (
                            <span key={p} className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
                              <Icon icon="solar:wineglass-linear" width={12} />{p}
                            </span>
                          ))}
                          {r.kidFriendly && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-zinc-900 text-white">
                              <Icon icon="solar:smile-circle-linear" width={12} />아이 가능
                            </span>
                          )}
                        </div>
                      )}
                      {(r.carbs !== null || r.protein !== null || r.fat !== null) && (
                        <p className="text-[11px] text-zinc-400 mt-2">
                          {[r.carbs !== null && `탄 ${r.carbs}g`, r.protein !== null && `단 ${r.protein}g`, r.fat !== null && `지 ${r.fat}g`].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      {r.ingredients.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {recipeItems(r).map((it, idx) => {
                            const qty = [it.amount, it.unit].filter(Boolean).join(" ");
                            const label = it.alts.length ? `${it.name} 또는 ${it.alts.join(", ")}` : it.name;
                            return (
                              <span
                                key={`${it.name}-${idx}`}
                                className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                                style={itemAvailable(it, stockNames)
                                  ? { background: "#18181B", color: "#fff" }
                                  : { background: "#F4F4F5", color: "#A1A1AA" }}
                              >{label}{qty ? ` ${qty}` : ""}</span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "search" && (
          <div>
            <div className={cardCls}>
              <p className="text-[11px] font-bold text-zinc-400 tracking-wider mb-3">유튜버 이름 검색</p>
              <div className="flex gap-2 mb-3">
                <input
                  className={inputCls}
                  placeholder="예: 육식맨, 승우아빠"
                  value={ytQuery}
                  onChange={(e) => setYtQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") searchChannel(); }}
                />
                <button onClick={searchChannel} disabled={ytLoading || !ytQuery.trim()} className={btnPrimaryCls}>
                  {ytLoading ? "검색 중..." : "검색"}
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {YT_PRESETS.map((name) => (
                  <button
                    key={name}
                    onClick={() => setYtQuery(name)}
                    className="text-[11px] font-semibold px-3 py-1 rounded-full border border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-zinc-400 hover:text-zinc-900 transition-colors"
                  >{name}</button>
                ))}
              </div>
              {ytError && <p className="mt-2 text-[11px] text-red-600">{ytError}</p>}
            </div>

            {ytChannel && (
              <div className={cardCls}>
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-zinc-100">
                  {ytChannel.channelThumb && <img src={ytChannel.channelThumb} alt="" className="w-10 h-10 rounded-full object-cover" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-zinc-900">{ytChannel.channelTitle}</p>
                    <p className="text-[11px] text-zinc-400">{ytChannel.subCount} · 최근 영상 {ytChannel.videos.length}개</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {ytChannel.videos.map((v) => {
                    const registered = registeredUrls.has(videoUrl(v.id));
                    return (
                      <div key={v.id} className="flex items-center gap-3 p-2 rounded-[10px] border border-zinc-200">
                        <img src={v.thumbnail} alt="" className="w-[100px] h-[56px] rounded-[6px] object-cover bg-zinc-100 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-zinc-900 leading-tight line-clamp-2 break-keep mb-1">{v.title}</p>
                          <p className="text-[11px] text-zinc-400 mb-0.5">{v.publishedAt}</p>
                          <a href={videoUrl(v.id)} target="_blank" rel="noopener noreferrer" className="text-[11px] text-zinc-500 hover:underline">
                            {videoUrl(v.id)}
                          </a>
                        </div>
                        {registered ? (
                          <span className="text-[11px] font-bold text-zinc-400 px-3 py-2 flex-shrink-0 whitespace-nowrap">이미 등록됨</span>
                        ) : (
                          <button
                            onClick={() => openFormFromVideo(v, ytChannel.channelTitle)}
                            disabled={!userId}
                            className={`${btnPrimaryCls} flex-shrink-0 text-[12px] py-2 whitespace-nowrap`}
                          >레시피 등록</button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-100">
                  <button disabled={!ytChannel.prevPageToken || ytLoading} onClick={() => pageChannel(ytChannel.prevPageToken)} className={`${btnSecondaryCls} disabled:opacity-30`}>← 이전</button>
                  <span className="text-[11px] font-semibold text-zinc-400">영상 총 {ytChannel.totalResults.toLocaleString()}개</span>
                  <button disabled={!ytChannel.nextPageToken || ytLoading} onClick={() => pageChannel(ytChannel.nextPageToken)} className={`${btnSecondaryCls} disabled:opacity-30`}>다음 →</button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "timetable" && (
          <div>
            <div className={cardCls}>
              <p className="text-[11px] font-bold text-zinc-400 tracking-wider mb-3">동시에 완성할 레시피 선택</p>
              {recipes.length === 0 ? (
                <p className="text-[12px] text-zinc-400 break-keep">먼저 레시피를 등록해주세요.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {recipes.map((r) => (
                    <label key={r.id} className="flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox" checked={selectedTT.has(r.id)} onChange={() => toggleTT(r.id)} className="w-4 h-4 accent-zinc-900" />
                      <span className="text-[13px] font-semibold text-zinc-900">{r.name}</span>
                      <span className="text-[11px] text-zinc-400">{r.totalTime > 0 ? `${r.totalTime}분` : "단계 없음"}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {ttRecipes.length > 0 && (
              <div className={cardCls}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[11px] font-bold text-zinc-400 tracking-wider">타임테이블 (총 {maxTime}분에 동시 완성)</p>
                </div>
                <div className="flex flex-col gap-4">
                  {ttRecipes.map((r) => {
                    const offset = maxTime - r.totalTime;
                    let cursor = 0;
                    return (
                      <div key={r.id}>
                        <p className="text-[12px] font-bold text-zinc-900 mb-1.5">{r.name}</p>
                        <div className="relative h-6 bg-zinc-100 rounded-[6px] overflow-hidden">
                          {r.steps.map((s, i) => {
                            const left = ((offset + cursor) / maxTime) * 100;
                            const width = (s.dur / maxTime) * 100;
                            cursor += s.dur;
                            return (
                              <div
                                key={i}
                                title={`${s.label} (${s.dur}분)`}
                                className="absolute top-0 h-full flex items-center justify-center overflow-hidden"
                                style={{ left: `${left}%`, width: `${width}%`, background: STEP_SHADES[i % STEP_SHADES.length] }}
                              >
                                <span className="text-[9px] font-semibold text-white px-1 truncate">{s.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-zinc-400">0분 (지금 시작)</span>
                  <span className="text-[10px] text-zinc-400">{maxTime}분 (동시 완성)</span>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/48">
          <div
            className="flex min-h-full items-start sm:items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) closeForm(); }}
          >
            <div className="bg-white rounded-[16px] w-full max-w-[480px] my-8 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[15px] font-bold text-zinc-900">{editingId ? "레시피 수정" : "새 레시피"}</p>
              <button onClick={closeForm} className="text-zinc-400 hover:text-zinc-900 text-[18px] leading-none">✕</button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-[11px] font-semibold text-zinc-500 mb-1">이름 *</p>
                <input className={inputCls} placeholder="예: 된장찌개" value={formName} onChange={(e) => setFormName(e.target.value)} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-zinc-500 mb-1">출처 (선택)</p>
                <input className={inputCls} placeholder="예: 육식맨, 승우아빠" value={formSource} onChange={(e) => setFormSource(e.target.value)} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-zinc-500 mb-1">링크 (선택)</p>
                <input className={inputCls} placeholder="예: https://blog.naver.com/..." inputMode="url" value={formLink} onChange={(e) => setFormLink(e.target.value)} />
              </div>
              {formYoutubeUrl && (
                <a href={formYoutubeUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-zinc-500 hover:underline break-all">
                  연결된 영상: {formYoutubeUrl}
                </a>
              )}
              <div>
                <p className="text-[11px] font-semibold text-zinc-500 mb-1">재료 (냉장고에 등록된 재료가 아래에 자동으로 추천돼요)</p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => { setIngRows((prev) => [...prev, { name: "", amount: "", unit: "", alts: [], altDraft: "" }]); setFocusedIngRow(null); setUnitPickerRow(null); }}
                    className={`${btnSecondaryCls} self-start`}
                  >+ 재료 추가</button>
                  {ingRows.map((row, i) => {
                    const query = row.name.trim();
                    const suggestions = focusedIngRow === i && query
                      ? stock.filter((s) => s.includes(query) && s !== query)
                      : [];
                    return (
                      <div key={i} className="flex flex-col gap-1.5 p-2.5 rounded-[10px] border border-zinc-200">
                        <div className="flex gap-2 items-start">
                          <div className="relative flex-1">
                            <input
                              className={inputCls}
                              placeholder="재료명"
                              value={row.name}
                              onFocus={() => setFocusedIngRow(i)}
                              onBlur={() => setTimeout(() => setFocusedIngRow((prev) => (prev === i ? null : prev)), 150)}
                              onChange={(e) => setIngRows((prev) => prev.map((r, idx) => idx === i ? { ...r, name: e.target.value } : r))}
                            />
                            {suggestions.length > 0 && (
                              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-zinc-200 rounded-[8px] shadow-md z-20 max-h-[160px] overflow-y-auto">
                                {suggestions.map((s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                      setIngRows((prev) => prev.map((r, idx) => idx === i ? { ...r, name: s } : r));
                                      setFocusedIngRow(null);
                                    }}
                                    className="block w-full text-left px-3 py-2 text-[12px] text-zinc-900 hover:bg-zinc-100"
                                  >{s}</button>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => setIngRows((prev) => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev)}
                            className={`${btnDestructiveCls} py-2.5`}
                          >삭제</button>
                        </div>
                        <div className="flex gap-2 items-center">
                          <div className="w-[90px] flex-shrink-0">
                            <input
                              className={inputCls}
                              placeholder="수량"
                              value={row.amount}
                              onChange={(e) => setIngRows((prev) => prev.map((r, idx) => idx === i ? { ...r, amount: e.target.value } : r))}
                            />
                          </div>
                          <div className="relative flex-1">
                            <button
                              type="button"
                              onClick={() => setUnitPickerRow((prev) => (prev === i ? null : i))}
                              className={`w-full text-left bg-zinc-50 border rounded-[10px] px-3 py-2.5 text-[13px] transition-colors ${row.unit ? "text-zinc-900 border-zinc-300" : "text-zinc-400 border-zinc-200"} ${unitPickerRow === i ? "border-zinc-900 bg-white" : ""}`}
                            >{row.unit || "단위 선택"}</button>
                            {unitPickerRow === i && (
                              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-zinc-200 rounded-[10px] shadow-md z-20 p-2 flex flex-wrap gap-1.5">
                                {UNITS.map((u) => {
                                  const sel = row.unit === u;
                                  return (
                                    <button
                                      key={u}
                                      type="button"
                                      onClick={() => {
                                        setIngRows((prev) => prev.map((r, idx) => idx === i ? { ...r, unit: sel ? "" : u } : r));
                                        setUnitPickerRow(null);
                                      }}
                                      className={`px-2.5 py-1 rounded-full text-[12px] font-semibold border transition-colors ${sel ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"}`}
                                    >{u}</button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                        {/* 또는(대체 재료) — 냉장고에 이 중 하나만 있어도 있는 것으로 인정 */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-zinc-400">또는</span>
                          {row.alts.map((alt, ai) => (
                            <span key={`${alt}-${ai}`} className="inline-flex items-center gap-1 bg-zinc-100 border border-zinc-200 rounded-full pl-2.5 pr-1 py-0.5">
                              <span className="text-[12px] font-semibold text-zinc-700">{alt}</span>
                              <button
                                type="button"
                                onClick={() => setIngRows((prev) => prev.map((r, idx) => idx === i ? { ...r, alts: r.alts.filter((_, k) => k !== ai) } : r))}
                                className="w-[16px] h-[16px] rounded-full flex items-center justify-center text-[9px] font-bold text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
                              >✕</button>
                            </span>
                          ))}
                          <input
                            className="flex-1 min-w-[90px] bg-zinc-50 border border-zinc-200 rounded-[8px] px-2.5 py-1.5 text-[12px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 transition-colors"
                            placeholder="대체 재료 입력 후 Enter"
                            value={row.altDraft}
                            onChange={(e) => setIngRows((prev) => prev.map((r, idx) => idx === i ? { ...r, altDraft: e.target.value } : r))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                setIngRows((prev) => prev.map((r, idx) => {
                                  if (idx !== i) return r;
                                  const v = r.altDraft.trim();
                                  if (!v || r.alts.includes(v) || v === r.name.trim()) return { ...r, altDraft: "" };
                                  return { ...r, alts: [...r.alts, v], altDraft: "" };
                                }));
                              }
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-zinc-500 mb-1">조리 단계</p>
                <div className="flex flex-col gap-2">
                  {stepRows.map((row, i) => (
                    <div key={i} className="flex flex-col gap-2 p-2.5 rounded-[10px] border border-zinc-200">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-zinc-100 border border-zinc-200 rounded-[8px] p-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => row.unit !== "min" && setStepRows((prev) => prev.map((r, idx) => idx === i ? toggleStepUnit(r) : r))}
                            className={`px-2 py-1 rounded-[6px] text-[11px] font-bold transition-colors ${row.unit === "min" ? "bg-zinc-900 text-white" : "text-zinc-500"}`}
                          >분</button>
                          <button
                            type="button"
                            onClick={() => row.unit !== "sec" && setStepRows((prev) => prev.map((r, idx) => idx === i ? toggleStepUnit(r) : r))}
                            className={`px-2 py-1 rounded-[6px] text-[11px] font-bold transition-colors ${row.unit === "sec" ? "bg-zinc-900 text-white" : "text-zinc-500"}`}
                          >초</button>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => setStepRows((prev) => prev.map((r, idx) => idx === i ? { ...r, value: Math.max(0, r.value - (r.unit === "min" ? 1 : 10)) } : r))}
                            className="w-7 h-7 rounded-full border border-zinc-200 text-zinc-600 text-[14px] font-bold hover:border-zinc-400 transition-colors"
                          >−</button>
                          <span className="text-[13px] font-bold text-zinc-900 w-[52px] text-center">{row.value}{row.unit === "min" ? "분" : "초"}</span>
                          <button
                            type="button"
                            onClick={() => setStepRows((prev) => prev.map((r, idx) => idx === i ? { ...r, value: r.value + (r.unit === "min" ? 1 : 10) } : r))}
                            className="w-7 h-7 rounded-full border border-zinc-200 text-zinc-600 text-[14px] font-bold hover:border-zinc-400 transition-colors"
                          >+</button>
                        </div>
                        <button
                          onClick={() => setStepRows((prev) => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev)}
                          className={`${btnDestructiveCls} ml-auto`}
                        >삭제</button>
                      </div>
                      <input
                        className={inputCls}
                        placeholder="조리 과정 (예: 재료 볶기)"
                        value={row.label}
                        onChange={(e) => setStepRows((prev) => prev.map((r, idx) => idx === i ? { ...r, label: e.target.value } : r))}
                      />
                    </div>
                  ))}
                  <button onClick={() => setStepRows((prev) => [...prev, { label: "", unit: "min", value: 1 }])} className={`${btnSecondaryCls} self-start`}>+ 단계 추가</button>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-zinc-500 mb-1.5">요리 종류</p>
                <div className="flex flex-wrap gap-1.5">
                  {CUISINES.map((c) => {
                    const sel = formCuisine === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFormCuisine((prev) => (prev === c ? "" : c))}
                        className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-colors ${sel ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"}`}
                      >{c}</button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-zinc-500 mb-1.5">카테고리</p>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((c) => {
                    const sel = formCategory === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFormCategory((prev) => (prev === c ? "" : c))}
                        className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-colors ${sel ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"}`}
                      >{c}</button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-zinc-500 mb-1.5">페어링 술 (여러 개 선택 가능)</p>
                <div className="flex flex-wrap gap-1.5">
                  {PAIRINGS.map((p) => {
                    const sel = formPairings.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormPairings((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))}
                        className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-colors ${sel ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"}`}
                      >{p}</button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-zinc-500 mb-1.5">영양성분 (선택 · g 단위)</p>
                <div className="flex gap-2">
                  {([
                    ["탄수화물", formCarbs, setFormCarbs],
                    ["단백질", formProtein, setFormProtein],
                    ["지방", formFat, setFormFat],
                  ] as const).map(([label, val, setter]) => (
                    <div key={label} className="flex-1">
                      <p className="text-[10px] font-semibold text-zinc-400 mb-1 text-center">{label}</p>
                      <input
                        className={`${inputCls} text-center`}
                        placeholder="0"
                        inputMode="decimal"
                        value={val}
                        onChange={(e) => setter(e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-zinc-500 mb-1.5">별점</p>
                <StarRating value={formRating} onChange={setFormRating} />
              </div>
              <button
                type="button"
                onClick={() => setFormKidFriendly((p) => !p)}
                className="flex items-center gap-2.5"
              >
                <span className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center flex-shrink-0 transition-colors ${formKidFriendly ? "bg-zinc-900 border-zinc-900" : "border-zinc-300"}`}>
                  {formKidFriendly && <Icon icon="solar:check-read-linear" className="text-white" width={13} />}
                </span>
                <span className="text-[13px] font-semibold text-zinc-700">아이도 먹을 수 있는 음식</span>
              </button>
              <div className="flex gap-2 mt-1">
                <button onClick={submitForm} disabled={!formName.trim() || submitting} className={`${btnPrimaryCls} flex-1`}>{submitting ? "저장 중..." : editingId ? "수정 저장" : "등록"}</button>
                <button onClick={closeForm} disabled={submitting} className={`${btnSecondaryCls} px-5`}>취소</button>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/48 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null); }}
        >
          <div className="bg-white rounded-[16px] w-full max-w-[320px] p-5 shadow-xl">
            <p className="text-[15px] font-bold text-zinc-900 mb-1">레시피를 삭제할까요?</p>
            <p className="text-[13px] text-zinc-500 break-keep mb-4">&ldquo;{deleteTarget.name}&rdquo; 레시피가 삭제돼요. 되돌릴 수 없어요.</p>
            <div className="flex gap-2">
              <button
                onClick={() => { const t = deleteTarget; setDeleteTarget(null); if (t) removeRecipe(t.id); }}
                className={`${btnPrimaryCls} flex-1`}
              >예, 삭제</button>
              <button onClick={() => setDeleteTarget(null)} className={`${btnSecondaryCls} px-5`}>취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
