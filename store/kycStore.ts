/**
 * KYC Store - Zustand
 * KYC document submission, verification status, and document management
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage } from '@/services/storage';
import { 
  KYCDocument, 
  KYCStatus, 
  DocumentType,
  KYCSubmission 
} from '@/types';

interface KYCState {
  // KYC Status
  kycStatus: KYCStatus;
  kycSubmission: KYCSubmission | null;
  
  // Documents
  documents: KYCDocument[];
  pendingDocuments: KYCDocument[];
  rejectedDocuments: KYCDocument[];
  
  // Current submission
  currentSubmission: {
    documentType: DocumentType | null;
    fileUri: string | null;
    fileName: string | null;
    fileSize: number | null;
    mimeType: string | null;
    isUploading: boolean;
    uploadProgress: number;
  };
  
  // Verification
  verificationLevel: 'none' | 'basic' | 'full' | 'premium';
  isVerified: boolean;
  verificationScore: number; // 0-100
  
  // Loading/Error
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  
  // Actions
  // Status
  setKYCStatus: (status: KYCStatus) => void;
  setKYCSubmission: (submission: KYCSubmission | null) => void;
  setVerificationLevel: (level: KYCState['verificationLevel']) => void;
  setIsVerified: (verified: boolean) => void;
  setVerificationScore: (score: number) => void;
  
  // Documents
  setDocuments: (documents: KYCDocument[]) => void;
  addDocument: (document: KYCDocument) => void;
  updateDocument: (id: string, updates: Partial<KYCDocument>) => void;
  removeDocument: (id: string) => void;
  setPendingDocuments: (documents: KYCDocument[]) => void;
  setRejectedDocuments: (documents: KYCDocument[]) => void;
  
  // Current submission
  setCurrentSubmission: (submission: Partial<KYCState['currentSubmission']>) => void;
  clearCurrentSubmission: () => void;
  setUploadProgress: (progress: number) => void;
  
  // Loading/Error
  setLoading: (loading: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed
  getDocumentByType: (type: DocumentType) => KYCDocument | undefined;
  getPendingDocumentByType: (type: DocumentType) => KYCDocument | undefined;
  getRejectedDocumentByType: (type: DocumentType) => KYCDocument | undefined;
  isDocumentSubmitted: (type: DocumentType) => boolean;
  isDocumentApproved: (type: DocumentType) => boolean;
  isDocumentRejected: (type: DocumentType) => boolean;
  isDocumentPending: (type: DocumentType) => boolean;
  getRequiredDocuments: () => DocumentType[];
  getMissingDocuments: () => DocumentType[];
  getCompletionPercentage: () => number;
  canSubmitForVerification: () => boolean;
  clearAll: () => void;
}

const defaultKYCStatus: KYCStatus = {
  status: 'not_started',
  submittedAt: null,
  reviewedAt: null,
  rejectionReason: null,
  documents: [],
};

const defaultCurrentSubmission = {
  documentType: null as DocumentType | null,
  fileUri: null as string | null,
  fileName: null as string | null,
  fileSize: null as number | null,
  mimeType: null as string | null,
  isUploading: false,
  uploadProgress: 0,
};

const requiredDocuments: DocumentType[] = [
  'aadhaar_front',
  'aadhaar_back',
  'pan_card',
  'selfie',
  'address_proof',
];

export const useKYCStore = create<KYCState>()(
  persist(
    (set, get) => ({
      // Initial state
      kycStatus: defaultKYCStatus,
      kycSubmission: null,
      documents: [],
      pendingDocuments: [],
      rejectedDocuments: [],
      currentSubmission: defaultCurrentSubmission,
      verificationLevel: 'none',
      isVerified: false,
      verificationScore: 0,
      isLoading: false,
      isSubmitting: false,
      error: null,
      
      // Actions
      // Status
      setKYCStatus: (kycStatus) => set({ kycStatus, isLoading: false, error: null }),
      
      setKYCSubmission: (kycSubmission) => set({ kycSubmission }),
      
      setVerificationLevel: (verificationLevel) => set({ verificationLevel }),
      
      setIsVerified: (isVerified) => set({ isVerified }),
      
      setVerificationScore: (verificationScore) => set({ verificationScore }),
      
      // Documents
      setDocuments: (documents) => set({ 
        documents,
        pendingDocuments: documents.filter((d) => d.status === 'pending'),
        rejectedDocuments: documents.filter((d) => d.status === 'rejected'),
      }),
      
      addDocument: (document) => set((state) => ({
        documents: [...state.documents.filter((d) => d.id !== document.id), document],
        pendingDocuments: document.status === 'pending' 
          ? [...state.pendingDocuments.filter((d) => d.id !== document.id), document]
          : state.pendingDocuments,
        rejectedDocuments: document.status === 'rejected'
          ? [...state.rejectedDocuments.filter((d) => d.id !== document.id), document]
          : state.rejectedDocuments,
      })),
      
      updateDocument: (id, updates) => set((state) => {
        const updatedDoc = { ...state.documents.find((d) => d.id === id), ...updates } as KYCDocument;
        return {
          documents: state.documents.map((d) => d.id === id ? updatedDoc : d),
          pendingDocuments: state.pendingDocuments.map((d) => d.id === id ? updatedDoc : d),
          rejectedDocuments: state.rejectedDocuments.map((d) => d.id === id ? updatedDoc : d),
        };
      }),
      
      removeDocument: (id) => set((state) => ({
        documents: state.documents.filter((d) => d.id !== id),
        pendingDocuments: state.pendingDocuments.filter((d) => d.id !== id),
        rejectedDocuments: state.rejectedDocuments.filter((d) => d.id !== id),
      })),
      
      setPendingDocuments: (pendingDocuments) => set({ pendingDocuments }),
      
      setRejectedDocuments: (rejectedDocuments) => set({ rejectedDocuments }),
      
      // Current submission
      setCurrentSubmission: (submission) => set((state) => ({
        currentSubmission: { ...state.currentSubmission, ...submission },
      })),
      
      clearCurrentSubmission: () => set({ currentSubmission: defaultCurrentSubmission }),
      
      setUploadProgress: (uploadProgress) => set((state) => ({
        currentSubmission: { ...state.currentSubmission, uploadProgress },
      })),
      
      // Loading/Error
      setLoading: (isLoading) => set({ isLoading, error: isLoading ? null : get().error }),
      
      setSubmitting: (isSubmitting) => set({ isSubmitting, error: isSubmitting ? null : get().error }),
      
      setError: (error) => set({ error, isLoading: false, isSubmitting: false }),
      
      // Computed
      getDocumentByType: (type) => get().documents.find((d) => d.documentType === type && d.status === 'approved'),
      
      getPendingDocumentByType: (type) => get().pendingDocuments.find((d) => d.documentType === type),
      
      getRejectedDocumentByType: (type) => get().rejectedDocuments.find((d) => d.documentType === type),
      
      isDocumentSubmitted: (type) => 
        get().documents.some((d) => d.documentType === type && ['pending', 'approved'].includes(d.status)),
      
      isDocumentApproved: (type) => 
        get().documents.some((d) => d.documentType === type && d.status === 'approved'),
      
      isDocumentRejected: (type) => 
        get().documents.some((d) => d.documentType === type && d.status === 'rejected'),
      
      isDocumentPending: (type) => 
        get().documents.some((d) => d.documentType === type && d.status === 'pending'),
      
      getRequiredDocuments: () => requiredDocuments,
      
      getMissingDocuments: () => {
        const submittedTypes = get().documents
          .filter((d) => ['pending', 'approved'].includes(d.status))
          .map((d) => d.documentType);
        return requiredDocuments.filter((type) => !submittedTypes.includes(type));
      },
      
      getCompletionPercentage: () => {
        const submittedCount = get().documents.filter((d) => ['pending', 'approved'].includes(d.status)).length;
        return Math.round((submittedCount / requiredDocuments.length) * 100);
      },
      
      canSubmitForVerification: () => {
        const missing = get().getMissingDocuments();
        return missing.length === 0 && get().kycStatus.status !== 'pending' && get().kycStatus.status !== 'approved';
      },
      
      clearAll: () => set({
        kycStatus: defaultKYCStatus,
        kycSubmission: null,
        documents: [],
        pendingDocuments: [],
        rejectedDocuments: [],
        currentSubmission: defaultCurrentSubmission,
        verificationLevel: 'none',
        isVerified: false,
        verificationScore: 0,
        isLoading: false,
        isSubmitting: false,
        error: null,
      }),
    }),
    {
      name: 'kyc-storage',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        // Persist documents and status
        documents: state.documents,
        kycStatus: state.kycStatus,
        verificationLevel: state.verificationLevel,
        isVerified: state.isVerified,
        verificationScore: state.verificationScore,
      }),
    }
  )
);

// Selectors
export const selectKYCStatus = (state: KYCState) => state.kycStatus;
export const selectKYCSubmission = (state: KYCState) => state.kycSubmission;
export const selectKYCDocuments = (state: KYCState) => state.documents;
export const selectPendingDocuments = (state: KYCState) => state.pendingDocuments;
export const selectRejectedDocuments = (state: KYCState) => state.rejectedDocuments;
export const selectCurrentSubmission = (state: KYCState) => state.currentSubmission;
export const selectVerificationLevel = (state: KYCState) => state.verificationLevel;
export const selectIsVerified = (state: KYCState) => state.isVerified;
export const selectVerificationScore = (state: KYCState) => state.verificationScore;
export const selectKYCLoading = (state: KYCState) => state.isLoading;
export const selectKYCSubmitting = (state: KYCState) => state.isSubmitting;
export const selectKYCError = (state: KYCState) => state.error;

// Computed selectors
export const selectMissingDocuments = (state: KYCState) => state.getMissingDocuments();
export const selectCompletionPercentage = (state: KYCState) => state.getCompletionPercentage();
export const selectCanSubmitForVerification = (state: KYCState) => state.canSubmitForVerification();
export const selectRequiredDocuments = (state: KYCState) => state.getRequiredDocuments();