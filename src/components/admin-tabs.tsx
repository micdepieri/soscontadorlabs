"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

type Tab = "videos" | "materials" | "categories";

export default function AdminTabs({
  videos,
  materials,
  categories,
}: {
  videos: Video[];
  materials: Material[];
  categories: Category[];
}) {
  const [tab, setTab] = useState<Tab>("videos");
  const router = useRouter();

  return (
    <div>
      {/* Tab nav */}
      <div className="mb-8 border-b border-gray-200">
        <div className="flex gap-6">
          {(["videos", "materials", "categories"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                tab === t
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "videos" ? "Vídeos" : t === "materials" ? "Materiais" : "Categorias"}
            </button>
          ))}
        </div>
      </div>

      {tab === "videos" && (
        <VideoTab videos={videos} categories={categories} onSave={() => router.refresh()} />
      )}
      {tab === "materials" && (
        <MaterialTab
          materials={materials}
          categories={categories}
          onSave={() => router.refresh()}
        />
      )}
      {tab === "categories" && (
        <CategoryTab categories={categories} onSave={() => router.refresh()} />
      )}
    </div>
  );
}

function VideoTab({
  videos,
  categories,
  onSave,
}: {
  videos: Video[];
  categories: Category[];
  onSave: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
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
    await fetch("/api/admin/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        publishedAt: form.publish ? new Date().toISOString() : null,
      }),
    });
    setSaving(false);
    setShowForm(false);
    setForm({
      title: "",
      url: "",
      description: "",
      categoryId: "",
      tags: "",
      isPremium: false,
      publish: true,
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
        <h2 className="font-semibold text-gray-900">{videos.length} vídeos</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white transition-colors hover:bg-indigo-700"
        >
          + Adicionar vídeo
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 space-y-4 rounded-xl border border-indigo-200 bg-indigo-50 p-6"
        >
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
                className="rounded"
              />
              Premium
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.publish}
                onChange={(e) => setForm({ ...form, publish: e.target.checked })}
                className="rounded"
              />
              Publicar agora
            </label>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-6 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-300 px-6 py-2 text-sm text-gray-700 hover:bg-gray-50"
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
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{video.title}</p>
              <p className="truncate text-xs text-gray-400">{video.url}</p>
            </div>
            <div className="ml-4 flex shrink-0 items-center gap-3">
              {video.isPremium && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                  Premium
                </span>
              )}
              {!video.publishedAt && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                  Rascunho
                </span>
              )}
              <button
                onClick={() => handleDelete(video.id)}
                className="text-xs text-red-500 hover:text-red-700"
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

function MaterialTab({
  materials,
  categories,
  onSave,
}: {
  materials: Material[];
  categories: Category[];
  onSave: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
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
    await fetch("/api/admin/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        publishedAt: form.publish ? new Date().toISOString() : null,
      }),
    });
    setSaving(false);
    setShowForm(false);
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
        <h2 className="font-semibold text-gray-900">{materials.length} materiais</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white transition-colors hover:bg-indigo-700"
        >
          + Adicionar material
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 space-y-4 rounded-xl border border-indigo-200 bg-indigo-50 p-6"
        >
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
                className="rounded"
              />
              Premium
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.publish}
                onChange={(e) => setForm({ ...form, publish: e.target.checked })}
                className="rounded"
              />
              Publicar agora
            </label>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-6 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-300 px-6 py-2 text-sm text-gray-700 hover:bg-gray-50"
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
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{material.title}</p>
              <p className="text-xs text-gray-400">
                {material.type} · <span className="truncate">{material.url}</span>
              </p>
            </div>
            <div className="ml-4 flex shrink-0 items-center gap-3">
              {material.isPremium && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                  Premium
                </span>
              )}
              {!material.publishedAt && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                  Rascunho
                </span>
              )}
              <button
                onClick={() => handleDelete(material.id)}
                className="text-xs text-red-500 hover:text-red-700"
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

function CategoryTab({ categories, onSave }: { categories: Category[]; onSave: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim() }),
    });
    setSaving(false);
    setName("");
    setDescription("");
    onSave();
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
        className="mb-8 space-y-4 rounded-xl border border-gray-200 bg-white p-6"
      >
        <h3 className="font-semibold text-gray-900">Nova categoria</h3>
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
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-indigo-600 px-6 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Criar categoria"}
        </button>
      </form>

      <div className="space-y-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">{cat.name}</p>
              <p className="text-xs text-gray-400">/{cat.slug}</p>
            </div>
            <button
              onClick={() => handleDelete(cat.id)}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Remover
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
