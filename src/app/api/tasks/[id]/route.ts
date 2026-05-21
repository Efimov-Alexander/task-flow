import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { UpdateTaskSchema } from "@/src/lib/schemas";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateTaskSchema.safeParse(body);

  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data: Record<string, unknown> = { ...parsed.data };
  if ("assigneeId" in parsed.data && parsed.data.assigneeId === null) {
    data.assigneeId = null;
  }

  const task = await prisma.task.update({
    where: { id },
    data,
    include: {
      assignee: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(task);
}