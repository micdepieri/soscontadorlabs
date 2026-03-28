"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Image from "next/image";

interface ProfileData {
  uid: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  city: string | null;
  state: string | null;
  skills: string[];
  linkedin: string | null;
  instagram: string | null;
  phone: string | null;
}

const BRAZIL_STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
  "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

export default function ProfileEditForm({ initialData }: { initialData: ProfileData }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: initialData.name ?? "",
    bio: initialData.bio ?? "",
    city: initialData.city ?? "",
    state: initialData.state ?? "",
    skills: initialData.skills ?? [],
    linkedin: initialData.linkedin ?? "",
    instagram: initialData.instagram ?? "",
    phone: initialData.phone ?? "",
    avatarUrl: initialData.avatarUrl ?? "",
  });
  const [skillInput, setSkillInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function addSkill(raw: string) {
    const skill = raw.trim();
    if (skill && !form.skills.includes(skill)) {
      setForm((f) => ({ ...f, skills: [...f.skills, skill] }));
    }
    setSkillInput("");
  }

  function handleSkillKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(skillInput);
    } else if (e.key === "Backspace" && skillInput === "" && form.skills.length > 0) {
      setForm((f) => ({ ...f, skills: f.skills.slice(0, -1) }));
    }
  }

  function removeSkill(skill: string) {
    setForm((f) => ({ ...f, skills: f.skills.filter((s) => s !== skill) }));
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMsg("Imagem deve ter menos de 2 MB.");
      return;
    }

    setUploading(true);
    setMsg("");
    try {
      const storageRef = ref(storage, `avatars/${initialData.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setForm((f) => ({ ...f, avatarUrl: url }));
    } catch {
      setMsg("Erro ao fazer upload da foto.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name || null,
          avatarUrl: form.avatarUrl || null,
          bio: form.bio || null,
          city: form.city || null,
          state: form.state || null,
          skills: form.skills,
          linkedin: form.linkedin || null,
          instagram: form.instagram || null,
          phone: form.phone || null,
        }),
      });
      if (!res.ok) throw new Error();
      setMsg("Perfil salvo!");
      setIsEditing(false);
      router.refresh();
    } catch {
      setMsg("Erro ao salvar perfil.");
    } finally {
      setSaving(false);
    }
  }

  if (!isEditing) {
    return (
      <button
        onClick={() => { setIsEditing(true); setMsg(""); }}
        className="rounded-lg border border-indigo-600 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors"
      >
        Editar perfil
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">Editar perfil</h3>
        <button
          onClick={() => setIsEditing(false)}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          Cancelar
        </button>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative">
          {form.avatarUrl ? (
            <Image
              src={form.avatarUrl}
              alt="Foto de perfil"
              width={72}
              height={72}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600">
              {(form.name || "?").charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="rounded-lg bg-white border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
          >
            {uploading ? "Enviando..." : "Alterar foto"}
          </button>
          <p className="mt-1 text-xs text-gray-400">JPG, PNG ou WebP · máx. 2 MB</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>
      </div>

      {/* Name */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Nome completo</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Seu nome"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Telefone / WhatsApp</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="(11) 99999-9999"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Location */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Cidade</label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            placeholder="Ex: São Paulo"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Estado</label>
          <select
            value={form.state}
            onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">Selecione</option>
            {BRAZIL_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Bio / Apresentação</label>
        <textarea
          value={form.bio}
          onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
          rows={3}
          maxLength={300}
          placeholder="Conte um pouco sobre você, sua área de atuação..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
        />
        <p className="mt-1 text-right text-xs text-gray-400">{form.bio.length}/300</p>
      </div>

      {/* Skills */}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Especialidades / Skills
        </label>
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500 min-h-[42px]">
          {form.skills.map((skill) => (
            <span
              key={skill}
              className="flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="text-indigo-400 hover:text-indigo-700 leading-none"
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={handleSkillKeyDown}
            onBlur={() => { if (skillInput.trim()) addSkill(skillInput); }}
            placeholder={form.skills.length === 0 ? "Ex: Contabilidade, Fiscal, SPED... (Enter para adicionar)" : ""}
            className="flex-1 min-w-32 text-sm outline-none bg-transparent"
          />
        </div>
        <p className="mt-1 text-xs text-gray-400">Pressione Enter ou vírgula para adicionar cada skill</p>
      </div>

      {/* Social */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">LinkedIn</label>
          <input
            type="url"
            value={form.linkedin}
            onChange={(e) => setForm((f) => ({ ...f, linkedin: e.target.value }))}
            placeholder="https://linkedin.com/in/..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Instagram</label>
          <input
            type="text"
            value={form.instagram}
            onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
            placeholder="@usuario"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 border-t border-indigo-100 pt-4">
        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          {saving ? "Salvando..." : "Salvar perfil"}
        </button>
        <button
          onClick={() => setIsEditing(false)}
          className="rounded-lg border border-gray-300 px-6 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        {msg && (
          <p className={`text-sm ${msg.startsWith("Erro") ? "text-red-600" : "text-green-600"}`}>
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}
