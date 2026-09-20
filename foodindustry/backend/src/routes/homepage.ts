import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { Router, Request, Response } from 'express';
import multer, { MulterError } from 'multer';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAdmin, requireAuth } from '../middleware/auth';

export const homepageRouter = Router();

const LAYOUT_ID = 'default';
const HEADER_ITEMS = ['logo', 'name', 'navigation', 'cart'] as const;
const SECTION_TYPES = ['hero', 'image-text', 'categories', 'products', 'spacer'] as const;
const UPLOAD_DIRECTORY = path.resolve(process.cwd(), 'uploads', 'homepage');
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const headerSchema = z.object({
  order: z.array(z.enum(HEADER_ITEMS)).length(HEADER_ITEMS.length).refine(
    (items) => new Set(items).size === HEADER_ITEMS.length,
    'Header order must contain each header item exactly once'
  ),
  alignment: z.enum(['left', 'center', 'right']),
});

const contentSchema = z.object({
  title: z.string().trim().max(200).optional(),
  description: z.string().trim().max(5_000).optional(),
  imageUrl: z.string().trim().max(2_048).optional(),
  buttonText: z.string().trim().max(100).optional(),
  buttonLink: z
    .string()
    .trim()
    .max(2_048)
    .refine((value) => value.startsWith('/') || /^https?:\/\//i.test(value), 'Button link must be a relative or HTTP(S) URL')
    .optional(),
});

const sectionSchema = z.object({
  id: z.string().min(1).max(100).optional(),
  type: z.enum(SECTION_TYPES),
  sortOrder: z.number().int().nonnegative().optional(),
  isActive: z.boolean().default(true),
  content: contentSchema.default({}),
});

const layoutSchema = z.object({
  header: headerSchema,
  sections: z.array(sectionSchema).max(50),
});

const sectionUpdateSchema = sectionSchema.omit({ id: true, sortOrder: true }).partial();
const reorderSchema = z.object({
  sectionIds: z.array(z.string().uuid()).max(50),
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.mimetype)) {
      callback(new Error('Only JPEG, PNG, GIF, and WebP images are supported'));
      return;
    }
    callback(null, true);
  },
});

function defaultHeader() {
  return { order: [...HEADER_ITEMS], alignment: 'left' as const };
}

function parseContent(content: string) {
  const parsed = contentSchema.safeParse(JSON.parse(content));
  if (!parsed.success) {
    throw new Error('Stored homepage section has invalid content');
  }
  return parsed.data;
}

function serializeLayout(layout: {
  headerOrder: string;
  headerAlignment: string;
  sections: { id: string; type: string; sortOrder: number; isActive: boolean; content: string }[];
}) {
  const header = headerSchema.safeParse({
    order: JSON.parse(layout.headerOrder),
    alignment: layout.headerAlignment,
  });
  if (!header.success) {
    throw new Error('Stored homepage header has invalid configuration');
  }
  return {
    header: header.data,
    sections: layout.sections.map((section) => ({
      ...section,
      type: z.enum(SECTION_TYPES).parse(section.type),
      content: parseContent(section.content),
    })),
  };
}

async function getLayout() {
  return prisma.homepageLayout.findUnique({
    where: { id: LAYOUT_ID },
    include: { sections: { orderBy: { sortOrder: 'asc' } } },
  });
}

async function ensureLayout() {
  return prisma.homepageLayout.upsert({
    where: { id: LAYOUT_ID },
    update: {},
    create: {
      id: LAYOUT_ID,
      headerOrder: JSON.stringify(defaultHeader().order),
      headerAlignment: defaultHeader().alignment,
    },
  });
}

function hasImageSignature(buffer: Buffer, mimetype: string) {
  if (mimetype === 'image/jpeg') return buffer.length >= 3 && buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  if (mimetype === 'image/png') return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimetype === 'image/gif') return buffer.subarray(0, 6).toString('ascii') === 'GIF87a' || buffer.subarray(0, 6).toString('ascii') === 'GIF89a';
  return buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
}

function extensionFor(mimetype: string) {
  return { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp' }[mimetype];
}

homepageRouter.get('/homepage', async (_req: Request, res: Response) => {
  const layout = await getLayout();
  res.json(layout ? serializeLayout(layout) : { header: defaultHeader(), sections: [] });
});

homepageRouter.put('/admin/homepage', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const parsed = layoutSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    await prisma.$transaction(async (tx) => {
      await tx.homepageLayout.upsert({
        where: { id: LAYOUT_ID },
        update: {
          headerOrder: JSON.stringify(parsed.data.header.order),
          headerAlignment: parsed.data.header.alignment,
        },
        create: {
          id: LAYOUT_ID,
          headerOrder: JSON.stringify(parsed.data.header.order),
          headerAlignment: parsed.data.header.alignment,
        },
      });

      const existing = await tx.homepageSection.findMany({ where: { layoutId: LAYOUT_ID }, select: { id: true } });
      const existingIds = new Set(existing.map((section) => section.id));
      const retainedIds = parsed.data.sections.flatMap((section) => (section.id && !section.id.startsWith('new-') ? [section.id] : []));
      if (retainedIds.some((id) => !existingIds.has(id))) {
        throw new HomepageNotFoundError();
      }
      await tx.homepageSection.deleteMany({ where: { layoutId: LAYOUT_ID, id: { notIn: retainedIds } } });

      for (const [sortOrder, section] of parsed.data.sections.entries()) {
        const data = {
          type: section.type,
          sortOrder,
          isActive: section.isActive,
          content: JSON.stringify(section.content),
        };
        if (section.id && existingIds.has(section.id)) {
          await tx.homepageSection.update({ where: { id: section.id }, data });
        } else {
          await tx.homepageSection.create({ data: { ...data, layoutId: LAYOUT_ID } });
        }
      }
    });
  } catch (error) {
    if (error instanceof HomepageNotFoundError) return res.status(404).json({ error: 'Homepage section not found' });
    throw error;
  }

  const layout = await getLayout();
  res.json(serializeLayout(layout!));
});

homepageRouter.put('/admin/homepage/header', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const parsed = headerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  await ensureLayout();
  const layout = await prisma.homepageLayout.update({
    where: { id: LAYOUT_ID },
    data: { headerOrder: JSON.stringify(parsed.data.order), headerAlignment: parsed.data.alignment },
    include: { sections: { orderBy: { sortOrder: 'asc' } } },
  });
  res.json(serializeLayout(layout));
});

homepageRouter.post('/admin/homepage/sections', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const parsed = sectionSchema.omit({ id: true, sortOrder: true }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  await ensureLayout();
  const sortOrder = await prisma.homepageSection.count({ where: { layoutId: LAYOUT_ID } });
  const section = await prisma.homepageSection.create({
    data: { ...parsed.data, layoutId: LAYOUT_ID, sortOrder, content: JSON.stringify(parsed.data.content) },
  });
  res.status(201).json({ section: { ...section, content: parseContent(section.content) } });
});

homepageRouter.put('/admin/homepage/sections/reorder', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const parsed = reorderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const sections = await prisma.homepageSection.findMany({ where: { layoutId: LAYOUT_ID }, select: { id: true } });
  const existingIds = new Set(sections.map((section) => section.id));
  if (
    parsed.data.sectionIds.length !== sections.length ||
    new Set(parsed.data.sectionIds).size !== sections.length ||
    parsed.data.sectionIds.some((id) => !existingIds.has(id))
  ) {
    return res.status(400).json({ error: 'sectionIds must contain every homepage section exactly once' });
  }
  await prisma.$transaction(
    parsed.data.sectionIds.map((id, sortOrder) =>
      prisma.homepageSection.update({ where: { id }, data: { sortOrder } })
    )
  );
  const layout = await getLayout();
  res.json(serializeLayout(layout!));
});

homepageRouter.put('/admin/homepage/sections/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const parsed = sectionUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const existing = await prisma.homepageSection.findFirst({
    where: { id: req.params.id, layoutId: LAYOUT_ID },
    select: { id: true },
  });
  if (!existing) return res.status(404).json({ error: 'Homepage section not found' });

  const { content, ...sectionData } = parsed.data;
  const section = await prisma.homepageSection.update({
    where: { id: existing.id },
    data: { ...sectionData, ...(content === undefined ? {} : { content: JSON.stringify(content) }) },
  });
  res.json({ section: { ...section, content: parseContent(section.content) } });
});

homepageRouter.delete('/admin/homepage/sections/:id', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const result = await prisma.homepageSection.deleteMany({ where: { id: req.params.id, layoutId: LAYOUT_ID } });
  if (result.count === 0) return res.status(404).json({ error: 'Homepage section not found' });
  res.status(204).send();
});

homepageRouter.post('/admin/homepage/upload', requireAuth, requireAdmin, (req: Request, res: Response, next) => {
  upload.single('image')(req, res, (error: unknown) => {
    if (error) {
      if (error instanceof MulterError && error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Image must be 5 MB or smaller' });
      }
      if (error instanceof Error) return res.status(400).json({ error: error.message });
      return next(error);
    }
    return next();
  });
}, async (req: Request, res: Response) => {
  const image = req.file;
  if (!image) return res.status(400).json({ error: 'An image file is required' });
  if (!hasImageSignature(image.buffer, image.mimetype)) {
    return res.status(400).json({ error: 'Image content does not match its declared file type' });
  }
  const extension = extensionFor(image.mimetype);
  if (!extension) return res.status(400).json({ error: 'Unsupported image type' });

  await mkdir(UPLOAD_DIRECTORY, { recursive: true });
  const filename = `${randomUUID()}.${extension}`;
  await writeFile(path.join(UPLOAD_DIRECTORY, filename), image.buffer, { flag: 'wx' });
  res.status(201).json({ url: `/uploads/homepage/${filename}` });
});

class HomepageNotFoundError extends Error {}
