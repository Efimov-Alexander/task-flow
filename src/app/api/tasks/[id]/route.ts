import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { UpdateTaskSchema } from "@/src/lib/schemas";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateTaskSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const task = await prisma.task.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json(task);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}