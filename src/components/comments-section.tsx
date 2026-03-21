"use client";

import { useState, useTransition } from "react";
import Image from "next/image";

interface CommentLike {
  id: string;
  userId: string;
  commentId: string;
}

interface Author {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

interface Comment {
  id: string;
  content: string;
  author: Author;
  likes: CommentLike[];
  createdAt: Date;
  replies?: Comment[];
}

interface Props {
  contentId: string;
  contentType: "video" | "material";
  comments: Comment[];
  currentUserId: string | null;
  currentUserClerkId: string | null;
}

function formatDate(date: Date) {
  return new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" }).format(
    Math.round((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    "day"
  );
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
  contentType: "video" | "material";
  onUpdate: () => void;
  depth?: number;
}) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isPending, startTransition] = useTransition();
  const likedByMe = currentUserId
    ? comment.likes.some((l) => l.userId === currentUserId)
    : false;

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

  return (
    <div className={`flex gap-3 ${depth > 0 ? "ml-8 mt-3" : ""}`}>
      <div className="shrink-0">
        {comment.author.avatarUrl ? (
          <Image
            src={comment.author.avatarUrl}
            alt={comment.author.name || ""}
            width={32}
            height={32}
            className="rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-600">
            {(comment.author.name || "U").charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 rounded-xl px-4 py-3">
          <p className="text-sm font-semibold text-gray-900">
            {comment.author.name || "Usuário"}
          </p>
          <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        </div>
        <div className="mt-1.5 flex items-center gap-4 px-1">
          <button
            onClick={handleLike}
            disabled={!currentUserId}
            className={`flex items-center gap-1 text-xs transition-colors ${
              likedByMe
                ? "text-indigo-600 font-medium"
                : "text-gray-500 hover:text-indigo-600"
            } disabled:opacity-40`}
          >
            <svg className="w-3.5 h-3.5" fill={likedByMe ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {comment.likes.length > 0 && comment.likes.length}
          </button>
          {currentUserId && depth === 0 && (
            <button
              onClick={() => setReplying(!replying)}
              className="text-xs text-gray-500 hover:text-indigo-600 transition-colors"
            >
              Responder
            </button>
          )}
          <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
        </div>

        {replying && (
          <form onSubmit={handleReply} className="mt-3 flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Escreva uma resposta..."
              className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={isPending || !replyText.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? "..." : "Enviar"}
            </button>
            <button
              type="button"
              onClick={() => setReplying(false)}
              className="rounded-lg px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
          </form>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 space-y-3">
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
  currentUserClerkId,
}: Props) {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [isPending, startTransition] = useTransition();

  async function refreshComments() {
    const res = await fetch(
      `/api/comments?contentId=${contentId}&contentType=${contentType}`
    );
    if (res.ok) {
      const data = await res.json();
      setComments(data);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    startTransition(async () => {
      await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment.trim(),
          contentId,
          contentType,
        }),
      });
      setNewComment("");
      await refreshComments();
    });
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        Comentários ({comments.length})
      </h2>

      {currentUserClerkId ? (
        <form onSubmit={handleSubmit} className="mb-8 flex gap-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Compartilhe sua experiência ou dúvida..."
            rows={3}
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <button
            type="submit"
            disabled={isPending || !newComment.trim()}
            className="self-end rounded-xl bg-indigo-600 px-6 py-3 text-sm text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? "Enviando..." : "Comentar"}
          </button>
        </form>
      ) : (
        <p className="mb-8 text-sm text-gray-500">
          <a href="/sign-in" className="text-indigo-600 hover:underline">Faça login</a> para comentar.
        </p>
      )}

      {comments.length === 0 ? (
        <p className="text-center py-12 text-gray-500 text-sm">
          Seja o primeiro a comentar!
        </p>
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
