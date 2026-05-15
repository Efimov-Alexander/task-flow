import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { CreateProjectSchema } from "@/src/lib/schemas";
import { auth } from "@/src/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      _count: { select: { tasks: true } },
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateProjectSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const project = await prisma.project.create({
    data: {
      ...parsed.data,
      userId: session.user.id,
      // Автоматически добавляем создателя как owner
      members: {
        create: { userId: session.user.id, role: "owner" },
      },
    },
  });

  return NextResponse.json(project, { status: 201 });
}