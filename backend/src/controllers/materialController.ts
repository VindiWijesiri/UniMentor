import { Response, NextFunction } from 'express';
import Material from '../models/Material';
import Settings from '../models/Settings';
import { AuthRequest } from '../middleware/auth';
import { notifyUser } from '../utils/notify';

const USER_FIELDS = 'name email role';

export async function listMaterials(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = ((req.query.q as string) ?? '').trim();
    const mine = req.query.mine === 'true';
    const filter: Record<string, unknown> = {};
    if (mine || req.userRole === 'mentor') {
      if (mine) filter.mentorId = req.userId;
      else if (req.userRole === 'student') filter.published = true;
    } else if (req.userRole === 'student') {
      filter.published = true;
    }
    if (q) {
      filter.$or = [
        { title: new RegExp(q, 'i') },
        { subject: new RegExp(q, 'i') },
        { module: new RegExp(q, 'i') },
      ];
    }
    const materials = await Material.find(filter)
      .populate('mentorId', USER_FIELDS)
      .sort({ createdAt: -1 });
    res.json(materials);
  } catch (err) {
    next(err);
  }
}

export async function getMaterial(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const material = await Material.findById(req.params.id).populate('mentorId', USER_FIELDS);
    if (!material) {
      res.status(404).json({ message: 'Material not found.' });
      return;
    }
    res.json(material);
  } catch (err) {
    next(err);
  }
}

export async function createMaterial(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await Settings.getApp();
    const price = Number(req.body.price ?? 0);
    if (price > settings.materialPriceCap) {
      res.status(400).json({
        message: `Price cannot exceed the campus cap of ${settings.materialPriceCap}.`,
      });
      return;
    }
    const material = await Material.create({
      mentorId: req.userId,
      title: req.body.title,
      subject: req.body.subject,
      module: req.body.module,
      description: req.body.description,
      resourceUrl: req.body.resourceUrl,
      price,
      published: req.body.published !== false,
    });
    res.status(201).json(await material.populate('mentorId', USER_FIELDS));
  } catch (err) {
    next(err);
  }
}

export async function updateMaterial(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      res.status(404).json({ message: 'Material not found.' });
      return;
    }
    if (String(material.mentorId) !== req.userId && req.userRole !== 'admin') {
      res.status(403).json({ message: 'Not authorised to edit this material.' });
      return;
    }
    const settings = await Settings.getApp();
    const allowed = ['title', 'subject', 'module', 'description', 'resourceUrl', 'price', 'published'];
    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        if (field === 'price' && Number(req.body.price) > settings.materialPriceCap) {
          res.status(400).json({
            message: `Price cannot exceed the campus cap of ${settings.materialPriceCap}.`,
          });
          return;
        }
        (material as unknown as Record<string, unknown>)[field] = req.body[field];
      }
    }
    await material.save();
    res.json(await material.populate('mentorId', USER_FIELDS));
  } catch (err) {
    next(err);
  }
}

export async function deleteMaterial(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      res.status(404).json({ message: 'Material not found.' });
      return;
    }
    if (String(material.mentorId) !== req.userId && req.userRole !== 'admin') {
      res.status(403).json({ message: 'Not authorised to delete this material.' });
      return;
    }
    await material.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function getPricing(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await Settings.getApp();
    const materials = await Material.find().populate('mentorId', USER_FIELDS).sort({ price: -1 });
    res.json({ materialPriceCap: settings.materialPriceCap, materials });
  } catch (err) {
    next(err);
  }
}

export async function updatePricingCap(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const cap = Number(req.body.materialPriceCap);
    if (Number.isNaN(cap) || cap < 0) {
      res.status(400).json({ message: 'A valid price cap is required.' });
      return;
    }
    const settings = await Settings.getApp();
    settings.materialPriceCap = cap;
    await settings.save();
    await notifyUser({
      userId: String(req.userId),
      title: 'Pricing cap updated',
      body: `Campus material cap is now ${cap}.`,
      type: 'pricing',
    });
    res.json(settings);
  } catch (err) {
    next(err);
  }
}
