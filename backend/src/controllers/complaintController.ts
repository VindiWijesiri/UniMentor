import { Response, NextFunction } from 'express';
import Complaint from '../models/Complaint';
import { AuthRequest } from '../middleware/auth';
import { notifyUser } from '../utils/notify';

const USER_FIELDS = 'name email role';

export async function listComplaints(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const filter =
      req.userRole === 'lic' || req.userRole === 'admin' ? {} : { reporterId: req.userId };
    const items = await Complaint.find(filter)
      .populate('reporterId', USER_FIELDS)
      .populate('againstUserId', USER_FIELDS)
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function createComplaint(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const complaint = await Complaint.create({
      reporterId: req.userId,
      againstUserId: req.body.againstUserId,
      category: req.body.category,
      title: req.body.title,
      details: req.body.details,
      evidenceUrl: req.body.evidenceUrl,
    });
    res.status(201).json(
      await complaint.populate([
        { path: 'reporterId', select: USER_FIELDS },
        { path: 'againstUserId', select: USER_FIELDS },
      ])
    );
  } catch (err) {
    next(err);
  }
}

export async function getComplaint(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('reporterId', USER_FIELDS)
      .populate('againstUserId', USER_FIELDS);
    if (!complaint) {
      res.status(404).json({ message: 'Complaint not found.' });
      return;
    }
    const reporterId = String((complaint.reporterId as { _id?: unknown })._id ?? complaint.reporterId);
    if (reporterId !== req.userId && req.userRole !== 'lic' && req.userRole !== 'admin') {
      res.status(403).json({ message: 'Not authorised to view this complaint.' });
      return;
    }
    res.json(complaint);
  } catch (err) {
    next(err);
  }
}

export async function updateComplaint(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      res.status(404).json({ message: 'Complaint not found.' });
      return;
    }
    if (req.body.status) complaint.status = req.body.status;
    if (req.body.resolutionNote !== undefined) complaint.resolutionNote = req.body.resolutionNote;
    await complaint.save();
    await notifyUser({
      userId: String(complaint.reporterId),
      title: 'Complaint update',
      body: `${complaint.title} is now ${complaint.status}.`,
      type: 'complaint',
      relatedId: String(complaint._id),
    });
    res.json(
      await complaint.populate([
        { path: 'reporterId', select: USER_FIELDS },
        { path: 'againstUserId', select: USER_FIELDS },
      ])
    );
  } catch (err) {
    next(err);
  }
}
