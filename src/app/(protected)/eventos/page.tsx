import { getEvents } from "@/lib/firestore";
import { getCurrentUser } from "@/lib/get-user";
import Link from "next/link";
import type { Metadata } from "next";
import EventsCalendar from "@/components/events-calendar";

export const metadata: Metadata = {
  title: "Eventos | Portal da Comunidade",
  description: "Webinários, lives e workshops da comunidade.",
};

export default async function EventosPage() {
  const user = await getCurrentUser();
  const isAdmin = user?.role === "ADMIN";

  const events = await getEvents({ publishedOnly: !isAdmin });

  const publicEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    type: e.type,
    startDate: e.startDate,
    endDate: e.endDate,
    registrationUrl: e.registrationUrl,
    thumbnail: e.thumbnail,
    isPremium: e.isPremium,
  }));

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        {isAdmin ? (
          <div className="rounded-2xl border border-cyan-ia/20 bg-linear-to-r from-tech-blue to-cyan-ia/30 p-8 text-white shadow-lg">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-bold">Eventos da Comunidade</h1>
              <p className="mt-2 text-cloud-white/80">
                Gerencie webinários, lives e workshops publicados na plataforma.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/admin?tab=events"
                  className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-tech-blue transition-transform active:scale-95 hover:bg-gray-50"
                >
                  Criar Evento
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-cloud-white">Eventos da Comunidade</h1>
            <p className="mt-2 text-cloud-white/60 max-w-2xl text-lg">
              Fique por dentro dos próximos webinários, lives e workshops. Inscreva-se e aprenda com a comunidade.
            </p>
          </>
        )}
      </div>

      <EventsCalendar events={publicEvents} />
    </div>
  );
}
