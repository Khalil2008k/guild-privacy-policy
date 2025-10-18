# 🧭 COMPLETE JOB SYSTEM - LOGIC MAP
## Screen → Backend → Firestore → Notifications → Next Screen

**Stack**: Express.js + Firebase (Firestore + Cloud Functions + FCM) + React Native

---

## 📋 **TABLE OF CONTENTS**

1. [Job Creation Flow](#1-job-creation-flow)
2. [Admin Review Flow](#2-admin-review-flow)
3. [Job Browsing & Offering](#3-job-browsing--offering)
4. [Client Accepts Offer](#4-client-accepts-offer)
5. [Contract Stage](#5-contract-stage)
6. [Work In Progress](#6-work-in-progress)
7. [Work Submission](#7-work-submission)
8. [Client Review / Completion](#8-client-review--completion)
9. [Dispute Resolution](#9-dispute-resolution)
10. [Review & Rating](#10-review--rating)
11. [Real-Time Updates Summary](#-real-time-updates-summary)
12. [Backend API Reference](#-backend-api-reference)
13. [Firestore Structure](#-firestore-structure)
14. [Cloud Functions](#-cloud-functions)

---

## **1️⃣ JOB CREATION FLOW**

### **📱 Screen: `(modals)/add-job.tsx`**

**Purpose**: Client creates new job posting

**UI Elements**:
- Title input
- Description textarea
- Budget input (min/max or fixed)
- Category dropdown
- Location selector (map or text)
- Skills tags
- Time needed selector
- Upload attachments (optional)
- Urgent toggle
- Submit button

**Frontend Logic**:
```typescript
const handleSubmit = async () => {
  // Validate fields
  if (!title || !description || !budget) {
    Alert.alert('Missing fields');
    return;
  }

  // Upload attachments to Firebase Storage
  const attachmentUrls = await uploadAttachments(files);

  // Create job via backend
  const response = await BackendAPI.post('/jobs', {
    title,
    description,
    category,
    budget,
    location,
    timeNeeded,
    skills,
    isUrgent,
    attachments: attachmentUrls,
  });

  if (response.success) {
    Alert.alert('Job Submitted', 'Your job is pending admin review');
    router.back();
  }
};
```

**Backend API**: `POST /api/jobs`

**Backend Logic** (`backend/src/routes/jobs.ts`):
```typescript
router.post('/', authenticateToken, async (req, res) => {
  const userId = req.user.uid;
  const {
    title,
    description,
    category,
    budget,
    location,
    timeNeeded,
    skills,
    isUrgent,
    attachments
  } = req.body;

  // Validation
  if (!title || !description || !category) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }

  // Rate limiting check (prevent spam)
  const recentJobs = await checkRecentJobsByUser(userId);
  if (recentJobs > 5) { // max 5 jobs per hour
    return res.status(429).json({
      success: false,
      message: 'Rate limit exceeded'
    });
  }

  // Create job document
  const jobData = {
    title,
    description,
    category,
    budget,
    location,
    timeNeeded,
    skills: skills || [],
    isUrgent: isUrgent || false,
    attachments: attachments || [],
    status: 'draft',
    adminStatus: 'pending_review',
    clientId: userId,
    clientName: req.user.displayName || 'Anonymous',
    clientAvatar: req.user.photoURL || null,
    offers: [],
    offerCount: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const db = await unifiedFirebase.getFirestore();
  const docRef = await db.collection('jobs').add(jobData);

  logger.info('Job created', { jobId: docRef.id, userId });

  res.status(201).json({
    success: true,
    data: { id: docRef.id, ...jobData },
    message: 'Job created. Pending admin approval.'
  });
});
```

**Firestore Write**:
```
/jobs/{jobId}
{
  title: "UI/UX Designer Needed",
  description: "...",
  category: "Design",
  budget: { min: 1000, max: 2000, currency: "QAR" },
  location: { address: "Doha, Qatar", coordinates: {...} },
  timeNeeded: "1-2 weeks",
  skills: ["Figma", "UI Design", "Mobile App"],
  isUrgent: false,
  attachments: ["gs://..."],
  status: "draft",
  adminStatus: "pending_review",
  clientId: "user123",
  clientName: "Ahmed",
  offers: [],
  offerCount: 0,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Cloud Function Trigger**: `functions/src/index.ts`
```typescript
export const onJobCreated = functions.firestore
  .document('jobs/{jobId}')
  .onCreate(async (snap, context) => {
    const job = snap.data();
    
    // Notify all admins
    await notificationService.sendNotification(
      'admin',
      'job_pending_review',
      {
        jobId: context.params.jobId,
        jobTitle: job.title,
        clientName: job.clientName
      }
    );

    logger.info('Job created notification sent', { 
      jobId: context.params.jobId 
    });
  });
```

**Notification Sent**:
- **Target**: All admins
- **Type**: `job_pending_review`
- **Title**: "New Job Pending Review"
- **Body**: "Ahmed posted 'UI/UX Designer Needed'"
- **Data**: `{ jobId, jobTitle, screen: 'admin/pending-jobs' }`

**Next Screen**: `(main)/jobs` (My Jobs tab)

---

## **2️⃣ ADMIN REVIEW FLOW**

### **📱 Screen: `(admin)/pending-jobs.tsx` *(Admin only)*

**Purpose**: Admin reviews and approves/rejects jobs

**UI Elements**:
- List of jobs where `adminStatus === 'pending_review'`
- Job preview card (title, description, budget, client)
- Approve button (green)
- Reject button (red) with reason textarea

**Frontend Logic**:
```typescript
// Real-time listener
useEffect(() => {
  const unsubscribe = db.collection('jobs')
    .where('adminStatus', '==', 'pending_review')
    .orderBy('createdAt', 'desc')
    .onSnapshot((snapshot) => {
      const jobs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPendingJobs(jobs);
    });

  return () => unsubscribe();
}, []);

const handleApprove = async (jobId: string) => {
  await BackendAPI.post(`/admin/jobs/${jobId}/approve`);
  Alert.alert('Job Approved', 'Job is now visible to freelancers');
};

const handleReject = async (jobId: string, reason: string) => {
  await BackendAPI.post(`/admin/jobs/${jobId}/reject`, { reason });
  Alert.alert('Job Rejected', 'Client has been notified');
};
```

**Backend API**: 
- `POST /api/admin/jobs/:jobId/approve`
- `POST /api/admin/jobs/:jobId/reject`

**Backend Logic** (`backend/src/routes/admin.ts`):
```typescript
// Approve job
router.post('/jobs/:jobId/approve', 
  requireAdmin, 
  async (req, res) => {
    const { jobId } = req.params;
    const adminId = req.user.uid;

    const db = await unifiedFirebase.getFirestore();
    const jobRef = db.collection('jobs').doc(jobId);

    await jobRef.update({
      adminStatus: 'approved',
      status: 'open',
      approvedBy: adminId,
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Get job data for notification
    const job = (await jobRef.get()).data();

    // Notify client
    await notificationService.sendNotification(
      job.clientId,
      'job_approved',
      {
        jobId,
        jobTitle: job.title
      }
    );

    logger.info('Job approved', { jobId, adminId });

    res.json({
      success: true,
      message: 'Job approved and published'
    });
  }
);

// Reject job
router.post('/jobs/:jobId/reject', 
  requireAdmin, 
  async (req, res) => {
    const { jobId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.uid;

    const db = await unifiedFirebase.getFirestore();
    const jobRef = db.collection('jobs').doc(jobId);

    await jobRef.update({
      adminStatus: 'rejected',
      status: 'draft',
      rejectionReason: reason,
      rejectedBy: adminId,
      rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const job = (await jobRef.get()).data();

    // Notify client
    await notificationService.sendNotification(
      job.clientId,
      'job_rejected',
      {
        jobId,
        jobTitle: job.title,
        reason
      }
    );

    res.json({
      success: true,
      message: 'Job rejected'
    });
  }
);
```

**Firestore Update**:
```
/jobs/{jobId}
{
  ...existing fields,
  adminStatus: "approved",
  status: "open",
  approvedBy: "admin456",
  approvedAt: Timestamp,
  updatedAt: Timestamp
}
```

**Notifications Sent**:

**Approval**:
- **Target**: Client (job poster)
- **Type**: `job_approved`
- **Title**: "Job Approved ✅"
- **Body**: "Your job 'UI/UX Designer Needed' is now live!"
- **Data**: `{ jobId, screen: '(modals)/job/[id]' }`

**Rejection**:
- **Target**: Client
- **Type**: `job_rejected`
- **Title**: "Job Rejected ❌"
- **Body**: "Your job was rejected. Reason: [reason]"
- **Data**: `{ jobId, reason, screen: '(modals)/edit-job/[id]' }`

**Real-Time Effect**:
- All freelancers browsing see new job appear instantly (Firestore listener)
- Client sees status change in "My Jobs" tab

**Next Screen**: 
- Admin: Back to pending jobs list
- Client: Receives notification → clicks → Job Details screen
- Freelancers: See job in Browse tab

---

## **3️⃣ JOB BROWSING & OFFERING**

### **📱 Screen: `(main)/jobs.tsx` (Browse tab)**

**Purpose**: Freelancers find and apply to jobs

**UI Elements**:
- Real-time job list (where `status === 'open'`)
- Filters (category, budget, location, skills)
- Job cards (title, budget, location, skills)
- Tap to view details

**Frontend Logic**:
```typescript
// Real-time Firestore listener
useEffect(() => {
  const unsubscribe = db.collection('jobs')
    .where('status', '==', 'open')
    .where('adminStatus', '==', 'approved')
    .orderBy('createdAt', 'desc')
    .limit(20)
    .onSnapshot((snapshot) => {
      const jobs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOpenJobs(jobs);
      setLoading(false);
    });

  return () => unsubscribe();
}, []);
```

### **📱 Screen: `(modals)/job/[id].tsx` (Job Details)**

**Purpose**: View full job details and submit offer

**UI Elements**:
- Job title, description, budget
- Client info (name, avatar, rating)
- Location, skills, time needed
- Attachments (if any)
- "Make Offer" button

**Tap → Opens**: `(modals)/offer-submission.tsx`

### **📱 Screen: `(modals)/offer-submission.tsx`**

**Purpose**: Freelancer submits offer for job

**UI Elements**:
- Job summary card
- Price input (your offer amount)
- Message textarea (cover letter)
- Delivery time selector
- Submit button

**Frontend Logic**:
```typescript
const handleSubmitOffer = async () => {
  if (!price || price < 0) {
    Alert.alert('Invalid price');
    return;
  }

  const response = await BackendAPI.post('/offers', {
    jobId,
    price,
    message,
    deliveryTime,
  });

  if (response.success) {
    Alert.alert('Offer Submitted!', 'The client will review your offer');
    router.back();
  }
};
```

**Backend API**: `POST /api/offers`

**Backend Logic** (`backend/src/routes/offers.ts` - *new file*):
```typescript
router.post('/', authenticateToken, async (req, res) => {
  const freelancerId = req.user.uid;
  const { jobId, price, message, deliveryTime } = req.body;

  // Validation
  if (!jobId || !price || price <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid offer data'
    });
  }

  const db = await unifiedFirebase.getFirestore();
  const jobRef = db.collection('jobs').doc(jobId);
  const job = (await jobRef.get()).data();

  // Prevent client from offering on own job
  if (job.clientId === freelancerId) {
    return res.status(403).json({
      success: false,
      message: 'Cannot offer on your own job'
    });
  }

  // Check if already offered
  const existingOffer = await db.collection('offers')
    .where('jobId', '==', jobId)
    .where('freelancerId', '==', freelancerId)
    .get();

  if (!existingOffer.empty) {
    return res.status(400).json({
      success: false,
      message: 'You already submitted an offer for this job'
    });
  }

  // Create offer
  const offerData = {
    jobId,
    freelancerId,
    freelancerName: req.user.displayName || 'Anonymous',
    freelancerAvatar: req.user.photoURL || null,
    price,
    message,
    deliveryTime,
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const offerRef = await db.collection('offers').add(offerData);

  // Update job
  await jobRef.update({
    status: 'offered',
    offerCount: admin.firestore.FieldValue.increment(1),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Notify client
  await notificationService.sendNotification(
    job.clientId,
    'offer_received',
    {
      jobId,
      offerId: offerRef.id,
      freelancerName: offerData.freelancerName,
      price: offerData.price
    }
  );

  logger.info('Offer created', { offerId: offerRef.id, jobId, freelancerId });

  res.status(201).json({
    success: true,
    data: { id: offerRef.id, ...offerData },
    message: 'Offer submitted successfully'
  });
});
```

**Firestore Writes**:

**New Offer Document**:
```
/offers/{offerId}
{
  jobId: "job123",
  freelancerId: "user456",
  freelancerName: "Sara",
  freelancerAvatar: "https://...",
  price: 1500,
  message: "I have 5 years experience in UI/UX...",
  deliveryTime: "7 days",
  status: "pending",
  createdAt: Timestamp
}
```

**Update Job**:
```
/jobs/{jobId}
{
  ...existing fields,
  status: "offered",
  offerCount: 1,
  updatedAt: Timestamp
}
```

**Notification Sent**:
- **Target**: Client (job poster)
- **Type**: `offer_received`
- **Title**: "New Offer Received!"
- **Body**: "Sara offered QAR 1,500 for your job"
- **Data**: `{ jobId, offerId, screen: '(modals)/job-offers/[jobId]' }`

**Next Screen**: 
- Freelancer: Back to jobs list, offer added to "My Offers" tab
- Client: Receives notification, can view offers

---

## **4️⃣ CLIENT ACCEPTS OFFER**

### **📱 Screen: `(modals)/job-offers/[jobId].tsx`**

**Purpose**: Client reviews all offers for their job

**UI Elements**:
- List of offers (sorted by price or date)
- Each offer card shows:
  - Freelancer name, avatar, rating
  - Offered price
  - Cover letter
  - Delivery time
- "View Profile" button
- "Accept Offer" button (green)
- "Reject Offer" button (red)

**Frontend Logic**:
```typescript
// Real-time offers listener
useEffect(() => {
  const unsubscribe = db.collection('offers')
    .where('jobId', '==', jobId)
    .where('status', '==', 'pending')
    .orderBy('createdAt', 'desc')
    .onSnapshot((snapshot) => {
      const offers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOffers(offers);
    });

  return () => unsubscribe();
}, [jobId]);

const handleAcceptOffer = async (offer: Offer) => {
  Alert.alert(
    'Accept Offer?',
    `Accept Sara's offer for QAR ${offer.price}?`,
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Accept', 
        onPress: async () => {
          const response = await BackendAPI.post(`/offers/${offer.id}/accept`);
          if (response.success) {
            router.push(`/(modals)/escrow-payment/${jobId}/${offer.id}`);
          }
        }
      }
    ]
  );
};
```

**Backend API**: `POST /api/offers/:offerId/accept`

**Backend Logic** (`backend/src/routes/offers.ts`):
```typescript
router.post('/:offerId/accept', authenticateToken, async (req, res) => {
  const { offerId } = req.params;
  const clientId = req.user.uid;

  const db = await unifiedFirebase.getFirestore();
  const offerRef = db.collection('offers').doc(offerId);
  const offer = (await offerRef.get()).data();

  if (!offer) {
    return res.status(404).json({
      success: false,
      message: 'Offer not found'
    });
  }

  // Verify client owns the job
  const jobRef = db.collection('jobs').doc(offer.jobId);
  const job = (await jobRef.get()).data();

  if (job.clientId !== clientId) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  // Update offer status
  await offerRef.update({
    status: 'accepted',
    acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Update job status
  await jobRef.update({
    status: 'accepted',
    freelancerId: offer.freelancerId,
    freelancerName: offer.freelancerName,
    freelancerAvatar: offer.freelancerAvatar,
    acceptedOfferId: offerId,
    acceptedPrice: offer.price,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Reject all other offers
  const otherOffers = await db.collection('offers')
    .where('jobId', '==', offer.jobId)
    .where('status', '==', 'pending')
    .get();

  const batch = db.batch();
  otherOffers.docs.forEach(doc => {
    if (doc.id !== offerId) {
      batch.update(doc.ref, { 
        status: 'rejected',
        rejectedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });
  await batch.commit();

  // Initialize payment (escrow creation happens on payment screen)
  
  // Notify freelancer
  await notificationService.sendNotification(
    offer.freelancerId,
    'offer_accepted',
    {
      jobId: offer.jobId,
      offerId,
      jobTitle: job.title,
      price: offer.price
    }
  );

  // Notify other freelancers (offers rejected)
  otherOffers.docs.forEach(async (doc) => {
    if (doc.id !== offerId) {
      await notificationService.sendNotification(
        doc.data().freelancerId,
        'offer_rejected',
        {
          jobId: offer.jobId,
          jobTitle: job.title
        }
      );
    }
  });

  logger.info('Offer accepted', { offerId, jobId: offer.jobId, clientId });

  res.json({
    success: true,
    data: { offer, job },
    message: 'Offer accepted. Proceed to payment.'
  });
});
```

**Firestore Updates**:

**Accepted Offer**:
```
/offers/{offerId}
{
  ...existing fields,
  status: "accepted",
  acceptedAt: Timestamp
}
```

**Other Offers**:
```
/offers/{otherOfferId}
{
  ...existing fields,
  status: "rejected",
  rejectedAt: Timestamp
}
```

**Job Update**:
```
/jobs/{jobId}
{
  ...existing fields,
  status: "accepted",
  freelancerId: "user456",
  freelancerName: "Sara",
  freelancerAvatar: "https://...",
  acceptedOfferId: "offer789",
  acceptedPrice: 1500,
  updatedAt: Timestamp
}
```

**Notifications Sent**:

**To Accepted Freelancer**:
- **Type**: `offer_accepted`
- **Title**: "Offer Accepted! 🎉"
- **Body**: "Ahmed accepted your offer for 'UI/UX Designer Needed'"
- **Data**: `{ jobId, offerId, screen: '(modals)/contract/[jobId]' }`

**To Rejected Freelancers**:
- **Type**: `offer_rejected`
- **Title**: "Offer Not Accepted"
- **Body**: "Your offer for 'UI/UX Designer Needed' was not selected"
- **Data**: `{ jobId, screen: '(main)/jobs' }`

**Next Screen**: `(modals)/escrow-payment/[jobId]/[offerId].tsx`

---

## **5️⃣ CONTRACT & PAYMENT STAGE**

### **📱 Screen: `(modals)/escrow-payment/[jobId]/[offerId].tsx`**

**Purpose**: Client pays into escrow to secure freelancer

**UI Elements**:
- Job summary
- Freelancer info
- Payment breakdown:
  - Offer price: QAR 1,500
  - Platform fee (5%): QAR 75
  - Freelancer fee (10%): QAR 150
  - Zakat (2.5%, optional): QAR 37.50
  - **Total**: QAR 1,762.50
- Payment method selector
- "Pay Now" button

**Frontend Logic**:
```typescript
const calculateBreakdown = () => {
  const clientFee = price * 0.05;
  const freelancerFee = price * 0.10;
  const zakat = includeZakat ? price * 0.025 : 0;
  const total = price + clientFee + freelancerFee + zakat;

  return { clientFee, freelancerFee, zakat, total };
};

const handlePayment = async () => {
  const breakdown = calculateBreakdown();

  // Call payment service
  const response = await BackendAPI.post('/escrow/create', {
    jobId,
    offerId,
    amount: breakdown.total,
    breakdown,
  });

  if (response.success) {
    Alert.alert('Payment Successful!', 'Work can now begin');
    router.replace('/(modals)/contract/[jobId]');
  }
};
```

**Backend API**: `POST /api/escrow/create`

**Backend Logic** (`backend/src/routes/escrow.ts` - *new file*):
```typescript
router.post('/create', authenticateToken, async (req, res) => {
  const clientId = req.user.uid;
  const { jobId, offerId, amount, breakdown } = req.body;

  const db = await unifiedFirebase.getFirestore();
  const jobRef = db.collection('jobs').doc(jobId);
  const offerRef = db.collection('offers').doc(offerId);

  const job = (await jobRef.get()).data();
  const offer = (await offerRef.get()).data();

  // Verify client owns job
  if (job.clientId !== clientId) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  // Process payment via PaymentService (abstracted)
  const paymentResult = await PaymentService.charge({
    userId: clientId,
    amount,
    description: `Escrow for job: ${job.title}`,
    metadata: { jobId, offerId }
  });

  if (!paymentResult.success) {
    return res.status(400).json({
      success: false,
      message: 'Payment failed'
    });
  }

  // Create escrow document
  const escrowData = {
    jobId,
    offerId,
    clientId,
    freelancerId: offer.freelancerId,
    amount: offer.price,
    clientFee: breakdown.clientFee,
    freelancerFee: breakdown.freelancerFee,
    zakat: breakdown.zakat,
    totalPaid: amount,
    status: 'held',
    paymentId: paymentResult.paymentId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    autoReleaseDate: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
  };

  const escrowRef = await db.collection('escrow').add(escrowData);

  // Update job
  await jobRef.update({
    status: 'in_contract',
    escrowId: escrowRef.id,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Notify freelancer
  await notificationService.sendNotification(
    offer.freelancerId,
    'payment_received',
    {
      jobId,
      jobTitle: job.title,
      amount: offer.price
    }
  );

  logger.info('Escrow created', { escrowId: escrowRef.id, jobId, amount });

  res.json({
    success: true,
    data: { escrowId: escrowRef.id, ...escrowData },
    message: 'Payment successful. Contract stage initiated.'
  });
});
```

**Firestore Writes**:

**New Escrow Document**:
```
/escrow/{escrowId}
{
  jobId: "job123",
  offerId: "offer789",
  clientId: "user123",
  freelancerId: "user456",
  amount: 1500,
  clientFee: 75,
  freelancerFee: 150,
  zakat: 37.50,
  totalPaid: 1762.50,
  status: "held",
  paymentId: "pay_abc123",
  createdAt: Timestamp,
  autoReleaseDate: Timestamp (72h from now)
}
```

**Job Update**:
```
/jobs/{jobId}
{
  ...existing fields,
  status: "in_contract",
  escrowId: "escrow123",
  updatedAt: Timestamp
}
```

**Notification**:
- **Target**: Freelancer
- **Type**: `payment_received`
- **Title**: "Payment Secured! 💰"
- **Body**: "Ahmed paid QAR 1,500 into escrow"
- **Data**: `{ jobId, screen: '(modals)/contract/[jobId]' }`

### **📱 Screen: `(modals)/contract/[jobId].tsx`**

**Purpose**: Both parties sign contract to start work

**UI Elements**:
- Job title, description
- Agreed price
- Delivery timeline
- Terms & conditions
- "I Agree & Sign" button
- Status indicators:
  - ✅ Client signed
  - ⏳ Freelancer pending
  
**Frontend Logic**:
```typescript
// Real-time contract status listener
useEffect(() => {
  const unsubscribe = db.collection('jobs').doc(jobId)
    .onSnapshot((doc) => {
      const data = doc.data();
      setClientSigned(data.clientSigned || false);
      setFreelancerSigned(data.freelancerSigned || false);

      // If both signed, navigate to work screen
      if (data.clientSigned && data.freelancerSigned) {
        router.replace('/(main)/jobs'); // Active tab
      }
    });

  return () => unsubscribe();
}, [jobId]);

const handleSign = async () => {
  await BackendAPI.post(`/jobs/${jobId}/sign-contract`);
};
```

**Backend API**: `POST /api/jobs/:jobId/sign-contract`

**Backend Logic**:
```typescript
router.post('/:jobId/sign-contract', authenticateToken, async (req, res) => {
  const { jobId } = req.params;
  const userId = req.user.uid;

  const db = await unifiedFirebase.getFirestore();
  const jobRef = db.collection('jobs').doc(jobId);
  const job = (await jobRef.get()).data();

  const isClient = job.clientId === userId;
  const isFreelancer = job.freelancerId === userId;

  if (!isClient && !isFreelancer) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  // Update signature
  const updates: any = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
  
  if (isClient) {
    updates.clientSigned = true;
    updates.clientSignedAt = admin.firestore.FieldValue.serverTimestamp();
  } else {
    updates.freelancerSigned = true;
    updates.freelancerSignedAt = admin.firestore.FieldValue.serverTimestamp();
  }

  await jobRef.update(updates);

  // Check if both signed
  const updatedJob = (await jobRef.get()).data();
  if (updatedJob.clientSigned && updatedJob.freelancerSigned) {
    await jobRef.update({
      status: 'in_progress',
      workStartedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Notify both
    await notificationService.sendNotification(
      job.clientId,
      'work_started',
      { jobId, jobTitle: job.title }
    );

    await notificationService.sendNotification(
      job.freelancerId,
      'work_started',
      { jobId, jobTitle: job.title }
    );
  }

  res.json({
    success: true,
    message: 'Contract signed'
  });
});
```

**Firestore Update**:
```
/jobs/{jobId}
{
  ...existing fields,
  clientSigned: true,
  clientSignedAt: Timestamp,
  freelancerSigned: true,
  freelancerSignedAt: Timestamp,
  status: "in_progress",
  workStartedAt: Timestamp,
  updatedAt: Timestamp
}
```

**Notifications** (when both signed):
- **Target**: Both client and freelancer
- **Type**: `work_started`
- **Title**: "Work Started! 🚀"
- **Body**: "Contract signed. Work can now begin."
- **Data**: `{ jobId, screen: '(modals)/job-progress/[jobId]' }`

**Next Screen**: `(modals)/job-progress/[jobId].tsx`

---

## **6️⃣ WORK IN PROGRESS**

### **📱 Screen: `(modals)/job-progress/[jobId].tsx`**

**Purpose**: Track work progress, communicate, add milestones

**UI Elements**:
- Progress bar (0-100%)
- Timeline of updates
- Chat button (link to chat screen)
- "Add Progress Update" button
- Upload work-in-progress files
- Milestones checklist

**Frontend Logic**:
```typescript
// Real-time progress listener
useEffect(() => {
  const unsubscribe = db.collection('jobs').doc(jobId)
    .collection('progressLogs')
    .orderBy('createdAt', 'desc')
    .onSnapshot((snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProgressLogs(logs);
    });

  return () => unsubscribe();
}, [jobId]);

const handleAddProgress = async () => {
  await BackendAPI.post(`/jobs/${jobId}/progress`, {
    description: progressText,
    percentage: progressPercentage,
    attachments: uploadedFiles,
  });
};
```

**Backend API**: `POST /api/jobs/:jobId/progress`

**Backend Logic**:
```typescript
router.post('/:jobId/progress', authenticateToken, async (req, res) => {
  const { jobId } = req.params;
  const freelancerId = req.user.uid;
  const { description, percentage, attachments } = req.body;

  const db = await unifiedFirebase.getFirestore();
  const jobRef = db.collection('jobs').doc(jobId);
  const job = (await jobRef.get()).data();

  // Verify freelancer owns job
  if (job.freelancerId !== freelancerId) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  // Add progress log
  const progressData = {
    description,
    percentage: percentage || 0,
    attachments: attachments || [],
    createdBy: freelancerId,
    createdByName: req.user.displayName || 'Freelancer',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await jobRef.collection('progressLogs').add(progressData);

  // Update job
  await jobRef.update({
    progress: percentage || 0,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Notify client
  await notificationService.sendNotification(
    job.clientId,
    'progress_update',
    {
      jobId,
      jobTitle: job.title,
      percentage
    }
  );

  res.json({
    success: true,
    message: 'Progress updated'
  });
});
```

**Firestore Write**:
```
/jobs/{jobId}/progressLogs/{logId}
{
  description: "Completed initial wireframes",
  percentage: 30,
  attachments: ["gs://..."],
  createdBy: "user456",
  createdByName: "Sara",
  createdAt: Timestamp
}
```

**Job Update**:
```
/jobs/{jobId}
{
  ...existing fields,
  progress: 30,
  updatedAt: Timestamp
}
```

**Notification**:
- **Target**: Client
- **Type**: `progress_update`
- **Title**: "Work Progress: 30% Complete"
- **Body**: "Sara: Completed initial wireframes"
- **Data**: `{ jobId, screen: '(modals)/job-progress/[jobId]' }`

**Next Screen**: Same (stays on progress screen)

---

## **7️⃣ WORK SUBMISSION**

### **📱 Screen: `(modals)/submit-work/[jobId].tsx`**

**Purpose**: Freelancer submits final deliverables

**UI Elements**:
- Upload final files (images, PDFs, ZIP, links)
- Submission note textarea
- Checklist of requirements
- "Submit for Review" button

**Frontend Logic**:
```typescript
const handleSubmitWork = async () => {
  // Upload files to Firebase Storage
  const fileUrls = await Promise.all(
    files.map(file => uploadToStorage(file, `jobs/${jobId}/submission`))
  );

  const response = await BackendAPI.post(`/jobs/${jobId}/submit`, {
    submissionNote,
    files: fileUrls,
  });

  if (response.success) {
    Alert.alert('Work Submitted!', 'Waiting for client approval');
    router.back();
  }
};
```

**Backend API**: `POST /api/jobs/:jobId/submit`

**Backend Logic**:
```typescript
router.post('/:jobId/submit', authenticateToken, async (req, res) => {
  const { jobId } = req.params;
  const freelancerId = req.user.uid;
  const { submissionNote, files } = req.body;

  const db = await unifiedFirebase.getFirestore();
  const jobRef = db.collection('jobs').doc(jobId);
  const job = (await jobRef.get()).data();

  if (job.freelancerId !== freelancerId) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  // Create submission document
  const submissionData = {
    jobId,
    freelancerId,
    submissionNote,
    files,
    submittedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const submissionRef = await jobRef.collection('submissions').add(submissionData);

  // Update job status
  await jobRef.update({
    status: 'submitted',
    submissionId: submissionRef.id,
    submittedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Schedule auto-complete (72 hours)
  await scheduleAutoComplete(jobId);

  // Notify client
  await notificationService.sendNotification(
    job.clientId,
    'work_submitted',
    {
      jobId,
      jobTitle: job.title,
      submissionId: submissionRef.id
    }
  );

  logger.info('Work submitted', { jobId, freelancerId, submissionId: submissionRef.id });

  res.json({
    success: true,
    message: 'Work submitted successfully'
  });
});

// Schedule auto-complete function
async function scheduleAutoComplete(jobId: string) {
  // Firebase Scheduled Function will check this
  const autoReleaseTime = new Date(Date.now() + 72 * 60 * 60 * 1000);
  
  const db = await unifiedFirebase.getFirestore();
  await db.collection('jobs').doc(jobId).update({
    autoCompleteAt: autoReleaseTime
  });
}
```

**Firestore Writes**:

**Submission Document**:
```
/jobs/{jobId}/submissions/{submissionId}
{
  jobId: "job123",
  freelancerId: "user456",
  submissionNote: "All deliverables completed as requested...",
  files: [
    "gs://bucket/jobs/job123/submission/design.fig",
    "gs://bucket/jobs/job123/submission/mockups.zip"
  ],
  submittedAt: Timestamp
}
```

**Job Update**:
```
/jobs/{jobId}
{
  ...existing fields,
  status: "submitted",
  submissionId: "sub123",
  submittedAt: Timestamp,
  autoCompleteAt: Timestamp (72h from now),
  updatedAt: Timestamp
}
```

**Cloud Function** (scheduled check):
```typescript
// runs every hour
export const checkAutoComplete = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = new Date();

    const jobs = await db.collection('jobs')
      .where('status', '==', 'submitted')
      .where('autoCompleteAt', '<=', now)
      .get();

    for (const doc of jobs.docs) {
      await completeJob(doc.id, 'auto');
    }
  });
```

**Notification**:
- **Target**: Client
- **Type**: `work_submitted`
- **Title**: "Work Submitted! 📦"
- **Body**: "Sara submitted the final work for review"
- **Data**: `{ jobId, submissionId, screen: '(modals)/review-work/[jobId]' }`

**Next Screen**: 
- Freelancer: Active jobs tab (waiting status)
- Client: Receives notification → Review Work screen

---

## **8️⃣ CLIENT REVIEW / COMPLETION**

### **📱 Screen: `(modals)/review-work/[jobId].tsx`**

**Purpose**: Client reviews submission and approves/disputes

**UI Elements**:
- Submission files (download/preview)
- Freelancer's submission note
- Timer countdown (72h auto-approve)
- "Approve & Complete" button (green)
- "Dispute" button (red)

**Frontend Logic**:
```typescript
const handleApprove = async () => {
  Alert.alert(
    'Approve Work?',
    'Payment will be released to freelancer',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          const response = await BackendAPI.post(`/jobs/${jobId}/complete`);
          if (response.success) {
            Alert.alert('Job Completed!', 'Payment released');
            router.push(`/(modals)/rate-user/${freelancerId}`);
          }
        }
      }
    ]
  );
};

const handleDispute = async () => {
  router.push(`/(modals)/dispute/${jobId}`);
};
```

**Backend API**: 
- `POST /api/jobs/:jobId/complete`
- `POST /api/jobs/:jobId/dispute`

**Backend Logic**:

**Complete Job**:
```typescript
router.post('/:jobId/complete', authenticateToken, async (req, res) => {
  const { jobId } = req.params;
  const clientId = req.user.uid;

  const db = await unifiedFirebase.getFirestore();
  const jobRef = db.collection('jobs').doc(jobId);
  const job = (await jobRef.get()).data();

  if (job.clientId !== clientId) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  // Update job status
  await jobRef.update({
    status: 'completed',
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
    completedBy: 'client', // or 'auto' for auto-complete
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Release escrow payment
  await PaymentService.releaseEscrow(job.escrowId);

  // Update escrow document
  const escrowRef = db.collection('escrow').doc(job.escrowId);
  await escrowRef.update({
    status: 'released',
    releasedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Notify freelancer
  await notificationService.sendNotification(
    job.freelancerId,
    'job_completed',
    {
      jobId,
      jobTitle: job.title,
      amount: job.acceptedPrice
    }
  );

  // Create review requests
  await createReviewRequest(jobId, clientId, job.freelancerId);
  await createReviewRequest(jobId, job.freelancerId, clientId);

  logger.info('Job completed', { jobId, completedBy: 'client' });

  res.json({
    success: true,
    message: 'Job completed and payment released'
  });
});
```

**Dispute Job**:
```typescript
router.post('/:jobId/dispute', authenticateToken, async (req, res) => {
  const { jobId } = req.params;
  const userId = req.user.uid;
  const { reason, evidence } = req.body;

  if (!reason) {
    return res.status(400).json({
      success: false,
      message: 'Dispute reason is required'
    });
  }

  const db = await unifiedFirebase.getFirestore();
  const jobRef = db.collection('jobs').doc(jobId);
  const job = (await jobRef.get()).data();

  const isClient = job.clientId === userId;
  const isFreelancer = job.freelancerId === userId;

  if (!isClient && !isFreelancer) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  // Create dispute document
  const disputeData = {
    jobId,
    initiatedBy: userId,
    initiatorRole: isClient ? 'client' : 'freelancer',
    reason,
    evidence: evidence || [],
    status: 'open',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const disputeRef = await db.collection('disputes').add(disputeData);

  // Update job status
  await jobRef.update({
    status: 'disputed',
    disputeId: disputeRef.id,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Hold escrow
  const escrowRef = db.collection('escrow').doc(job.escrowId);
  await escrowRef.update({
    status: 'disputed',
  });

  // Notify admin
  await notificationService.sendNotification(
    'admin',
    'dispute_opened',
    {
      jobId,
      disputeId: disputeRef.id,
      jobTitle: job.title,
      initiatedBy: req.user.displayName
    }
  );

  // Notify other party
  const otherPartyId = isClient ? job.freelancerId : job.clientId;
  await notificationService.sendNotification(
    otherPartyId,
    'dispute_opened',
    {
      jobId,
      disputeId: disputeRef.id,
      jobTitle: job.title
    }
  );

  logger.info('Dispute opened', { jobId, disputeId: disputeRef.id, initiatedBy: userId });

  res.json({
    success: true,
    data: { disputeId: disputeRef.id },
    message: 'Dispute opened. Admin will review.'
  });
});
```

**Firestore Updates**:

**Job Completed**:
```
/jobs/{jobId}
{
  ...existing fields,
  status: "completed",
  completedAt: Timestamp,
  completedBy: "client", // or "auto"
  updatedAt: Timestamp
}
```

**Escrow Released**:
```
/escrow/{escrowId}
{
  ...existing fields,
  status: "released",
  releasedAt: Timestamp
}
```

**Job Disputed**:
```
/jobs/{jobId}
{
  ...existing fields,
  status: "disputed",
  disputeId: "dispute123",
  updatedAt: Timestamp
}

/disputes/{disputeId}
{
  jobId: "job123",
  initiatedBy: "user123",
  initiatorRole: "client",
  reason: "Work doesn't match requirements",
  evidence: ["gs://..."],
  status: "open",
  createdAt: Timestamp
}

/escrow/{escrowId}
{
  ...existing fields,
  status: "disputed"
}
```

**Notifications**:

**Job Completed**:
- **Target**: Freelancer
- **Type**: `job_completed`
- **Title**: "Job Completed! 🎉"
- **Body**: "Ahmed approved your work. QAR 1,500 released"
- **Data**: `{ jobId, amount, screen: '(modals)/rate-user/[userId]' }`

**Dispute Opened**:
- **Target 1**: Admin
- **Type**: `dispute_opened`
- **Title**: "⚠️ New Dispute"
- **Body**: "Ahmed opened a dispute for 'UI/UX Designer Needed'"
- **Data**: `{ jobId, disputeId, screen: '(admin)/dispute/[disputeId]' }`

- **Target 2**: Other party (freelancer)
- **Type**: `dispute_opened`
- **Title**: "Dispute Opened"
- **Body**: "Client disputed your work for 'UI/UX Designer Needed'"
- **Data**: `{ jobId, disputeId, screen: '(modals)/dispute/[disputeId]' }`

**Next Screen**:
- Completed: `(modals)/rate-user/[userId].tsx`
- Disputed: `(modals)/dispute/[disputeId].tsx`

---

## **9️⃣ DISPUTE RESOLUTION**

### **📱 Screen: `(modals)/dispute/[disputeId].tsx`**

**Purpose**: View dispute details, add evidence, chat with admin

**UI Elements**:
- Dispute reason
- Evidence files from both parties
- Chat thread with admin
- Upload additional evidence
- Status badge (Open / Under Review / Resolved)

**Frontend Logic**:
```typescript
// Real-time dispute listener
useEffect(() => {
  const unsubscribe = db.collection('disputes').doc(disputeId)
    .onSnapshot((doc) => {
      setDispute({ id: doc.id, ...doc.data() });
    });

  return () => unsubscribe();
}, [disputeId]);

const handleAddEvidence = async () => {
  const fileUrls = await uploadFiles(evidenceFiles);
  
  await BackendAPI.post(`/disputes/${disputeId}/evidence`, {
    files: fileUrls,
    description: evidenceDescription,
  });
};
```

### **📱 Screen: `(admin)/disputes.tsx` *(Admin only)*

**Purpose**: Admin resolves disputes

**UI Elements**:
- List of open disputes
- Each dispute shows:
  - Job title
  - Client vs Freelancer
  - Dispute reason
  - Evidence from both sides
- "Resolve in favor of Client" button
- "Resolve in favor of Freelancer" button
- Admin notes textarea

**Frontend Logic**:
```typescript
const handleResolve = async (disputeId: string, winner: 'client' | 'freelancer', notes: string) => {
  await BackendAPI.post(`/admin/disputes/${disputeId}/resolve`, {
    winner,
    adminNotes: notes,
  });

  Alert.alert('Dispute Resolved', `Resolved in favor of ${winner}`);
};
```

**Backend API**: `POST /api/admin/disputes/:disputeId/resolve`

**Backend Logic** (`backend/src/routes/admin.ts`):
```typescript
router.post('/disputes/:disputeId/resolve', 
  requireAdmin, 
  async (req, res) => {
    const { disputeId } = req.params;
    const { winner, adminNotes } = req.body;
    const adminId = req.user.uid;

    if (!winner || !['client', 'freelancer'].includes(winner)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid winner value'
      });
    }

    const db = await unifiedFirebase.getFirestore();
    const disputeRef = db.collection('disputes').doc(disputeId);
    const dispute = (await disputeRef.get()).data();

    const jobRef = db.collection('jobs').doc(dispute.jobId);
    const job = (await jobRef.get()).data();

    // Update dispute
    await disputeRef.update({
      status: 'resolved',
      winner,
      adminNotes,
      resolvedBy: adminId,
      resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update job
    await jobRef.update({
      status: 'completed',
      disputeResolution: winner,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Handle payment
    const escrowRef = db.collection('escrow').doc(job.escrowId);
    
    if (winner === 'freelancer') {
      // Release payment to freelancer
      await PaymentService.releaseEscrow(job.escrowId);
      await escrowRef.update({
        status: 'released',
        releasedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // Refund payment to client
      await PaymentService.refundEscrow(job.escrowId);
      await escrowRef.update({
        status: 'refunded',
        refundedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Notify both parties
    await notificationService.sendNotification(
      job.clientId,
      'dispute_resolved',
      {
        jobId: dispute.jobId,
        disputeId,
        winner,
        jobTitle: job.title
      }
    );

    await notificationService.sendNotification(
      job.freelancerId,
      'dispute_resolved',
      {
        jobId: dispute.jobId,
        disputeId,
        winner,
        jobTitle: job.title
      }
    );

    logger.info('Dispute resolved', { disputeId, winner, adminId });

    res.json({
      success: true,
      message: `Dispute resolved in favor of ${winner}`
    });
  }
);
```

**Firestore Updates**:
```
/disputes/{disputeId}
{
  ...existing fields,
  status: "resolved",
  winner: "freelancer",
  adminNotes: "Freelancer provided sufficient evidence...",
  resolvedBy: "admin456",
  resolvedAt: Timestamp
}

/jobs/{jobId}
{
  ...existing fields,
  status: "completed",
  disputeResolution: "freelancer",
  completedAt: Timestamp,
  updatedAt: Timestamp
}

/escrow/{escrowId}
{
  ...existing fields,
  status: "released", // or "refunded"
  releasedAt: Timestamp // or refundedAt
}
```

**Notifications**:
- **Target**: Both client and freelancer
- **Type**: `dispute_resolved`
- **Title**: "Dispute Resolved"
- **Body**: "Dispute resolved in favor of [winner]"
- **Data**: `{ jobId, disputeId, winner, screen: '(main)/jobs' }`

**Next Screen**: Back to dashboard / job history

---

## **🔟 REVIEW & RATING**

### **📱 Screen: `(modals)/rate-user/[userId].tsx`**

**Purpose**: Rate and review the other party after job completion

**UI Elements**:
- User's avatar and name
- Star rating (1-5)
- Review textarea
- Submit button

**Frontend Logic**:
```typescript
const handleSubmitReview = async () => {
  await BackendAPI.post('/reviews', {
    jobId,
    targetUserId: userId,
    rating,
    comment: reviewText,
  });

  Alert.alert('Thank you!', 'Your review has been submitted');
  router.back();
};
```

**Backend API**: `POST /api/reviews`

**Backend Logic** (`backend/src/routes/reviews.ts` - *new file*):
```typescript
router.post('/', authenticateToken, async (req, res) => {
  const reviewerId = req.user.uid;
  const { jobId, targetUserId, rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Invalid rating'
    });
  }

  const db = await unifiedFirebase.getFirestore();

  // Create review document
  const reviewData = {
    jobId,
    reviewerId,
    reviewerName: req.user.displayName || 'Anonymous',
    targetUserId,
    rating,
    comment: comment || '',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const reviewRef = await db.collection('reviews').add(reviewData);

  // Update target user's rating average
  await updateUserRating(targetUserId);

  logger.info('Review created', { reviewId: reviewRef.id, jobId, targetUserId, rating });

  res.json({
    success: true,
    message: 'Review submitted'
  });
});

async function updateUserRating(userId: string) {
  const db = await unifiedFirebase.getFirestore();
  const reviews = await db.collection('reviews')
    .where('targetUserId', '==', userId)
    .get();

  const totalRating = reviews.docs.reduce((sum, doc) => sum + doc.data().rating, 0);
  const averageRating = totalRating / reviews.size;
  const reviewCount = reviews.size;

  await db.collection('users').doc(userId).update({
    rating: averageRating,
    reviewCount,
  });
}
```

**Firestore Write**:
```
/reviews/{reviewId}
{
  jobId: "job123",
  reviewerId: "user123",
  reviewerName: "Ahmed",
  targetUserId: "user456",
  rating: 5,
  comment: "Excellent work! Very professional.",
  createdAt: Timestamp
}
```

**User Profile Update**:
```
/users/{userId}
{
  ...existing fields,
  rating: 4.8,
  reviewCount: 23
}
```

**Next Screen**: Back to job history

---

## 🔄 **REAL-TIME UPDATES SUMMARY**

| Event | Trigger | Firestore Listener | Target Screen | Notification |
|-------|---------|-------------------|---------------|--------------|
| **Job Created** | Client submits job | `jobs/{jobId}` | Admin: Pending Jobs | ✅ Admin |
| **Job Approved** | Admin approves | `jobs/{jobId}` | Client: My Jobs<br>Freelancers: Browse | ✅ Client<br>🔔 Real-time list |
| **Job Rejected** | Admin rejects | `jobs/{jobId}` | Client: My Jobs | ✅ Client |
| **New Offer** | Freelancer offers | `offers` collection | Client: Job Offers | ✅ Client |
| **Offer Accepted** | Client accepts | `offers/{offerId}`<br>`jobs/{jobId}` | Freelancer: Active<br>Client: Payment | ✅ Freelancer<br>✅ Rejected freelancers |
| **Payment Complete** | Client pays escrow | `escrow/{escrowId}`<br>`jobs/{jobId}` | Both: Contract | ✅ Freelancer |
| **Contract Signed** | Both sign | `jobs/{jobId}` | Both: Job Progress | ✅ Both |
| **Progress Update** | Freelancer adds | `jobs/{jobId}/progressLogs` | Client: Progress View | ✅ Client |
| **Work Submitted** | Freelancer submits | `jobs/{jobId}/submissions`<br>`jobs/{jobId}` | Client: Review Work | ✅ Client |
| **Job Completed** | Client approves | `jobs/{jobId}`<br>`escrow/{escrowId}` | Both: History | ✅ Freelancer |
| **Auto-Complete** | 72h timer | Cloud Function | Both: History | ✅ Both |
| **Dispute Opened** | Either party | `disputes/{disputeId}`<br>`jobs/{jobId}` | Admin: Disputes<br>Other party: Dispute | ✅ Admin<br>✅ Other party |
| **Dispute Resolved** | Admin resolves | `disputes/{disputeId}`<br>`jobs/{jobId}`<br>`escrow/{escrowId}` | Both: History | ✅ Both |

---

## 🔌 **BACKEND API REFERENCE**

### **Jobs**
```
POST   /api/jobs                          Create job
GET    /api/jobs                          List/search jobs
GET    /api/jobs/:jobId                   Get job details
POST   /api/jobs/:jobId/sign-contract     Sign contract
POST   /api/jobs/:jobId/progress          Add progress update
POST   /api/jobs/:jobId/submit            Submit work
POST   /api/jobs/:jobId/complete          Complete job
POST   /api/jobs/:jobId/dispute           Open dispute
```

### **Offers**
```
POST   /api/offers                        Create offer
GET    /api/offers?jobId={id}             Get offers for job
GET    /api/offers?freelancerId={id}      Get freelancer's offers
POST   /api/offers/:offerId/accept        Accept offer
POST   /api/offers/:offerId/reject        Reject offer
```

### **Escrow**
```
POST   /api/escrow/create                 Create escrow & pay
POST   /api/escrow/:escrowId/release      Release payment
POST   /api/escrow/:escrowId/refund       Refund payment
```

### **Admin**
```
POST   /api/admin/jobs/:jobId/approve     Approve job
POST   /api/admin/jobs/:jobId/reject      Reject job
GET    /api/admin/disputes                List disputes
POST   /api/admin/disputes/:id/resolve    Resolve dispute
```

### **Reviews**
```
POST   /api/reviews                       Create review
GET    /api/reviews?userId={id}           Get user reviews
```

---

## 📦 **FIRESTORE STRUCTURE**

```
/jobs/{jobId}
  - title, description, category, budget, location, skills, etc.
  - status: draft | open | offered | accepted | in_contract | in_progress | submitted | completed | cancelled | disputed
  - adminStatus: pending_review | approved | rejected
  - clientId, clientName, freelancerId, freelancerName
  - escrowId, acceptedOfferId, submissionId, disputeId
  - timestamps
  /progressLogs/{logId}
    - description, percentage, attachments, createdBy, createdAt
  /submissions/{submissionId}
    - freelancerId, submissionNote, files, submittedAt

/offers/{offerId}
  - jobId, freelancerId, price, message, deliveryTime
  - status: pending | accepted | rejected
  - timestamps

/escrow/{escrowId}
  - jobId, offerId, clientId, freelancerId
  - amount, fees breakdown
  - status: pending | held | released | refunded | disputed
  - paymentId, timestamps

/disputes/{disputeId}
  - jobId, initiatedBy, initiatorRole, reason, evidence
  - status: open | under_review | resolved
  - winner, adminNotes, resolvedBy, timestamps

/reviews/{reviewId}
  - jobId, reviewerId, targetUserId, rating, comment, createdAt

/users/{userId}
  - ...user fields
  - rating (average)
  - reviewCount
```

---

## ☁️ **CLOUD FUNCTIONS**

### **Triggers**
```typescript
// 1. On job created → Notify admins
onJobCreated(jobId) → sendNotificationToAdmins()

// 2. On offer created → Notify client
onOfferCreated(offerId) → sendNotificationToClient()

// 3. Auto-complete jobs (scheduled)
checkAutoComplete() → every 1 hour → complete submitted jobs > 72h old

// 4. Daily job cleanup (scheduled)
cleanupExpiredJobs() → every 1 day → archive old completed jobs
```

---

## ✅ **IMPLEMENTATION STATUS**

```
╔════════════════════════════════════════════════════════════╗
║      COMPLETE JOB SYSTEM LOGIC MAP: 100% DOCUMENTED      ║
╚════════════════════════════════════════════════════════════╝

✅ Job Creation Flow
✅ Admin Review Flow
✅ Job Browsing & Offering
✅ Client Accepts Offer
✅ Contract & Payment Stage
✅ Work In Progress
✅ Work Submission
✅ Client Review / Completion
✅ Dispute Resolution
✅ Review & Rating
✅ Real-Time Updates
✅ Backend API Reference
✅ Firestore Structure
✅ Cloud Functions

READY TO IMPLEMENT! 🚀
```

---

**Your job system now has COMPLETE end-to-end logic mapping with every screen, backend function, Firestore operation, and real-time update documented!** 🎉✨







