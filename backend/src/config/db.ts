import mongoose from 'mongoose';

async function migrateLegacyReviewIndexes(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) return;

  const collectionExists = await db.listCollections({ name: 'reviews' }).hasNext();
  if (!collectionExists) return;

  const reviews = db.collection('reviews');
  const indexes = await reviews.indexes();
  const legacyIndex = indexes.find(({ name }) => name === 'tutorId_1_studentId_1');

  if (legacyIndex) {
    const legacyReviews = reviews.find({
      tutorId: { $exists: true, $ne: null },
      studentId: { $exists: true, $ne: null },
    });

    for await (const review of legacyReviews) {
      await reviews.updateOne(
        { _id: review._id },
        {
          $set: {
            tutor: String(review.tutorId),
            student: review.studentId,
          },
          $unset: { tutorId: '', studentId: '' },
        },
      );
    }

    await reviews.dropIndex('tutorId_1_studentId_1');
    console.log('✅ Legacy review index migrated');
  }

  await reviews.createIndex(
    { tutor: 1, student: 1 },
    { unique: true, name: 'tutor_1_student_1' },
  );
}

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not defined in environment variables.');
  }

  await mongoose.connect(uri);
  await migrateLegacyReviewIndexes();
  console.log('✅ MongoDB connected');

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });
}
