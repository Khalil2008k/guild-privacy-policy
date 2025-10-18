import { collection, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { db } from '@/config/firebase';

export async function runDevSeedOnce(userId: string) {
  try {
    const jobsCol = collection(db, 'jobs');
    const offersCol = collection(db, 'offers');

    const jobRef = await addDoc(jobsCol, {
      title: 'Demo Delivery Job',
      description: 'Deliver a small package across town',
      category: 'Delivery',
      budget: '150',
      clientId: userId,
      clientName: 'Demo Client',
      createdAt: serverTimestamp(),
      status: 'open',
    });

    await addDoc(offersCol, {
      jobId: jobRef.id,
      freelancerId: 'demo-freelancer-id',
      price: 120,
      message: 'I can complete this within 2 hours.',
      status: 'Pending',
      createdAt: serverTimestamp(),
    });

    // Minimal user doc
    await setDoc(doc(db, 'users', userId), {
      displayName: 'Demo User',
      createdAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.warn('Dev seed error:', error);
  }
}

