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
        className="rounded-lg border border-cyan-ia px-4 py-2 text-sm text-cyan-ia hover:bg-tech-blue/20 transition-colors"
      >
        Editar perfil
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-app-border bg-midnight-blue p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-cloud-white">Editar perfil</h3>
        <button
          onClick={() => setIsEditing(false)}
          className="text-sm text-cloud-white/40 hover:text-cloud-white/70"
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
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-tech-blue/30 text-2xl font-bold text-cyan-ia">
              {(form.name || "?").charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border border-app-border px-3 py-1.5 text-sm text-cloud-white/70 hover:bg-deep-navy disabled:opacity-60 transition-colors"
          >
            {uploading ? "Enviando..." : "Alterar foto"}
          </button>
          <p className="mt-1 text-xs text-cloud-white/40">JPG, PNG ou WebP · máx. 2 MB</p>
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
          <label className="mb-1 block text-xs font-medium text-cloud-white/70">Nome completo</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Seu nome"
            className="w-full rounded-lg border border-app-border px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-cloud-white/70">Telefone / WhatsApp</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="(11) 99999-9999"
            className="w-full rounded-lg border border-app-border px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none"
          />
        </div>
      </div>

      {/* Location */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-cloud-white/70">Cidade</label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            placeholder="Ex: São Paulo"
            className="w-full rounded-lg border border-app-border px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-cloud-white/70">Estado</label>
          <select
            value={form.state}
            onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
            className="w-full rounded-lg border border-app-border px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none"
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
        <label className="mb-1 block text-xs font-medium text-cloud-white/70">Bio / Apresentação</label>
        <textarea
          value={form.bio}
          onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
          rows={3}
          maxLength={300}
          placeholder="Conte um pouco sobre você, sua área de atuação..."
          className="w-full rounded-lg border border-app-border px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none resize-none"
        />
        <p className="mt-1 text-right text-xs text-cloud-white/40">{form.bio.length}/300</p>
      </div>

      {/* Skills */}
      <div>
        <label className="mb-1 block text-xs font-medium text-cloud-white/70">
          Especialidades / Skills
        </label>
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-app-border bg-app-input-bg px-3 py-2 focus-within:ring-2 focus-within:ring-cyan-ia min-h-[42px]">
          {form.skills.map((skill) => (
            <span
              key={skill}
              className="flex items-center gap-1 rounded-full bg-tech-blue/30 px-2.5 py-0.5 text-xs font-medium text-cyan-ia"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="text-cyan-ia/60 hover:text-cyan-ia leading-none"
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
            className="flex-1 min-w-32 text-sm outline-none bg-transparent text-cloud-white placeholder:text-cloud-white/30"
          />
        </div>
        <p className="mt-1 text-xs text-cloud-white/40">Pressione Enter ou vírgula para adicionar cada skill</p>
      </div>

      {/* Social */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-cloud-white/70">LinkedIn</label>
          <input
            type="url"
            value={form.linkedin}
            onChange={(e) => setForm((f) => ({ ...f, linkedin: e.target.value }))}
            placeholder="https://linkedin.com/in/..."
            className="w-full rounded-lg border border-app-border px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-cloud-white/70">Instagram</label>
          <input
            type="text"
            value={form.instagram}
            onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
            placeholder="@usuario"
            className="w-full rounded-lg border border-app-border px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 border-t border-app-border pt-4">
        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="rounded-lg bg-tech-blue px-6 py-2 text-sm font-semibold text-white hover:bg-tech-blue/80 disabled:opacity-60 transition-colors"
        >
          {saving ? "Salvando..." : "Salvar perfil"}
        </button>
        <button
          onClick={() => setIsEditing(false)}
          className="rounded-lg border border-app-border px-6 py-2 text-sm text-cloud-white/60 hover:bg-deep-navy transition-colors"
        >
          Cancelar
        </button>
        {msg && (
          <p className={`text-sm ${msg.startsWith("Erro") ? "text-red-400" : "text-green-400"}`}>
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}
