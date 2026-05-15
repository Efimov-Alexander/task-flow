import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { auth } from "@/src/lib/auth";

// Добавить участника по email
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const { email } = await req.json();

  // Проверяем что текущий пользователь — владелец
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });
  if (!project)
    return NextResponse.json({ error: "Not found or no permission" }, { status: 403 });

  // Ищем пользователя по email
  const invitee = await prisma.user.findUnique({ where: { email } });
  if (!invitee)
    return NextResponse.json({ error: "User with this email not found" }, { status: 404 });

  if (invitee.id === session.user.id)
    return NextResponse.json({ error: "You are already the owner" }, { status: 400 });

  // Добавляем участника (upsert на случай повторного приглашения)
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId, userId: invitee.id } },
    create: { projectId, userId: invitee.id, role: "member" },
    update: {},
  });

  return NextResponse.json({ ok: true, name: invitee.name, email: invitee.email });
}

// Удалить участника
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;
  const { userId } = await req.json();

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });
  if (!project)
    return NextResponse.json({ error: "No permission" }, { status: 403 });

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId } },
  });

  return NextResponse.json({ ok: true });
}