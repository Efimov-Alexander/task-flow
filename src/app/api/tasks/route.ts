import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { CreateTaskSchema } from "@/src/lib/schemas";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const tasks = await prisma.task.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = CreateTaskSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const task = await prisma.task.create({ data: parsed.data });
  return NextResponse.json(task, { status: 201 });
}