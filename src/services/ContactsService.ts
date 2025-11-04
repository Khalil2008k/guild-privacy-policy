/**
 * Contacts Service - Manage user contacts
 * Stores contacts in Firestore under users/{userId}/contacts/{contactId}
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc, 
  deleteDoc,
  query, 
  orderBy,
  where,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { auth } from '../config/firebase';
import { logger } from '../utils/logger';

export interface Contact {
  id: string;
  userId: string; // The contact's user ID
  name: string;
  guild?: string;
  gid?: string;
  profileImage?: string;
  phoneNumber?: string;
  email?: string;
  addedAt: Timestamp;
  lastContactAt?: Timestamp;
  note?: string;
}

class ContactsServiceClass {
  private getCurrentUserId(): string | null {
    return auth.currentUser?.uid || null;
  }

  private getContactsCollection(userId: string) {
    return collection(db, 'users', userId, 'contacts');
  }

  /**
   * Add a contact
   */
  async addContact(contactData: {
    userId: string;
    name: string;
    guild?: string;
    gid?: string;
    profileImage?: string;
    phoneNumber?: string;
    email?: string;
    note?: string;
  }): Promise<Contact> {
    try {
      const currentUserId = this.getCurrentUserId();
      if (!currentUserId) {
        throw new Error('User must be authenticated to add contacts');
      }

      // Check if contact already exists
      const existingContact = await this.getContactByUserId(contactData.userId);
      if (existingContact) {
        // Build update object, only including defined values
        const updateData: any = {
          name: contactData.name,
        };
        
        if (contactData.guild !== undefined && contactData.guild !== null) {
          updateData.guild = contactData.guild;
        }
        if (contactData.gid !== undefined && contactData.gid !== null) {
          updateData.gid = contactData.gid;
        }
        if (contactData.profileImage !== undefined && contactData.profileImage !== null && contactData.profileImage !== '') {
          updateData.profileImage = contactData.profileImage;
        }
        if (contactData.phoneNumber !== undefined && contactData.phoneNumber !== null && contactData.phoneNumber !== '') {
          updateData.phoneNumber = contactData.phoneNumber;
        }
        if (contactData.email !== undefined && contactData.email !== null && contactData.email !== '') {
          updateData.email = contactData.email;
        }
        if (contactData.note !== undefined && contactData.note !== null && contactData.note !== '') {
          updateData.note = contactData.note;
        }
        
        // Update existing contact
        await this.updateContact(existingContact.id, updateData);
        return existingContact;
      }

      // Create new contact
      const contactsRef = this.getContactsCollection(currentUserId);
      const contactDocRef = doc(contactsRef);
      
      // Build contact object, only including defined values (Firestore doesn't allow undefined)
      const newContact: any = {
        userId: contactData.userId,
        name: contactData.name,
        addedAt: serverTimestamp() as Timestamp,
      };
      
      // Only add optional fields if they are defined
      if (contactData.guild !== undefined && contactData.guild !== null) {
        newContact.guild = contactData.guild;
      }
      if (contactData.gid !== undefined && contactData.gid !== null) {
        newContact.gid = contactData.gid;
      }
      if (contactData.profileImage !== undefined && contactData.profileImage !== null && contactData.profileImage !== '') {
        newContact.profileImage = contactData.profileImage;
      }
      if (contactData.phoneNumber !== undefined && contactData.phoneNumber !== null && contactData.phoneNumber !== '') {
        newContact.phoneNumber = contactData.phoneNumber;
      }
      if (contactData.email !== undefined && contactData.email !== null && contactData.email !== '') {
        newContact.email = contactData.email;
      }
      if (contactData.note !== undefined && contactData.note !== null && contactData.note !== '') {
        newContact.note = contactData.note;
      }

      await setDoc(contactDocRef, newContact);

      logger.info('✅ Contact added:', { contactId: contactDocRef.id, userId: contactData.userId });

      return {
        id: contactDocRef.id,
        ...newContact,
        addedAt: newContact.addedAt || Timestamp.now(),
      };
    } catch (error) {
      logger.error('❌ Error adding contact:', error);
      throw error;
    }
  }

  /**
   * Get all contacts for current user
   */
  async getContacts(): Promise<Contact[]> {
    try {
      const currentUserId = this.getCurrentUserId();
      if (!currentUserId) {
        return [];
      }

      const contactsRef = this.getContactsCollection(currentUserId);
      const q = query(contactsRef, orderBy('addedAt', 'desc'));
      const snapshot = await getDocs(q);

      const contacts: Contact[] = [];
      snapshot.docs.forEach(docSnapshot => {
        const data = docSnapshot.data();
        contacts.push({
          id: docSnapshot.id,
          ...data,
          addedAt: data.addedAt || Timestamp.now(),
        } as Contact);
      });

      logger.debug(`✅ Retrieved ${contacts.length} contacts`);
      return contacts;
    } catch (error) {
      logger.error('❌ Error getting contacts:', error);
      return [];
    }
  }

  /**
   * Get a contact by their user ID
   */
  async getContactByUserId(contactUserId: string): Promise<Contact | null> {
    try {
      const currentUserId = this.getCurrentUserId();
      if (!currentUserId) {
        return null;
      }

      const contactsRef = this.getContactsCollection(currentUserId);
      const q = query(contactsRef, where('userId', '==', contactUserId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const docSnapshot = snapshot.docs[0];
      const data = docSnapshot.data();
      
      return {
        id: docSnapshot.id,
        ...data,
        addedAt: data.addedAt || Timestamp.now(),
      } as Contact;
    } catch (error) {
      logger.error('❌ Error getting contact by userId:', error);
      return null;
    }
  }

  /**
   * Get a contact by contact ID
   */
  async getContact(contactId: string): Promise<Contact | null> {
    try {
      const currentUserId = this.getCurrentUserId();
      if (!currentUserId) {
        return null;
      }

      const contactRef = doc(this.getContactsCollection(currentUserId), contactId);
      const docSnapshot = await getDoc(contactRef);

      if (!docSnapshot.exists()) {
        return null;
      }

      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        ...data,
        addedAt: data.addedAt || Timestamp.now(),
      } as Contact;
    } catch (error) {
      logger.error('❌ Error getting contact:', error);
      return null;
    }
  }

  /**
   * Update a contact
   */
  async updateContact(contactId: string, updates: Partial<Contact>): Promise<void> {
    try {
      const currentUserId = this.getCurrentUserId();
      if (!currentUserId) {
        throw new Error('User must be authenticated to update contacts');
      }

      const contactRef = doc(this.getContactsCollection(currentUserId), contactId);
      
      // Filter out undefined values (Firestore doesn't allow undefined)
      const cleanUpdates: any = {
        lastContactAt: serverTimestamp(),
      };
      
      // Only include defined values from updates
      Object.keys(updates).forEach(key => {
        const value = (updates as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          cleanUpdates[key] = value;
        }
      });
      
      await setDoc(contactRef, cleanUpdates, { merge: true });

      logger.info('✅ Contact updated:', contactId);
    } catch (error) {
      logger.error('❌ Error updating contact:', error);
      throw error;
    }
  }

  /**
   * Delete a contact
   */
  async deleteContact(contactId: string): Promise<void> {
    try {
      const currentUserId = this.getCurrentUserId();
      if (!currentUserId) {
        throw new Error('User must be authenticated to delete contacts');
      }

      const contactRef = doc(this.getContactsCollection(currentUserId), contactId);
      await deleteDoc(contactRef);

      logger.info('✅ Contact deleted:', contactId);
    } catch (error) {
      logger.error('❌ Error deleting contact:', error);
      throw error;
    }
  }

  /**
   * Check if a user is already in contacts
   */
  async isContact(userId: string): Promise<boolean> {
    const contact = await this.getContactByUserId(userId);
    return contact !== null;
  }
}

export const ContactsService = new ContactsServiceClass();
