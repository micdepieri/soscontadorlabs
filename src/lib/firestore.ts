import { getAdminFirestore } from "@/lib/firebase-admin";

// User helpers
export interface FirestoreUser {
  uid: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: "MEMBER" | "ADMIN";
  createdAt: string;
  updatedAt: string;
}

export async function getUserByUid(uid: string): Promise<FirestoreUser | null> {
  const db = getAdminFirestore();
  const doc = await db.collection("users").doc(uid).get();
  if (!doc.exists) return null;
  return { uid: doc.id, ...doc.data() } as FirestoreUser;
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
  isHidden: boolean;
  likes: string[]; // array of user UIDs who liked
  createdAt: string;
  updatedAt: string;
}

export async function getComments(
  contentId: string,
  contentType: "video" | "material"
): Promise<FirestoreComment[]> {
  const db = getAdminFirestore();
  const field = contentType === "video" ? "videoId" : "materialId";
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
