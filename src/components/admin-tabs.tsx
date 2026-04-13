"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminAnalyticsTab from "@/components/admin-analytics-tab";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Video {
  id: string;
  title: string;
  url: string;
  description: string | null;
  isPremium: boolean;
  isPinned?: boolean;
  publishedAt: Date | null;
  category: Category | null;
  tags: string[];
}

interface Material {
  id: string;
  title: string;
  url: string;
  type: string;
  description: string | null;
  isPremium: boolean;
  isPinned?: boolean;
  publishedAt: Date | null;
  category: Category | null;
  tags: string[];
}

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  isPremium: boolean;
  isPinned?: boolean;
  publishedAt: Date | null;
  category: Category | null;
  tags: string[];
}

type Tab = "videos" | "materials" | "posts" | "categories" | "demands" | "settings" | "members" | "analytics" | "events";

interface AISettingsData {
  provider: "anthropic" | "openai";
  model: string;
  anthropicApiKeySet: boolean;
  anthropicApiKeyMasked: string;
  openaiApiKeySet: boolean;
  openaiApiKeyMasked: string;
  openaiBaseUrl: string;
  updatedAt: string;
}

interface CommunitySettingsData {
  communityName: string;
  communityTagline: string;
  updatedAt: string;
}

interface EmailSettingsData {
  enabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPasswordSet: boolean;
  smtpPasswordMasked: string;
  smtpSecure: boolean;
  senderName: string;
  senderEmail: string;
  updatedAt?: string;
}

interface StripeSettingsData {
  publishableKey: string;
  publishableKeySet: boolean;
  secretKeySet: boolean;
  secretKeyMasked: string;
  webhookSecretSet: boolean;
  webhookSecretMasked: string;
  priceId: string;
  updatedAt: string;
}

interface Member {
  uid: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: "MEMBER" | "ADMIN";
  createdAt: string;
  subscription: {
    status: "ACTIVE" | "INACTIVE" | "CANCELLED" | "PAST_DUE" | null;
    currentPeriodEnd: string | null;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    stripePriceId: string | null;
  } | null;
}

interface ContentRequest {
  id: string;
  userId: string;
  userName: string | null;
  topic: string;
  userMessage: string;
  status: "PENDING" | "IN_PROGRESS" | "DONE" | "CANCELLED";
  createdAt: string;
}

interface EventData {
  id: string;
  title: string;
  description: string | null;
  type: "WEBINAR" | "LIVE" | "WORKSHOP" | "OUTRO";
  startDate: string;
  endDate: string | null;
  registrationUrl: string | null;
  thumbnail: string | null;
  isPremium: boolean;
  publishedAt: string | null;
}

export default function AdminTabs({
  videos,
  materials,
  posts,
  categories,
  contentRequests,
  aiSettings,
  stripeSettings,
  communitySettings = { communityName: "Comunidade", communityTagline: "Portal da Comunidade", updatedAt: "" },
  emailSettings,
  members,
  ratingStats,
  events = [],
}: {
  videos: Video[];
  materials: Material[];
  posts: Post[];
  categories: Category[];
  contentRequests: ContentRequest[];
  aiSettings: AISettingsData;
  stripeSettings: StripeSettingsData;
  communitySettings: CommunitySettingsData;
  emailSettings: EmailSettingsData;
  members: Member[];
  ratingStats: Record<string, { total: number; count: number; average: number }>;
  events?: EventData[];
}) {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("videos");
  const router = useRouter();

  useEffect(() => {
    const t = searchParams.get("tab") as Tab;
    if (
      t &&
      (["videos", "materials", "posts", "categories", "demands", "settings", "members", "analytics", "events"] as Tab[]).includes(t)
    ) {
      setTab(t);
    }
  }, [searchParams]);

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", newTab);
    router.replace(`/admin?${params.toString()}`);
  };

  const pendingCount = contentRequests.filter((r) => r.status === "PENDING").length;

  return (
    <div>
      {/* Tab nav */}
      <div className="mb-8 border-b border-app-border overflow-x-auto">
        <div className="flex gap-6 min-w-max pb-px">
          {(["videos", "materials", "posts", "categories", "demands", "events", "settings", "members", "analytics"] as Tab[]).map(
            (t) => (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                className={`relative border-b-2 pb-3 text-sm font-medium transition-colors ${
                  tab === t
                    ? "border-cyan-ia text-cyan-ia"
                    : "border-transparent text-cloud-white/50 hover:text-cloud-white"
                }`}
              >
                {t === "videos"
                  ? "Vídeos"
                  : t === "materials"
                  ? "Materiais"
                  : t === "posts"
                  ? "Artigos"
                  : t === "categories"
                  ? "Categorias"
                  : t === "demands"
                  ? "Demandas IA"
                  : t === "events"
                  ? "Eventos"
                  : t === "members"
                  ? "Membros"
                  : t === "analytics"
                  ? "Analytics"
                  : "Configurações"}
                {t === "demands" && pendingCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {pendingCount}
                  </span>
                )}
              </button>
            )
          )}
        </div>
      </div>

      {tab === "videos" && (
        <VideoTab
          videos={videos}
          categories={categories}
          ratingStats={ratingStats}
          onSave={() => router.refresh()}
        />
      )}
      {tab === "materials" && (
        <MaterialTab
          materials={materials}
          categories={categories}
          ratingStats={ratingStats}
          onSave={() => router.refresh()}
        />
      )}
      {tab === "posts" && (
        <PostTab posts={posts} categories={categories} ratingStats={ratingStats} onSave={() => router.refresh()} />
      )}
      {tab === "categories" && (
        <CategoryTab categories={categories} onSave={() => router.refresh()} />
      )}
      {tab === "demands" && (
        <ContentRequestsTab requests={contentRequests} onSave={() => router.refresh()} />
      )}
      {tab === "settings" && (
        <SettingsSection
          aiSettings={aiSettings}
          stripeSettings={stripeSettings}
          communitySettings={communitySettings}
          emailSettings={emailSettings}
          onSave={() => router.refresh()}
        />
      )}
      {tab === "members" && (
        <MembersTab initialMembers={members} onSave={() => router.refresh()} />
      )}
      {tab === "analytics" && <AdminAnalyticsTab />}
      {tab === "events" && (
        <EventTab events={events} onSave={() => router.refresh()} />
      )}
    </div>
  );
}

function VideoTab({
  videos,
  categories,
  ratingStats,
  onSave,
}: {
  videos: Video[];
  categories: Category[];
  ratingStats: Record<string, { total: number; count: number; average: number }>;
  onSave: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    url: "",
    description: "",
    categoryId: "",
    tags: "",
    isPremium: false,
    publish: true,
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const data = {
      ...form,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      publishedAt: form.publish ? new Date().toISOString() : null,
    };

    const url = editingId ? `/api/admin/videos/${editingId}` : "/api/admin/videos";
    const method = editingId ? "PATCH" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setSaving(false);
    handleCancel();
    onSave();
  }

  function handleEdit(video: Video) {
    setEditingId(video.id);
    setForm({
      title: video.title,
      url: video.url,
      description: video.description || "",
      categoryId: video.category?.id || "",
      tags: video.tags.join(", "),
      isPremium: video.isPremium,
      publish: !!video.publishedAt,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setForm({
      title: "",
      url: "",
      description: "",
      categoryId: "",
      tags: "",
      isPremium: false,
      publish: true,
    });
  }

  async function handlePin(video: Video) {
    await fetch(`/api/admin/videos/${video.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !video.isPinned }),
    });
    onSave();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este vídeo?")) return;
    await fetch(`/api/admin/videos/${id}`, { method: "DELETE" });
    onSave();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-semibold text-cloud-white">{videos.length} vídeos</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-tech-blue px-4 py-2 text-sm text-white transition-colors hover:bg-tech-blue/80"
          >
            + Adicionar vídeo
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 space-y-4 rounded-xl border border-app-border bg-midnight-blue p-6"
        >
          <h3 className="text-sm font-bold text-cyan-ia">
            {editingId ? "Editar vídeo" : "Novo vídeo"}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-cloud-white/70">Título *</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-app-border px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-cloud-white/70">URL do vídeo *</label>
              <input
                required
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="YouTube, Vimeo ou embed URL"
                className="w-full rounded-lg border border-app-border px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-cloud-white/70">Descrição</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-app-border px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-cloud-white/70">Categoria</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full rounded-lg border border-app-border px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none"
              >
                <option value="">Sem categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-cloud-white/70">
                Tags (separadas por vírgula)
              </label>
              <input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="w-full rounded-lg border border-app-border px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-cloud-white/70">
              <input
                type="checkbox"
                checked={form.isPremium}
                onChange={(e) => setForm({ ...form, isPremium: e.target.checked })}
                className="rounded text-cyan-ia focus:ring-cyan-ia"
              />
              Premium
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-cloud-white/70">
              <input
                type="checkbox"
                checked={form.publish}
                onChange={(e) => setForm({ ...form, publish: e.target.checked })}
                className="rounded text-cyan-ia focus:ring-cyan-ia"
              />
              Publicar agora
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-tech-blue px-6 py-2 text-sm font-semibold text-white hover:bg-tech-blue/80 disabled:opacity-60"
            >
              {saving ? "Salvando..." : editingId ? "Atualizar" : "Salvar"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-app-border px-6 py-2 text-sm font-medium text-cloud-white/70 hover:bg-midnight-blue"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {videos.map((video) => (
          <div
            key={video.id}
            className="flex items-center justify-between rounded-xl border border-app-border bg-midnight-blue px-5 py-4 shadow-sm"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-cloud-white">{video.title}</p>
              <p className="truncate text-xs text-cloud-white/40">{video.url}</p>
              {video.category && (
                <span className="mt-1 inline-block rounded-md bg-tech-blue/20 px-1.5 py-0.5 text-[10px] font-medium text-cyan-ia">
                  {video.category.name}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-6">
              {/* Rating/Thermometer */}
              {ratingStats[video.id] && ratingStats[video.id].count > 0 && (
                <div className="flex flex-col items-center">
                   <div className="flex items-center gap-1">
                      <span className="text-lg">🔥</span>
                      <span className="text-sm font-black text-cloud-white">{ratingStats[video.id].average}</span>
                   </div>
                   <div className="text-[9px] font-bold text-cloud-white/40 uppercase tracking-tighter">{ratingStats[video.id].count} votos</div>
                </div>
              )}
            </div>
            
            <div className="ml-4 flex shrink-0 items-center gap-4">
              {video.isPinned && (
                <span className="rounded-full bg-cyan-ia/20 px-2 py-0.5 text-[10px] font-bold text-cyan-ia uppercase tracking-tighter">
                  Fixado
                </span>
              )}
              {video.isPremium && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 uppercase tracking-tighter">
                  Premium
                </span>
              )}
              {!video.publishedAt && (
                <span className="rounded-full bg-app-chip px-2 py-0.5 text-[10px] font-medium text-cloud-white/70 uppercase tracking-tighter">
                  Rascunho
                </span>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handlePin(video)}
                  title={video.isPinned ? "Desafixar" : "Fixar no topo"}
                  className={`text-xs font-medium transition-colors ${video.isPinned ? "text-cyan-ia hover:text-cyan-ia/70" : "text-cloud-white/40 hover:text-cyan-ia"}`}
                >
                  {video.isPinned ? "Desafixar" : "Fixar"}
                </button>
                <button
                  onClick={() => handleEdit(video)}
                  className="text-xs font-medium text-cyan-ia hover:text-cyan-ia/70"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(video.id)}
                  className="text-xs font-medium text-red-500 hover:text-red-700"
                >
                  Remover
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MaterialTab({
  materials,
  categories,
  ratingStats,
  onSave,
}: {
  materials: Material[];
  categories: Category[];
  ratingStats: Record<string, { total: number; count: number; average: number }>;
  onSave: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    url: "",
    type: "LINK",
    description: "",
    categoryId: "",
    tags: "",
    isPremium: false,
    publish: true,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const storageRef = ref(storage, `materials/${fileName}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      
      setForm(prev => ({
        ...prev,
        url: downloadUrl,
        type: file.type === "application/pdf" ? "PDF" : prev.type
      }));
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Erro ao fazer upload do arquivo.");
    } finally {
      setUploading(false);
    }
  }


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const data = {
      ...form,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      publishedAt: form.publish ? new Date().toISOString() : null,
    };

    const url = editingId ? `/api/admin/materials/${editingId}` : "/api/admin/materials";
    const method = editingId ? "PATCH" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setSaving(false);
    handleCancel();
    onSave();
  }

  function handleEdit(m: Material) {
    setEditingId(m.id);
    setForm({
      title: m.title,
      url: m.url,
      type: m.type,
      description: m.description || "",
      categoryId: m.category?.id || "",
      tags: m.tags.join(", "),
      isPremium: m.isPremium,
      publish: !!m.publishedAt,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setForm({
      title: "",
      url: "",
      type: "LINK",
      description: "",
      categoryId: "",
      tags: "",
      isPremium: false,
      publish: true,
    });
  }

  async function handlePin(material: Material) {
    await fetch(`/api/admin/materials/${material.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !material.isPinned }),
    });
    onSave();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este material?")) return;
    await fetch(`/api/admin/materials/${id}`, { method: "DELETE" });
    onSave();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-semibold text-cloud-white">{materials.length} materiais</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-tech-blue px-4 py-2 text-sm text-white transition-colors hover:bg-tech-blue/80"
          >
            + Adicionar material
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 space-y-4 rounded-xl border border-app-border bg-midnight-blue p-6"
        >
          <h3 className="text-sm font-bold text-cyan-ia">
            {editingId ? "Editar material" : "Novo material"}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-cloud-white/70">Título *</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-app-border px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none"
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 block text-xs font-medium text-cloud-white/70">URL *</label>
              <div className="flex gap-2">
                <input
                  required
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  className="flex-1 rounded-lg border border-app-border px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none"
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg bg-app-chip px-3 py-2 text-xs font-medium text-cloud-white transition-colors hover:bg-app-chip-accent disabled:opacity-50"
                >
                  {uploading ? "..." : "Upload"}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-cloud-white/70">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-lg border border-app-border px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none"
              >
                <option value="LINK">Link</option>
                <option value="PDF">PDF</option>
                <option value="RESOURCE">Recurso</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-cloud-white/70">Categoria</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full rounded-lg border border-app-border px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none"
              >
                <option value="">Sem categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-cloud-white/70">Descrição</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-app-border px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-cloud-white/70">
              Tags (separadas por vírgula)
            </label>
            <input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="w-full rounded-lg border border-app-border px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-cloud-white/70">
              <input
                type="checkbox"
                checked={form.isPremium}
                onChange={(e) => setForm({ ...form, isPremium: e.target.checked })}
                className="rounded text-cyan-ia focus:ring-cyan-ia"
              />
              Premium
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-cloud-white/70">
              <input
                type="checkbox"
                checked={form.publish}
                onChange={(e) => setForm({ ...form, publish: e.target.checked })}
                className="rounded text-cyan-ia focus:ring-cyan-ia"
              />
              Publicar agora
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-tech-blue px-6 py-2 text-sm font-semibold text-white hover:bg-tech-blue/80 disabled:opacity-60"
            >
              {saving ? "Salvando..." : editingId ? "Atualizar" : "Salvar"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-app-border px-6 py-2 text-sm font-medium text-cloud-white/70 hover:bg-midnight-blue"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {materials.map((material) => (
          <div
            key={material.id}
            className="flex items-center justify-between rounded-xl border border-app-border bg-midnight-blue px-5 py-4 shadow-sm"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-cloud-white">{material.title}</p>
              <p className="text-xs text-cloud-white/40">
                {material.type} · <span className="truncate">{material.url}</span>
              </p>
              {material.category && (
                <span className="mt-1 inline-block rounded-md bg-tech-blue/20 px-1.5 py-0.5 text-[10px] font-medium text-cyan-ia">
                  {material.category.name}
                </span>
              )}
            </div>

            <div className="flex items-center gap-6">
              {/* Rating/Thermometer */}
              {ratingStats[material.id] && ratingStats[material.id].count > 0 && (
                <div className="flex flex-col items-center">
                   <div className="flex items-center gap-1">
                      <span className="text-lg">🔥</span>
                      <span className="text-sm font-black text-cloud-white">{ratingStats[material.id].average}</span>
                   </div>
                   <div className="text-[9px] font-bold text-cloud-white/40 uppercase tracking-tighter">{ratingStats[material.id].count} votos</div>
                </div>
              )}
            </div>

            <div className="ml-4 flex shrink-0 items-center gap-4">
              {material.isPinned && (
                <span className="rounded-full bg-cyan-ia/20 px-2 py-0.5 text-[10px] font-bold text-cyan-ia uppercase tracking-tighter">
                  Fixado
                </span>
              )}
              {material.isPremium && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 uppercase tracking-tighter">
                  Premium
                </span>
              )}
              {!material.publishedAt && (
                <span className="rounded-full bg-app-chip px-2 py-0.5 text-[10px] font-medium text-cloud-white/70 uppercase tracking-tighter">
                  Rascunho
                </span>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handlePin(material)}
                  className={`text-xs font-medium transition-colors ${material.isPinned ? "text-cyan-ia hover:text-cyan-ia/70" : "text-cloud-white/40 hover:text-cyan-ia"}`}
                >
                  {material.isPinned ? "Desafixar" : "Fixar"}
                </button>
                <button
                  onClick={() => handleEdit(material)}
                  className="text-xs font-medium text-cyan-ia hover:text-cyan-ia/70"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(material.id)}
                  className="text-xs font-medium text-red-500 hover:text-red-700"
                >
                  Remover
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryTab({ categories, onSave }: { categories: Category[]; onSave: () => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);

    const url = editingId ? `/api/admin/categories/${editingId}` : "/api/admin/categories";
    const method = editingId ? "PATCH" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim() }),
    });

    setSaving(false);
    handleCancel();
    onSave();
  }

  function handleEdit(cat: Category & { description?: string | null }) {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancel() {
    setEditingId(null);
    setName("");
    setDescription("");
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esta categoria?")) return;
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    onSave();
  }

  return (
    <div className="max-w-lg">
      <form
        onSubmit={handleSubmit}
        className="mb-8 space-y-4 rounded-xl border border-app-border bg-midnight-blue p-6 shadow-sm"
      >
        <h3 className="text-sm font-bold text-cloud-white">
          {editingId ? "Editar categoria" : "Nova categoria"}
        </h3>
        <div>
          <label className="mb-1 block text-xs font-medium text-cloud-white/70">Nome *</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-app-border px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-cloud-white/70">Descrição</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-app-border px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-tech-blue px-6 py-2 text-sm font-semibold text-white hover:bg-tech-blue/80 disabled:opacity-60"
          >
            {saving ? "Salvando..." : editingId ? "Atualizar" : "Criar categoria"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-app-border px-6 py-2 text-sm font-medium text-cloud-white/70 hover:bg-midnight-blue"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="space-y-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between rounded-xl border border-app-border bg-midnight-blue px-5 py-4 shadow-sm"
          >
            <div>
              <p className="font-semibold text-cloud-white">{cat.name}</p>
              <p className="text-xs text-cloud-white/40">/{cat.slug}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleEdit(cat as any)}
                className="text-xs font-medium text-cyan-ia hover:text-cyan-ia/70"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(cat.id)}
                className="text-xs font-medium text-red-500 hover:text-red-700"
              >
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const STATUS_LABELS: Record<ContentRequest["status"], string> = {
  PENDING: "Pendente",
  IN_PROGRESS: "Em andamento",
  DONE: "Concluído",
  CANCELLED: "Cancelado",
};

const STATUS_COLORS: Record<ContentRequest["status"], string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  DONE: "bg-green-100 text-green-800",
  CANCELLED: "bg-app-chip text-cloud-white/60",
};

function ContentRequestsTab({
  requests,
  onSave,
}: {
  requests: ContentRequest[];
  onSave: () => void;
}) {
  async function handleStatusChange(id: string, status: ContentRequest["status"]) {
    await fetch(`/api/admin/content-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    onSave();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esta demanda?")) return;
    await fetch(`/api/admin/content-requests/${id}`, { method: "DELETE" });
    onSave();
  }

  const grouped: Record<ContentRequest["status"], ContentRequest[]> = {
    PENDING: [],
    IN_PROGRESS: [],
    DONE: [],
    CANCELLED: [],
  };
  for (const r of requests) grouped[r.status].push(r);

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-semibold text-cloud-white">
          Demandas de Conteúdo geradas pelo Assistente IA
        </h2>
        <p className="mt-1 text-sm text-cloud-white/50">
          Registros de quando o assistente não encontrou conteúdo adequado para o usuário.
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-app-border p-12 text-center text-sm text-cloud-white/40">
          Nenhuma demanda registrada ainda.
        </div>
      ) : (
        <div className="space-y-6">
          {(["PENDING", "IN_PROGRESS", "DONE", "CANCELLED"] as ContentRequest["status"][]).map(
            (status) =>
              grouped[status].length > 0 && (
                <div key={status}>
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cloud-white/50">
                    <span className={`rounded-full px-2 py-0.5 ${STATUS_COLORS[status]}`}>
                      {STATUS_LABELS[status]}
                    </span>
                    <span>({grouped[status].length})</span>
                  </h3>
                  <div className="space-y-3">
                    {grouped[status].map((req) => (
                      <div
                        key={req.id}
                        className="rounded-xl border border-app-border bg-midnight-blue px-5 py-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-cloud-white truncate">{req.topic}</p>
                            <p className="mt-1 text-sm text-cloud-white/50 line-clamp-2">{req.userMessage}</p>
                            <div className="mt-2 flex items-center gap-3 text-xs text-cloud-white/40">
                              <span>{req.userName || "Usuário"}</span>
                              <span>·</span>
                              <span>{new Date(req.createdAt).toLocaleDateString("pt-BR")}</span>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <select
                              value={req.status}
                              onChange={(e) =>
                                handleStatusChange(
                                  req.id,
                                  e.target.value as ContentRequest["status"]
                                )
                              }
                              className="rounded-lg border border-app-border px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-ia"
                            >
                              {(
                                [
                                  "PENDING",
                                  "IN_PROGRESS",
                                  "DONE",
                                  "CANCELLED",
                                ] as ContentRequest["status"][]
                              ).map((s) => (
                                <option key={s} value={s}>
                                  {STATUS_LABELS[s]}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleDelete(req.id)}
                              className="text-xs font-medium text-red-500 hover:text-red-700"
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
          )}
        </div>
      )}
    </div>
  );
}

function PostTab({
  posts,
  categories,
  ratingStats,
  onSave,
}: {
  posts: Post[];
  categories: Category[];
  ratingStats: Record<string, { total: number; count: number; average: number }>;
  onSave: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    content: "",
    categoryId: "",
    tags: "",
    isPremium: false,
    publish: true,
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const data = {
      ...form,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      publishedAt: form.publish ? new Date().toISOString() : null,
    };

    const url = editingId ? `/api/admin/posts/${editingId}` : "/api/admin/posts";
    const method = editingId ? "PATCH" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setSaving(false);
    handleCancel();
    onSave();
  }

  function handleEdit(post: Post) {
    setEditingId(post.id);
    setForm({
      title: post.title,
      slug: post.slug,
      content: post.content || "",
      categoryId: post.category?.id || "",
      tags: post.tags.join(", "),
      isPremium: post.isPremium,
      publish: !!post.publishedAt,
    });
    setShowForm(true);
  }

  async function handlePin(post: Post) {
    await fetch(`/api/admin/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !post.isPinned }),
    });
    onSave();
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta postagem?")) return;
    await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    onSave();
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setForm({
      title: "",
      slug: "",
      content: "",
      categoryId: "",
      tags: "",
      isPremium: false,
      publish: true,
    });
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-cloud-white">Artigos & Postagens (Substack-style)</h2>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-tech-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-tech-blue/80"
        >
          Novo Artigo
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-app-border bg-midnight-blue p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-bold text-cloud-white">
            {editingId ? "Editar Artigo" : "Criar Novo Artigo / Código de Agente"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-cloud-white/70">Título</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setForm({ ...form, title, slug: editingId ? form.slug : generateSlug(title) });
                  }}
                  className="w-full rounded-lg border border-app-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-ia"
                  placeholder="Ex: Como configurar um Agente de Voz com OpenAI"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-cloud-white/70">Slug (URL)</label>
                <input
                  type="text"
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full rounded-lg border border-app-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-ia"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-cloud-white/70">Conteúdo (Markdown / Código)</label>
              <textarea
                required
                rows={12}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full rounded-lg border border-app-border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-ia"
                placeholder="Escreva aqui seu artigo ou cole o código do seu agente..."
              />
              <p className="text-xs text-cloud-white/40">Suporta Markdown para formatação e blocos de código.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-cloud-white/70">Categoria</label>
                <select
                  required
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full rounded-lg border border-app-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-ia"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-cloud-white/70">Tags (separadas por vírgula)</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="w-full rounded-lg border border-app-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-ia"
                  placeholder="n8n, agente, automaçao"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6 border-t border-app-border pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPremium}
                  onChange={(e) => setForm({ ...form, isPremium: e.target.checked })}
                  className="h-4 w-4 rounded text-cyan-ia focus:ring-cyan-ia"
                />
                <span className="text-sm font-medium text-cloud-white/70">Conteúdo Premium</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.publish}
                  onChange={(e) => setForm({ ...form, publish: e.target.checked })}
                  className="h-4 w-4 rounded text-cyan-ia focus:ring-cyan-ia"
                />
                <span className="text-sm font-medium text-cloud-white/70">Publicar agora</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg px-4 py-2 text-sm font-medium text-cloud-white/60 hover:bg-midnight-blue"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-tech-blue px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-tech-blue/80 disabled:opacity-50"
              >
                {saving ? "Salvando..." : editingId ? "Atualizar Artigo" : "Salvar Artigo"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Posts List */}
      <div className="overflow-hidden rounded-xl border border-app-border bg-midnight-blue shadow-sm font-sans mb-10">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-midnight-blue">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-cloud-white/50 uppercase">Título</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-cloud-white/50 uppercase text-center">Termômetro</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-cloud-white/50 uppercase">Categoria</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-cloud-white/50 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-cloud-white/50 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-cloud-white/50">
                  Nenhum artigo publicado ainda. Comece compartilhando seu primeiro conteúdo!
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} className="hover:bg-midnight-blue transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-cloud-white truncate max-w-xs">{post.title}</div>
                    <div className="text-xs text-cloud-white/40">/{post.slug}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {ratingStats[post.id] && ratingStats[post.id].count > 0 ? (
                      <div className="inline-flex flex-col items-center">
                        <div className="flex items-center gap-1">
                          <span className="text-base">🔥</span>
                          <span className="text-sm font-bold text-cloud-white">{ratingStats[post.id].average}</span>
                        </div>
                        <span className="text-[9px] text-cloud-white/40 font-bold uppercase">{ratingStats[post.id].count} votos</span>
                      </div>
                    ) : (
                      <span className="text-xs text-cloud-white/30">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-cloud-white/60">{post.category?.name || "-"}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${post.publishedAt ? "bg-green-500" : "bg-yellow-500"}`} />
                      <span className="text-sm font-medium text-cloud-white/70">
                        {post.publishedAt ? "Publicado" : "Rascunho"}
                      </span>
                      {post.isPremium && (
                        <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 border border-amber-100">
                          PREMIUM
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handlePin(post)}
                        className={`text-sm font-medium transition-colors ${post.isPinned ? "text-cyan-ia hover:text-cyan-ia/70" : "text-cloud-white/40 hover:text-cyan-ia"}`}
                      >
                        {post.isPinned ? "Desafixar" : "Fixar"}
                      </button>
                      <button
                        onClick={() => handleEdit(post)}
                        className="text-sm font-medium text-cyan-ia hover:text-cyan-ia/70"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="text-sm font-medium text-red-600 hover:text-red-800"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── AI Settings Tab ──────────────────────────────────────────────────────────

const ANTHROPIC_MODELS = [
  { value: "claude-haiku-4-5", label: "Claude Haiku 4.5 (rápido e econômico)" },
  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (balanceado)" },
  { value: "claude-opus-4-6", label: "Claude Opus 4.6 (mais poderoso)" },
];

const OPENAI_MODELS = [
  { value: "gpt-4o-mini", label: "GPT-4o Mini (rápido e econômico)" },
  { value: "gpt-4o", label: "GPT-4o (balanceado)" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo (avançado)" },
  { value: "MiniMax-Text-01", label: "MiniMax Text 01" },
  { value: "MiniMax-01", label: "MiniMax 01" },
  { value: "__custom__", label: "Personalizado..." },
];

type SettingsSubTab = "community" | "ai" | "stripe" | "email";

function SettingsSection({
  aiSettings,
  stripeSettings,
  communitySettings,
  emailSettings,
  onSave,
}: {
  aiSettings: AISettingsData;
  stripeSettings: StripeSettingsData;
  communitySettings: CommunitySettingsData;
  emailSettings: EmailSettingsData;
  onSave: () => void;
}) {
  const [sub, setSub] = useState<SettingsSubTab>("community");

  const subTabs: { key: SettingsSubTab; label: string }[] = [
    { key: "community", label: "Comunidade" },
    { key: "ai",        label: "Assistente IA" },
    { key: "stripe",    label: "Stripe" },
    { key: "email",     label: "E-mail" },
  ];

  return (
    <div>
      {/* Sub-nav */}
      <div className="mb-8 flex gap-1 rounded-xl border border-app-border bg-midnight-blue p-1">
        {subTabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSub(key)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              sub === key
                ? "bg-tech-blue text-white shadow"
                : "text-cloud-white/50 hover:text-cloud-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {sub === "community" && <CommunitySettingsTab initialSettings={communitySettings} onSave={onSave} />}
      {sub === "ai"        && <AISettingsTab        initialSettings={aiSettings}        onSave={onSave} />}
      {sub === "stripe"    && <StripeSettingsTab    initialSettings={stripeSettings}    onSave={onSave} />}
      {sub === "email"     && <EmailSettingsTab     initialSettings={emailSettings}     onSave={onSave} />}
    </div>
  );
}

function AISettingsTab({
  initialSettings,
  onSave,
}: {
  initialSettings: AISettingsData;
  onSave: () => void;
}) {
  const knownOpenAIValues = OPENAI_MODELS.filter((o) => o.value !== "__custom__").map((o) => o.value);

  const [provider, setProvider] = useState<"anthropic" | "openai">(initialSettings.provider);
  const [model, setModel] = useState(() => {
    if (initialSettings.provider === "openai" && !knownOpenAIValues.includes(initialSettings.model)) {
      return "__custom__";
    }
    return initialSettings.model;
  });
  const [customModel, setCustomModel] = useState(() => {
    if (initialSettings.provider === "openai" && !knownOpenAIValues.includes(initialSettings.model)) {
      return initialSettings.model;
    }
    return "";
  });
  const [anthropicKey, setAnthropicKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [openaiBaseUrl, setOpenaiBaseUrl] = useState(initialSettings.openaiBaseUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const models = provider === "openai" ? OPENAI_MODELS : ANTHROPIC_MODELS;
  const effectiveModel = model === "__custom__" ? customModel.trim() : model;

  // When provider changes, reset model to first option of new provider
  function handleProviderChange(p: "anthropic" | "openai") {
    setProvider(p);
    setModel(p === "openai" ? OPENAI_MODELS[0].value : ANTHROPIC_MODELS[0].value);
    setCustomModel("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);

    const payload: Record<string, string> = { provider, model: effectiveModel };
    if (anthropicKey.trim()) payload.anthropicApiKey = anthropicKey.trim();
    if (openaiKey.trim()) payload.openaiApiKey = openaiKey.trim();
    payload.openaiBaseUrl = openaiBaseUrl.trim();

    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (res.ok) {
      setSaveMsg("Configurações salvas com sucesso!");
      setAnthropicKey("");
      setOpenaiKey("");
      onSave();
    } else {
      const err = await res.json().catch(() => ({}));
      setSaveMsg(`Erro: ${err.error || "Falha ao salvar"}`);
    }
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h2 className="font-semibold text-cloud-white">Configurações do Assistente IA</h2>
        <p className="mt-1 text-sm text-cloud-white/50">
          Selecione o provedor de IA e o modelo a ser usado no assistente da comunidade.
          As chaves de API são armazenadas com segurança e nunca expostas ao frontend.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Provider */}
        <div className="rounded-xl border border-app-border bg-midnight-blue p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-cloud-white">Provedor de IA</h3>
          <div className="grid grid-cols-2 gap-3">
            {(["anthropic", "openai"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handleProviderChange(p)}
                className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
                  provider === p
                    ? "border-cyan-ia bg-tech-blue/20"
                    : "border-app-border hover:border-app-border-accent"
                }`}
              >
                <span className="text-2xl">{p === "anthropic" ? "🟣" : "🟢"}</span>
                <div>
                  <p className="text-sm font-semibold text-cloud-white">
                    {p === "anthropic" ? "Anthropic" : "OpenAI"}
                  </p>
                  <p className="text-xs text-cloud-white/50">
                    {p === "anthropic" ? "Claude" : "ChatGPT"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Model */}
        <div className="rounded-xl border border-app-border bg-midnight-blue p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-cloud-white">Modelo</h3>
          <div className="space-y-2">
            {models.map((m) => (
              <label
                key={m.value}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3 transition-colors ${
                  model === m.value
                    ? "border-cyan-ia bg-tech-blue/20"
                    : "border-app-border hover:border-app-border-accent"
                }`}
              >
                <input
                  type="radio"
                  name="model"
                  value={m.value}
                  checked={model === m.value}
                  onChange={() => setModel(m.value)}
                  className="text-cyan-ia focus:ring-cyan-ia"
                />
                <div>
                  <p className="text-sm font-medium text-cloud-white">{m.label}</p>
                  <p className="text-xs text-cloud-white/40 font-mono">{m.value}</p>
                </div>
              </label>
            ))}
            {model === "__custom__" && (
              <input
                type="text"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="ex: MiniMax-Text-01, mistralai/Mistral-7B-v0.1..."
                className="mt-2 w-full rounded-lg border border-app-border px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-cyan-ia focus:outline-none"
              />
            )}
          </div>
        </div>

        {/* API Keys */}
        <div className="rounded-xl border border-app-border bg-midnight-blue p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-cloud-white">Chaves de API</h3>
          <p className="text-xs text-cloud-white/50">
            Deixe em branco para manter a chave atual. As chaves são armazenadas com segurança no
            Firestore e nunca enviadas ao browser.
          </p>

          {/* Anthropic Key */}
          <div>
            <label className="mb-1 flex items-center gap-2 text-xs font-medium text-cloud-white/70">
              <span className="text-base">🟣</span> Chave Anthropic
              {initialSettings.anthropicApiKeySet && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                  Configurada
                </span>
              )}
            </label>
            {initialSettings.anthropicApiKeySet && (
              <p className="mb-1.5 font-mono text-xs text-cloud-white/40">
                {initialSettings.anthropicApiKeyMasked}
              </p>
            )}
            <input
              type="password"
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
              placeholder={
                initialSettings.anthropicApiKeySet
                  ? "Nova chave (deixe vazio para manter)"
                  : "sk-ant-..."
              }
              className="w-full rounded-lg border border-app-border px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-cyan-ia focus:outline-none"
            />
          </div>

          {/* OpenAI Key */}
          <div>
            <label className="mb-1 flex items-center gap-2 text-xs font-medium text-cloud-white/70">
              <span className="text-base">🟢</span> Chave OpenAI
              {initialSettings.openaiApiKeySet && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                  Configurada
                </span>
              )}
            </label>
            {initialSettings.openaiApiKeySet && (
              <p className="mb-1.5 font-mono text-xs text-cloud-white/40">
                {initialSettings.openaiApiKeyMasked}
              </p>
            )}
            <input
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder={
                initialSettings.openaiApiKeySet
                  ? "Nova chave (deixe vazio para manter)"
                  : "sk-..."
              }
              className="w-full rounded-lg border border-app-border px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-cyan-ia focus:outline-none"
            />
          </div>

          {/* OpenAI-compatible Base URL */}
          <div>
            <label className="mb-1 block text-xs font-medium text-cloud-white/70">
              Base URL (OpenAI-compatible)
            </label>
            <p className="mb-1.5 text-xs text-cloud-white/40">
              Deixe vazio para usar a API padrão da OpenAI. Use para gateways compatíveis como OpenCode Zen, MiniMax, Together, etc.
            </p>
            <input
              type="text"
              value={openaiBaseUrl}
              onChange={(e) => setOpenaiBaseUrl(e.target.value)}
              placeholder="https://opencode.ai/zen/v1"
              className="w-full rounded-lg border border-app-border px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-cyan-ia focus:outline-none"
            />
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-tech-blue px-6 py-2 text-sm font-semibold text-white hover:bg-tech-blue/80 disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar configurações"}
          </button>
          {saveMsg && (
            <p
              className={`text-sm ${
                saveMsg.startsWith("Erro") ? "text-red-600" : "text-green-600"
              }`}
            >
              {saveMsg}
            </p>
          )}
        </div>

        {/* Current config summary */}
        <div className="rounded-lg bg-midnight-blue border border-app-border px-4 py-3 text-xs text-cloud-white/50 space-y-1">
          <p>
            <span className="font-medium text-cloud-white/70">Configuração ativa:</span>{" "}
            {initialSettings.provider === "openai" ? "OpenAI" : "Anthropic"} /{" "}
            <span className="font-mono">{initialSettings.model}</span>
          </p>
          {initialSettings.provider === "openai" && initialSettings.openaiBaseUrl && (
            <p>
              <span className="font-medium text-cloud-white/70">Base URL:</span>{" "}
              <span className="font-mono">{initialSettings.openaiBaseUrl}</span>
            </p>
          )}
          {initialSettings.updatedAt && (
            <p>
              Atualizado em:{" "}
              {new Date(initialSettings.updatedAt).toLocaleString("pt-BR")}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

function CommunitySettingsTab({
  initialSettings,
  onSave,
}: {
  initialSettings: CommunitySettingsData;
  onSave: () => void;
}) {
  const [communityName, setCommunityName] = useState(initialSettings.communityName);
  const [communityTagline, setCommunityTagline] = useState(initialSettings.communityTagline);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);

    const res = await fetch("/api/admin/settings?section=community", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ communityName: communityName.trim(), communityTagline: communityTagline.trim() }),
    });

    setSaving(false);
    if (res.ok) {
      setSaveMsg("Configurações da comunidade salvas!");
      window.dispatchEvent(
        new CustomEvent("communitySettingsUpdated", {
          detail: { communityName: communityName.trim(), communityTagline: communityTagline.trim() },
        })
      );
      onSave();
    } else {
      const err = await res.json().catch(() => ({}));
      setSaveMsg(`Erro: ${err.error || "Falha ao salvar"}`);
    }
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h2 className="font-semibold text-cloud-white">Identidade da Comunidade</h2>
        <p className="mt-1 text-sm text-cloud-white/50">
          Nome e descrição exibidos na barra lateral e no cabeçalho do portal.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-app-border bg-midnight-blue p-5 shadow-sm space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-cloud-white/70">
              Nome da Comunidade
            </label>
            <input
              type="text"
              value={communityName}
              onChange={(e) => setCommunityName(e.target.value)}
              placeholder="Ex: SOS Contador Labs"
              maxLength={60}
              required
              className="w-full rounded-lg border border-app-border px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none"
            />
            <p className="mt-1 text-xs text-cloud-white/40">Aparece na barra lateral (logo).</p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-cloud-white/70">
              Tagline / Subtítulo
            </label>
            <input
              type="text"
              value={communityTagline}
              onChange={(e) => setCommunityTagline(e.target.value)}
              placeholder="Ex: Portal da Comunidade"
              maxLength={80}
              required
              className="w-full rounded-lg border border-app-border px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none"
            />
            <p className="mt-1 text-xs text-cloud-white/40">Usado no título das páginas (aba do browser).</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-tech-blue px-6 py-2 text-sm font-semibold text-white hover:bg-tech-blue/80 disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
          {saveMsg && (
            <p className={`text-sm ${saveMsg.startsWith("Erro") ? "text-red-600" : "text-green-600"}`}>
              {saveMsg}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

function StripeSettingsTab({
  initialSettings,
  onSave,
}: {
  initialSettings: StripeSettingsData;
  onSave: () => void;
}) {
  const [publishableKey, setPublishableKey] = useState(initialSettings.publishableKey);
  const [secretKey, setSecretKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [priceId, setPriceId] = useState(initialSettings.priceId);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);

    const payload: Record<string, string> = {
      publishableKey: publishableKey.trim(),
      priceId: priceId.trim(),
    };
    if (secretKey.trim()) payload.secretKey = secretKey.trim();
    if (webhookSecret.trim()) payload.webhookSecret = webhookSecret.trim();

    const res = await fetch("/api/admin/settings?section=stripe", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (res.ok) {
      setSaveMsg("Configurações Stripe salvas com sucesso!");
      setSecretKey("");
      setWebhookSecret("");
      onSave();
    } else {
      const err = await res.json().catch(() => ({}));
      setSaveMsg(`Erro: ${err.error || "Falha ao salvar"}`);
    }
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h2 className="font-semibold text-cloud-white">Configurações do Stripe</h2>
        <p className="mt-1 text-sm text-cloud-white/50">
          Credenciais da sua conta Stripe para processar pagamentos e assinaturas.
          As chaves secretas são armazenadas com segurança no Firestore e nunca expostas ao browser.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Chaves de API */}
        <div className="rounded-xl border border-app-border bg-midnight-blue p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-cloud-white">Chaves de API</h3>
          <p className="text-xs text-cloud-white/50">
            Deixe os campos de chave secreta em branco para manter o valor atual.
          </p>

          {/* Publishable Key */}
          <div>
            <label className="mb-1 flex items-center gap-2 text-xs font-medium text-cloud-white/70">
              Chave Publicável (pk_...)
              {initialSettings.publishableKeySet && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                  Configurada
                </span>
              )}
            </label>
            <input
              type="text"
              value={publishableKey}
              onChange={(e) => setPublishableKey(e.target.value)}
              placeholder="pk_live_..."
              className="w-full rounded-lg border border-app-border px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-cyan-ia focus:outline-none"
            />
          </div>

          {/* Secret Key */}
          <div>
            <label className="mb-1 flex items-center gap-2 text-xs font-medium text-cloud-white/70">
              Chave Secreta (sk_...)
              {initialSettings.secretKeySet && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                  Configurada
                </span>
              )}
            </label>
            {initialSettings.secretKeySet && (
              <p className="mb-1.5 font-mono text-xs text-cloud-white/40">{initialSettings.secretKeyMasked}</p>
            )}
            <input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder={initialSettings.secretKeySet ? "Nova chave (deixe vazio para manter)" : "sk_live_..."}
              className="w-full rounded-lg border border-app-border px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-cyan-ia focus:outline-none"
            />
          </div>

          {/* Webhook Secret */}
          <div>
            <label className="mb-1 flex items-center gap-2 text-xs font-medium text-cloud-white/70">
              Webhook Secret (whsec_...)
              {initialSettings.webhookSecretSet && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                  Configurado
                </span>
              )}
            </label>
            {initialSettings.webhookSecretSet && (
              <p className="mb-1.5 font-mono text-xs text-cloud-white/40">{initialSettings.webhookSecretMasked}</p>
            )}
            <input
              type="password"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder={initialSettings.webhookSecretSet ? "Novo secret (deixe vazio para manter)" : "whsec_..."}
              className="w-full rounded-lg border border-app-border px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-cyan-ia focus:outline-none"
            />
          </div>
        </div>

        {/* Plano */}
        <div className="rounded-xl border border-app-border bg-midnight-blue p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-cloud-white">Plano de Assinatura</h3>
          <div>
            <label className="mb-1 block text-xs font-medium text-cloud-white/70">
              Price ID do Stripe (price_...)
            </label>
            <p className="mb-1.5 text-xs text-cloud-white/40">
              ID do preço criado no painel Stripe para o plano mensal.
            </p>
            <input
              type="text"
              value={priceId}
              onChange={(e) => setPriceId(e.target.value)}
              placeholder="price_..."
              className="w-full rounded-lg border border-app-border px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-cyan-ia focus:outline-none"
            />
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-tech-blue px-6 py-2 text-sm font-semibold text-white hover:bg-tech-blue/80 disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar configurações Stripe"}
          </button>
          {saveMsg && (
            <p className={`text-sm ${saveMsg.startsWith("Erro") ? "text-red-600" : "text-green-600"}`}>
              {saveMsg}
            </p>
          )}
        </div>

        {/* Status resumo */}
        {(initialSettings.secretKeySet || initialSettings.priceId) && (
          <div className="rounded-lg bg-midnight-blue border border-app-border px-4 py-3 text-xs text-cloud-white/50 space-y-1">
            <p className="font-medium text-cloud-white/70">Status atual</p>
            <p>Chave secreta: {initialSettings.secretKeySet ? "✓ Configurada" : "✗ Não configurada"}</p>
            <p>Webhook secret: {initialSettings.webhookSecretSet ? "✓ Configurado" : "✗ Não configurado"}</p>
            <p>Price ID: {initialSettings.priceId ? <span className="font-mono">{initialSettings.priceId}</span> : "✗ Não configurado"}</p>
            {initialSettings.updatedAt && (
              <p>Atualizado em: {new Date(initialSettings.updatedAt).toLocaleString("pt-BR")}</p>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

function EmailSettingsTab({
  initialSettings,
  onSave,
}: {
  initialSettings: EmailSettingsData;
  onSave: () => void;
}) {
  const [enabled, setEnabled] = useState(initialSettings.enabled);
  const [smtpHost, setSmtpHost] = useState(initialSettings.smtpHost);
  const [smtpPort, setSmtpPort] = useState(String(initialSettings.smtpPort || 587));
  const [smtpUser, setSmtpUser] = useState(initialSettings.smtpUser);
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpSecure, setSmtpSecure] = useState(initialSettings.smtpSecure);
  const [senderName, setSenderName] = useState(initialSettings.senderName);
  const [senderEmail, setSenderEmail] = useState(initialSettings.senderEmail);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);

    const payload: Record<string, string | number | boolean> = {
      enabled,
      smtpHost: smtpHost.trim(),
      smtpPort: Number(smtpPort) || 587,
      smtpUser: smtpUser.trim(),
      smtpSecure,
      senderName: senderName.trim(),
      senderEmail: senderEmail.trim(),
    };
    if (smtpPassword.trim()) payload.smtpPassword = smtpPassword.trim();

    const res = await fetch("/api/admin/settings?section=email", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (res.ok) {
      setSaveMsg("Configurações de e-mail salvas com sucesso!");
      setSmtpPassword("");
      onSave();
    } else {
      const err = await res.json().catch(() => ({}));
      setSaveMsg(`Erro: ${err.error || "Falha ao salvar"}`);
    }
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h2 className="font-semibold text-cloud-white">Notificações por E-mail</h2>
        <p className="mt-1 text-sm text-cloud-white/50">
          Configure um servidor SMTP para enviar e-mails aos membros sempre que um novo conteúdo
          for publicado. A senha é armazenada com segurança no Firestore e nunca exposta ao browser.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Ativar / desativar */}
        <div className="rounded-xl border border-app-border bg-midnight-blue p-5 shadow-sm">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              <div
                className={`h-6 w-11 rounded-full transition-colors ${
                  enabled ? "bg-cyan-ia" : "bg-app-chip"
                }`}
              />
              <div
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </div>
            <span className="text-sm font-medium text-cloud-white">
              {enabled ? "Notificações ativadas" : "Notificações desativadas"}
            </span>
          </label>
        </div>

        {/* Servidor SMTP */}
        <div className="rounded-xl border border-app-border bg-midnight-blue p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-cloud-white">Servidor SMTP</h3>
          <p className="text-xs text-cloud-white/50">
            Deixe o campo de senha em branco para manter o valor atual.
          </p>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-cloud-white/70">Host</label>
              <input
                type="text"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                placeholder="smtp.gmail.com"
                className="w-full rounded-lg border border-app-border px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-cyan-ia focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-cloud-white/70">Porta</label>
              <input
                type="number"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                placeholder="587"
                className="w-full rounded-lg border border-app-border px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-cyan-ia focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-cloud-white/70">Usuário (e-mail de login)</label>
            <input
              type="text"
              value={smtpUser}
              onChange={(e) => setSmtpUser(e.target.value)}
              placeholder="noreply@suacomunidade.com.br"
              className="w-full rounded-lg border border-app-border px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-cyan-ia focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 flex items-center gap-2 text-xs font-medium text-cloud-white/70">
              Senha
              {initialSettings.smtpPasswordSet && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                  Configurada
                </span>
              )}
            </label>
            {initialSettings.smtpPasswordSet && (
              <p className="mb-1.5 font-mono text-xs text-cloud-white/40">{initialSettings.smtpPasswordMasked}</p>
            )}
            <input
              type="password"
              value={smtpPassword}
              onChange={(e) => setSmtpPassword(e.target.value)}
              placeholder={initialSettings.smtpPasswordSet ? "Nova senha (deixe vazio para manter)" : "Senha SMTP"}
              className="w-full rounded-lg border border-app-border px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-cyan-ia focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={smtpSecure}
              onChange={(e) => setSmtpSecure(e.target.checked)}
              className="h-4 w-4 rounded border-app-border"
            />
            <span className="text-xs text-cloud-white/70">Usar TLS/SSL (porta 465)</span>
          </label>
        </div>

        {/* Remetente */}
        <div className="rounded-xl border border-app-border bg-midnight-blue p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-cloud-white">Remetente</h3>

          <div>
            <label className="mb-1 block text-xs font-medium text-cloud-white/70">Nome do remetente</label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Comunidade"
              className="w-full rounded-lg border border-app-border px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-cloud-white/70">E-mail do remetente</label>
            <input
              type="email"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              placeholder="noreply@suacomunidade.com.br"
              className="w-full rounded-lg border border-app-border px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-cyan-ia focus:outline-none"
            />
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-tech-blue px-6 py-2 text-sm font-semibold text-white hover:bg-tech-blue/80 disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar configurações de e-mail"}
          </button>
          {saveMsg && (
            <p className={`text-sm ${saveMsg.startsWith("Erro") ? "text-red-600" : "text-green-600"}`}>
              {saveMsg}
            </p>
          )}
        </div>

        {/* Status resumo */}
        {(initialSettings.smtpHost || initialSettings.smtpUser) && (
          <div className="rounded-lg bg-midnight-blue border border-app-border px-4 py-3 text-xs text-cloud-white/50 space-y-1">
            <p className="font-medium text-cloud-white/70">Status atual</p>
            <p>Notificações: {initialSettings.enabled ? "✓ Ativadas" : "✗ Desativadas"}</p>
            <p>Host SMTP: {initialSettings.smtpHost ? <span className="font-mono">{initialSettings.smtpHost}:{initialSettings.smtpPort}</span> : "✗ Não configurado"}</p>
            <p>Usuário: {initialSettings.smtpUser ? <span className="font-mono">{initialSettings.smtpUser}</span> : "✗ Não configurado"}</p>
            <p>Senha: {initialSettings.smtpPasswordSet ? "✓ Configurada" : "✗ Não configurada"}</p>
            {initialSettings.updatedAt && (
              <p>Atualizado em: {new Date(initialSettings.updatedAt).toLocaleString("pt-BR")}</p>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

const SUB_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  CANCELLED: "Cancelado",
  PAST_DUE: "Em atraso",
};

const SUB_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-app-chip text-cloud-white/50",
  CANCELLED: "bg-red-100 text-red-600",
  PAST_DUE: "bg-yellow-100 text-yellow-700",
};

function MembersTab({
  initialMembers,
  onSave,
}: {
  initialMembers: Member[];
  onSave: () => void;
}) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [search, setSearch] = useState("");
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [form, setForm] = useState<{
    role: "MEMBER" | "ADMIN";
    subscriptionStatus: "ACTIVE" | "INACTIVE" | "CANCELLED" | "PAST_DUE";
    subscriptionPeriodEnd: string;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    stripePriceId: string;
  }>({
    role: "MEMBER",
    subscriptionStatus: "INACTIVE",
    subscriptionPeriodEnd: "",
    stripeCustomerId: "",
    stripeSubscriptionId: "",
    stripePriceId: "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const filtered = members.filter(
    (m) =>
      !search ||
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  function handleEdit(member: Member) {
    setEditingUid(member.uid);
    setMsg("");
    setForm({
      role: member.role,
      subscriptionStatus: member.subscription?.status || "INACTIVE",
      subscriptionPeriodEnd: member.subscription?.currentPeriodEnd
        ? member.subscription.currentPeriodEnd.slice(0, 10)
        : "",
      stripeCustomerId: member.subscription?.stripeCustomerId || "",
      stripeSubscriptionId: member.subscription?.stripeSubscriptionId || "",
      stripePriceId: member.subscription?.stripePriceId || "",
    });
  }

  async function handleSave(uid: string) {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/users/${uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: form.role,
          subscriptionStatus: form.subscriptionStatus,
          subscriptionPeriodEnd: form.subscriptionPeriodEnd
            ? new Date(form.subscriptionPeriodEnd).toISOString()
            : null,
          stripeCustomerId: form.stripeCustomerId || null,
          stripeSubscriptionId: form.stripeSubscriptionId || null,
          stripePriceId: form.stripePriceId || null,
        }),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      setMsg("Salvo com sucesso!");
      setMembers((prev) =>
        prev.map((m) =>
          m.uid === uid
            ? {
                ...m,
                role: form.role,
                subscription: {
                  status: form.subscriptionStatus,
                  currentPeriodEnd: form.subscriptionPeriodEnd
                    ? new Date(form.subscriptionPeriodEnd).toISOString()
                    : null,
                  stripeCustomerId: form.stripeCustomerId || null,
                  stripeSubscriptionId: form.stripeSubscriptionId || null,
                  stripePriceId: form.stripePriceId || null,
                },
              }
            : m
        )
      );
      onSave();
    } catch {
      setMsg("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-cloud-white">
          Membros ({members.length})
        </h2>
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72 rounded-lg border border-app-border px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-app-border">
        <table className="w-full text-sm">
          <thead className="bg-midnight-blue text-xs text-cloud-white/50 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Membro</th>
              <th className="px-4 py-3 text-left">Perfil</th>
              <th className="px-4 py-3 text-left">Assinatura</th>
              <th className="px-4 py-3 text-left">Expira em</th>
              <th className="px-4 py-3 text-left">Desde</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-cloud-white/40">
                  Nenhum membro encontrado.
                </td>
              </tr>
            )}
            {filtered.map((member) => (
              <React.Fragment key={member.uid}>
                <tr className="hover:bg-midnight-blue transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {member.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={member.avatarUrl}
                          alt={member.name || member.email}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-tech-blue/30 text-xs font-semibold text-cyan-ia">
                          {(member.name || member.email).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-cloud-white">{member.name || "—"}</p>
                        <p className="text-xs text-cloud-white/40">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        member.role === "ADMIN"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {member.role === "ADMIN" ? "Admin" : "Membro"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {member.subscription?.status ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          SUB_STATUS_COLORS[member.subscription.status] || "bg-app-chip text-cloud-white/50"
                        }`}
                      >
                        {SUB_STATUS_LABELS[member.subscription.status] || member.subscription.status}
                      </span>
                    ) : (
                      <span className="text-cloud-white/30 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-cloud-white/50 text-xs">
                    {member.subscription?.currentPeriodEnd
                      ? new Date(member.subscription.currentPeriodEnd).toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-cloud-white/40 text-xs">
                    {new Date(member.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() =>
                        editingUid === member.uid ? setEditingUid(null) : handleEdit(member)
                      }
                      className="rounded-lg border border-app-border px-3 py-1 text-xs font-medium text-cloud-white/60 hover:bg-midnight-blue transition-colors"
                    >
                      {editingUid === member.uid ? "Fechar" : "Editar"}
                    </button>
                  </td>
                </tr>
                {editingUid === member.uid && (
                  <tr key={`${member.uid}-edit`}>
                    <td colSpan={6} className="bg-midnight-blue px-6 py-5">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-cloud-white/70">
                            Perfil de acesso
                          </label>
                          <select
                            value={form.role}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, role: e.target.value as "MEMBER" | "ADMIN" }))
                            }
                            className="w-full rounded-lg border border-app-border px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none"
                          >
                            <option value="MEMBER">Membro</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-cloud-white/70">
                            Status da assinatura
                          </label>
                          <select
                            value={form.subscriptionStatus}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                subscriptionStatus: e.target.value as
                                  | "ACTIVE"
                                  | "INACTIVE"
                                  | "CANCELLED"
                                  | "PAST_DUE",
                              }))
                            }
                            className="w-full rounded-lg border border-app-border px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none"
                          >
                            <option value="ACTIVE">Ativo</option>
                            <option value="INACTIVE">Inativo</option>
                            <option value="CANCELLED">Cancelado</option>
                            <option value="PAST_DUE">Em atraso</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-cloud-white/70">
                            Validade da assinatura
                          </label>
                          <input
                            type="date"
                            value={form.subscriptionPeriodEnd}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, subscriptionPeriodEnd: e.target.value }))
                            }
                            className="w-full rounded-lg border border-app-border px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-cloud-white/70">
                            Stripe Customer ID
                          </label>
                          <input
                            type="text"
                            value={form.stripeCustomerId}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, stripeCustomerId: e.target.value }))
                            }
                            placeholder="cus_..."
                            className="w-full rounded-lg border border-app-border px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-cyan-ia focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-cloud-white/70">
                            Stripe Subscription ID
                          </label>
                          <input
                            type="text"
                            value={form.stripeSubscriptionId}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, stripeSubscriptionId: e.target.value }))
                            }
                            placeholder="sub_..."
                            className="w-full rounded-lg border border-app-border px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-cyan-ia focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-cloud-white/70">
                            Stripe Price ID
                          </label>
                          <input
                            type="text"
                            value={form.stripePriceId}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, stripePriceId: e.target.value }))
                            }
                            placeholder="price_..."
                            className="w-full rounded-lg border border-app-border px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-cyan-ia focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-4">
                        <button
                          onClick={() => handleSave(member.uid)}
                          disabled={saving}
                          className="rounded-lg bg-tech-blue px-5 py-2 text-sm font-semibold text-white hover:bg-tech-blue/80 disabled:opacity-60"
                        >
                          {saving ? "Salvando..." : "Salvar alterações"}
                        </button>
                        <button
                          onClick={() => setEditingUid(null)}
                          className="rounded-lg border border-app-border px-5 py-2 text-sm text-cloud-white/60 hover:bg-midnight-blue"
                        >
                          Cancelar
                        </button>
                        {msg && (
                          <p
                            className={`text-sm ${
                              msg.startsWith("Erro") ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            {msg}
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Events Tab ────────────────────────────────────────────────────────────────

const EVENT_TYPES = ["WEBINAR", "LIVE", "WORKSHOP", "OUTRO"] as const;
const EVENT_TYPE_LABELS: Record<string, string> = {
  WEBINAR: "Webinário",
  LIVE: "Live",
  WORKSHOP: "Workshop",
  OUTRO: "Outro",
};

function toLocalDatetimeValue(isoString: string | null | undefined): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function EventTab({ events, onSave }: { events: EventData[]; onSave: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "WEBINAR" as (typeof EVENT_TYPES)[number],
    startDate: "",
    endDate: "",
    registrationUrl: "",
    thumbnail: "",
    isPremium: false,
    publish: true,
  });

  function handleEdit(event: EventData) {
    setEditingId(event.id);
    setForm({
      title: event.title,
      description: event.description || "",
      type: event.type,
      startDate: toLocalDatetimeValue(event.startDate),
      endDate: toLocalDatetimeValue(event.endDate),
      registrationUrl: event.registrationUrl || "",
      thumbnail: event.thumbnail || "",
      isPremium: event.isPremium,
      publish: !!event.publishedAt,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setForm({
      title: "",
      description: "",
      type: "WEBINAR",
      startDate: "",
      endDate: "",
      registrationUrl: "",
      thumbnail: "",
      isPremium: false,
      publish: true,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const url = editingId ? `/api/admin/events/${editingId}` : "/api/admin/events";
    const method = editingId ? "PATCH" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description || null,
        type: form.type,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
        registrationUrl: form.registrationUrl || null,
        thumbnail: form.thumbnail || null,
        isPremium: form.isPremium,
        publishedAt: form.publish,
      }),
    });
    setSaving(false);
    handleCancel();
    onSave();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este evento?")) return;
    await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
    onSave();
  }

  const sorted = [...events].sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-semibold text-cloud-white">{events.length} evento{events.length !== 1 ? "s" : ""}</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-tech-blue px-4 py-2 text-sm text-white transition-colors hover:bg-tech-blue/80"
          >
            + Criar evento
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 space-y-4 rounded-xl border border-app-border bg-midnight-blue p-6"
        >
          <h3 className="text-sm font-bold text-cyan-ia">
            {editingId ? "Editar evento" : "Novo evento"}
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-cloud-white/70">Título *</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-app-border bg-deep-navy px-3 py-2 text-sm text-cloud-white focus:ring-1 focus:ring-cyan-ia focus:outline-none"
                placeholder="Ex: Webinário: IA para Contadores"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-cloud-white/70">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as (typeof EVENT_TYPES)[number] })}
                className="w-full rounded-lg border border-app-border bg-deep-navy px-3 py-2 text-sm text-cloud-white focus:ring-1 focus:ring-cyan-ia focus:outline-none"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-cloud-white/70">Início *</label>
              <input
                required
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full rounded-lg border border-app-border bg-deep-navy px-3 py-2 text-sm text-cloud-white focus:ring-1 focus:ring-cyan-ia focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-cloud-white/70">Término (opcional)</label>
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full rounded-lg border border-app-border bg-deep-navy px-3 py-2 text-sm text-cloud-white focus:ring-1 focus:ring-cyan-ia focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-cloud-white/70">Link de inscrição</label>
              <input
                type="url"
                value={form.registrationUrl}
                onChange={(e) => setForm({ ...form, registrationUrl: e.target.value })}
                className="w-full rounded-lg border border-app-border bg-deep-navy px-3 py-2 text-sm text-cloud-white focus:ring-1 focus:ring-cyan-ia focus:outline-none"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-cloud-white/70">Thumbnail (URL)</label>
              <input
                type="url"
                value={form.thumbnail}
                onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                className="w-full rounded-lg border border-app-border bg-deep-navy px-3 py-2 text-sm text-cloud-white focus:ring-1 focus:ring-cyan-ia focus:outline-none"
                placeholder="https://..."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-cloud-white/70">Descrição</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-app-border bg-deep-navy px-3 py-2 text-sm text-cloud-white focus:ring-1 focus:ring-cyan-ia focus:outline-none resize-none"
                placeholder="Descreva o evento..."
              />
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-cloud-white/70 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPremium}
                onChange={(e) => setForm({ ...form, isPremium: e.target.checked })}
                className="rounded border-app-border bg-deep-navy accent-cyan-ia"
              />
              Premium
            </label>
            <label className="flex items-center gap-2 text-sm text-cloud-white/70 cursor-pointer">
              <input
                type="checkbox"
                checked={form.publish}
                onChange={(e) => setForm({ ...form, publish: e.target.checked })}
                className="rounded border-app-border bg-deep-navy accent-cyan-ia"
              />
              Publicar agora
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-tech-blue px-6 py-2 text-sm font-semibold text-white disabled:opacity-60 hover:bg-tech-blue/80 transition-colors"
            >
              {saving ? "Salvando..." : editingId ? "Salvar alterações" : "Criar evento"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-app-border px-5 py-2 text-sm text-cloud-white/60 hover:bg-midnight-blue transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {sorted.length === 0 ? (
        <p className="py-12 text-center text-cloud-white/40">Nenhum evento criado ainda.</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-4 rounded-xl border border-app-border bg-midnight-blue p-4"
            >
              <div className="flex-shrink-0 text-center">
                <div className="flex h-14 w-14 flex-col items-center justify-center rounded-lg bg-deep-navy">
                  <span className="text-xl font-bold text-cyan-ia leading-none">
                    {new Date(event.startDate).getDate()}
                  </span>
                  <span className="text-[10px] font-semibold uppercase text-cloud-white/50 mt-0.5">
                    {new Date(event.startDate).toLocaleString("pt-BR", { month: "short" })}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase text-cyan-ia">
                    {EVENT_TYPE_LABELS[event.type]}
                  </span>
                  {event.isPremium && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 border border-amber-100 uppercase">
                      Premium
                    </span>
                  )}
                  {event.publishedAt ? (
                    <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-bold text-green-400 uppercase">
                      Publicado
                    </span>
                  ) : (
                    <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold text-yellow-400 uppercase">
                      Rascunho
                    </span>
                  )}
                </div>
                <p className="font-semibold text-cloud-white truncate">{event.title}</p>
                <p className="text-xs text-cloud-white/50 mt-0.5">
                  {new Date(event.startDate).toLocaleString("pt-BR", {
                    day: "2-digit", month: "short", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                    timeZone: "America/Sao_Paulo",
                  })}
                  {event.endDate && ` – ${new Date(event.endDate).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })}`}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleEdit(event)}
                  className="rounded-lg border border-app-border px-3 py-1.5 text-xs text-cloud-white/60 hover:text-cloud-white hover:bg-deep-navy transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(event.id)}
                  className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

