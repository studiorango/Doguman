// app/recipegerator/page.tsx
"use client";

import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import AuthButton from "@/components/auth/AuthButton";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type FridgeItem = { name: string };
type Step = { label: string; dur: number; color: string };
type Recipe = { id: number; name: string; source: string; time: number; ingredients: string[]; ingredientTexts?: string[]; ingredientAlts?: Record<string, string[]>; steps: Step[]; cuisine: string; thumbnail?: string; youtubeUrl?: string; dbId?: string };
type NavPage = "fridge" | "recipe" | "timetable" | "youtuber" | "pending";
type SortOrder = "default" | "pct_desc" | "pct_asc" | "time_asc";
type IngRow = { text: string; alts?: string[] };
type StepRow = { label: string; dur: string };
type RecipeDraft = {
  draftId: number;
  name: string; source: string; time: string; cuisine: string;
  ingRows: IngRow[]; stepRows: StepRow[];
  rawIngText: string; ingError: string;
  thumbnail: string; youtubeUrl: string;
  ytUrl: string; ytLoading: boolean; ytError: string;
  isPublic: boolean;
};

const COOKING_STEPS_DB = {
  '기본 손질': [
    {name:'재료 계량', dur:3}, {name:'재료 세척', dur:3}, {name:'재료 손질', dur:10},
    {name:'고기 핏물 제거', dur:20}, {name:'고기 밑간', dur:10}, {name:'재료 해동', dur:30},
    {name:'고기 숙성', dur:60}, {name:'채소 절이기', dur:15}, {name:'데치기', dur:3},
    {name:'반죽 휴지', dur:30}, {name:'불린 재료 준비', dur:60},
  ],
  '볶음': [
    {name:'팬 달구기', dur:2}, {name:'향 내기', dur:3}, {name:'재료 볶기', dur:5},
    {name:'센불 볶기', dur:3}, {name:'약불 볶기', dur:10}, {name:'고기 볶기', dur:8},
    {name:'채소 볶기', dur:5}, {name:'소스 볶기', dur:3}, {name:'달걀 볶기', dur:3},
  ],
  '끓임·찜': [
    {name:'물 끓이기', dur:5}, {name:'육수 내기', dur:30}, {name:'재료 투하', dur:2},
    {name:'센불 끓이기', dur:5}, {name:'중불 끓이기', dur:15}, {name:'약불 끓이기', dur:20},
    {name:'졸이기', dur:15}, {name:'찌기', dur:20}, {name:'면 삶기', dur:5},
    {name:'블랜칭', dur:2}, {name:'뚜껑 덮고 끓이기', dur:10},
  ],
  '굽기': [
    {name:'오븐 예열', dur:10}, {name:'앞면 굽기', dur:5}, {name:'뒷면 굽기', dur:5},
    {name:'앞뒤 굽기', dur:10}, {name:'오븐 굽기', dur:25}, {name:'에어프라이어', dur:15},
    {name:'석쇠 굽기', dur:10}, {name:'겉면 굽기', dur:5}, {name:'저온 조리', dur:60},
  ],
  '튀기기': [
    {name:'기름 예열', dur:5}, {name:'튀김옷 입히기', dur:5}, {name:'튀기기', dur:10},
    {name:'에어프라이 튀기기', dur:15}, {name:'기름 빼기', dur:3},
  ],
  '소스·양념': [
    {name:'양념장 만들기', dur:5}, {name:'간 맞추기', dur:3}, {name:'소스 끓이기', dur:5},
    {name:'버무리기', dur:3}, {name:'마리네이드', dur:30}, {name:'드레싱 만들기', dur:3},
  ],
  '마무리': [
    {name:'불 끄기', dur:1}, {name:'식히기', dur:10}, {name:'담기', dur:3},
    {name:'고명 올리기', dur:2}, {name:'레스팅', dur:5}, {name:'냉장 보관', dur:120},
    {name:'플레이팅', dur:5},
  ],
  '서양식': [
    {name:'디글레이징', dur:3}, {name:'소테', dur:5}, {name:'브레이징', dur:60},
    {name:'시어링', dur:3}, {name:'블랑시르', dur:2}, {name:'리듀싱', dur:10},
    {name:'마운팅', dur:3}, {name:'베이스팅', dur:5}, {name:'플람베', dur:2},
    {name:'스칼로핀', dur:5}, {name:'콩피', dur:90}, {name:'수비드', dur:120},
    {name:'에멀시파이', dur:5},
  ],
  '중식': [
    {name:'웍 달구기', dur:2}, {name:'폭채', dur:3}, {name:'홍소', dur:30},
    {name:'청증', dur:15}, {name:'과유', dur:10}, {name:'고류', dur:5},
    {name:'파기름 내기', dur:3}, {name:'마라 볶기', dur:5}, {name:'전분 밑작업', dur:5},
    {name:'화조 볶기', dur:3},
  ],
  '일식': [
    {name:'다시 내기', dur:20}, {name:'미소 풀기', dur:2}, {name:'데리야끼 소스 졸이기', dur:5},
    {name:'스야끼', dur:5}, {name:'쓰유 만들기', dur:5}, {name:'튀김옷 만들기', dur:3},
    {name:'아게다시', dur:10}, {name:'가라아게 밑간', dur:15}, {name:'야끼도리 굽기', dur:10},
    {name:'샤브샤브', dur:3}, {name:'타레 바르기', dur:2}, {name:'오시즈시 압착', dur:10},
  ],
};

const CUISINE_COLORS: Record<string, string> = {
  '한식': '#2D6A4F', '일식': '#1A5E5E', '중식': '#B5541A',
  '미국': '#1B4F8A', '스페인': '#8C1C1C', '이탈리안': '#7B3558',
  '프렌치': '#4A3F7B', '기타 양식': '#4A6FA5', '동남아': '#5B8A6E',
  '멕시칸': '#A0622A', '인도': '#7C4A03', '기타': '#888888',
};

const STEP_COLORS = ['#4A7362','#3E5878','#7A6040','#6B5480','#3D7A7A','#7A4A42'];
const CUISINES = ['전체','한식','일식','중식','미국','스페인','이탈리안','프렌치','기타 양식','동남아','멕시칸','인도','기타'];

const PRESET: Record<string, string[]> = {
  '돼지고기': ['삼겹살','목살','앞다리살','뒷다리살','돼지갈비','등갈비','항정살','오겹살','족발','돼지껍데기','순대','돼지간','돼지내장','돼지귀','돼지볼살','가브리살','돼지볼기살'],
  '소고기': ['안심','등심','채끝','소갈비','양지','사태','홍두깨','우삼겹','꽃등심','차돌박이','소혀','소간','곱창','대창','막창','소꼬리','부채살','토시살','업진살','치마살','보섭살'],
  '닭·오리': ['닭가슴살','닭다리','닭날개','닭발','닭목','닭안심','닭볶음용','오리고기','오리훈제','닭껍질','반계탕용닭','닭모래집'],
  '양고기': ['양갈비','양어깨살','양등심','양다리살','양목살','양가슴살','양내장','양볼살','양꼬치용','랙오브램','양어깨통구이용','양고기민스','양족','머튼'],
  '채소·잎채소': ['양파','대파','쪽파','실파','부추','상추','깻잎','시금치','아욱','근대','쑥갓','청경채','배추','양배추','봄동','얼갈이','로메인','루꼴라','바질','민트','파슬리','딜','타임','로즈마리','고수','차이브','세이지','오레가노','라벤더','방풍나물','돌나물','취나물'],
  '채소·뿌리·구근': ['감자','고구마','당근','무','연근','우엉','마','생강','강황','도라지','더덕','비트','셀러리악','파스닙','토란','여주','돼지감자','콜라비','루타바가'],
  '채소·과채': ['토마토','방울토마토','오이','애호박','단호박','가지','피망','파프리카','고추','청고추','홍고추','꽈리고추','청양고추','옥수수','아보카도','주키니','할라피뇨','포블라노','세라노','오크라','아티초크'],
  '채소·버섯': ['표고버섯','팽이버섯','새송이버섯','느타리버섯','양송이버섯','송이버섯','목이버섯','석이버섯','만가닥버섯','노루궁뎅이버섯','트러플','포르치니','샹트렐','마이타케','시메지'],
  '채소·콩류': ['브로콜리','콜리플라워','아스파라거스','두릅','고사리','숙주','콩나물','새싹채소','완두콩','강낭콩','병아리콩','렌틸콩','에다마메','리마빈','블랙빈','핀토빈','납작완두','풋콩'],
  '채소·기타': ['셀러리','회향','라디치오','벨기에치커리','엔다이브','마카','코코넛','죽순','고구마순','워터크레스','케일','차드','근대줄기'],
  '두부·콩제품': ['두부','순두부','연두부','막두부','유부','두부면','콩비지','청국장','낫토','템페','두유','콩가루','유부초밥용유부'],
  '해산물·등푸른생선': ['고등어','삼치','청어','꽁치','전갱이','멸치','정어리','방어','참다랑어','황다랑어','가다랑어','볼락'],
  '해산물·흰살생선': ['갈치','조기','홍어','가자미','광어','우럭','돔','연어','대구','명태','동태','황태','코다리','아귀','아나고','넙치','도미','참돔','민어','병어'],
  '해산물·갑각류': ['새우','꽃게','대게','킹크랩','랍스터','가재','홍가리비','딱총새우','기름새우','보리새우','중하','대하'],
  '해산물·조개': ['바지락','홍합','모시조개','전복','소라','굴','가리비','대합','꼬막','피조개','오분자기','맛조개','키조개'],
  '해산물·연체': ['오징어','낙지','문어','한치','꼴뚜기','갑오징어','주꾸미'],
  '해산물·기타': ['해삼','멍게','미더덕','성게','해파리','미역','다시마','김','파래','톳','한천','어묵','게맛살','명란','연어알','날치알','가자미알','청어알'],
  '김치·절임': ['배추김치','깍두기','총각김치','갓김치','열무김치','오이소박이','파김치','부추김치','동치미','백김치','장아찌','단무지','피클','올리브절임','케이퍼','반건시','깻잎장아찌','마늘장아찌','고추장아찌'],
  '장류·발효': ['된장','고추장','쌈장','간장','국간장','양조간장','진간장','미소(흰)','미소(적)','미소(혼합)','춘장','두반장','해선장','굴소스','XO소스','피시소스','남플라','쌈바소스','칠리소스','스리라차','새우젓','멸치젓','황석어젓','조기젓','어간장','해황','다시다','미원','후리카케'],
  '식초': ['식초','현미식초','사과식초','쌀식초','발사믹식초','레드와인식초','화이트와인식초','샴페인식초','셰리식초','무화과식초','폰즈','유자폰즈'],
  // ★ 고추씨 추가
  '양념·한식': ['소금','굵은소금','천일염','죽염','설탕','황설탕','흑설탕','올리고당','물엿','매실청','꿀','참기름','들기름','고춧가루','고추씨','후추','통후추','산초가루','초피가루','겨자','참깨','들깨','들깻가루'],
  '양념·일식·중식': ['미림','맛술','청주','사케','시치미','와사비','가쓰오부시','곤부','화쟈오','팔각','오향분','노추','라유','마라소스','두시','샤오싱주','흑식초'],
  '양념·양식': ['올리브오일','엑스트라버진올리브오일','버터','포도씨유','아보카도오일','코코넛오일','참깨오일','우스터소스','타바스코','케첩','마요네즈','홀그레인머스터드','디종머스터드','토마토페이스트','앤초비페이스트','트러플오일','헤이즐넛오일','호두오일'],
  '향신료·허브': ['마늘','생마늘','마늘분말','양파분말','파프리카파우더','훈제파프리카','커민','커민씨','고수씨','카레파우더','강황분말','계피','시나몬스틱','넛맥','정향','카다몸','바닐라빈','바닐라에센스','사프란','아니스','펜넬씨','캐러웨이씨','주니퍼베리','올스파이스','그린카다몸','블랙카다몸','갈랑갈','레몬그라스','카피르라임잎','판단잎'],
  '유제품': ['우유','저지방우유','귀리우유','아몬드밀크','두유(유제품대안)','생크림','휘핑크림','사워크림','크렘프레슈','연유','아이스크림','버터밀크'],
  '치즈': ['크림치즈','리코타치즈','모짜렐라치즈','체다치즈','파마산치즈','페코리노','고다치즈','에멘탈치즈','그뤼에르치즈','까망베르치즈','브리치즈','블루치즈','고르곤졸라','할루미','부라타','스트링치즈','코티지치즈','마스카포네','퐁당','망고치즈'],
  '계란·가금류알': ['계란','메추리알','오리알','거위알','칠면조알'],
  '면류·파스타': ['소면','중면','굵은면','칼국수면','우동면','냉면면','당면','쌀국수','메밀면','라면','짜파게티','스파게티','페투치네','리가토니','펜네','파르팔레','오레키에테','링귀네','라자냐','뇨키','라멘면','소바','우동','히야무기','소멘','비훈','쌀면','녹두면'],
  '곡류·전분': ['쌀','현미','찹쌀','흑미','보리','귀리','퀴노아','기장','수수','율무','밀가루','박력분','강력분','중력분','통밀가루','쌀가루','찹쌀가루','전분','옥수수전분','타피오카전분','감자전분','아라로트전분','빵가루','세몰리나','폴렌타','오트밀','아마란스'],
  '빵·베이킹': ['식빵','바게트','치아바타','포카치아','피타빵','난','토르티야','핫케이크가루','베이킹파우더','베이킹소다','이스트','드라이이스트','제빵개량제'],
  '견과류·씨앗': ['아몬드','아몬드버터','호두','피칸','마카다미아','캐슈넛','캐슈버터','피스타치오','헤이즐넛','잣','은행','밤','땅콩','땅콩버터','해바라기씨','호박씨','참깨','들깨','아마씨','치아씨','대마씨','파인너트','브라질너트','코코넛채','코코넛분말'],
  '과일·건과일': ['레몬','라임','오렌지','그레이프프루트','유자','귤','청포도','적포도','사과','배','복숭아','자두','살구','체리','블루베리','라즈베리','딸기','바나나','파인애플','망고','파파야','패션프루트','건포도','크랜베리(건)','살구(건)','무화과(건)','대추','곶감'],
  '주류·조리용': ['청주','미림','맛술','사케','소주','맥주','막걸리','화이트와인','레드와인','스파클링와인','로제와인','코냑','브랜디','럼','다크럼','데킬라','버번','위스키','진','보드카','샴페인','마르살라와인','포트와인','셰리','압생트','그라파'],
  '육수·스톡': ['사골육수','닭육수','채소육수','멸치다시마육수','가쓰오다시','콘소메','치킨스톡큐브','소고기스톡큐브','채소스톡큐브','굴다시'],
  '소스·드레싱': ['스테이크소스','바비큐소스','허니머스터드','발사믹글레이즈','데리야키소스','폰즈소스','참깨드레싱','시저드레싱','랜치드레싱','이탈리안드레싱','천사채소스','오로라소스','홀란다이즈소스','베샤멜소스','피카타소스','페스토','타프나드','차트니','살사','과카몰리','훔무스','타히니','하리사','롬메스코','아이올리','타르타르소스','레물라드','그리비쉬'],
  '통조림·가공': ['참치캔','꽁치캔','정어리캔','연어캔','스팸','런천미트','콘비프','황도캔','백도캔','파인애플캔','체리캔','망고캔','옥수수캔','강낭콩캔','토마토캔','홀토마토','토마토소스','코코넛밀크','코코넛크림','앤초비캔','올리브캔','아티초크캔','자이언트빈캔','팥캔','녹두캔','사골곰탕캔','전복죽캔'],
};

const INGREDIENT_CATEGORY: Record<string, string> = {};
for (const [cat, items] of Object.entries(PRESET)) {
  for (const item of items) INGREDIENT_CATEGORY[item] = cat;
}

const UNIT_RE = /[\d/.~]+\s*(?:kg|g|ml|l|L|개|대|장|컵|밥숟갈|테이블스푼|큰술|작은술|조각|단|뿌리|알|통|봉|캔|팩|병|마리|포기|움큼|꼬집|그램|리터|cc|모|줌|묶음|쪽|인분|tsp|tbsp).*/i;
function extractIngName(text: string): string {
  const orSplit = text.split(/\s+(?:혹은|또는|or)\s+|\s*\/\s*/);
  const first = orSplit[0].trim();
  return first.replace(UNIT_RE, '').replace(/\s*\(.*?\)/g, '').replace(/https?:\S*/g, '').trim();
}

const INITIAL_FRIDGE: FridgeItem[] = [];
const INITIAL_RECIPES: Recipe[] = [];

function PctBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? '#4A7362' : pct >= 50 ? '#F59E0B' : '#F94239';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      <span style={{ fontSize:11, fontWeight:700, color, flexShrink:0, minWidth:52 }}>{pct}% 준비됨</span>
      <div style={{ flex:1, height:4, background:'#F0F0F2', borderRadius:3, overflow:'hidden' }}>
        <div style={{ height:'100%', borderRadius:3, background:color, width:`${pct}%`, transition:'width .3s' }} />
      </div>
    </div>
  );
}

const cardCls  = "bg-white rounded-[16px] border border-[#EAE7E2] shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-5 mb-4";
const inputCls = "w-full bg-[#F5F5F5] border border-[#EAE7E2] rounded-[10px] px-3 py-2.5 text-[13px] text-[#1A1A1A] font-[inherit] focus:outline-none focus:bg-white focus:border-[#1A1A1A] transition-colors";
const btnCls   = "text-white border-none rounded-[10px] px-4 py-2.5 text-[13px] font-bold cursor-pointer font-[inherit] transition-colors";
const btnSmCls = "bg-white text-[#555] border border-[#EAE7E2] rounded-[8px] px-3 py-1.5 text-[12px] font-semibold cursor-pointer font-[inherit] hover:border-[#A8C9B8] transition-colors";

let _draftCounter = 0;
function newDraft(): RecipeDraft {
  return {
    draftId: ++_draftCounter,
    name: '', source: '', time: '', cuisine: '한식',
    ingRows: [{ text: '' }], stepRows: [{ label: '', dur: '' }],
    rawIngText: '', ingError: '',
    thumbnail: '', youtubeUrl: '', ytUrl: '', ytLoading: false, ytError: '',
    isPublic: false,
  };
}


function AdminRequests({ supabase }: { supabase: any }) {
  const [reqs, setReqs] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.from('recipe_requests').select('*').order('created_at', { ascending: false })
      .then(({ data }: any) => { if (data) setReqs(data); setLoaded(true); });
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('recipe_requests').update({ status }).eq('id', id);
    setReqs(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  if (!loaded) return <p className="text-[12px] text-[#B0A99F]">불러오는 중...</p>;
  if (reqs.length === 0) return <p className="text-[12px] text-[#B0A99F]">요청이 없어요.</p>;

  return (
    <div>
      <p className="text-[11px] font-bold text-[#B0A99F] tracking-wider mb-3">🔑 관리자 — 레시피 요청 목록</p>
      <div className="flex flex-col gap-2">
        {reqs.map(r => (
          <div key={r.id} className="p-3 rounded-[10px] border border-[#EAE7E2] bg-[#FAF9F7]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[13px] font-bold text-[#1A1A1A]">{r.youtuber_name} — {r.recipe_name}</p>
                {r.message && <p className="text-[11px] text-[#888888] mt-0.5">{r.message}</p>}
                <p className="text-[10px] text-[#B0A99F] mt-1">{new Date(r.created_at).toLocaleDateString('ko-KR')}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${r.status === 'pending' ? 'bg-[#FFF8E6] text-[#B45309]' : r.status === 'done' ? 'bg-[#ECF2EE] text-[#4A7362]' : 'bg-[#FFF5F5] text-[#F94239]'}`}>
                {r.status === 'pending' ? '대기' : r.status === 'done' ? '완료' : '거절'}
              </span>
            </div>
            {r.status === 'pending' && (
              <div className="flex gap-2 mt-2">
                <button onClick={() => updateStatus(r.id, 'done')}
                  className="flex-1 py-1 rounded-[6px] text-[11px] font-bold bg-[#ECF2EE] text-[#4A7362] hover:bg-[#A8C9B8] transition-colors">
                  등록 완료
                </button>
                <button onClick={() => updateStatus(r.id, 'rejected')}
                  className="flex-1 py-1 rounded-[6px] text-[11px] font-bold bg-[#FFF5F5] text-[#F94239] hover:bg-[#FFCCC7] transition-colors">
                  거절
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RecipegeratorPage() {
  const [page, setPage] = useState<NavPage>('fridge');
  const [fridge, setFridge] = useState<FridgeItem[]>(INITIAL_FRIDGE);
  const [recipes, setRecipes] = useState<Recipe[]>(INITIAL_RECIPES);
  const [nextId, setNextId] = useState(10);
  const [selectedTT, setSelectedTT] = useState<number[]>([]);
  const [ttBuilt, setTtBuilt] = useState(false);
  const [fiName, setFiName] = useState('');
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [drafts, setDrafts] = useState<RecipeDraft[]>([newDraft()]);
  const [editingId, setEditingId] = useState<number|null>(null);
  const [userId, setUserId] = useState<string|null>(null);
  const isAdmin = userId === process.env.NEXT_PUBLIC_ADMIN_USER_ID;
  const [dbLoaded, setDbLoaded] = useState(false);

  // ★ PRESET에 없는 재료 동적 추가용
  const [extraPreset, setExtraPreset] = useState<Record<string, string[]>>({});

  // mergedPreset = PRESET + extraPreset 합산
  const mergedPreset = useMemo(() => {
    const merged: Record<string, string[]> = { ...PRESET };
    for (const [cat, items] of Object.entries(extraPreset)) {
      const existing = merged[cat] ?? [];
      merged[cat] = [...existing, ...items.filter(x => !existing.includes(x))];
    }
    return merged;
  }, [extraPreset]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) { setUserId(data.user.id); loadFromDb(data.user.id); }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) { setUserId(session.user.id); loadFromDb(session.user.id); }
      else { setUserId(null); setFridge([]); setRecipes([]); setDbLoaded(false); }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const loadFromDb = async (uid: string) => {
    const { data: fridgeData } = await supabase.from('fridges').select('name').eq('user_id', uid).order('created_at');
    if (fridgeData?.length) setFridge(fridgeData.map(d => ({ name: d.name })));
    const { data: recipeData } = await supabase.from('recipes').select('*').eq('user_id', uid).order('created_at');
    if (recipeData?.length) {
      setRecipes(recipeData.map((r, i) => ({
        id: i + 1, name: r.name, source: r.source, time: r.time, cuisine: r.cuisine,
        thumbnail: r.thumbnail, youtubeUrl: r.youtube_url,
        ingredients: r.ingredients ?? [], ingredientTexts: r.ingredient_texts ?? [],
        ingredientAlts: r.ingredient_alts ?? {}, steps: r.steps ?? [], dbId: r.id,
      })));
      setNextId(recipeData.length + 1);
    }
    setDbLoaded(true);
  };

  const updateDraft = (draftId: number, patch: Partial<RecipeDraft>) =>
    setDrafts(prev => prev.map(d => d.draftId === draftId ? { ...d, ...patch } : d));
  const [openMenuId, setOpenMenuId] = useState<number|null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [recipeSubTab, setRecipeSubTab] = useState<'my'|'browse'|'request'>('my');
  const [publicRecipes, setPublicRecipes] = useState<Recipe[]>([]);
  const [publicLoading, setPublicLoading] = useState(false);
  const [requestForm, setRequestForm] = useState({ youtuber: '', recipe: '', message: '' });
  const [requestSent, setRequestSent] = useState(false);
  const [cuisineFilter, setCuisineFilter] = useState('전체');
  const [sortOrder, setSortOrder] = useState<SortOrder>('default');

  const fridgeNames = useMemo(() => new Set(fridge.map(f => f.name)), [fridge]);

  const ingAvailable = (ing: string, r: Recipe) => {
    if (fridgeNames.has(ing)) return 'has';
    const alts = r.ingredientAlts?.[ing] ?? [];
    if (alts.some(a => fridgeNames.has(a))) return 'alt';
    return 'none';
  };

  const matchPct = (r: Recipe) => {
    if (!r.ingredients.length) return 0;
    const matched = r.ingredients.filter(i => ingAvailable(i, r) !== 'none').length;
    return Math.round(matched / r.ingredients.length * 100);
  };
  const makeableCount = recipes.filter(r => matchPct(r) >= 80).length;

  const filteredSortedRecipes = useMemo(() => {
    let list = recipes.filter(r => cuisineFilter === '전체' || r.cuisine === cuisineFilter);
    if (sortOrder === 'pct_desc') list = [...list].sort((a, b) => matchPct(b) - matchPct(a));
    else if (sortOrder === 'pct_asc') list = [...list].sort((a, b) => matchPct(a) - matchPct(b));
    else if (sortOrder === 'time_asc') list = [...list].sort((a, b) => a.time - b.time);
    return list;
  }, [recipes, cuisineFilter, sortOrder, fridgeNames]);

  const addManual = async () => {
    if (!userId) { alert('로그인이 필요해요.'); return; }
    if (!fiName.trim() || fridgeNames.has(fiName.trim())) return;
    const name = fiName.trim();
    setFridge(prev => [...prev, { name }]);
    setFiName('');
    await supabase.from('fridges').insert({ user_id: userId, name });
  };

  const addChecked = async () => {
    if (!userId) { alert('로그인이 필요해요.'); return; }
    const checked = document.querySelectorAll<HTMLInputElement>('#preset-list input[type=checkbox]:checked:not(:disabled)');
    const toAdd: FridgeItem[] = [];
    checked.forEach(cb => { if (!fridgeNames.has(cb.dataset.item!)) toAdd.push({ name: cb.dataset.item! }); });
    if (!toAdd.length) return;
    setFridge(prev => [...prev, ...toAdd]);
    await supabase.from('fridges').insert(toAdd.map(f => ({ user_id: userId, name: f.name })));
  };

  const removeFridgeItem = async (name: string) => {
    setFridge(prev => prev.filter(x => x.name !== name));
    if (userId) await supabase.from('fridges').delete().eq('user_id', userId).eq('name', name);
  };

  const buildRecipeFromDraft = (d: RecipeDraft, id: number): Recipe => {
    const ingredients = d.ingRows.filter(r => r.text.trim()).map(r => extractIngName(r.text));
    const ingredientTexts = d.ingRows.filter(r => r.text.trim()).map(r => r.text.trim());
    const ingredientAlts: Record<string, string[]> = {};
    d.ingRows.filter(r => r.text.trim() && r.alts?.length).forEach(r => { ingredientAlts[extractIngName(r.text)] = r.alts!; });
    const steps: Step[] = d.stepRows.filter(r => r.label.trim()).map((r, i) => ({
      label: r.label.trim(), dur: parseInt(r.dur) || 5, color: STEP_COLORS[i % STEP_COLORS.length],
    }));
    const autoTime = steps.reduce((sum, s) => sum + s.dur, 0);
    const time = autoTime > 0 ? autoTime : (parseInt(d.time) || 0);
    return { id, name: d.name.trim(), source: d.source.trim(), time, cuisine: d.cuisine, ingredients, ingredientTexts, ingredientAlts: Object.keys(ingredientAlts).length ? ingredientAlts : undefined, steps, thumbnail: d.thumbnail||undefined, youtubeUrl: d.youtubeUrl||undefined };
  };

  const saveEditingDraft = async () => {
    const d = drafts[0];
    if (!d || !d.name.trim()) return;
    const built = buildRecipeFromDraft(d, editingId!);
    const prevRecipe = recipes.find(r => r.id === editingId);
    setRecipes(prev => prev.map(r => r.id === editingId ? { ...built, id: editingId! } : r));
    setEditingId(null); setShowAddRecipe(false); setDrafts([newDraft()]);
    if (userId && (prevRecipe as any)?.dbId) {
      await supabase.from('recipes').update({
        name: built.name, source: built.source, time: built.time, cuisine: built.cuisine,
        thumbnail: built.thumbnail ?? null, youtube_url: built.youtubeUrl ?? null,
        ingredients: built.ingredients, ingredient_texts: built.ingredientTexts ?? [],
        ingredient_alts: built.ingredientAlts ?? {}, steps: built.steps,
      }).eq('id', (prevRecipe as any).dbId);
    }
  };

  const saveAllDrafts = async () => {
    const valid = drafts.filter(d => d.name.trim());
    if (!valid.length) return;
    let id = nextId;
    const newRecipes = valid.map(d => buildRecipeFromDraft(d, id++));
    setRecipes(prev => [...prev, ...newRecipes]);
    setNextId(id);
    setDrafts([newDraft()]);
    setShowAddRecipe(false);
    if (userId) {
      const rows = newRecipes.map((r, i) => ({
        user_id: userId,
        name: r.name, source: r.source, time: r.time, cuisine: r.cuisine,
        thumbnail: r.thumbnail ?? null, youtube_url: r.youtubeUrl ?? null,
        ingredients: r.ingredients, ingredient_texts: r.ingredientTexts ?? [],
        ingredient_alts: r.ingredientAlts ?? {}, steps: r.steps,
        is_public: isAdmin ? (valid[i].isPublic ?? false) : false,
      }));
      const { error } = await supabase.from('recipes').insert(rows);
      if (error) { console.error('레시피 저장 실패:', error); alert(`저장 중 오류: ${error.message}`); }
    }
    // ★ PRESET에 없는 재료 → '기타 재료' 카테고리에 자동 추가
    const allIngNames = newRecipes.flatMap(r => r.ingredients).filter(Boolean);
    const currentExtra = extraPreset['기타 재료'] ?? [];
    const unknownIngs = allIngNames.filter(ing =>
      !INGREDIENT_CATEGORY[ing] &&
      !currentExtra.includes(ing) &&
      !Object.values(extraPreset).flat().includes(ing)
    );
    if (unknownIngs.length > 0) {
      setExtraPreset(prev => ({
        ...prev,
        '기타 재료': [...(prev['기타 재료'] ?? []), ...unknownIngs],
      }));
    }
  };

  const selRecipes = recipes.filter(r => selectedTT.includes(r.id));

  useEffect(() => {
    const validIds = new Set(recipes.map(r => r.id));
    const cleaned = selectedTT.filter(id => validIds.has(id));
    if (cleaned.length !== selectedTT.length) setSelectedTT(cleaned);
  }, [recipes]);

  const maxTime = selRecipes.length ? Math.max(...selRecipes.map(r => r.time)) : 0;
  const totalSlots = Math.ceil(maxTime / 5);
  const [ttCuisineFilter, setTtCuisineFilter] = useState('전체');
  const [ytQuery, setYtQuery] = useState('');
  const [ytLoading2, setYtLoading2] = useState(false);
  const [ytChannel, setYtChannel] = useState<{channelId:string;channelTitle:string;channelThumb:string;subCount:string;videos:{id:string;title:string;thumbnail:string;publishedAt:string}[];nextPageToken:string|null;prevPageToken:string|null;totalResults:number} | null>(null);
  const [ytSelected, setYtSelected] = useState<Set<string>>(new Set());
  const [ytError2, setYtError2] = useState('');
  const [ytPage, setYtPage] = useState(1);
  const [bellOpen, setBellOpen] = useState(false);
  const [pendingReqs, setPendingReqs] = useState<any[]>([]);
  const [pendingLoaded, setPendingLoaded] = useState(false);
  const [userNotifs, setUserNotifs] = useState<any[]>([]);

  // 관리자: pending 요청 로드
  useEffect(() => {
    if (!isAdmin) return;
    supabase.from('recipe_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false })
      .then(({ data }: any) => { if (data) setPendingReqs(data); setPendingLoaded(true); });
  }, [isAdmin]);

  // 일반 유저: 완료/거절됐는데 아직 안 읽은 알림 로드
  useEffect(() => {
    if (!userId || isAdmin) return;
    supabase.from('recipe_requests').select('*')
      .eq('user_id', userId)
      .in('status', ['done', 'rejected'])
      .eq('user_notified', false)
      .order('created_at', { ascending: false })
      .then(({ data }: any) => { if (data) setUserNotifs(data); });
  }, [userId, isAdmin]);

  const tabCls = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all cursor-pointer whitespace-nowrap ${active ? 'bg-[#ECF2EE] border-[#A8C9B8] text-[#4A7362]' : 'bg-white border-[#EAE7E2] text-[#888888] hover:border-[#A8C9B8]'}`;


  return (
    <div className="min-h-[100dvh] bg-[#FAF9F7]">

<header
        className="sticky top-0 z-50"
        style={{
          background: "rgba(250,249,247,0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid #E8E5E0",
        }}
      >
        {/* 상단 네브 — 3열 그리드 */}
        <div
          className="mx-auto px-6"
          style={{
            maxWidth: "1040px",
            height: 60,
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
          }}
        >
          {/* 왼쪽 — 로고 */}
          <div className="flex items-center">
            <Link href="/" className="text-[17px] font-bold tracking-tight" style={{ color: "#1A1A1A" }}>
              김민제
            </Link>
          </div>

          {/* 가운데 — 블로그 */}
          <div className="flex items-center justify-center">
            <Link href="/blog" className="text-[15px] font-medium transition-opacity hover:opacity-60" style={{ color: "#888888" }}>
              블로그
            </Link>
          </div>

          {/* 오른쪽 — 벨 + AuthButton */}
          <div className="flex items-center justify-end gap-3">
            {userId && (
              <div className="relative">
                <button
                  onClick={() => setBellOpen(p => !p)}
                  className="relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#EAE7E2] transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M9 1.5a5.25 5.25 0 00-5.25 5.25v2.625L2.25 11.25h13.5l-1.5-1.875V6.75A5.25 5.25 0 009 1.5z" stroke="#888" strokeWidth="1.4" strokeLinejoin="round"/>
                    <path d="M7.5 14.25a1.5 1.5 0 003 0" stroke="#888" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  {(isAdmin ? pendingReqs.length : userNotifs.length) > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#7A4A42] flex items-center justify-center text-[9px] font-bold text-white">
                      {isAdmin
                        ? (pendingReqs.length > 9 ? '9+' : pendingReqs.length)
                        : (userNotifs.length > 9 ? '9+' : userNotifs.length)}
                    </span>
                  )}
                </button>

                {bellOpen && (
                  <div className="absolute right-0 top-10 z-50 bg-white rounded-[16px] border border-[#EAE7E2] shadow-[0_8px_24px_rgba(0,0,0,0.10)] w-[320px] max-h-[400px] overflow-y-auto">
                    <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #EAE7E2" }}>
                      <p className="text-[13px] font-bold" style={{ color: "#1A1A1A" }}>
                        {isAdmin ? '레시피 요청' : '알림'}
                      </p>
                      {isAdmin && pendingReqs.length > 0 && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#F2EDE4", color: "#7A6040" }}>
                          {pendingReqs.length}건 대기
                        </span>
                      )}
                    </div>

                    {/* 관리자 뷰 */}
                    {isAdmin && (
                      !pendingLoaded ? (
                        <p className="text-[12px] p-4" style={{ color: "#B0A99F" }}>불러오는 중...</p>
                      ) : pendingReqs.length === 0 ? (
                        <p className="text-[12px] p-4" style={{ color: "#B0A99F" }}>새 요청이 없어요.</p>
                      ) : (
                        <div className="flex flex-col" style={{ borderTop: "none" }}>
                          {pendingReqs.map(r => (
                            <div key={r.id} className="p-3" style={{ borderBottom: "1px solid #EAE7E2" }}>
                              <p className="text-[13px] font-bold" style={{ color: "#1A1A1A" }}>{r.youtuber_name} — {r.recipe_name}</p>
                              {r.message && <p className="text-[11px] mt-0.5" style={{ color: "#888" }}>{r.message}</p>}
                              <p className="text-[10px] mt-1 mb-2" style={{ color: "#B0A99F" }}>{new Date(r.created_at).toLocaleDateString('ko-KR')}</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={async () => {
                                    await supabase.from('recipe_requests').update({ status: 'done' }).eq('id', r.id);
                                    setPendingReqs(prev => prev.filter(x => x.id !== r.id));
                                  }}
                                  className="flex-1 py-1 rounded-[8px] text-[11px] font-bold transition-colors"
                                  style={{ background: "#ECF2EE", color: "#4A7362" }}
                                >
                                  등록 완료
                                </button>
                                <button
                                  onClick={async () => {
                                    await supabase.from('recipe_requests').update({ status: 'rejected' }).eq('id', r.id);
                                    setPendingReqs(prev => prev.filter(x => x.id !== r.id));
                                  }}
                                  className="flex-1 py-1 rounded-[8px] text-[11px] font-bold transition-colors"
                                  style={{ background: "#F3ECEA", color: "#7A4A42" }}
                                >
                                  거절
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    )}

                    {/* 일반 유저 뷰 */}
                    {!isAdmin && (
                      userNotifs.length === 0 ? (
                        <p className="text-[12px] p-4" style={{ color: "#B0A99F" }}>새 알림이 없어요.</p>
                      ) : (
                        <div className="flex flex-col">
                          {userNotifs.map(r => (
                            <div key={r.id} className="p-3 flex items-start gap-3" style={{ borderBottom: "1px solid #EAE7E2" }}>
                              <span className="text-[18px] flex-shrink-0">{r.status === 'done' ? '✅' : '❌'}</span>
                              <div className="flex-1">
                                <p className="text-[13px] font-bold" style={{ color: "#1A1A1A" }}>
                                  {r.status === 'done' ? '요청이 등록됐어요!' : '요청이 거절됐어요'}
                                </p>
                                <p className="text-[12px] mt-0.5" style={{ color: "#888" }}>{r.youtuber_name} — {r.recipe_name}</p>
                                {r.status === 'done' && (
                                  <p className="text-[11px] mt-1" style={{ color: "#4A7362" }}>불러오기 탭에서 확인해보세요!</p>
                                )}
                                <button
                                  onClick={async () => {
                                    await supabase.from('recipe_requests').update({ user_notified: true }).eq('id', r.id);
                                    setUserNotifs(prev => prev.filter(x => x.id !== r.id));
                                  }}
                                  className="mt-2 text-[11px] underline"
                                  style={{ color: "#B0A99F" }}
                                >
                                  확인
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )}
            <AuthButton />
          </div>
        </div>

      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 overflow-auto">
        {/* ─────────────────────────────────────────────────────────────
    헤더에서 서브탭 div 전체 삭제 후
    <main> 바로 안에 아래 코드 추가
───────────────────────────────────────────────────────────── */}

      {/* 네비 카드 */}
      <div className="grid grid-cols-5 gap-3 mb-8">
        {([
          { key: 'fridge',    label: '냉장고',      desc: '재고 관리' },
          { key: 'recipe',    label: '레시피',      desc: '내 레시피 모음' },
          { key: 'timetable', label: '타임테이블',  desc: '동시 완성 계획' },
          { key: 'youtuber',  label: '유튜버 검색', desc: '채널 & 영상 탐색' },
          { key: 'pending',   label: '대기중',      desc: '자동 감지 레시피' },
        ] as const).map(n => (
          <button
            key={n.key}
            onClick={() => setPage(n.key as NavPage)}
            className="text-center rounded-[16px] py-8 px-5 border-2 transition-all duration-200 hover:-translate-y-[2px]"
            style={{
              background:   page === n.key ? "#ECF2EE" : "#fff",
              borderColor:  page === n.key ? "#4A7362" : "#EAE7E2",
              boxShadow:    page === n.key
                ? "0 4px 16px rgba(74,115,98,0.12)"
                : "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <div className="text-[15px] font-bold tracking-tight" style={{ color: "#1A1A1A" }}>
              {n.label}
            </div>
            <div className="text-[12px] mt-1.5" style={{ color: "#B0A99F" }}>
              {n.desc}
            </div>
          </button>
        ))}
      </div>

        {/* 냉장고 */}
        {page === 'fridge' && (
          <div>
            <h1 className="text-[16px] font-extrabold text-[#1A1A1A] mb-4">냉장고 재고</h1>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {[{label:'총 재료',val:fridge.length},{label:'만들 수 있는 레시피',val:makeableCount}].map(s=>(
                <div key={s.label} className="bg-[#FAF9F7] rounded-[10px] p-3 text-center">
                  <div className="text-[20px] font-extrabold text-[#4A7362]">{s.val}</div>
                  <div className="text-[10px] font-semibold text-[#B0A99F] mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            <div className={cardCls}>
              <p className="text-[11px] font-bold text-[#B0A99F] tracking-wider mb-3">카테고리별 재료 선택</p>
              {!userId && (
                <div className="mb-3 p-3 bg-[#FFF8E6] border border-[#F59E0B] rounded-[10px] flex items-center gap-2">
                  <span className="text-[13px]">🔒</span>
                  <p className="text-[12px] font-semibold text-[#B45309]">로그인하면 재료를 냉장고에 저장할 수 있어요.</p>
                </div>
              )}
              <div id="preset-list">
                {/* ★ mergedPreset 사용 */}
                {Object.entries(mergedPreset).map(([cat, items]) => (
                  <div key={cat}>
                    <div className="text-[11px] font-bold text-[#4A7362] my-2 px-2 py-1 bg-[#ECF2EE] rounded-[6px] flex items-center gap-2">
                      {cat}
                      {cat === '기타 재료' && (
                        <span className="text-[10px] font-normal text-[#B0A99F]">레시피 등록 시 자동 추가됨</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {(items as string[]).map(item => {
                        const has = fridgeNames.has(item);
                        return (
                          <label key={item} className="flex items-center gap-1.5 px-2 py-1 rounded-[6px] text-[12px] font-semibold"
                            style={{ background:has?'#ECF2EE':'#F5F5F5', border:`1px solid ${has?'#A8C9B8':'#E6E6E6'}`, opacity:(has||!userId)?0.65:1, cursor:(has||!userId)?'default':'pointer' }}>
                            <input type="checkbox" data-item={item} disabled={has || !userId} defaultChecked={has}
                              style={{ width:14, height:14, accentColor:'#4A7362', flexShrink:0 }} />
                            <span style={{ color:has?'#4A7362':'#1A1A1A' }}>{item}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addChecked} disabled={!userId} className={`${btnCls} w-full mt-3 disabled:opacity-40`}>선택한 재료 냉장고에 넣기</button>
            </div>
            <div className={cardCls}>
              <p className="text-[11px] font-bold text-[#B0A99F] tracking-wider mb-3">직접 추가</p>
              <div className="flex gap-2">
                <input className={inputCls} placeholder={userId ? "재료명 입력 후 Enter" : "로그인 후 사용 가능"}
                  disabled={!userId} value={fiName}
                  onChange={e => setFiName(e.target.value)} onKeyDown={e => e.key==='Enter' && addManual()} />
                <button onClick={addManual} disabled={!userId} className={`${btnCls} disabled:opacity-40`}>추가</button>
              </div>
            </div>
            <div className={cardCls}>
              <p className="text-[11px] font-bold text-[#B0A99F] tracking-wider mb-3">냉장고 목록 ({fridge.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {fridge.map(f => (
                  <div key={f.name} className="flex items-center gap-1 bg-[#ECF2EE] border border-[#A8C9B8] rounded-full pl-3 pr-1 py-1">
                    <span className="text-[12px] font-semibold text-[#1A1A1A]">{f.name}</span>
                    <button onClick={() => removeFridgeItem(f.name)}
                      className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-[#B0A99F] hover:bg-[#A8C9B8] hover:text-[#4A7362] transition-colors">✕</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}


        {/* 레시피 */}
        {page === 'recipe' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-[16px] font-extrabold text-[#1A1A1A]">레시피</h1>
              <div className="flex gap-1 bg-[#F0F0F2] rounded-[10px] p-1">
                {([['my','내 레시피'],['browse','불러오기'],['request','요청하기']] as const).map(([key, label]) => (
                  <button key={key} onClick={() => {
                    setRecipeSubTab(key);
                    if (key === 'browse' && publicRecipes.length === 0) {
                      setPublicLoading(true);
                      supabase.from('recipes').select('*').eq('is_public', true).order('created_at', { ascending: false })
                        .then(({ data }) => {
                          if (data) setPublicRecipes(data.map((r, i) => ({
                            id: -(i+1), name: r.name, source: r.source, time: r.time, cuisine: r.cuisine,
                            thumbnail: r.thumbnail, youtubeUrl: r.youtube_url,
                            ingredients: r.ingredients ?? [], ingredientTexts: r.ingredient_texts ?? [],
                            ingredientAlts: r.ingredient_alts ?? {}, steps: r.steps ?? [], dbId: r.id,
                          })));
                          setPublicLoading(false);
                        });
                    }
                  }}
                    className={`px-3 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all ${recipeSubTab === key ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#888888] hover:text-[#1A1A1A]'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {recipeSubTab === 'browse' && (
              <div>
                {publicLoading ? (
                  <div className="text-center py-20 text-[13px] text-[#B0A99F]">불러오는 중...</div>
                ) : publicRecipes.length === 0 ? (
                  <div className="text-center py-20 text-[13px] text-[#B0A99F]">아직 등록된 공개 레시피가 없어요.</div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {publicRecipes.map(r => (
                      <div key={r.id} className="bg-white rounded-[12px] border border-[#EAE7E2] overflow-hidden hover:shadow-md transition-all">
                        <div className="relative w-full" style={{ paddingTop:'37.5%', background: CUISINE_COLORS[r.cuisine] ?? '#E6E6E6', overflow:'hidden' }}>
                          {r.thumbnail
                            ? <img src={r.thumbnail} alt={r.name} className="absolute inset-0 w-full h-full object-cover" />
                            : <div className="absolute inset-0 flex items-center justify-center"><span className="text-white text-[11px] font-bold opacity-80 text-center px-2">{r.name}</span></div>
                          }
                        </div>
                        <div className="p-3">
                          <p className="text-[13px] font-bold text-[#1A1A1A] mb-0.5 truncate">{r.name}</p>
                          <p className="text-[11px] text-[#B0A99F] mb-2">{r.source} · {r.time}분</p>
                          <button
                            onClick={async () => {
                              if (!userId) { alert('로그인이 필요해요.'); return; }
                              const { data } = await supabase.from('recipes').insert({
                                user_id: userId, name: r.name, source: r.source, time: r.time, cuisine: r.cuisine,
                                thumbnail: r.thumbnail ?? null, youtube_url: r.youtubeUrl ?? null,
                                ingredients: r.ingredients, ingredient_texts: r.ingredientTexts ?? [],
                                ingredient_alts: r.ingredientAlts ?? {}, steps: r.steps, is_public: false,
                                original_recipe_id: r.dbId,
                              }).select().single();
                              if (data) {
                                const newId = Math.max(...recipes.map(x => x.id), 0) + 1;
                                setRecipes(prev => [...prev, { ...r, id: newId, dbId: data.id }]);
                                setRecipeSubTab('my');
                                alert(`"${r.name}" 를 내 레시피에 추가했어요!`);
                              }
                            }}
                            className={`${btnCls} w-full text-[11px] py-1.5`}>
                            내 레시피로 복사
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {recipeSubTab === 'request' && (
              <div className={cardCls}>
                <p className="text-[13px] font-bold text-[#1A1A1A] mb-1">레시피 요청하기</p>
                <p className="text-[11px] text-[#B0A99F] mb-4">원하는 유튜버나 셰프의 레시피를 요청하면 검토 후 등록해드려요.</p>
                {requestSent ? (
                  <div className="text-center py-8">
                    <p className="text-[24px] mb-2">✅</p>
                    <p className="text-[14px] font-bold text-[#1A1A1A] mb-1">요청이 전달됐어요!</p>
                    <p className="text-[12px] text-[#B0A99F]">검토 후 등록되면 불러오기 탭에서 확인할 수 있어요.</p>
                    <button onClick={() => setRequestSent(false)} className={`${btnSmCls} mt-4`}>다시 요청하기</button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-[11px] font-semibold text-[#888888] mb-1">유튜버 / 셰프 이름 *</p>
                      <input className={inputCls} placeholder="예: 육식맨, 백종원" value={requestForm.youtuber}
                        onChange={e => setRequestForm(p => ({...p, youtuber: e.target.value}))} />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-[#888888] mb-1">레시피 이름 *</p>
                      <input className={inputCls} placeholder="예: 홍소육, 된장찌개" value={requestForm.recipe}
                        onChange={e => setRequestForm(p => ({...p, recipe: e.target.value}))} />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-[#888888] mb-1">추가 메모</p>
                      <textarea className={inputCls} placeholder="유튜브 링크나 추가 설명을 남겨주세요." rows={3}
                        style={{resize:'none'}} value={requestForm.message}
                        onChange={e => setRequestForm(p => ({...p, message: e.target.value}))} />
                    </div>
                    <button
                      onClick={async () => {
                        if (!requestForm.youtuber.trim() || !requestForm.recipe.trim()) { alert('유튜버와 레시피 이름을 입력해주세요.'); return; }
                        await supabase.from('recipe_requests').insert({
                          user_id: userId ?? null,
                          youtuber_name: requestForm.youtuber.trim(),
                          recipe_name: requestForm.recipe.trim(),
                          message: requestForm.message.trim(),
                        });
                        setRequestSent(true);
                        setRequestForm({ youtuber: '', recipe: '', message: '' });
                      }}
                      className={`${btnCls} w-full`}>
                      요청 보내기
                    </button>
                  </div>
                )}
              </div>
            )}

            {recipeSubTab === 'my' && <>
            <div className="bg-white rounded-[16px] border border-[#EAE7E2] p-3 mb-3 flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap gap-1.5 flex-1">
                {CUISINES.map(c => (
                  <button key={c} onClick={() => setCuisineFilter(c)} className={tabCls(cuisineFilter === c)}>{c}</button>
                ))}
              </div>
              <select value={sortOrder} onChange={e => setSortOrder(e.target.value as SortOrder)}
                className="bg-[#F5F5F5] border border-[#EAE7E2] rounded-[8px] px-2 py-1.5 text-[11px] font-semibold text-[#1A1A1A] focus:outline-none focus:border-[#4A7362] cursor-pointer">
                <option value="default">기본순</option>
                <option value="pct_desc">준비된 재료 많은순</option>
                <option value="pct_asc">준비된 재료 적은순</option>
                <option value="time_asc">조리시간 빠른순</option>
              </select>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
              {filteredSortedRecipes.map(r => {
                const isSel = selectedTT.includes(r.id);
                const menuOpen = openMenuId === r.id;
                return (
                <div key={r.id}
                  className="bg-white rounded-[12px] border-2 overflow-hidden transition-all cursor-pointer relative"
                  style={{ borderColor: isSel ? '#4A7362' : '#E6E6E6', boxShadow: isSel ? '0 4px 12px rgba(124,140,3,0.12)' : undefined }}
                  onClick={() => { setSelectedTT(prev => prev.includes(r.id) ? prev.filter(x=>x!==r.id) : [...prev,r.id]); setOpenMenuId(null); }}>
                  <div className="relative w-full" style={{ paddingTop:'37.5%', background: CUISINE_COLORS[r.cuisine] ?? '#E6E6E6', overflow:'hidden' }}>
                    {r.thumbnail ? (
                      <img src={r.thumbnail} alt={r.name} className="absolute inset-0 w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-[11px] font-bold opacity-80 text-center px-2">{r.name}</span>
                      </div>
                    )}
                    {isSel && (
                      <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-[#4A7362] flex items-center justify-center shadow-sm">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7.5L8 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    )}
                    {r.youtubeUrl && (
                      <a href={r.youtubeUrl} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-[#FF0000] flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M4 3l4 2-4 2V3z" fill="white"/></svg>
                      </a>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[13px] font-bold text-[#1A1A1A]">{r.name}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F5F7FA] text-[#49627A] border border-[#D0D8E4]">{r.cuisine}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {r.source && <span className="text-[11px] font-semibold text-[#4A7362]">{r.source}</span>}
                          <span className="text-[11px] text-[#B0A99F]">약 {r.time}분</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <div className="relative ml-1">
                          <button onClick={() => setOpenMenuId(menuOpen ? null : r.id)}
                            className="w-6 h-6 flex items-center justify-center rounded-[6px] text-[#B0A99F] hover:bg-[#F0F0F2] hover:text-[#1A1A1A] transition-colors text-[14px] font-bold">⋮</button>
                          {menuOpen && (
                            <div className="absolute right-0 top-7 z-20 bg-white rounded-[10px] border border-[#EAE7E2] shadow-[0_4px_16px_rgba(0,0,0,0.1)] overflow-hidden w-[88px]">
                              <button
                                onClick={() => {
                                  setDrafts([{ ...newDraft(), name:r.name, source:r.source, time:String(r.time), cuisine:r.cuisine, thumbnail:r.thumbnail||'', youtubeUrl:r.youtubeUrl||'', ingRows:(r.ingredientTexts ?? r.ingredients).map((t, idx) => ({ text: t, alts: r.ingredientAlts?.[r.ingredients[idx]] ?? [] })), stepRows:r.steps.map(s => ({ label:s.label, dur:String(s.dur) })) }]);
                                  setEditingId(r.id); setShowAddRecipe(true); setOpenMenuId(null);
                                }}
                                className="w-full text-left px-3 py-2 text-[12px] font-semibold text-[#1A1A1A] hover:bg-[#ECF2EE] hover:text-[#4A7362] transition-colors">수정</button>
                              {isAdmin && (r as any).dbId && (
                                <>
                                  <div className="h-px bg-[#F0F0F2]" />
                                  <button
                                    onClick={async () => {
                                      const cur = (r as any).isPublic;
                                      await supabase.from('recipes').update({ is_public: !cur }).eq('id', (r as any).dbId);
                                      setRecipes(prev => prev.map(x => x.id === r.id ? {...x, isPublic: !cur} as any : x));
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-[12px] font-semibold text-[#1B4F8A] hover:bg-[#EFF6FF] transition-colors">
                                    {(r as any).isPublic ? '🌐 공개 → 비공개' : '🔒 비공개 → 공개'}
                                  </button>
                                </>
                              )}
                              <div className="h-px bg-[#F0F0F2]" />
                              <button
                                onClick={async () => { if(confirm(`"${r.name}" 레시피를 삭제할까요?`)) {
                                  if (userId && (r as any).dbId) await supabase.from('recipes').delete().eq('id', (r as any).dbId);
                                  setRecipes(prev => prev.filter(x => x.id !== r.id)); setOpenMenuId(null); }}}
                                className="w-full text-left px-3 py-2 text-[12px] font-semibold text-[#F94239] hover:bg-[#FFF5F5] transition-colors">삭제</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mb-2 flex flex-wrap gap-1">
                      {r.ingredients.map((ing, idx) => {
                        const avail = ingAvailable(ing, r);
                        const allAlts = r.ingredientAlts?.[ing] ?? [];
                        const availAlts = avail === 'alt' ? allAlts.filter(a => fridgeNames.has(a)) : [];
                        const displayText = r.ingredientTexts?.[idx] ?? ing;
                        const bg = avail === 'has' ? '#ECF2EE' : avail === 'alt' ? '#FFF8E6' : '#FFF5F5';
                        const border = avail === 'has' ? '#A8C9B8' : avail === 'alt' ? '#F59E0B' : '#FFCCC7';
                        const color = avail === 'has' ? '#4A7362' : avail === 'alt' ? '#B45309' : '#F94239';
                        return (
                          <span key={idx} className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{ background: bg, border: `1px solid ${border}`, color }}>
                            {avail === 'none' && '✕ '}{displayText}{availAlts.length > 0 ? ` → ${availAlts.join(', ')}` : ''}
                          </span>
                        );
                      })}
                    </div>
                    <PctBar pct={matchPct(r)} />
                    {r.steps.length > 0 && (
                      <button
                        onClick={e => { e.stopPropagation(); setExpandedIds(prev => { const n = new Set(prev); n.has(r.id) ? n.delete(r.id) : n.add(r.id); return n; }); }}
                        className="mt-2 w-full text-[10px] font-semibold text-[#B0A99F] hover:text-[#4A7362] transition-colors text-left flex items-center gap-1">
                        <span>{expandedIds.has(r.id) ? "▲" : "▼"}</span>
                        조리 순서 {expandedIds.has(r.id) ? "닫기" : "보기"}
                      </button>
                    )}
                    {expandedIds.has(r.id) && r.steps.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-[#F0F0F2]" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col gap-1 mb-3">
                          {r.steps.map((s, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0" style={{ background: s.color }}>{i+1}</div>
                              <span className="text-[11px] font-semibold text-[#1A1A1A]">{s.label}</span>
                              <span className="text-[10px] text-[#B0A99F] ml-auto">{s.dur}분</span>
                            </div>
                          ))}
                          <div className="text-[10px] text-[#B0A99F] mt-1 text-right">총 {r.steps.reduce((a,s) => a+s.dur, 0)}분</div>
                        </div>
                        <div className="overflow-x-auto">
                          <div className="flex gap-0.5 min-w-0">
                            {r.steps.map((s, i) => {
                              const totalTime = r.steps.reduce((a, x) => a + x.dur, 0);
                              const widthPct = (s.dur / totalTime) * 100;
                              return (
                                <div key={i} className="flex flex-col items-start" style={{ width: `${widthPct}%`, minWidth: 32 }}>
                                  <div className="w-full h-[24px] rounded-[4px] flex items-center justify-center px-1 overflow-hidden" style={{ background: s.color }}>
                                    <span className="text-[9px] font-bold text-white truncate">{s.label}</span>
                                  </div>
                                  <span className="text-[9px] text-[#B0A99F] mt-0.5">{s.dur}분</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                );
              })}
            </div>

            {!userId && (
              <div className="mb-3 p-3 bg-[#FFF8E6] border border-[#F59E0B] rounded-[10px] flex items-center gap-2">
                <span className="text-[13px]">🔒</span>
                <p className="text-[12px] font-semibold text-[#B45309]">로그인하면 레시피가 저장되고 어디서든 불러올 수 있어요.</p>
              </div>
            )}
            {selectedTT.length > 0 && (
              <button onClick={() => { setTtBuilt(true); setPage('timetable'); }}
                className="w-full mb-3 py-2.5 rounded-[10px] text-[13px] font-bold text-white transition-all hover:opacity-90"
                style={{ background: '#1B4F8A' }}>
                타임테이블 생성 · {selectedTT.length}개 선택됨
              </button>
            )}
            <button onClick={() => setShowAddRecipe(!showAddRecipe)} className="w-full py-2.5 rounded-[10px] text-[13px] font-bold text-white transition-all hover:opacity-90 mb-0" style={{ background: '#4A7362' }}>
              {showAddRecipe ? (editingId !== null ? '수정 취소' : '닫기') : '+ 새 레시피 추가'}
            </button>
            {recipeSubTab === 'my' && showAddRecipe && (
              <div className="mt-3">
                {drafts.map((d, dIdx) => (
                  <div key={d.draftId} className={`${cardCls}`} style={{ borderLeft: '3px solid #4A7362' }}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[11px] font-bold text-[#B0A99F] tracking-wider">{editingId !== null ? '레시피 수정' : `레시피 ${dIdx + 1}`}</p>
                      {editingId === null && drafts.length > 1 && (
                        <button onClick={() => setDrafts(prev => prev.filter(x => x.draftId !== d.draftId))} className="text-[11px] text-[#F94239] hover:underline">삭제</button>
                      )}
                    </div>
                    <div className="mb-3 p-3 bg-[#FAF9F7] rounded-[10px] border border-[#EAE7E2]">
                      <p className="text-[11px] font-semibold text-[#888888] mb-2">유튜브 URL로 자동 채우기</p>
                      <div className="flex gap-2">
                        <input className={inputCls} placeholder="https://youtube.com/watch?v=..." value={d.ytUrl}
                          onChange={e => updateDraft(d.draftId, { ytUrl: e.target.value })} style={{flex:1}} />
                        <button
                          onClick={async () => {
                            if (!d.ytUrl.trim()) return;
                            updateDraft(d.draftId, { ytLoading: true, ytError: '' });
                            try {
                              const res = await fetch('/api/parse-recipe', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({url: d.ytUrl}) });
                              const data = await res.json();
                              const patch: Partial<RecipeDraft> = { ytLoading: false };
                              if (data.thumbnail) patch.thumbnail = data.thumbnail;
                              if (d.ytUrl) patch.youtubeUrl = d.ytUrl;
                              const extractDishName = (title: string) => {
                                let name = title.split(/[:：|｜]/)[0]
                                  .replace(/\s*(만들기|레시피|만드는법|만드는방법|황금레시피|쉽게|간단|초간단|초간편|꿀팁)\s*/gi, '')
                                  .replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim();
                                return name || title.trim();
                              };
                              if (data.recipe) {
                                if (data.recipe.name) patch.name = extractDishName(data.recipe.name);
                                if (data.recipe.source || data.source) patch.source = data.recipe.source || data.source || '';
                                if (data.recipe.time) patch.time = String(data.recipe.time);
                                if (data.recipe.cuisine) patch.cuisine = data.recipe.cuisine;
                                if (data.recipe.ingredients) patch.ingRows = data.recipe.ingredients.map((t: string) => ({ text: t }));
                                if (data.recipe.steps) patch.stepRows = data.recipe.steps.map((s: {label:string;dur:number}) => ({ label: s.label, dur: String(s.dur) }));
                              } else {
                                if (data.title) patch.name = extractDishName(data.title);
                                if (data.source) patch.source = data.source;
                                if (data.error) patch.ytError = data.error;
                              }
                              updateDraft(d.draftId, patch);
                            } catch { updateDraft(d.draftId, { ytLoading: false, ytError: '분석 실패. URL을 확인해주세요.' }); }
                          }}
                          disabled={d.ytLoading}
                          className="flex-shrink-0 px-3 py-2 rounded-[8px] text-[12px] font-bold text-white disabled:opacity-40"
                          style={{background:'#1B4F8A', fontFamily:'inherit'}}>
                          {d.ytLoading ? '분석 중...' : '분석'}
                        </button>
                      </div>
                      {d.thumbnail && (
                        <div className="mt-2 flex items-center gap-3">
                          <img src={d.thumbnail} alt="썸네일" className="rounded-[8px] object-cover flex-shrink-0" style={{width:'160px',height:'90px'}} />
                          {d.youtubeUrl && (
                            <a href={d.youtubeUrl} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-[12px] font-semibold text-[#1B4F8A] hover:underline break-all">
                              <div className="w-5 h-5 rounded-full bg-[#FF0000] flex items-center justify-center flex-shrink-0">
                                <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M3 2l4 2-4 2V2z" fill="white"/></svg>
                              </div>
                              {d.youtubeUrl}
                            </a>
                          )}
                        </div>
                      )}
                      {d.ytError && <p className="mt-1 text-[11px] text-[#F94239]">{d.ytError}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input className={inputCls} placeholder="레시피 이름" value={d.name} onChange={e => updateDraft(d.draftId, { name: e.target.value })} />
                      <input className={inputCls} placeholder="출처 (예: 육식맨)" value={d.source} onChange={e => updateDraft(d.draftId, { source: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <p className="text-[10px] font-semibold text-[#B0A99F] mb-1">조리 시간 (분)</p>
                        {(() => {
                          const autoTime = d.stepRows.filter(r => r.label.trim()).reduce((sum, r) => sum + (parseInt(r.dur) || 0), 0);
                          return autoTime > 0 ? (
                            <div className="flex items-center gap-2 px-3 py-2 bg-[#ECF2EE] border border-[#A8C9B8] rounded-[8px]">
                              <span className="text-[13px] font-bold text-[#4A7362]">{autoTime}분</span>
                              <span className="text-[10px] text-[#B0A99F]">조리 단계 합산 자동 계산</span>
                            </div>
                          ) : (
                            <input className={inputCls} placeholder="조리 단계 입력 시 자동 계산" type="number" value={d.time} onChange={e => updateDraft(d.draftId, { time: e.target.value })} />
                          );
                        })()}
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-[#B0A99F] mb-1">요리 종류</p>
                        <select className={inputCls} value={d.cuisine} onChange={e => updateDraft(d.draftId, { cuisine: e.target.value })}>
                          {CUISINES.filter(c => c !== '전체').map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="mb-4">
                      <p className="text-[11px] font-bold text-[#B0A99F] tracking-wider mb-2">재료</p>
                      <div className="mb-2 p-3 bg-[#FAF9F7] rounded-[10px] border border-[#EAE7E2]">
                        <p className="text-[11px] font-semibold text-[#888888] mb-2">유튜브 설명란 붙여넣기 → 자동 정리</p>
                        <textarea className={inputCls} placeholder={"🔽재료 목록🔽\n오겹살 2kg\n쪽파 뿌리 10개..."} rows={4}
                          style={{resize:'none'}} value={d.rawIngText}
                          onChange={e => updateDraft(d.draftId, { rawIngText: e.target.value })} />
                        <button
                          onClick={() => {
                            if (!d.rawIngText.trim()) return;
                            const UNITS = '(?:kg|g|ml|l|L|개|대|장|컵|밥숟갈|밥숟가락|테이블스푼|티스푼|큰술|작은술|조각|단|뿌리|알|통|봉|캔|팩|병|줄|토막|마리|포기|움큼|꼬집|그램|리터|cc|Tbsp|tbsp|tsp|줌|묶음|쪽|덩어리|모|쌈|장|인분)';
                            const parseLines = (lines: string[]) => lines.map((line: string) => {
                              const cleanLine = line.replace(/^\(선택\)\s*/i, '').replace(/^\*\s*/, '').replace(/https?:\S*/g, '').replace(/link\.\S+/g, '').trim();
                              const noParens = cleanLine.replace(/\s*\(.*?\)/g, '').trim();
                              const orSplit = noParens.split(/\s+(?:혹은|또는|or|OR)\s+|\s*\/\s*/);
                              if (orSplit.length >= 2) {
                                const amtRegexOr = new RegExp('([\\d/.~]+\\s*' + UNITS + '(?:\\s+(?:반모|이상|이하|정도|가량))?)', 'i');
                                const autoAlts = orSplit.slice(1).map((s: string) => s.replace(amtRegexOr, '').trim()).filter(Boolean);
                                return { text: cleanLine, alts: autoAlts };
                              }
                              return { text: cleanLine };
                            }).filter((r: any) => r.text?.trim());
                            const rawLines = d.rawIngText.split('\n');
                            const sectionRegex = /^\[(.+?)\]/;
                            const sections: { name: string; lines: string[] }[] = [];
                            let current: { name: string; lines: string[] } | null = null;
                            for (const line of rawLines) {
                              const m = line.trim().match(sectionRegex);
                              if (m) { if (current) sections.push(current); current = { name: m[1].trim(), lines: [] }; }
                              else if (current) { current.lines.push(line); }
                              else { if (!current) current = { name: '', lines: [] }; current.lines.push(line); }
                            }
                            if (current) sections.push(current);
                            if (sections.length >= 2) {
                              const baseName = d.name.trim();
                              const newDraftsFromSections = sections
                                .filter(sec => sec.name.trim() || sec.lines.some(l => l.trim()))
                                .map(sec => {
                                  const filteredLines = sec.lines.filter((l: string) => l.trim() && !l.startsWith('🔽') && !l.startsWith('#') && !l.match(/^https?:/));
                                  return { ...newDraft(), name: baseName ? `${baseName} - ${sec.name || '기타'}` : (sec.name || '레시피'), source: d.source, cuisine: d.cuisine, thumbnail: d.thumbnail, youtubeUrl: d.youtubeUrl, ingRows: parseLines(filteredLines).length > 0 ? parseLines(filteredLines) : [{ text: '' }], rawIngText: '' };
                                });
                              setDrafts(prev => [...prev.filter(x => x.draftId !== d.draftId), ...newDraftsFromSections]);
                              return;
                            }
                            updateDraft(d.draftId, { ingError: '' });
                            const lines = d.rawIngText.split('\n').map((l: string) => l.trim()).filter((l: string) => l && !l.startsWith('🔽') && !l.startsWith('[') && !l.startsWith('#') && !l.match(/^https?:/));
                            const parsed = parseLines(lines);
                            if (parsed.length > 0) updateDraft(d.draftId, { ingRows: parsed, rawIngText: '' });
                          }}
                          disabled={!d.rawIngText.trim()}
                          className="mt-2 w-full py-2 rounded-[8px] text-[12px] font-bold text-white disabled:opacity-40"
                          style={{background:'#1B4F8A', fontFamily:'inherit'}}>
                          재료 자동 정리
                        </button>
                        {d.ingError && <div className="mt-2 p-2 bg-[#FFF5F5] border border-[#FFCCC7] rounded-[8px] text-[11px] text-[#F94239]">⚠️ {d.ingError}</div>}
                      </div>
                      <div className="border border-[#EAE7E2] rounded-[10px] overflow-hidden">
                        <div className="grid grid-cols-[1fr_1fr_32px] bg-[#FAF9F7] border-b border-[#EAE7E2]">
                          <span className="text-[10px] font-bold text-[#B0A99F] px-3 py-2">재료 (정량 포함 그대로)</span>
                          <span className="text-[10px] font-bold text-[#B0A99F] px-3 py-2 border-l border-[#EAE7E2]">대체 가능 재료</span>
                          <span/>
                        </div>
                        {d.ingRows.map((row, i) => {
                          const ingName = extractIngName(row.text);
                          const cat = INGREDIENT_CATEGORY[ingName];
                          const catItems = cat ? PRESET[cat]?.filter((x: string) => x !== ingName) ?? [] : [];
                          return (
                            <div key={i} className="border-b border-[#F0F0F2] last:border-0">
                              <div className="grid grid-cols-[1fr_1fr_32px]">
                                <input className="px-3 py-2 text-[12px] text-[#1A1A1A] bg-transparent focus:outline-none focus:bg-[#ECF2EE]"
                                  placeholder="예: 오겹살 2kg" value={row.text}
                                  onChange={e => updateDraft(d.draftId, { ingRows: d.ingRows.map((r,j) => j===i ? {...r, text:e.target.value, alts:[]} : r) })} />
                                <div className="px-2 py-1.5 border-l border-[#F0F0F2] flex flex-wrap gap-1 min-h-[36px]">
                                  {catItems.length > 0 ? catItems.map((alt: string) => {
                                    const selected = row.alts?.includes(alt);
                                    return (
                                      <button key={alt} type="button"
                                        onClick={() => updateDraft(d.draftId, { ingRows: d.ingRows.map((r,j) => { if (j !== i) return r; const alts = r.alts ?? []; return { ...r, alts: selected ? alts.filter(a => a !== alt) : [...alts, alt] }; })})}
                                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border transition-all"
                                        style={{ background: selected ? '#FFF3E0' : '#F5F5F5', borderColor: selected ? '#F59E0B' : '#E6E6E6', color: selected ? '#B45309' : '#B0A99F' }}>
                                        {alt}
                                      </button>
                                    );
                                  }) : <span className="text-[10px] text-[#D1D5DB] self-center">-</span>}
                                </div>
                                <button onClick={() => updateDraft(d.draftId, { ingRows: d.ingRows.filter((_,j) => j!==i) })}
                                  className="flex items-center justify-center text-[#D1D5DB] hover:text-[#F94239] text-[14px]">✕</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <button onClick={() => updateDraft(d.draftId, { ingRows: [...d.ingRows, {text:''}] })}
                        className="mt-2 w-full py-1.5 rounded-[8px] text-[11px] font-semibold text-[#888888] bg-[#FAF9F7] border border-dashed border-[#D1D5DB] hover:border-[#4A7362] hover:text-[#4A7362] transition-colors">
                        + 재료 추가
                      </button>
                    </div>
                    <div className="mb-2">
                      <p className="text-[11px] font-bold text-[#B0A99F] tracking-wider mb-2">조리 단계</p>
                      <div className="mb-3 p-3 bg-[#FAF9F7] rounded-[10px] border border-[#EAE7E2]">
                        <p className="text-[11px] font-semibold text-[#888888] mb-2">단계 선택해서 추가</p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {['기본 손질','볶음','끓임·찜','굽기','튀기기','소스·양념','마무리','서양식','중식','일식'].map(cat => (
                            <button key={cat} type="button"
                              onClick={() => updateDraft(d.draftId, { _stepCat: cat } as any)}
                              className="px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all"
                              style={{ background: (d as any)._stepCat === cat ? '#ECF2EE' : '#fff', borderColor: (d as any)._stepCat === cat ? '#A8C9B8' : '#E6E6E6', color: (d as any)._stepCat === cat ? '#4A7362' : '#888888' }}>
                              {cat}
                            </button>
                          ))}
                        </div>
                        {(d as any)._stepCat && (
                          <div className="flex flex-wrap gap-1.5">
                            {COOKING_STEPS_DB[(d as any)._stepCat as keyof typeof COOKING_STEPS_DB]?.map(step => (
                              <button key={step.name} type="button"
                                onClick={() => updateDraft(d.draftId, { stepRows: [...d.stepRows.filter(r => r.label || r.dur), { label: step.name, dur: String(step.dur) }] })}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] border border-[#EAE7E2] bg-white text-[11px] font-semibold text-[#1A1A1A] hover:border-[#A8C9B8] hover:bg-[#ECF2EE] transition-all">
                                {step.name}
                                <span className="text-[10px] text-[#B0A99F]">{step.dur}분</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="border border-[#EAE7E2] rounded-[10px] overflow-hidden">
                        <div className="grid grid-cols-[1fr_80px_32px] bg-[#FAF9F7] border-b border-[#EAE7E2]">
                          <span className="text-[10px] font-bold text-[#B0A99F] px-3 py-2">단계명</span>
                          <span className="text-[10px] font-bold text-[#B0A99F] px-3 py-2 border-l border-[#EAE7E2]">시간(분)</span>
                          <span/>
                        </div>
                        {d.stepRows.map((row, i) => (
                          <div key={i} className="grid grid-cols-[1fr_80px_32px] border-b border-[#F0F0F2] last:border-0">
                            <input className="px-3 py-2 text-[12px] text-[#1A1A1A] bg-transparent focus:outline-none focus:bg-[#ECF2EE]"
                              placeholder="예: 재료 손질" value={row.label}
                              onChange={e => updateDraft(d.draftId, { stepRows: d.stepRows.map((r,j) => j===i ? {...r, label:e.target.value} : r) })} />
                            <input type="number" className="px-3 py-2 text-[12px] text-[#1A1A1A] bg-transparent border-l border-[#F0F0F2] focus:outline-none focus:bg-[#ECF2EE]"
                              placeholder="5" value={row.dur}
                              onChange={e => updateDraft(d.draftId, { stepRows: d.stepRows.map((r,j) => j===i ? {...r, dur:e.target.value} : r) })} />
                            <button onClick={() => updateDraft(d.draftId, { stepRows: d.stepRows.filter((_,j) => j!==i) })}
                              className="flex items-center justify-center text-[#D1D5DB] hover:text-[#F94239] text-[14px]">✕</button>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => updateDraft(d.draftId, { stepRows: [...d.stepRows, {label:'',dur:''}] })}
                        className="mt-2 w-full py-1.5 rounded-[8px] text-[11px] font-semibold text-[#888888] bg-[#FAF9F7] border border-dashed border-[#D1D5DB] hover:border-[#4A7362] hover:text-[#4A7362] transition-colors">
                        + 직접 입력
                      </button>
                    </div>
                  </div>
                ))}
                {editingId === null && (
                  <button onClick={() => setDrafts(prev => [...prev, newDraft()])}
                    className="w-full py-2.5 mb-3 rounded-[10px] text-[13px] font-bold border-2 border-dashed border-[#A8C9B8] text-[#4A7362] hover:bg-[#ECF2EE] transition-colors">
                    + 레시피 더 추가
                  </button>
                )}
                <div className="flex gap-2">
                  {isAdmin && (
                    <label className="flex items-center gap-2 px-3 py-2 rounded-[10px] border border-[#EAE7E2] bg-[#FAF9F7] cursor-pointer">
                      <input type="checkbox"
                        checked={drafts[0]?.isPublic ?? false}
                        onChange={e => setDrafts(prev => prev.map((d, i) => i === 0 ? {...d, isPublic: e.target.checked} : d))}
                        style={{ accentColor: '#1B4F8A', width: 14, height: 14 }} />
                      <span className="text-[12px] font-semibold text-[#1B4F8A]">공개 레시피로 저장</span>
                    </label>
                  )}
                  <button onClick={() => { editingId !== null ? saveEditingDraft() : saveAllDrafts(); }} className={`${btnCls} flex-1`}>
                    {editingId !== null ? '수정 완료' : `${drafts.filter(d => d.name.trim()).length}개 저장`}
                  </button>
                  <button onClick={() => { setShowAddRecipe(false); setEditingId(null); setDrafts([newDraft()]); }} className={btnSmCls}>취소</button>
                </div>
              </div>
            )}
            </>}
          </div>
        )}


        {/* 타임테이블 */}
        {page === 'timetable' && (
          <div>
            <h1 className="text-[16px] font-extrabold text-[#1A1A1A] mb-4">타임테이블</h1>
            <div className="bg-white rounded-[16px] border border-[#EAE7E2] p-3 mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[12px] font-bold text-[#1A1A1A]">
                  {selRecipes.length > 0 ? selRecipes.map(r => r.name).join(' · ') : '선택된 레시피가 없습니다'}
                </p>
                {selRecipes.length > 0 && <p className="text-[11px] text-[#B0A99F] mt-0.5">총 {selRecipes.length}개 · 최대 {maxTime}분</p>}
              </div>
              <button onClick={() => setPage('recipe')}
                className="flex-shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-[8px] bg-[#FAF9F7] border border-[#EAE7E2] text-[#888888] hover:border-[#A8C9B8] hover:text-[#4A7362] transition-colors">
                ← 레시피 변경
              </button>
            </div>
            {selRecipes.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                {selRecipes.map(r => (
                  <div key={r.id} className="bg-white rounded-[16px] border border-[#EAE7E2] overflow-hidden">
                    <div className="flex items-center gap-3 p-3 border-b border-[#F0F0F2]">
                      {r.thumbnail && <img src={r.thumbnail} alt="" className="w-[60px] h-[34px] rounded-[4px] object-cover flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-[#1A1A1A] truncate">{r.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {r.source && <span className="text-[11px] font-semibold text-[#4A7362]">{r.source}</span>}
                          <span className="text-[11px] text-[#B0A99F]">약 {r.time}분</span>
                        </div>
                      </div>
                      {r.youtubeUrl && (
                        <a href={r.youtubeUrl} target="_blank" rel="noopener noreferrer"
                          className="w-6 h-6 rounded-full bg-[#FF0000] flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform">
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M3 2l4 2-4 2V2z" fill="white"/></svg>
                        </a>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-[10px] font-bold text-[#B0A99F] tracking-wider mb-2">재료 {r.ingredients.length}가지</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {r.ingredients.map((ing, idx) => {
                          const avail = ingAvailable(ing, r);
                          const displayText = r.ingredientTexts?.[idx] ?? ing;
                          const allAlts = r.ingredientAlts?.[ing] ?? [];
                          const availAlts = avail === 'alt' ? allAlts.filter(a => fridgeNames.has(a)) : [];
                          const bg = avail === 'has' ? '#ECF2EE' : avail === 'alt' ? '#FFF8E6' : '#FFF5F5';
                          const border = avail === 'has' ? '#A8C9B8' : avail === 'alt' ? '#F59E0B' : '#FFCCC7';
                          const color = avail === 'has' ? '#4A7362' : avail === 'alt' ? '#B45309' : '#F94239';
                          return (
                            <span key={idx} className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                              style={{ background: bg, border: `1px solid ${border}`, color }}>
                              {avail === 'none' && '✕ '}{displayText}{availAlts.length > 0 ? ` → ${availAlts.join(', ')}` : ''}
                            </span>
                          );
                        })}
                      </div>
                      {r.steps.length > 0 && (
                        <button onClick={() => setExpandedIds(prev => { const n = new Set(prev); n.has(r.id) ? n.delete(r.id) : n.add(r.id); return n; })}
                          className="text-[10px] font-semibold text-[#B0A99F] hover:text-[#4A7362] transition-colors flex items-center gap-1">
                          <span>{expandedIds.has(r.id) ? '▲' : '▼'}</span>
                          조리 순서 {expandedIds.has(r.id) ? '닫기' : '보기'}
                        </button>
                      )}
                      {expandedIds.has(r.id) && r.steps.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-[#F0F0F2]">
                          <div className="flex flex-col gap-1 mb-3">
                            {r.steps.map((s, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0" style={{ background: s.color }}>{i+1}</div>
                                <span className="text-[11px] font-semibold text-[#1A1A1A]">{s.label}</span>
                                <span className="text-[10px] text-[#B0A99F] ml-auto">{s.dur}분</span>
                              </div>
                            ))}
                            <div className="text-[10px] text-[#B0A99F] mt-1 text-right">총 {r.steps.reduce((a,s) => a+s.dur, 0)}분</div>
                          </div>
                          <div className="overflow-x-auto">
                            <div className="flex gap-0.5">
                              {r.steps.map((s, i) => {
                                const totalTime = r.steps.reduce((a, x) => a + x.dur, 0);
                                const widthPct = (s.dur / totalTime) * 100;
                                return (
                                  <div key={i} className="flex flex-col items-start" style={{ width: `${widthPct}%`, minWidth: 32 }}>
                                    <div className="w-full h-[24px] rounded-[4px] flex items-center justify-center px-1 overflow-hidden" style={{ background: s.color }}>
                                      <span className="text-[9px] font-bold text-white truncate">{s.label}</span>
                                    </div>
                                    <span className="text-[9px] text-[#B0A99F] mt-0.5">{s.dur}분</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {selRecipes.length > 0 && (
              <div className={cardCls}>
                <p className="text-[11px] font-bold text-[#B0A99F] tracking-wider mb-3">타임테이블 (5분 단위 · 동시 완성 기준)</p>
                <div className="overflow-x-auto">
                  <table style={{ borderCollapse:'collapse', width:'100%', tableLayout:'fixed' }}>
                    <colgroup>
                      <col style={{ width: 52 }} />
                      {selRecipes.map(r => <col key={r.id} />)}
                    </colgroup>
                    <thead>
                      <tr style={{ borderBottom:'2px solid #E6E6E6' }}>
                        <th style={{ fontSize:10,fontWeight:700,color:'#B0A99F',padding:'6px 8px',textAlign:'left' }}>시간</th>
                        {selRecipes.map(r => (
                          <th key={r.id} style={{ fontSize:11,fontWeight:700,color:'#1A1A1A',padding:'6px 8px',textAlign:'left',borderLeft:'1px solid #E6E6E6' }}>
                            {r.name}
                            <span style={{ display:'block',fontSize:10,fontWeight:400,color:'#B0A99F',marginTop:1 }}>{r.time}분</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({length: totalSlots + 1}).map((_, slotIdx) => {
                        const minuteLabel = `${Math.floor(slotIdx * 5 / 60)}:${String((slotIdx * 5) % 60).padStart(2,'0')}`;
                        const isLast = slotIdx === totalSlots;
                        return (
                          <tr key={slotIdx} style={{ borderBottom: isLast ? '2px solid #4A7362' : '1px solid #F0F0F2', background: isLast ? '#ECF2EE' : slotIdx % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                            <td style={{ fontSize:11,fontWeight:700,color: isLast ? '#4A7362' : '#B0A99F',padding:'8px 8px',whiteSpace:'nowrap',verticalAlign:'top' }}>
                              {isLast ? '완성' : minuteLabel}
                            </td>
                            {selRecipes.map(r => {
                              const offset = maxTime - r.time;
                              const offsetSlots = Math.round(offset / 5);
                              if (isLast) {
                                return <td key={r.id} style={{ padding:'6px 8px', borderLeft:'1px solid #E6E6E6', verticalAlign:'top' }}>
                                  <div style={{ display:'inline-block', background:'#4A7362', color:'#fff', borderRadius:6, padding:'2px 8px', fontSize:11, fontWeight:700 }}>완성 🍽️</div>
                                </td>;
                              }
                              let cur = offsetSlots;
                              let activeStep: {label:string;color:string;isStart:boolean} | null = null;
                              for (const s of r.steps) {
                                const durSlots = Math.ceil(s.dur / 5);
                                if (slotIdx >= cur && slotIdx < cur + durSlots) {
                                  activeStep = { label: s.label, color: s.color, isStart: slotIdx === cur };
                                  break;
                                }
                                cur += durSlots;
                              }
                              if (slotIdx < offsetSlots) {
                                return <td key={r.id} style={{ padding:'8px 8px', borderLeft:'1px solid #E6E6E6', color:'#D1D5DB', fontSize:10, verticalAlign:'top' }}>—</td>;
                              }
                              return (
                                <td key={r.id} style={{ padding:'6px 8px', borderLeft:'1px solid #E6E6E6', verticalAlign:'top' }}>
                                  {activeStep ? (
                                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                      <div style={{ width:10, height:10, borderRadius:'50%', background: activeStep.color, flexShrink:0 }} />
                                      <span style={{ fontSize:12, fontWeight: activeStep.isStart ? 700 : 400, color: activeStep.isStart ? '#1A1A1A' : '#888888' }}>
                                        {activeStep.label}
                                      </span>
                                    </div>
                                  ) : null}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-[#B0A99F] mt-2">※ 짧은 요리는 늦게 시작해 모든 요리가 동시에 완성됩니다.</p>
              </div>
            )}
          </div>
        )}

        {/* 유튜버 검색 */}
        {page === 'youtuber' && (
          <div>
            <h1 className="text-[16px] font-extrabold text-[#1A1A1A] mb-4">유튜버 검색</h1>
            <div className={cardCls}>
              <p className="text-[11px] font-bold text-[#B0A99F] tracking-wider mb-3">유튜버 이름 검색</p>
              <div className="flex gap-2 mb-3">
                <input className={inputCls} placeholder="예: 육식맨, 백종원, 은수저" value={ytQuery}
                  onChange={e => setYtQuery(e.target.value)}
                  onKeyDown={async e => { if (e.key === 'Enter') document.getElementById('yt-search-btn')?.click(); }} />
                <button id="yt-search-btn" disabled={ytLoading2 || !ytQuery.trim()}
                  onClick={async () => {
                    setYtLoading2(true); setYtError2(''); setYtChannel(null); setYtSelected(new Set()); setYtPage(1);
                    try {
                      const res = await fetch('/api/search-channel', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({query: ytQuery}) });
                      const data = await res.json();
                      if (data.error) { setYtError2(data.error); } else { setYtChannel(data); }
                    } catch { setYtError2('검색 실패. 다시 시도해주세요.'); }
                    finally { setYtLoading2(false); }
                  }}
                  className={`${btnCls} flex-shrink-0 disabled:opacity-40`}>
                  {ytLoading2 ? '검색 중...' : '검색'}
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {['냉부해', '승우아빠', '은수저', '육식맨', '이원일', '정호영'].map(name => (
                  <button key={name} onClick={() => { setYtQuery(name); }}
                    className="text-[11px] font-semibold px-3 py-1 rounded-full border border-[#EAE7E2] bg-[#FAF9F7] text-[#888888] hover:border-[#A8C9B8] hover:text-[#4A7362] transition-colors">
                    {name}
                  </button>
                ))}
              </div>
              {ytError2 && <p className="mt-2 text-[11px] text-[#F94239]">{ytError2}</p>}
            </div>

            {ytChannel && (
              <div className={cardCls}>
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#F0F0F2]">
                  {ytChannel.channelThumb && <img src={ytChannel.channelThumb} alt="" className="w-10 h-10 rounded-full object-cover" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-[#1A1A1A]">{ytChannel.channelTitle}</p>
                    <p className="text-[11px] text-[#B0A99F]">{ytChannel.subCount} · 최근 영상 {ytChannel.videos.length}개</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {ytSelected.size > 0 && (
                      <span className="text-[11px] font-semibold text-[#4A7362] bg-[#ECF2EE] border border-[#A8C9B8] rounded-full px-2 py-0.5">
                        {ytSelected.size}개 선택
                      </span>
                    )}
                    <button onClick={() => {
                      const allIds = new Set(ytChannel.videos.map(v => v.id));
                      const allSel = ytChannel.videos.every(v => ytSelected.has(v.id));
                      setYtSelected(allSel ? new Set() : allIds);
                    }} className={btnSmCls}>
                      {ytChannel.videos.every(v => ytSelected.has(v.id)) ? '전체 해제' : '전체 선택'}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-2 mb-4">
                  {ytChannel.videos.map(v => {
                    const sel = ytSelected.has(v.id);
                    return (
                      <div key={v.id} onClick={() => setYtSelected(prev => { const n = new Set(prev); sel ? n.delete(v.id) : n.add(v.id); return n; })}
                        className="flex items-center gap-3 p-2 rounded-[10px] border-2 cursor-pointer transition-all"
                        style={{ borderColor: sel ? '#4A7362' : '#E6E6E6', background: sel ? '#ECF2EE' : '#fff' }}>
                        <div className="relative flex-shrink-0">
                          <img src={v.thumbnail} alt="" className="w-[100px] h-[56px] rounded-[6px] object-cover bg-[#F0F0F2]" />
                          {sel && (
                            <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-[#4A7362] flex items-center justify-center">
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2.5 4-4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-[#1A1A1A] leading-tight line-clamp-2 break-keep mb-1">{v.title}</p>
                          <p className="text-[11px] text-[#B0A99F]">{v.publishedAt}</p>
                          <a href={`https://youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()} className="text-[11px] text-[#1B4F8A] hover:underline">
                            youtube.com/watch?v={v.id}
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between mb-4 pt-2 border-t border-[#F0F0F2]">
                  <button
                    disabled={!ytChannel.prevPageToken || ytLoading2}
                    onClick={async () => {
                      if (!ytChannel.prevPageToken) return;
                      setYtLoading2(true); setYtSelected(new Set());
                      try {
                        const res = await fetch('/api/search-channel', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ channelId: ytChannel.channelId, pageToken: ytChannel.prevPageToken }) });
                        const data = await res.json();
                        if (!data.error) { setYtChannel({...data, channelTitle: ytChannel.channelTitle, channelThumb: ytChannel.channelThumb, subCount: ytChannel.subCount}); setYtPage(p => p - 1); }
                      } finally { setYtLoading2(false); }
                    }}
                    className={`${btnSmCls} disabled:opacity-30`}>← 이전</button>
                  <span className="text-[12px] font-semibold text-[#888888]">
                    {ytPage}페이지 · 영상 총 {ytChannel.totalResults.toLocaleString()}개 (약 {Math.ceil(ytChannel.totalResults / 20)}페이지)
                  </span>
                  <button
                    disabled={!ytChannel.nextPageToken || ytLoading2}
                    onClick={async () => {
                      if (!ytChannel.nextPageToken) return;
                      setYtLoading2(true); setYtSelected(new Set());
                      try {
                        const res = await fetch('/api/search-channel', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ channelId: ytChannel.channelId, pageToken: ytChannel.nextPageToken }) });
                        const data = await res.json();
                        if (!data.error) { setYtChannel({...data, channelTitle: ytChannel.channelTitle, channelThumb: ytChannel.channelThumb, subCount: ytChannel.subCount}); setYtPage(p => p + 1); }
                      } finally { setYtLoading2(false); }
                    }}
                    className={`${btnSmCls} disabled:opacity-30`}>다음 →</button>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => {
                    const vids = ytChannel.videos.filter(v => ytSelected.has(v.id));
                    const text = vids.map(v => `${v.title}\nhttps://youtube.com/watch?v=${v.id}`).join('\n\n');
                    navigator.clipboard.writeText(text).catch(()=>{});
                    alert(`${vids.length}개 링크가 복사됐어요!`);
                  }} disabled={ytSelected.size === 0} className={`${btnSmCls} disabled:opacity-40`}>링크 복사</button>
                  <button
                    onClick={() => {
                      const vids = ytChannel.videos.filter(v => ytSelected.has(v.id));
                      setDrafts(vids.map(v => ({ ...newDraft(), name: v.title, source: ytChannel!.channelTitle, thumbnail: v.thumbnail, youtubeUrl: `https://youtube.com/watch?v=${v.id}` })));
                      setShowAddRecipe(true); setPage('recipe');
                    }}
                    disabled={ytSelected.size === 0}
                    className={`${btnCls} flex-1 disabled:opacity-40`}>
                    {ytSelected.size > 0 ? `선택한 ${ytSelected.size}개 레시피 등록` : '레시피 등록'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {page === 'pending' && (
          <PendingRecipesTab
            cardCls={cardCls}
            btnCls={btnCls}
            btnSmCls={btnSmCls}
            onApprove={(recipe, videoUrl) => {
              const r = recipe as { name?: string; source?: string; time?: number; cuisine?: string; ingredients?: string[]; steps?: {label:string;dur:number}[] };
              setDrafts([{ ...newDraft(), name: r.name ?? '', source: r.source ?? '', time: String(r.time ?? ''), cuisine: r.cuisine ?? '기타', ingRows: (r.ingredients ?? []).map((i: string) => ({ text: i })), stepRows: (r.steps ?? []).map((s: {label:string;dur:number}) => ({ label: s.label, dur: String(s.dur) })), rawIngText: (r.ingredients ?? []).join('\n'), ingError: '', thumbnail: '', youtubeUrl: videoUrl, ytUrl: videoUrl, ytLoading: false, ytError: '', isPublic: false }]);
              setShowAddRecipe(true);
              setPage('recipe');
            }}
          />
        )}
      </main>
    </div>
  );
}

function PendingRecipesTab({ cardCls, btnCls, btnSmCls, onApprove }: {
  cardCls: string;
  btnCls: string;
  btnSmCls: string;
  onApprove: (recipe: Record<string, unknown>, videoUrl: string) => void;
}) {
  const [items, setItems] = useState<Array<{id: string; video_id: string; video_url: string; title: string; thumbnail: string; channel_name: string; recipe: Record<string,unknown>|null; status: string; created_at: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [watchedChannels, setWatchedChannels] = useState<Array<{id:string;channel_id:string;channel_name:string}>>([]);
  const [addChId, setAddChId] = useState('');
  const [addChName, setAddChName] = useState('');
  const [checking, setChecking] = useState(false);

  async function load() {
    setLoading(true);
    const [pr, wc] = await Promise.all([
      fetch('/api/pending-recipes').then(r => r.json()),
      fetch('/api/watch-channel').then(r => r.json()),
    ]);
    if (pr.ok) setItems(pr.recipes ?? []);
    if (wc.ok) setWatchedChannels(wc.channels ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function dismiss(id: string) {
    await fetch('/api/pending-recipes', { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id, status: 'rejected' }) });
    setItems(prev => prev.filter(i => i.id !== id));
  }

  async function addChannel() {
    if (!addChId.trim() || !addChName.trim()) return;
    await fetch('/api/watch-channel', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ channelId: addChId.trim(), channelName: addChName.trim() }) });
    setAddChId(''); setAddChName('');
    load();
  }

  async function removeChannel(channelId: string) {
    await fetch('/api/watch-channel', { method: 'DELETE', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ channelId }) });
    load();
  }

  async function checkNow() {
    setChecking(true);
    await fetch('/api/check-new-videos');
    await load();
    setChecking(false);
  }

  return (
    <div>
      <h1 className="text-[16px] font-extrabold text-[#1A1A1A] mb-4">자동 감지 레시피</h1>

      {/* 감시 채널 관리 */}
      <div className={cardCls + ' mb-4'}>
        <p className="text-[11px] font-bold text-[#B0A99F] tracking-wider mb-3">감시 중인 채널</p>
        {watchedChannels.length === 0 && <p className="text-[12px] text-[#B0A99F] mb-3">아직 등록된 채널이 없어요.</p>}
        <div className="flex flex-col gap-2 mb-3">
          {watchedChannels.map(ch => (
            <div key={ch.id} className="flex items-center justify-between bg-[#F8F7F5] rounded-[10px] px-3 py-2">
              <div>
                <p className="text-[13px] font-semibold text-[#1A1A1A]">{ch.channel_name}</p>
                <p className="text-[11px] text-[#B0A99F]">{ch.channel_id}</p>
              </div>
              <button onClick={() => removeChannel(ch.channel_id)} className="text-[11px] text-[#F94239] font-semibold px-2 py-1 rounded-[6px] hover:bg-[#FFF5F5]">제거</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mb-2">
          <input value={addChName} onChange={e => setAddChName(e.target.value)} placeholder="채널명 (예: 은수저)" className="flex-1 text-[12px] border border-[#EAE7E2] rounded-[8px] px-3 py-2 focus:outline-none focus:border-[#4A7362]" />
          <input value={addChId} onChange={e => setAddChId(e.target.value)} placeholder="채널 ID (UCxx...)" className="flex-1 text-[12px] border border-[#EAE7E2] rounded-[8px] px-3 py-2 focus:outline-none focus:border-[#4A7362]" />
          <button onClick={addChannel} disabled={!addChId.trim() || !addChName.trim()} className={`${btnSmCls} disabled:opacity-40 flex-shrink-0`}>등록</button>
        </div>
        <p className="text-[10px] text-[#B0A99F]">채널 ID는 유튜브 채널 URL의 UC로 시작하는 부분이에요. 매일 오전 9시 자동 확인.</p>
        <button onClick={checkNow} disabled={checking || watchedChannels.length === 0} className={`${btnSmCls} mt-3 w-full disabled:opacity-40`}>
          {checking ? '확인 중...' : '지금 바로 확인'}
        </button>
      </div>

      {/* 대기 중인 레시피 */}
      <div className={cardCls}>
        <p className="text-[11px] font-bold text-[#B0A99F] tracking-wider mb-3">
          대기 중인 레시피 {items.length > 0 && <span className="text-[#4A7362]">({items.length}개)</span>}
        </p>
        {loading && <p className="text-[12px] text-[#B0A99F]">불러오는 중...</p>}
        {!loading && items.length === 0 && <p className="text-[12px] text-[#B0A99F]">대기 중인 레시피가 없어요.</p>}
        <div className="flex flex-col gap-4">
          {items.map(item => (
            <div key={item.id} className="border border-[#EAE7E2] rounded-[12px] overflow-hidden">
              <div className="flex gap-3 p-3 bg-[#F8F7F5]">
                {item.thumbnail && <img src={item.thumbnail} alt="" className="w-[80px] h-[45px] rounded-[6px] object-cover flex-shrink-0 bg-[#E8E8E8]" />}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-[#1A1A1A] leading-tight line-clamp-2 break-keep">{item.title}</p>
                  <p className="text-[11px] text-[#B0A99F] mt-0.5">{item.channel_name} · {item.created_at.slice(0,10)}</p>
                  <a href={item.video_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#1B4F8A] hover:underline">영상 보기 ↗</a>
                </div>
              </div>
              {item.recipe ? (
                <div className="p-3">
                  <p className="text-[12px] font-semibold text-[#1A1A1A] mb-1">{String(item.recipe.name ?? '')}</p>
                  <p className="text-[11px] text-[#888] mb-2">{String(item.recipe.cuisine ?? '')} · {String(item.recipe.time ?? '')}분</p>
                  <p className="text-[11px] font-semibold text-[#B0A99F] mb-1">재료</p>
                  <p className="text-[11px] text-[#555] mb-3 leading-relaxed">
                    {(item.recipe.ingredients as string[] ?? []).join(' · ')}
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => onApprove(item.recipe!, item.video_url)} className={`${btnCls} flex-1`}>
                      레시피 등록 →
                    </button>
                    <button onClick={() => dismiss(item.id)} className={`${btnSmCls} flex-shrink-0`}>건너뛰기</button>
                  </div>
                </div>
              ) : (
                <div className="p-3">
                  <p className="text-[12px] text-[#B0A99F] mb-2">레시피 정보를 자동으로 파싱하지 못했어요.</p>
                  <div className="flex gap-2">
                    <button onClick={() => onApprove({name: item.title, source: item.channel_name, time: 30, cuisine: '기타', ingredients: [], steps: []}, item.video_url)} className={`${btnSmCls} flex-1`}>
                      직접 입력하기
                    </button>
                    <button onClick={() => dismiss(item.id)} className={`${btnSmCls} flex-shrink-0`}>건너뛰기</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}