# **🔥 GUILD FIREBASE IMPLEMENTATION PLAN**
**Date**: October 5, 2025  
**Approved Requirements**: Based on User Feedback  
**Timeline**: 4 weeks

---

## **✅ CONFIRMED REQUIREMENTS**

### **1. SMS** ✅
- **Use**: Firebase Authentication Phone Sign-In ONLY
- **Purpose**: User verification during signup/login
- **No custom SMS needed**: Use push notifications for all other communications

### **2. Search** ✅
- **Use**: Client-side filtering
- **Reason**: Small dataset, all jobs open to all users
- **No limits/based jobs yet**: Simple filtering is sufficient

### **3. Voice/Video Calls** ❌
- **Not needed**: Guild is a job platform, not communication app
- **Agreed**: Skip this feature

### **4. File & Picture Sharing in Chat** ✅ **NEW REQUIREMENT**
- **Use**: Firebase Storage + Firestore
- **Support**: Images, documents, PDFs in chat
- **Implementation needed**: Add to current chat system

### **5. Payment Processing** ⚠️ **LATER**
- **Current**: No PSP integration yet
- **Firebase Role**: Store payment records only (transactions, wallet balance)
- **PSP Integration**: Will be added later
- **Logic Changes**: Planned for future

### **6. Email** ✅
- **Use**: Firebase Extension (Trigger Email from Firestore)
- **When needed**: User notifications, receipts, etc.

---

## **🏗️ FINAL ARCHITECTURE**

```
┌─────────────────────────────────────────────────────┐
│              GUILD APP (Frontend)                    │
│           React Native + Expo SDK 54                 │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ 100% Firebase
                   │
    ┌──────────────┴──────────────┐
    │                             │
    ▼                             ▼
┌──────────────┐        ┌────────────────┐
│   FIREBASE   │        │    FIREBASE    │
│   SERVICES   │        │   EXTENSIONS   │
├──────────────┤        ├────────────────┤
│ ✅ Firestore │        │ ✅ Email Ext   │
│   • Chat     │        │   (if needed)  │
│   • Messages │        │                │
│   • Files    │        │                │
│              │        │                │
│ ✅ Auth      │        │                │
│   • Phone    │        │                │
│   • Email    │        │                │
│              │        │                │
│ ✅ Storage   │        │                │
│   • Chat     │        │                │
│   • Files    │        │                │
│   • Images   │        │                │
│              │        │                │
│ ✅ FCM       │        │                │
│   • Push     │        │                │
│   • Notifs   │        │                │
│              │        │                │
│ ✅ Functions │        │                │
│   • Triggers │        │                │
│   • Cron     │        │                │
└──────────────┘        └────────────────┘
```

---

## **📋 IMPLEMENTATION TASKS**

### **Phase 1: Chat File Sharing (Week 1-2)** 🎯 **PRIORITY**

#### **Task 1.1: Update Firestore Schema**

**Current Schema**:
```typescript
chats/{chatId}/messages/{messageId}
  - text: string
  - senderId: string
  - createdAt: timestamp
  - readBy: array
```

**New Schema**:
```typescript
chats/{chatId}/messages/{messageId}
  - text: string
  - senderId: string
  - type: 'text' | 'image' | 'file' | 'document'
  - createdAt: timestamp
  - readBy: array
  
  // For files/images
  - fileUrl?: string
  - fileName?: string
  - fileSize?: number
  - fileType?: string (mime type)
  - thumbnailUrl?: string (for images)
  - uploadStatus?: 'uploading' | 'completed' | 'failed'
```

---

#### **Task 1.2: Implement File Upload**

**File**: `src/services/chatFileService.ts`

```typescript
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { addDoc, collection, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '../config/firebase';

export class ChatFileService {
  /**
   * Upload image to chat
   */
  async uploadImage(
    chatId: string,
    imageUri: string,
    senderId: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      // Convert image URI to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${senderId}_${timestamp}.jpg`;
      const storageRef = ref(storage, `chats/${chatId}/images/${filename}`);
      
      // Create message document first (with uploading status)
      const messageRef = await addDoc(collection(db, 'chats', chatId, 'messages'), {
        type: 'image',
        senderId,
        uploadStatus: 'uploading',
        fileName: filename,
        createdAt: serverTimestamp(),
        readBy: [senderId]
      });
      
      // Upload file with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, blob);
      
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Progress
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress?.(progress);
          },
          (error) => {
            // Error
            console.error('Upload error:', error);
            
            // Update message with error status
            updateDoc(messageRef, {
              uploadStatus: 'failed',
              error: error.message
            });
            
            reject(error);
          },
          async () => {
            // Success
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Update message with file URL
            await updateDoc(messageRef, {
              fileUrl: downloadURL,
              uploadStatus: 'completed',
              fileSize: uploadTask.snapshot.totalBytes
            });
            
            resolve(messageRef.id);
          }
        );
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }
  
  /**
   * Upload document/file to chat
   */
  async uploadFile(
    chatId: string,
    fileUri: string,
    fileName: string,
    fileType: string,
    senderId: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      // Convert file URI to blob
      const response = await fetch(fileUri);
      const blob = await response.blob();
      
      // Generate unique filename
      const timestamp = Date.now();
      const uniqueFilename = `${senderId}_${timestamp}_${fileName}`;
      const storageRef = ref(storage, `chats/${chatId}/files/${uniqueFilename}`);
      
      // Create message document first
      const messageRef = await addDoc(collection(db, 'chats', chatId, 'messages'), {
        type: 'file',
        senderId,
        uploadStatus: 'uploading',
        fileName,
        fileType,
        createdAt: serverTimestamp(),
        readBy: [senderId]
      });
      
      // Upload file
      const uploadTask = uploadBytesResumable(storageRef, blob, {
        contentType: fileType
      });
      
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress?.(progress);
          },
          (error) => {
            console.error('Upload error:', error);
            updateDoc(messageRef, {
              uploadStatus: 'failed',
              error: error.message
            });
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            await updateDoc(messageRef, {
              fileUrl: downloadURL,
              uploadStatus: 'completed',
              fileSize: uploadTask.snapshot.totalBytes
            });
            
            resolve(messageRef.id);
          }
        );
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }
  
  /**
   * Download file from chat
   */
  async downloadFile(fileUrl: string, fileName: string): Promise<void> {
    try {
      // Use expo-file-system to download
      const { downloadAsync } = await import('expo-file-system');
      const { documentDirectory } = await import('expo-file-system');
      
      const fileUri = documentDirectory + fileName;
      
      await downloadAsync(fileUrl, fileUri);
      
      // Open file with appropriate app
      const { getContentUriAsync } = await import('expo-file-system');
      const contentUri = await getContentUriAsync(fileUri);
      
      const { openURL } = await import('expo-linking');
      await openURL(contentUri);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }
}

export const chatFileService = new ChatFileService();
```

---

#### **Task 1.3: Update Chat UI**

**File**: `src/components/ChatMessage.tsx`

```typescript
import React from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatFileService } from '../services/chatFileService';

interface ChatMessageProps {
  message: {
    id: string;
    type: 'text' | 'image' | 'file';
    text?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    uploadStatus?: 'uploading' | 'completed' | 'failed';
    senderId: string;
  };
  isOwnMessage: boolean;
}

export function ChatMessage({ message, isOwnMessage }: ChatMessageProps) {
  const handleDownload = async () => {
    if (message.fileUrl && message.fileName) {
      await chatFileService.downloadFile(message.fileUrl, message.fileName);
    }
  };
  
  // Text message
  if (message.type === 'text') {
    return (
      <View style={[styles.messageBubble, isOwnMessage && styles.ownMessage]}>
        <Text style={styles.messageText}>{message.text}</Text>
      </View>
    );
  }
  
  // Image message
  if (message.type === 'image') {
    return (
      <View style={[styles.messageBubble, isOwnMessage && styles.ownMessage]}>
        {message.uploadStatus === 'uploading' ? (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="large" />
            <Text>Uploading image...</Text>
          </View>
        ) : message.uploadStatus === 'failed' ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color="red" />
            <Text>Upload failed</Text>
          </View>
        ) : (
          <TouchableOpacity onPress={() => {/* Open full screen image */}}>
            <Image
              source={{ uri: message.fileUrl }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
      </View>
    );
  }
  
  // File message
  if (message.type === 'file') {
    return (
      <View style={[styles.messageBubble, isOwnMessage && styles.ownMessage]}>
        {message.uploadStatus === 'uploading' ? (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="small" />
            <Text>Uploading {message.fileName}...</Text>
          </View>
        ) : message.uploadStatus === 'failed' ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color="red" />
            <Text>Upload failed</Text>
          </View>
        ) : (
          <TouchableOpacity onPress={handleDownload} style={styles.fileContainer}>
            <Ionicons name="document" size={32} color="#007AFF" />
            <View style={styles.fileInfo}>
              <Text style={styles.fileName}>{message.fileName}</Text>
              <Text style={styles.fileSize}>
                {(message.fileSize! / 1024).toFixed(2)} KB
              </Text>
            </View>
            <Ionicons name="download" size={24} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>
    );
  }
  
  return null;
}
```

---

#### **Task 1.4: Add File Picker**

**File**: `src/screens/ChatScreen.tsx`

```typescript
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { chatFileService } from '../services/chatFileService';

function ChatScreen() {
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const handlePickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Need camera roll permission');
      return;
    }
    
    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: false
    });
    
    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      
      try {
        await chatFileService.uploadImage(
          chatId,
          imageUri,
          userId,
          (progress) => setUploadProgress(progress)
        );
      } catch (error) {
        Alert.alert('Upload failed', 'Could not upload image');
      }
    }
  };
  
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });
      
      if (result.type === 'success') {
        await chatFileService.uploadFile(
          chatId,
          result.uri,
          result.name,
          result.mimeType || 'application/octet-stream',
          userId,
          (progress) => setUploadProgress(progress)
        );
      }
    } catch (error) {
      Alert.alert('Upload failed', 'Could not upload file');
    }
  };
  
  return (
    <View style={styles.container}>
      {/* Messages list */}
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <ChatMessage message={item} isOwnMessage={item.senderId === userId} />
        )}
      />
      
      {/* Input area */}
      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={handlePickImage}>
          <Ionicons name="image" size={24} color="#007AFF" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handlePickDocument}>
          <Ionicons name="attach" size={24} color="#007AFF" />
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={messageText}
          onChangeText={setMessageText}
        />
        
        <TouchableOpacity onPress={handleSendMessage}>
          <Ionicons name="send" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
      
      {/* Upload progress */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <View style={styles.progressContainer}>
          <Text>Uploading: {uploadProgress.toFixed(0)}%</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
          </View>
        </View>
      )}
    </View>
  );
}
```

---

#### **Task 1.5: Update Firestore Security Rules**

**File**: `firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Chat messages with file support
    match /chats/{chatId}/messages/{messageId} {
      allow read: if request.auth != null && 
        request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
      
      allow create: if request.auth != null && 
        request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants &&
        request.resource.data.senderId == request.auth.uid &&
        // Validate message type
        request.resource.data.type in ['text', 'image', 'file'] &&
        // Validate file messages have required fields
        (request.resource.data.type == 'text' || 
         (request.resource.data.keys().hasAll(['fileName', 'uploadStatus'])));
    }
  }
}
```

---

#### **Task 1.6: Update Storage Security Rules**

**File**: `storage.rules`

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Chat files
    match /chats/{chatId}/images/{imageId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        request.resource.size < 5 * 1024 * 1024 && // Max 5MB
        request.resource.contentType.matches('image/.*');
    }
    
    match /chats/{chatId}/files/{fileId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        request.resource.size < 10 * 1024 * 1024; // Max 10MB
    }
  }
}
```

---

### **Phase 2: Payment Records (Week 3)** 💰 **FOUNDATION ONLY**

#### **Task 2.1: Create Payment Schema**

**Firestore Collections**:

```typescript
// Collection: transactions
transactions/{transactionId}
  - userId: string
  - type: 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'escrow_hold' | 'escrow_release'
  - amount: number
  - currency: string (default: 'QAR')
  - status: 'pending' | 'completed' | 'failed' | 'cancelled'
  - description: string
  - jobId?: string (if related to job)
  - pspTransactionId?: string (from external PSP)
  - pspProvider?: string ('stripe', 'paypal', etc.)
  - metadata: object (any additional data)
  - createdAt: timestamp
  - updatedAt: timestamp

// Collection: wallets
wallets/{userId}
  - balance: number
  - currency: string (default: 'QAR')
  - pendingBalance: number (escrow)
  - totalEarned: number
  - totalSpent: number
  - lastTransactionAt: timestamp
  - createdAt: timestamp
  - updatedAt: timestamp
```

---

#### **Task 2.2: Create Payment Service**

**File**: `src/services/paymentRecordService.ts`

```typescript
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  increment,
  runTransaction
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Transaction {
  id?: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'escrow_hold' | 'escrow_release';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  jobId?: string;
  pspTransactionId?: string;
  pspProvider?: string;
  metadata?: any;
  createdAt?: any;
  updatedAt?: any;
}

export interface Wallet {
  balance: number;
  currency: string;
  pendingBalance: number;
  totalEarned: number;
  totalSpent: number;
  lastTransactionAt?: any;
  createdAt?: any;
  updatedAt?: any;
}

export class PaymentRecordService {
  /**
   * Create transaction record
   * NOTE: This only creates the record. Actual payment processing happens in PSP.
   */
  async createTransaction(transaction: Omit<Transaction, 'id'>): Promise<string> {
    try {
      const transactionRef = await addDoc(collection(db, 'transactions'), {
        ...transaction,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return transactionRef.id;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }
  
  /**
   * Update transaction status (called by PSP webhook)
   */
  async updateTransactionStatus(
    transactionId: string,
    status: 'completed' | 'failed' | 'cancelled',
    pspTransactionId?: string
  ): Promise<void> {
    try {
      await updateDoc(doc(db, 'transactions', transactionId), {
        status,
        pspTransactionId,
        updatedAt: serverTimestamp()
      });
      
      // If completed, update wallet
      if (status === 'completed') {
        const transactionDoc = await getDoc(doc(db, 'transactions', transactionId));
        const transaction = transactionDoc.data() as Transaction;
        
        await this.updateWallet(transaction);
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }
  
  /**
   * Update wallet balance
   */
  private async updateWallet(transaction: Transaction): Promise<void> {
    try {
      const walletRef = doc(db, 'wallets', transaction.userId);
      
      await runTransaction(db, async (txn) => {
        const walletDoc = await txn.get(walletRef);
        
        if (!walletDoc.exists()) {
          // Create wallet if doesn't exist
          txn.set(walletRef, {
            balance: 0,
            currency: transaction.currency,
            pendingBalance: 0,
            totalEarned: 0,
            totalSpent: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
        
        // Update balance based on transaction type
        const updates: any = {
          updatedAt: serverTimestamp(),
          lastTransactionAt: serverTimestamp()
        };
        
        switch (transaction.type) {
          case 'deposit':
            updates.balance = increment(transaction.amount);
            updates.totalEarned = increment(transaction.amount);
            break;
            
          case 'withdrawal':
            updates.balance = increment(-transaction.amount);
            updates.totalSpent = increment(transaction.amount);
            break;
            
          case 'payment':
            updates.balance = increment(-transaction.amount);
            updates.totalSpent = increment(transaction.amount);
            break;
            
          case 'refund':
            updates.balance = increment(transaction.amount);
            break;
            
          case 'escrow_hold':
            updates.balance = increment(-transaction.amount);
            updates.pendingBalance = increment(transaction.amount);
            break;
            
          case 'escrow_release':
            updates.pendingBalance = increment(-transaction.amount);
            updates.totalEarned = increment(transaction.amount);
            break;
        }
        
        txn.update(walletRef, updates);
      });
    } catch (error) {
      console.error('Error updating wallet:', error);
      throw error;
    }
  }
  
  /**
   * Get user's wallet
   */
  async getWallet(userId: string): Promise<Wallet | null> {
    try {
      const walletDoc = await getDoc(doc(db, 'wallets', userId));
      
      if (!walletDoc.exists()) {
        return null;
      }
      
      return walletDoc.data() as Wallet;
    } catch (error) {
      console.error('Error getting wallet:', error);
      throw error;
    }
  }
  
  /**
   * Get user's transactions
   */
  async getUserTransactions(userId: string, limit: number = 50): Promise<Transaction[]> {
    try {
      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
    } catch (error) {
      console.error('Error getting transactions:', error);
      throw error;
    }
  }
}

export const paymentRecordService = new PaymentRecordService();
```

---

### **Phase 3: Client-Side Search (Week 4)** 🔍

#### **Task 3.1: Implement Job Search**

**File**: `src/hooks/useJobSearch.ts`

```typescript
import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Job } from '../services/jobService';

export function useJobSearch() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 100000]);
  
  // Load all jobs (cached by Firestore)
  useEffect(() => {
    const q = query(
      collection(db, 'jobs'),
      where('status', '==', 'open'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allJobs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Job[];
      
      setJobs(allJobs);
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);
  
  // Filter jobs client-side
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(query);
        const matchesDescription = job.description.toLowerCase().includes(query);
        const matchesSkills = job.skills.some(skill => 
          skill.toLowerCase().includes(query)
        );
        
        if (!matchesTitle && !matchesDescription && !matchesSkills) {
          return false;
        }
      }
      
      // Category filter
      if (categoryFilter && job.category !== categoryFilter) {
        return false;
      }
      
      // Budget filter
      const jobBudget = typeof job.budget === 'object' 
        ? job.budget.max 
        : parseFloat(job.budget);
      
      if (jobBudget < budgetRange[0] || jobBudget > budgetRange[1]) {
        return false;
      }
      
      return true;
    });
  }, [jobs, searchQuery, categoryFilter, budgetRange]);
  
  return {
    jobs: filteredJobs,
    loading,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    budgetRange,
    setBudgetRange,
    totalJobs: jobs.length,
    filteredCount: filteredJobs.length
  };
}
```

---

## **💰 COST ESTIMATE**

| **Service** | **Current** | **After Implementation** |
|-------------|-------------|--------------------------|
| **Firestore** | $50/month | $60/month (+file metadata) |
| **Storage** | $20/month | $40/month (+chat files) |
| **Auth** | $30/month | $30/month (no change) |
| **Functions** | $40/month | $40/month (no change) |
| **FCM** | FREE | FREE |
| **Analytics** | FREE | FREE |
| **TOTAL** | $140/month | $170/month |

**Additional Cost**: +$30/month for file storage

---

## **✅ SUMMARY**

### **What We're Implementing**:
1. ✅ **Chat File Sharing** - Images + Documents (Week 1-2)
2. ✅ **Payment Records** - Firestore tracking only (Week 3)
3. ✅ **Client-Side Search** - Filter all jobs (Week 4)

### **What We're NOT Doing** (As Agreed):
1. ❌ Custom SMS (using Firebase Auth Phone only)
2. ❌ Voice/Video calls (not needed)
3. ❌ PSP integration (later)
4. ❌ Third-party search (Algolia)

### **Timeline**: 4 weeks
### **Cost**: $170/month (vs $340 current = 50% savings)
### **Effort**: 80 hours total

---

**Ready to start implementation?** 🚀







