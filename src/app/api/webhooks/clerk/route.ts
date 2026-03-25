import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("CLERK_WEBHOOK_SECRET environment variable not set");
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let event: WebhookEvent;

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  switch (event.type) {
    case "user.created": {
      const { id, email_addresses, first_name, last_name, image_url } = event.data;
      const primaryEmail = email_addresses.find(
        (e) => e.id === event.data.primary_email_address_id
      );

      if (!primaryEmail) break;

      await prisma.user.create({
        data: {
          clerkId: id,
          email: primaryEmail.email_address,
          name: [first_name, last_name].filter(Boolean).join(" ") || null,
          avatarUrl: image_url || null,
        },
      });
      break;
    }

    case "user.updated": {
      const { id, email_addresses, first_name, last_name, image_url } = event.data;
      const primaryEmail = email_addresses.find(
        (e) => e.id === event.data.primary_email_address_id
      );

      await prisma.user.update({
        where: { clerkId: id },
        data: {
          email: primaryEmail?.email_address,
          name: [first_name, last_name].filter(Boolean).join(" ") || null,
          avatarUrl: image_url || null,
        },
      });
      break;
    }

    case "user.deleted": {
      const { id } = event.data;
      if (id) {
        await prisma.user.delete({ where: { clerkId: id } });
      }
      break;
    }
  }

  return new Response("OK", { status: 200 });
}
