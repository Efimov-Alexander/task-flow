import { z } from "zod";

export const CreateProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  icon: z.string().min(1).max(4),
});

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  projectId: z.string().cuid(),
  section: z.enum(["Todo", "In Progress", "Done"]).default("Todo"),
  priority: z.enum(["High", "Medium", "Low"]).default("Medium"),
  assignee: z.string().default("AK"),
  due: z.string().optional(),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  section: z.enum(["Todo", "In Progress", "Done"]).optional(),
  priority: z.enum(["High", "Medium", "Low"]).optional(),
  done: z.boolean().optional(),
  assignee: z.string().optional(),
  due: z.string().optional(),
});