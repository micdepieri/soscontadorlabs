"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string | null;
  authorAvatarUrl: string | null;
  imageUrl?: string | null;
  likes: string[]; // array of UIDs
  createdAt: string;
  replies?: Comment[];
}

interface User {
  uid: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

interface Props {
  contentId: string;
  contentType: "video" | "material" | "post";
  comments: Comment[];
  currentUserId: string | null;
  isLoggedIn: boolean;
}

function formatDate(dateStr: string) {
  try {
    const diff = Math.round((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "hoje";
    return new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" }).format(diff, "day");
  } catch (e) {
    return "recentemente";
  }
}

function CommentItem({
  comment,
  currentUserId,
  contentId,
  contentType,
  onUpdate,
  depth = 0,
}: {
  comment: Comment;
  currentUserId: string | null;
  contentId: string;
  contentType: "video" | "material" | "post";
  onUpdate: () => void;
  depth?: number;
}) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isPending, startTransition] = useTransition();
  const likedByMe = currentUserId ? comment.likes.includes(currentUserId) : false;

  async function handleLike() {
    if (!currentUserId) return;
    await fetch(`/api/comments/${comment.id}/likes`, { method: "POST" });
    onUpdate();
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim()) return;
    startTransition(async () => {
      await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: replyText.trim(),
          contentId,
          contentType,
          parentId: comment.id,
        }),
      });
      setReplyText("");
      setReplying(false);
      onUpdate();
    });
  }

  // Highlight mentions in content
  const renderContent = (content: string) => {
    const parts = content.split(/(@\S+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        return <span key={i} className="font-semibold text-cyan-ia cursor-pointer hover:underline">{part}</span>;
      }
      return part;
    });
  };

  return (
    <div className={`flex gap-3 group ${depth > 0 ? "mt-4 ml-8 border-l-2 border-app-border pl-4" : ""}`}>
      <div className="shrink-0 pt-1">
        {comment.authorAvatarUrl ? (
          <Image
            src={comment.authorAvatarUrl}
            alt={comment.authorName || ""}
            width={depth > 0 ? 24 : 36}
            height={depth > 0 ? 24 : 36}
            className="rounded-full ring-2 ring-white shadow-sm"
          />
        ) : (
          <div className={`flex ${depth > 0 ? "h-6 w-6" : "h-9 w-9"} items-center justify-center rounded-full bg-tech-blue/30 text-[10px] font-bold text-cyan-ia`}>
            {(comment.authorName || "U").charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-midnight-blue border border-app-border p-4 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-bold text-cloud-white">{comment.authorName || "Membro"}</p>
            <span className="text-[10px] text-cloud-white/40 font-medium uppercase">{formatDate(comment.createdAt)}</span>
          </div>
          <p className="text-sm break-words whitespace-pre-wrap text-cloud-white/80 leading-relaxed">
            {renderContent(comment.content)}
          </p>
          
          {comment.imageUrl && (
            <div className="mt-4 overflow-hidden rounded-xl border border-app-border bg-deep-navy">
              <img 
                src={comment.imageUrl} 
                alt="Anexo" 
                className="max-h-96 w-auto object-contain mx-auto"
              />
            </div>
          )}
        </div>
        
        <div className="mt-2 flex items-center gap-4 px-2">
          <button
            onClick={handleLike}
            disabled={!currentUserId}
            className={`flex items-center gap-1.5 text-xs transition-all active:scale-95 ${
              likedByMe ? "font-bold text-cyan-ia" : "text-cloud-white/50 hover:text-cyan-ia"
            } disabled:opacity-40`}
          >
            <svg
              className={`h-4 w-4 ${likedByMe ? "fill-cyan-ia" : "fill-none"}`}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            {comment.likes.length > 0 ? comment.likes.length : "Curtir"}
          </button>
          
          {currentUserId && depth === 0 && (
            <button
              onClick={() => setReplying(!replying)}
              className="text-xs font-medium text-cloud-white/50 transition-colors hover:text-cyan-ia"
            >
              Responder
            </button>
          )}
        </div>

        {replying && (
          <form onSubmit={handleReply} className="mt-4 flex gap-3 animate-in fade-in slide-in-from-top-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Escreva uma resposta..."
              className="flex-1 rounded-xl border border-app-border px-4 py-2 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none transition-all"
              autoFocus
            />
            <button
              type="submit"
              disabled={isPending || !replyText.trim()}
              className="rounded-xl bg-tech-blue px-5 py-2 text-xs font-bold text-white transition-all hover:bg-tech-blue/80 active:scale-95 disabled:opacity-50"
            >
              {isPending ? "..." : "Enviar"}
            </button>
            <button
              type="button"
              onClick={() => setReplying(false)}
              className="rounded-xl px-4 py-2 text-xs font-medium text-cloud-white/50 hover:bg-midnight-blue transition-colors"
            >
              Cancelar
            </button>
          </form>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-1 space-y-1">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentUserId={currentUserId}
                contentId={contentId}
                contentType={contentType}
                onUpdate={onUpdate}
                depth={1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommentsSection({
  contentId,
  contentType,
  comments: initialComments,
  currentUserId,
  isLoggedIn,
}: Props) {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionUsers, setMentionUsers] = useState<User[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mentionQuery.length > 1) {
      fetch(`/api/users/search?q=${mentionQuery}`)
        .then(res => res.json())
        .then(data => setMentionUsers(data));
    } else {
      setMentionUsers([]);
    }
  }, [mentionQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewComment(value);

    // Basic mention detection
    const lastWord = value.split(" ").pop() || "";
    if (lastWord.startsWith("@") && lastWord.length > 1) {
      setMentionQuery(lastWord.slice(1));
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (user: User) => {
    const words = newComment.split(" ");
    words.pop(); // Remove the partial query
    setNewComment(words.join(" ") + (words.length > 0 ? " " : "") + "@" + (user.name || user.email.split("@")[0]) + " ");
    setShowMentions(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  async function refreshComments() {
    const res = await fetch(`/api/comments?contentId=${contentId}&contentType=${contentType}`);
    if (res.ok) {
      const data = await res.json();
      setComments(data);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() && !image) return;

    startTransition(async () => {
      let imageUrl = null;
      if (image) {
        const storageRef = ref(storage, `comments/${Date.now()}-${image.name}`);
        const snapshot = await uploadBytes(storageRef, image);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment.trim(),
          contentId,
          contentType,
          imageUrl,
        }),
      });

      setNewComment("");
      setImage(null);
      setImagePreview(null);
      await refreshComments();
    });
  }

  return (
    <div className="relative">
      <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-cloud-white">
        <svg className="h-5 w-5 text-cyan-ia" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        Comunidade ({comments.length})
      </h2>

      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="mb-10 space-y-3">
          <div className="relative rounded-2xl border border-app-border bg-midnight-blue p-3 focus-within:ring-2 focus-within:ring-cyan-ia transition-all shadow-xs">
            <textarea
              value={newComment}
              onChange={handleInputChange}
              placeholder="Mande sua mensagem ou @mencione alguém..."
              rows={3}
              className="w-full resize-none border-none bg-transparent p-2 text-sm focus:outline-none"
            />
            
            {/* Mention Suggestions Popup */}
            {showMentions && mentionUsers.length > 0 && (
              <div className="absolute bottom-full left-0 mb-2 w-64 rounded-xl border border-app-border bg-midnight-blue p-2 shadow-xl z-50">
                {mentionUsers.map(user => (
                  <button
                    key={user.uid}
                    type="button"
                    onClick={() => insertMention(user)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-left hover:bg-deep-navy transition-colors"
                  >
                    <div className="h-6 w-6 rounded-full bg-tech-blue/30 flex items-center justify-center text-[10px] font-bold text-cyan-ia">
                      {user.avatarUrl ? <img src={user.avatarUrl} className="h-full w-full rounded-full" /> : (user.name || "U")[0]}
                    </div>
                    <span>{user.name || user.email}</span>
                  </button>
                ))}
              </div>
            )}

            {imagePreview && (
              <div className="relative mt-2 inline-block">
                <img src={imagePreview} className="h-24 w-24 rounded-lg object-cover border border-app-border" />
                <button 
                  onClick={() => { setImage(null); setImagePreview(null); }}
                  className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-md hover:bg-red-600"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            )}

            <div className="mt-2 flex items-center justify-between border-t border-app-border pt-2 px-1">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg p-2 text-cloud-white/40 transition-colors hover:bg-midnight-blue hover:text-cyan-ia"
                  title="Anexar imagem"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-xl bg-tech-blue px-6 py-2 text-sm font-bold text-white transition-all hover:bg-tech-blue/80 active:scale-95 disabled:opacity-50"
              >
                {isPending ? "Enviando..." : "Compartilhar"}
              </button>
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </form>
      ) : (
        <div className="mb-10 rounded-2xl bg-midnight-blue border border-app-border p-6 text-center shadow-xs">
          <p className="text-sm font-medium text-cloud-white">
            Entre na conversa! <Link href="/sign-in" className="font-bold underline">Faça login</Link> para compartilhar sua experiência.
          </p>
        </div>
      )}

      {comments.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center animate-in fade-in zoom-in-95">
          <div className="mb-4 rounded-full bg-midnight-blue p-6">
            <svg className="h-10 w-10 text-cloud-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-cloud-white/40">Silêncio no momento...<br/>Seja o primeiro a puxar o assunto!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              contentId={contentId}
              contentType={contentType}
              onUpdate={refreshComments}
            />
          ))}
        </div>
      )}
    </div>
  );
}
