import { getAdminFirestore } from "@/lib/firebase-admin";

// User helpers
export interface FirestoreUser {
  uid: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: "MEMBER" | "ADMIN";
  bio: string | null;
  city: string | null;
  state: string | null;
  skills: string[];
  linkedin: string | null;
  instagram: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function updateUserProfile(
  uid: string,
  data: {
    name?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
    city?: string | null;
    state?: string | null;
    skills?: string[];
    linkedin?: string | null;
    instagram?: string | null;
    phone?: string | null;
  }
) {
  const db = getAdminFirestore();
  await db
    .collection("users")
    .doc(uid)
    .update({ ...data, updatedAt: new Date().toISOString() });
}

export async function getUsers(): Promise<FirestoreUser[]> {
  const db = getAdminFirestore();
  const snapshot = await db.collection("users").orderBy("createdAt", "desc").get();
  return snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }) as FirestoreUser);
}

export async function getUserByUid(uid: string): Promise<FirestoreUser | null> {
  const db = getAdminFirestore();
  const doc = await db.collection("users").doc(uid).get();
  if (!doc.exists) return null;
  return { uid: doc.id, ...doc.data() } as FirestoreUser;
}

export async function searchUsers(q: string): Promise<FirestoreUser[]> {
  const db = getAdminFirestore();
  const query = q.toLowerCase();
  
  // For simplicity and to avoid complex indices now, we fetch all and filter 
  // (In production with many users, we'd use Algolia or specialized Firestore query)
  const snapshot = await db.collection("users").get();
  return snapshot.docs
    .map(doc => ({ uid: doc.id, ...doc.data() } as FirestoreUser))
    .filter(u => 
      u.name?.toLowerCase().includes(query) || 
      u.email?.toLowerCase().includes(query)
    )
    .slice(0, 10);
}

export async function upsertUser(data: Partial<FirestoreUser> & { uid: string; email: string }) {
  const db = getAdminFirestore();
  const ref = db.collection("users").doc(data.uid);
  const doc = await ref.get();

  if (doc.exists) {
    await ref.update({ ...data, updatedAt: new Date().toISOString() });
  } else {
    await ref.set({
      ...data,
      name: data.name || null,
      avatarUrl: data.avatarUrl || null,
      role: data.role || "MEMBER",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

// Video helpers
export interface FirestoreVideo {
  id: string;
  title: string;
  description: string | null;
  url: string;
  thumbnail: string | null;
  categoryId: string | null;
  tags: string[];
  isPremium: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getVideos(filters?: {
  categoryId?: string;
  search?: string;
  publishedOnly?: boolean;
}): Promise<FirestoreVideo[]> {
  const db = getAdminFirestore();
  let query: FirebaseFirestore.Query = db.collection("videos");

  if (filters?.publishedOnly !== false) {
    query = query.where("publishedAt", "!=", null);
  }
  if (filters?.categoryId) {
    query = query.where("categoryId", "==", filters.categoryId);
  }

  const snapshot = await query.orderBy("publishedAt", "desc").get();
  let videos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as FirestoreVideo);

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    videos = videos.filter(
      (v) =>
        v.title.toLowerCase().includes(q) ||
        v.description?.toLowerCase().includes(q) ||
        v.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  return videos;
}

export async function getVideoById(id: string): Promise<FirestoreVideo | null> {
  const db = getAdminFirestore();
  const doc = await db.collection("videos").doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as FirestoreVideo;
}

export async function createVideo(data: Omit<FirestoreVideo, "id" | "createdAt" | "updatedAt">) {
  const db = getAdminFirestore();
  const now = new Date().toISOString();
  const ref = await db.collection("videos").add({ ...data, createdAt: now, updatedAt: now });
  return { id: ref.id, ...data, createdAt: now, updatedAt: now };
}

export async function deleteVideo(id: string) {
  const db = getAdminFirestore();
  await db.collection("videos").doc(id).delete();
}

export async function updateVideo(id: string, data: Partial<FirestoreVideo>) {
  const db = getAdminFirestore();
  const now = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _, createdAt: __, ...updateData } = data;
  await db
    .collection("videos")
    .doc(id)
    .update({ ...updateData, updatedAt: now });
}

// Material helpers
export interface FirestoreMaterial {
  id: string;
  title: string;
  description: string | null;
  type: "PDF" | "LINK" | "RESOURCE";
  url: string;
  categoryId: string | null;
  tags: string[];
  isPremium: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getMaterials(filters?: {
  categoryId?: string;
  type?: string;
  search?: string;
  publishedOnly?: boolean;
}): Promise<FirestoreMaterial[]> {
  const db = getAdminFirestore();
  let query: FirebaseFirestore.Query = db.collection("materials");

  if (filters?.publishedOnly !== false) {
    query = query.where("publishedAt", "!=", null);
  }
  if (filters?.categoryId) {
    query = query.where("categoryId", "==", filters.categoryId);
  }
  if (filters?.type) {
    query = query.where("type", "==", filters.type);
  }

  const snapshot = await query.orderBy("publishedAt", "desc").get();
  let materials = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as FirestoreMaterial);

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    materials = materials.filter(
      (m) => m.title.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q)
    );
  }

  return materials;
}

export async function getMaterialById(id: string): Promise<FirestoreMaterial | null> {
  const db = getAdminFirestore();
  const doc = await db.collection("materials").doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as FirestoreMaterial;
}

export async function createMaterial(
  data: Omit<FirestoreMaterial, "id" | "createdAt" | "updatedAt">
) {
  const db = getAdminFirestore();
  const now = new Date().toISOString();
  const ref = await db.collection("materials").add({ ...data, createdAt: now, updatedAt: now });
  return { id: ref.id, ...data, createdAt: now, updatedAt: now };
}

export async function deleteMaterial(id: string) {
  const db = getAdminFirestore();
  await db.collection("materials").doc(id).delete();
}

export async function updateMaterial(id: string, data: Partial<FirestoreMaterial>) {
  const db = getAdminFirestore();
  const now = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _, createdAt: __, ...updateData } = data;
  await db
    .collection("materials")
    .doc(id)
    .update({ ...updateData, updatedAt: now });
}

// Category helpers
export interface FirestoreCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
}

export async function getCategories(): Promise<FirestoreCategory[]> {
  const db = getAdminFirestore();
  const snapshot = await db.collection("categories").orderBy("name", "asc").get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as FirestoreCategory);
}

export async function createCategory(data: Omit<FirestoreCategory, "id" | "createdAt">) {
  const db = getAdminFirestore();
  const now = new Date().toISOString();
  const ref = await db.collection("categories").add({ ...data, createdAt: now });
  return { id: ref.id, ...data, createdAt: now };
}

export async function deleteCategory(id: string) {
  const db = getAdminFirestore();
  await db.collection("categories").doc(id).delete();
}

export async function updateCategory(id: string, data: Partial<FirestoreCategory>) {
  const db = getAdminFirestore();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _, createdAt: __, ...updateData } = data;
  await db.collection("categories").doc(id).update(updateData);
}

// Comment helpers
export interface FirestoreComment {
  id: string;
  content: string;
  authorId: string;
  authorName: string | null;
  authorAvatarUrl: string | null;
  videoId: string | null;
  materialId: string | null;
  parentId: string | null;
  imageUrl?: string | null; // Added field for image attachments
  isHidden: boolean;
  likes: string[]; // array of user UIDs who liked
  createdAt: string;
  updatedAt: string;
}

export async function getComments(
  contentId: string,
  contentType: "video" | "material" | "post"
): Promise<FirestoreComment[]> {
  const db = getAdminFirestore();
  const fieldMapping = {
    video: "videoId",
    material: "materialId",
    post: "postId",
  };
  const field = fieldMapping[contentType];
  try {
    const snapshot = await db
      .collection("comments")
      .where(field, "==", contentId)
      .where("isHidden", "==", false)
      .orderBy("createdAt", "desc")
      .get();

    const allComments = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as FirestoreComment
    );

    // Separate top-level and replies
    const topLevel = allComments.filter((c) => !c.parentId);
    const replies = allComments.filter((c) => c.parentId);

    // Attach replies to parents
    return topLevel.map((comment) => ({
      ...comment,
      replies: replies
        .filter((r) => r.parentId === comment.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    }));
  } catch (error: any) {
    if (error.message?.includes("requires an index")) {
      console.warn(
        "⚠️ Firestore Index required for comments. Please create it using the link in the console."
      );
    } else {
      console.error("Error fetching comments:", error);
    }
    return [];
  }
}

export async function createComment(
  data: Omit<FirestoreComment, "id" | "createdAt" | "updatedAt" | "likes" | "isHidden">
) {
  const db = getAdminFirestore();
  const now = new Date().toISOString();
  const ref = await db.collection("comments").add({
    ...data,
    isHidden: false,
    likes: [],
    createdAt: now,
    updatedAt: now,
  });
  return { id: ref.id, ...data, isHidden: false, likes: [], createdAt: now, updatedAt: now };
}

export async function toggleCommentLike(commentId: string, uid: string): Promise<boolean> {
  const db = getAdminFirestore();
  const ref = db.collection("comments").doc(commentId);
  const doc = await ref.get();

  if (!doc.exists) return false;

  const data = doc.data() as FirestoreComment;
  const likes = data.likes || [];
  const hasLiked = likes.includes(uid);

  if (hasLiked) {
    await ref.update({ likes: likes.filter((id) => id !== uid) });
    return false;
  } else {
    await ref.update({ likes: [...likes, uid] });
    return true;
  }
}

// Content Request helpers
export interface FirestoreContentRequest {
  id: string;
  userId: string;
  userName: string | null;
  topic: string;
  userMessage: string;
  status: "PENDING" | "IN_PROGRESS" | "DONE" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
}

export async function getContentRequests(): Promise<FirestoreContentRequest[]> {
  const db = getAdminFirestore();
  const snapshot = await db.collection("content_requests").orderBy("createdAt", "desc").get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as FirestoreContentRequest);
}

export async function createContentRequest(
  data: Omit<FirestoreContentRequest, "id" | "createdAt" | "updatedAt" | "status">
) {
  const db = getAdminFirestore();
  const now = new Date().toISOString();
  const ref = await db
    .collection("content_requests")
    .add({ ...data, status: "PENDING", createdAt: now, updatedAt: now });
  return { id: ref.id, ...data, status: "PENDING" as const, createdAt: now, updatedAt: now };
}

export async function updateContentRequest(id: string, data: Partial<FirestoreContentRequest>) {
  const db = getAdminFirestore();
  const now = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _, createdAt: __, ...updateData } = data;
  await db.collection("content_requests").doc(id).update({ ...updateData, updatedAt: now });
}

export async function deleteContentRequest(id: string) {
  const db = getAdminFirestore();
  await db.collection("content_requests").doc(id).delete();
}

// Subscription helpers
export interface FirestoreSubscription {
  id: string;
  userId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  status: "ACTIVE" | "INACTIVE" | "CANCELLED" | "PAST_DUE";
  currentPeriodEnd: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getSubscription(userId: string): Promise<FirestoreSubscription | null> {
  const db = getAdminFirestore();
  const snapshot = await db
    .collection("subscriptions")
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as FirestoreSubscription;
}

export async function upsertSubscription(
  userId: string,
  data: Partial<Omit<FirestoreSubscription, "id" | "userId">>
) {
  const db = getAdminFirestore();
  const snapshot = await db
    .collection("subscriptions")
    .where("userId", "==", userId)
    .limit(1)
    .get();

  const now = new Date().toISOString();

  if (snapshot.empty) {
    await db.collection("subscriptions").add({
      userId,
      ...data,
      status: data.status || "INACTIVE",
      stripeCustomerId: data.stripeCustomerId || null,
      stripeSubscriptionId: data.stripeSubscriptionId || null,
      stripePriceId: data.stripePriceId || null,
      currentPeriodEnd: data.currentPeriodEnd || null,
      createdAt: now,
      updatedAt: now,
    });
  } else {
    const doc = snapshot.docs[0];
    await doc.ref.update({ ...data, updatedAt: now });
  }
}

export async function getAllSubscriptions(): Promise<FirestoreSubscription[]> {
  const db = getAdminFirestore();
  const snapshot = await db.collection("subscriptions").get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as FirestoreSubscription);
}

export async function updateSubscriptionByStripeId(
  stripeSubscriptionId: string,
  data: Partial<FirestoreSubscription>
) {
  const db = getAdminFirestore();
  const snapshot = await db
    .collection("subscriptions")
    .where("stripeSubscriptionId", "==", stripeSubscriptionId)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    await doc.ref.update({ ...data, updatedAt: new Date().toISOString() });
  }
}

// Blog Post helpers
export interface FirestorePost {
  id: string;
  title: string;
  slug: string; // URL friendly ID
  content: string; // Markdown or HTML
  authorId: string;
  authorName: string | null;
  authorAvatarUrl: string | null;
  thumbnail?: string | null;
  categoryId: string | null;
  tags: string[];
  isPremium: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getPosts(filters?: {
  categoryId?: string;
  search?: string;
  publishedOnly?: boolean;
}): Promise<FirestorePost[]> {
  const db = getAdminFirestore();
  let query: FirebaseFirestore.Query = db.collection("posts");

  if (filters?.publishedOnly !== false) {
    query = query.where("publishedAt", "!=", null);
  }
  if (filters?.categoryId) {
    query = query.where("categoryId", "==", filters.categoryId);
  }

  const snapshot = await query.orderBy("publishedAt", "desc").get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as FirestorePost));
}

export async function getPostById(id: string): Promise<FirestorePost | null> {
  const db = getAdminFirestore();
  const doc = await db.collection("posts").doc(id).get();
  if (doc.exists) return { id: doc.id, ...doc.data() } as FirestorePost;

  // Try slug matching
  const slugSnapshot = await db.collection("posts").where("slug", "==", id).get();
  if (!slugSnapshot.empty) {
    const doc = slugSnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as FirestorePost;
  }
  return null;
}

export async function upsertPost(data: Partial<FirestorePost> & { id?: string }) {
  const db = getAdminFirestore();
  const now = new Date().toISOString();
  const id = data.id || db.collection("posts").doc().id;
  const ref = db.collection("posts").doc(id);
  const doc = await ref.get();

  if (doc.exists) {
    await ref.update({ ...data, updatedAt: now });
  } else {
    await ref.set({
      ...data,
      publishedAt: data.publishedAt || (data.publishedAt === undefined ? null : data.publishedAt),
      createdAt: now,
      updatedAt: now,
    });
  }
  return { id, ...data };
}

export async function deletePost(id: string) {
  const db = getAdminFirestore();
  await db.collection("posts").doc(id).delete();
}

// AI Settings helpers
export type AIProvider = "anthropic" | "openai";

export interface AISettings {
  provider: AIProvider;
  model: string;
  anthropicApiKey: string;
  openaiApiKey: string;
  openaiBaseUrl: string;
  updatedAt: string;
}

const AI_SETTINGS_DOC = "ai_config";

export async function getAISettings(): Promise<AISettings> {
  const db = getAdminFirestore();
  const doc = await db.collection("settings").doc(AI_SETTINGS_DOC).get();
  if (!doc.exists) {
    return {
      provider: "anthropic",
      model: "claude-haiku-4-5",
      anthropicApiKey: "",
      openaiApiKey: "",
      openaiBaseUrl: "",
      updatedAt: new Date().toISOString(),
    };
  }
  const data = doc.data()!;
  return {
    provider: data.provider ?? "anthropic",
    model: data.model ?? "claude-haiku-4-5",
    anthropicApiKey: data.anthropicApiKey ?? "",
    openaiApiKey: data.openaiApiKey ?? "",
    openaiBaseUrl: data.openaiBaseUrl ?? "",
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  };
}

export async function updateAISettings(data: Partial<AISettings>) {
  const db = getAdminFirestore();
  await db
    .collection("settings")
    .doc(AI_SETTINGS_DOC)
    .set({ ...data, updatedAt: new Date().toISOString() }, { merge: true });
}

// Community Settings helpers
export interface CommunitySettings {
  communityName: string;
  communityTagline: string;
  updatedAt: string;
}

const COMMUNITY_SETTINGS_DOC = "community_config";

export async function getCommunitySettings(): Promise<CommunitySettings> {
  const db = getAdminFirestore();
  const doc = await db.collection("settings").doc(COMMUNITY_SETTINGS_DOC).get();
  if (!doc.exists) {
    return {
      communityName: "Comunidade",
      communityTagline: "Portal da Comunidade",
      updatedAt: new Date().toISOString(),
    };
  }
  const data = doc.data()!;
  return {
    communityName: data.communityName ?? "Comunidade",
    communityTagline: data.communityTagline ?? "Portal da Comunidade",
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  };
}

export async function updateCommunitySettings(data: Partial<CommunitySettings>) {
  const db = getAdminFirestore();
  await db
    .collection("settings")
    .doc(COMMUNITY_SETTINGS_DOC)
    .set({ ...data, updatedAt: new Date().toISOString() }, { merge: true });
}

// Stripe Settings helpers
export interface StripeSettings {
  secretKey: string;
  publishableKey: string;
  webhookSecret: string;
  priceId: string;
  updatedAt: string;
}

const STRIPE_SETTINGS_DOC = "stripe_config";

export async function getStripeSettings(): Promise<StripeSettings> {
  const db = getAdminFirestore();
  const doc = await db.collection("settings").doc(STRIPE_SETTINGS_DOC).get();
  if (!doc.exists) {
    return {
      secretKey: "",
      publishableKey: "",
      webhookSecret: "",
      priceId: "",
      updatedAt: new Date().toISOString(),
    };
  }
  const data = doc.data()!;
  return {
    secretKey: data.secretKey ?? "",
    publishableKey: data.publishableKey ?? "",
    webhookSecret: data.webhookSecret ?? "",
    priceId: data.priceId ?? "",
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  };
}

export async function updateStripeSettings(data: Partial<StripeSettings>) {
  const db = getAdminFirestore();
  await db
    .collection("settings")
    .doc(STRIPE_SETTINGS_DOC)
    .set({ ...data, updatedAt: new Date().toISOString() }, { merge: true });
}

// XP / Gamification helpers

export type ContentType = "video" | "material" | "post";

export interface FirestoreContentProgress {
  userId: string;
  contentId: string;
  contentType: ContentType;
  consumedAt: string;
}

export interface FirestoreUserXP {
  userId: string;
  totalXP: number;
  level: number;
  contentConsumed: number;
  updatedAt: string;
}

export interface FirestoreXPTransaction {
  id: string;
  userId: string;
  contentId: string;
  contentType: ContentType;
  xpAmount: number;
  createdAt: string;
}

export const XP_VALUES: Record<ContentType, number> = {
  video: 10,
  material: 5,
  post: 5,
};

export function calcLevel(xp: number): number {
  if (xp >= 700) return 5;
  if (xp >= 350) return 4;
  if (xp >= 150) return 3;
  if (xp >= 50) return 2;
  return 1;
}

export const LEVEL_LABELS: Record<number, string> = {
  1: "Iniciante",
  2: "Aprendiz",
  3: "Praticante",
  4: "Especialista",
  5: "Mestre",
};

/** Mark a content as consumed. Returns the XP awarded (0 if already consumed). */
export async function markContentConsumed(
  userId: string,
  contentId: string,
  contentType: ContentType
): Promise<number> {
  const db = getAdminFirestore();
  const progressId = `${userId}_${contentId}`;
  const progressRef = db.collection("content_progress").doc(progressId);
  const existing = await progressRef.get();

  if (existing.exists) return 0; // already consumed, no XP

  const now = new Date().toISOString();
  const xpAmount = XP_VALUES[contentType];

  // Write progress doc
  await progressRef.set({ userId, contentId, contentType, consumedAt: now });

  // Log XP transaction
  await db.collection("xp_transactions").add({
    userId,
    contentId,
    contentType,
    xpAmount,
    createdAt: now,
  });

  // Update user XP (upsert)
  const xpRef = db.collection("user_xp").doc(userId);
  const xpDoc = await xpRef.get();
  if (xpDoc.exists) {
    const data = xpDoc.data() as FirestoreUserXP;
    const newXP = data.totalXP + xpAmount;
    await xpRef.update({
      totalXP: newXP,
      level: calcLevel(newXP),
      contentConsumed: data.contentConsumed + 1,
      updatedAt: now,
    });
  } else {
    await xpRef.set({
      userId,
      totalXP: xpAmount,
      level: calcLevel(xpAmount),
      contentConsumed: 1,
      updatedAt: now,
    });
  }

  return xpAmount;
}

/** Check if a user has consumed a specific content. */
export async function getUserContentProgress(
  userId: string,
  contentId: string
): Promise<boolean> {
  const db = getAdminFirestore();
  const doc = await db.collection("content_progress").doc(`${userId}_${contentId}`).get();
  return doc.exists;
}

/** Get XP data for a single user. */
export async function getUserXP(userId: string): Promise<FirestoreUserXP | null> {
  const db = getAdminFirestore();
  const doc = await db.collection("user_xp").doc(userId).get();
  if (!doc.exists) return null;
  return { userId, ...doc.data() } as FirestoreUserXP;
}

/** Get XP data for all users (for leaderboard). */
export async function getAllUsersXP(): Promise<FirestoreUserXP[]> {
  const db = getAdminFirestore();
  const snapshot = await db.collection("user_xp").orderBy("totalXP", "desc").get();
  return snapshot.docs.map((doc) => ({ userId: doc.id, ...doc.data() }) as FirestoreUserXP);
}

/** Analytics overview: top content by consumption count. */
export async function getContentConsumptionStats(): Promise<
  Record<string, { count: number; contentType: ContentType }>
> {
  const db = getAdminFirestore();
  const snapshot = await db.collection("content_progress").get();
  const stats: Record<string, { count: number; contentType: ContentType }> = {};
  snapshot.docs.forEach((doc) => {
    const { contentId, contentType } = doc.data() as FirestoreContentProgress;
    if (!stats[contentId]) stats[contentId] = { count: 0, contentType };
    stats[contentId].count += 1;
  });
  return stats;
}

/** Total XP transactions count and sum. */
export async function getXPOverview(): Promise<{ totalXPDistributed: number; totalConsumptions: number; activeMembers: number }> {
  const db = getAdminFirestore();
  const [txSnap, xpSnap] = await Promise.all([
    db.collection("xp_transactions").get(),
    db.collection("user_xp").get(),
  ]);
  const totalXPDistributed = txSnap.docs.reduce((acc, d) => acc + (d.data().xpAmount as number), 0);
  return {
    totalXPDistributed,
    totalConsumptions: txSnap.size,
    activeMembers: xpSnap.size,
  };
}

// Rating helpers
export interface FirestoreRating {
  userId: string;
  contentId: string;
  contentType: "video" | "material" | "post";
  value: number; // 1-5 (stars or thermometer level)
  createdAt: string;
}

export async function saveRating(data: Omit<FirestoreRating, "createdAt">) {
  const db = getAdminFirestore();
  const ratingId = `${data.userId}_${data.contentId}`;
  const now = new Date().toISOString();
  await db.collection("ratings").doc(ratingId).set({
    ...data,
    createdAt: now
  });
}

export async function getContentRatingStats(contentId: string) {
  const db = getAdminFirestore();
  try {
    const snapshot = await db.collection("ratings")
      .where("contentId", "==", contentId)
      .get();

    if (snapshot.empty) return { average: 0, count: 0 };

    const values = snapshot.docs.map(doc => doc.data().value as number);
    const total = values.reduce((acc, v) => acc + v, 0);
    return {
      average: parseFloat((total / values.length).toFixed(1)),
      count: values.length
    };
  } catch (error) {
    console.error("Error fetching rating stats:", error);
    return { average: 0, count: 0 };
  }
}

export async function getUserRating(userId: string, contentId: string) {
  const db = getAdminFirestore();
  const doc = await db.collection("ratings").doc(`${userId}_${contentId}`).get();
  if (!doc.exists) return null;
  return doc.data()!.value as number;
}

export async function getAllContentStats() {
  const db = getAdminFirestore();
  const snapshot = await db.collection("ratings").get();
  
  const stats: Record<string, { total: number; count: number; average: number }> = {};
  
  snapshot.docs.forEach(doc => {
    const { contentId, value } = doc.data();
    if (!stats[contentId]) {
      stats[contentId] = { total: 0, count: 0, average: 0 };
    }
    stats[contentId].total += value;
    stats[contentId].count += 1;
  });
  
  Object.keys(stats).forEach(id => {
    stats[id].average = parseFloat((stats[id].total / stats[id].count).toFixed(1));
  });
  
  return stats;
}

