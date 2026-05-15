export type BucketCategory = "travel" | "challenge" | "relation" | "other";

export const BUCKET_CATEGORY_LABEL: Record<BucketCategory, string> = {
  travel: "여행",
  challenge: "도전",
  relation: "관계",
  other: "기타",
};

export type BucketRow = {
  id: string;
  user_id: string;
  title: string;
  category: BucketCategory;
  is_completed: boolean;
  created_at: string;
  share_slug: string | null;
};

export type LocalBucketItem = {
  id: string;
  title: string;
  category: BucketCategory;
  is_completed: boolean;
  created_at: string;
};

export const LOCAL_STORAGE_KEY = "kongnamu-bucket-list-v1";
