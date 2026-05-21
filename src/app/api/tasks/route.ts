import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { CreateTaskSchema } from "@/src/lib/schemas";
import {auth} from "@/src/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const tasks = await prisma.task.findMany({
    where: projectId ? { projectId } : undefined,
    include: {
      assignee: { select: { id: true, name: true, email: true } }, // ← добавь
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateTaskSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const task = await prisma.task.create({
    data: {
      ...parsed.data,
      assigneeId: parsed.data.assigneeId ?? session.user.id, // ← автоназначение
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
    },
  });
  return NextResponse.json(task, { status: 201 });
}

