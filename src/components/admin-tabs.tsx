"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
  publishedAt: Date | null;
  category: Category | null;
  tags: string[];
}

type Tab = "videos" | "materials" | "posts" | "categories" | "demands" | "settings" | "members";

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

export default function AdminTabs({
  videos,
  materials,
  posts,
  categories,
  contentRequests,
  aiSettings,
  members,
  ratingStats,
}: {
  videos: Video[];
  materials: Material[];
  posts: Post[];
  categories: Category[];
  contentRequests: ContentRequest[];
  aiSettings: AISettingsData;
  members: Member[];
  ratingStats: Record<string, { total: number; count: number; average: number }>;
}) {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("videos");
  const router = useRouter();

  useEffect(() => {
    const t = searchParams.get("tab") as Tab;
    if (
      t &&
      (["videos", "materials", "posts", "categories", "demands", "settings", "members"] as Tab[]).includes(t)
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
      <div className="mb-8 border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-6 min-w-max pb-px">
          {(["videos", "materials", "posts", "categories", "demands", "settings", "members"] as Tab[]).map(
            (t) => (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                className={`relative border-b-2 pb-3 text-sm font-medium transition-colors ${
                  tab === t
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
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
                  : t === "members"
                  ? "Membros"
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
        <AISettingsTab initialSettings={aiSettings} onSave={() => router.refresh()} />
      )}
      {tab === "members" && (
        <MembersTab initialMembers={members} onSave={() => router.refresh()} />
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

  async function handleDelete(id: string) {
    if (!confirm("Remover este vídeo?")) return;
    await fetch(`/api/admin/videos/${id}`, { method: "DELETE" });
    onSave();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">{videos.length} vídeos</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white transition-colors hover:bg-indigo-700"
          >
            + Adicionar vídeo
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 space-y-4 rounded-xl border border-indigo-200 bg-indigo-50 p-6"
        >
          <h3 className="text-sm font-bold text-indigo-900">
            {editingId ? "Editar vídeo" : "Novo vídeo"}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Título *</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">URL do vídeo *</label>
              <input
                required
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="YouTube, Vimeo ou embed URL"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Descrição</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Categoria</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Tags (separadas por vírgula)
              </label>
              <input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isPremium}
                onChange={(e) => setForm({ ...form, isPremium: e.target.checked })}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              Premium
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.publish}
                onChange={(e) => setForm({ ...form, publish: e.target.checked })}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              Publicar agora
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Salvando..." : editingId ? "Atualizar" : "Salvar"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
            className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-gray-900">{video.title}</p>
              <p className="truncate text-xs text-gray-400">{video.url}</p>
              {video.category && (
                <span className="mt-1 inline-block rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600">
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
                      <span className="text-sm font-black text-gray-900">{ratingStats[video.id].average}</span>
                   </div>
                   <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{ratingStats[video.id].count} votos</div>
                </div>
              )}
            </div>
            
            <div className="ml-4 flex shrink-0 items-center gap-4">
              {video.isPremium && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 uppercase tracking-tighter">
                  Premium
                </span>
              )}
              {!video.publishedAt && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 uppercase tracking-tighter">
                  Rascunho
                </span>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleEdit(video)}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
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

  async function handleDelete(id: string) {
    if (!confirm("Remover este material?")) return;
    await fetch(`/api/admin/materials/${id}`, { method: "DELETE" });
    onSave();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">{materials.length} materiais</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white transition-colors hover:bg-indigo-700"
          >
            + Adicionar material
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 space-y-4 rounded-xl border border-indigo-200 bg-indigo-50 p-6"
        >
          <h3 className="text-sm font-bold text-indigo-900">
            {editingId ? "Editar material" : "Novo material"}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Título *</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">URL *</label>
              <input
                required
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="LINK">Link</option>
                <option value="PDF">PDF</option>
                <option value="RESOURCE">Recurso</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Categoria</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
            <label className="mb-1 block text-xs font-medium text-gray-700">Descrição</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Tags (separadas por vírgula)
            </label>
            <input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isPremium}
                onChange={(e) => setForm({ ...form, isPremium: e.target.checked })}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              Premium
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.publish}
                onChange={(e) => setForm({ ...form, publish: e.target.checked })}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              Publicar agora
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Salvando..." : editingId ? "Atualizar" : "Salvar"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
            className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-gray-900">{material.title}</p>
              <p className="text-xs text-gray-400">
                {material.type} · <span className="truncate">{material.url}</span>
              </p>
              {material.category && (
                <span className="mt-1 inline-block rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600">
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
                      <span className="text-sm font-black text-gray-900">{ratingStats[material.id].average}</span>
                   </div>
                   <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{ratingStats[material.id].count} votos</div>
                </div>
              )}
            </div>

            <div className="ml-4 flex shrink-0 items-center gap-4">
              {material.isPremium && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 uppercase tracking-tighter">
                  Premium
                </span>
              )}
              {!material.publishedAt && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 uppercase tracking-tighter">
                  Rascunho
                </span>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleEdit(material)}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
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
        className="mb-8 space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h3 className="text-sm font-bold text-gray-900">
          {editingId ? "Editar categoria" : "Nova categoria"}
        </h3>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Nome *</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Descrição</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? "Salvando..." : editingId ? "Atualizar" : "Criar categoria"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
            className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm"
          >
            <div>
              <p className="font-semibold text-gray-900">{cat.name}</p>
              <p className="text-xs text-gray-400">/{cat.slug}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleEdit(cat as any)}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
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
  CANCELLED: "bg-gray-100 text-gray-600",
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
        <h2 className="font-semibold text-gray-900">
          Demandas de Conteúdo geradas pelo Assistente IA
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Registros de quando o assistente não encontrou conteúdo adequado para o usuário.
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-sm text-gray-400">
          Nenhuma demanda registrada ainda.
        </div>
      ) : (
        <div className="space-y-6">
          {(["PENDING", "IN_PROGRESS", "DONE", "CANCELLED"] as ContentRequest["status"][]).map(
            (status) =>
              grouped[status].length > 0 && (
                <div key={status}>
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <span className={`rounded-full px-2 py-0.5 ${STATUS_COLORS[status]}`}>
                      {STATUS_LABELS[status]}
                    </span>
                    <span>({grouped[status].length})</span>
                  </h3>
                  <div className="space-y-3">
                    {grouped[status].map((req) => (
                      <div
                        key={req.id}
                        className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 truncate">{req.topic}</p>
                            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{req.userMessage}</p>
                            <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
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
                              className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
        <h2 className="text-xl font-semibold text-gray-900">Artigos & Postagens (Substack-style)</h2>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          Novo Artigo
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-bold text-gray-900">
            {editingId ? "Editar Artigo" : "Criar Novo Artigo / Código de Agente"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Título</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setForm({ ...form, title, slug: editingId ? form.slug : generateSlug(title) });
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: Como configurar um Agente de Voz com OpenAI"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Slug (URL)</label>
                <input
                  type="text"
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Conteúdo (Markdown / Código)</label>
              <textarea
                required
                rows={12}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Escreva aqui seu artigo ou cole o código do seu agente..."
              />
              <p className="text-xs text-gray-400">Suporta Markdown para formatação e blocos de código.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Categoria</label>
                <select
                  required
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                <label className="text-sm font-medium text-gray-700">Tags (separadas por vírgula)</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="n8n, agente, automaçao"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6 border-t border-gray-100 pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPremium}
                  onChange={(e) => setForm({ ...form, isPremium: e.target.checked })}
                  className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">Conteúdo Premium</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.publish}
                  onChange={(e) => setForm({ ...form, publish: e.target.checked })}
                  className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">Publicar agora</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? "Salvando..." : editingId ? "Atualizar Artigo" : "Salvar Artigo"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Posts List */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm font-sans mb-10">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Título</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase text-center">Termômetro</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Categoria</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                  Nenhum artigo publicado ainda. Comece compartilhando seu primeiro conteúdo!
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 truncate max-w-xs">{post.title}</div>
                    <div className="text-xs text-gray-400">/{post.slug}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {ratingStats[post.id] && ratingStats[post.id].count > 0 ? (
                      <div className="inline-flex flex-col items-center">
                        <div className="flex items-center gap-1">
                          <span className="text-base">🔥</span>
                          <span className="text-sm font-bold text-gray-900">{ratingStats[post.id].average}</span>
                        </div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase">{ratingStats[post.id].count} votos</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{post.category?.name || "-"}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${post.publishedAt ? "bg-green-500" : "bg-yellow-500"}`} />
                      <span className="text-sm font-medium text-gray-700">
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
                        onClick={() => handleEdit(post)}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
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
        <h2 className="font-semibold text-gray-900">Configurações do Assistente IA</h2>
        <p className="mt-1 text-sm text-gray-500">
          Selecione o provedor de IA e o modelo a ser usado no assistente da comunidade.
          As chaves de API são armazenadas com segurança e nunca expostas ao frontend.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Provider */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Provedor de IA</h3>
          <div className="grid grid-cols-2 gap-3">
            {(["anthropic", "openai"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handleProviderChange(p)}
                className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
                  provider === p
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="text-2xl">{p === "anthropic" ? "🟣" : "🟢"}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {p === "anthropic" ? "Anthropic" : "OpenAI"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {p === "anthropic" ? "Claude" : "ChatGPT"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Model */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Modelo</h3>
          <div className="space-y-2">
            {models.map((m) => (
              <label
                key={m.value}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3 transition-colors ${
                  model === m.value
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="model"
                  value={m.value}
                  checked={model === m.value}
                  onChange={() => setModel(m.value)}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.label}</p>
                  <p className="text-xs text-gray-400 font-mono">{m.value}</p>
                </div>
              </label>
            ))}
            {model === "__custom__" && (
              <input
                type="text"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="ex: MiniMax-Text-01, mistralai/Mistral-7B-v0.1..."
                className="mt-2 w-full rounded-lg border border-indigo-300 px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            )}
          </div>
        </div>

        {/* API Keys */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Chaves de API</h3>
          <p className="text-xs text-gray-500">
            Deixe em branco para manter a chave atual. As chaves são armazenadas com segurança no
            Firestore e nunca enviadas ao browser.
          </p>

          {/* Anthropic Key */}
          <div>
            <label className="mb-1 flex items-center gap-2 text-xs font-medium text-gray-700">
              <span className="text-base">🟣</span> Chave Anthropic
              {initialSettings.anthropicApiKeySet && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                  Configurada
                </span>
              )}
            </label>
            {initialSettings.anthropicApiKeySet && (
              <p className="mb-1.5 font-mono text-xs text-gray-400">
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* OpenAI Key */}
          <div>
            <label className="mb-1 flex items-center gap-2 text-xs font-medium text-gray-700">
              <span className="text-base">🟢</span> Chave OpenAI
              {initialSettings.openaiApiKeySet && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                  Configurada
                </span>
              )}
            </label>
            {initialSettings.openaiApiKeySet && (
              <p className="mb-1.5 font-mono text-xs text-gray-400">
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* OpenAI-compatible Base URL */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Base URL (OpenAI-compatible)
            </label>
            <p className="mb-1.5 text-xs text-gray-400">
              Deixe vazio para usar a API padrão da OpenAI. Use para gateways compatíveis como OpenCode Zen, MiniMax, Together, etc.
            </p>
            <input
              type="text"
              value={openaiBaseUrl}
              onChange={(e) => setOpenaiBaseUrl(e.target.value)}
              placeholder="https://opencode.ai/zen/v1"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
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
        <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-xs text-gray-500 space-y-1">
          <p>
            <span className="font-medium text-gray-700">Configuração ativa:</span>{" "}
            {initialSettings.provider === "openai" ? "OpenAI" : "Anthropic"} /{" "}
            <span className="font-mono">{initialSettings.model}</span>
          </p>
          {initialSettings.provider === "openai" && initialSettings.openaiBaseUrl && (
            <p>
              <span className="font-medium text-gray-700">Base URL:</span>{" "}
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

const SUB_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  CANCELLED: "Cancelado",
  PAST_DUE: "Em atraso",
};

const SUB_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-gray-100 text-gray-500",
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
        <h2 className="text-lg font-semibold text-gray-900">
          Membros ({members.length})
        </h2>
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
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
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Nenhum membro encontrado.
                </td>
              </tr>
            )}
            {filtered.map((member) => (
              <React.Fragment key={member.uid}>
                <tr className="hover:bg-gray-50 transition-colors">
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
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">
                          {(member.name || member.email).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{member.name || "—"}</p>
                        <p className="text-xs text-gray-400">{member.email}</p>
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
                          SUB_STATUS_COLORS[member.subscription.status] || "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {SUB_STATUS_LABELS[member.subscription.status] || member.subscription.status}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {member.subscription?.currentPeriodEnd
                      ? new Date(member.subscription.currentPeriodEnd).toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(member.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() =>
                        editingUid === member.uid ? setEditingUid(null) : handleEdit(member)
                      }
                      className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      {editingUid === member.uid ? "Fechar" : "Editar"}
                    </button>
                  </td>
                </tr>
                {editingUid === member.uid && (
                  <tr key={`${member.uid}-edit`}>
                    <td colSpan={6} className="bg-indigo-50 px-6 py-5">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-700">
                            Perfil de acesso
                          </label>
                          <select
                            value={form.role}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, role: e.target.value as "MEMBER" | "ADMIN" }))
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          >
                            <option value="MEMBER">Membro</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-700">
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
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          >
                            <option value="ACTIVE">Ativo</option>
                            <option value="INACTIVE">Inativo</option>
                            <option value="CANCELLED">Cancelado</option>
                            <option value="PAST_DUE">Em atraso</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-700">
                            Validade da assinatura
                          </label>
                          <input
                            type="date"
                            value={form.subscriptionPeriodEnd}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, subscriptionPeriodEnd: e.target.value }))
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-700">
                            Stripe Customer ID
                          </label>
                          <input
                            type="text"
                            value={form.stripeCustomerId}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, stripeCustomerId: e.target.value }))
                            }
                            placeholder="cus_..."
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-700">
                            Stripe Subscription ID
                          </label>
                          <input
                            type="text"
                            value={form.stripeSubscriptionId}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, stripeSubscriptionId: e.target.value }))
                            }
                            placeholder="sub_..."
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-700">
                            Stripe Price ID
                          </label>
                          <input
                            type="text"
                            value={form.stripePriceId}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, stripePriceId: e.target.value }))
                            }
                            placeholder="price_..."
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-4">
                        <button
                          onClick={() => handleSave(member.uid)}
                          disabled={saving}
                          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                          {saving ? "Salvando..." : "Salvar alterações"}
                        </button>
                        <button
                          onClick={() => setEditingUid(null)}
                          className="rounded-lg border border-gray-300 px-5 py-2 text-sm text-gray-600 hover:bg-gray-100"
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

