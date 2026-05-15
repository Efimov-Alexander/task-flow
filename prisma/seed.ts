import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const p1 = await prisma.project.create({
    data: { name: "Product Launch", color: "#f97316", icon: "🚀" },
  });
  const p2 = await prisma.project.create({
    data: { name: "Design System", color: "#8b5cf6", icon: "🎨" },
  });

  await prisma.task.createMany({
    data: [
      { title: "Define MVP feature set", section: "Todo", priority: "High", assignee: "AK", due: "Mar 10", projectId: p1.id },
      { title: "Create onboarding mockups", section: "In Progress", priority: "Medium", assignee: "JS", due: "Mar 12", projectId: p1.id },
      { title: "Write press release", section: "Done", priority: "Low", assignee: "MR", due: "Mar 5", done: true, projectId: p1.id },
      { title: "Set up component library", section: "Todo", priority: "High", assignee: "JS", due: "Mar 14", subtasks: 7, projectId: p2.id },
      { title: "Document color tokens", section: "In Progress", priority: "Medium", assignee: "MR", due: "Mar 11", projectId: p2.id },
    ],
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());