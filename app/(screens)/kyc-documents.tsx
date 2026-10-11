/**
 * KYC Documents Screen - Upload and manage KYC documents
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { apiGet, apiPost } from '@/services/api';
import { uploadToCloudinary } from '@/services/upload';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { ScreenHeader } from '@/components/ui';

// Mint new document ids outside the component so render stays pure
const mintDocId = (): string => `doc_${Date.now()}`;


export default function KYCDocumentsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { showToast } = useUIStore();

  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  const documentTypes = [
    {
      id: 'government_id',
      title: 'Government ID',
      subtitle: 'Passport, Driver\'s License, or National ID',
      icon: 'card-outline',
      required: true,
      acceptedTypes: ['passport', 'drivers_license', 'national_id'],
      description: 'Clear photo of the front and back of your government-issued ID',
    },
    {
      id: 'selfie',
      title: 'Selfie Verification',
      subtitle: 'Live photo for facial verification',
      icon: 'camera-outline',
      required: true,
      acceptedTypes: ['selfie'],
      description: 'Take a clear selfie holding your ID next to your face',
    },
    {
      id: 'proof_of_address',
      title: 'Proof of Address',
      subtitle: 'Utility bill, bank statement, or lease agreement',
      icon: 'location-outline',
      required: false,
      acceptedTypes: ['utility_bill', 'bank_statement', 'lease_agreement'],
      description: 'Document must be less than 3 months old and show your name and address',
    },
  ];

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await apiGet<{ kyc: any; documents: any[] }>('/users/me/kyc');
      // Backend returns per-type verification rows with documentUrls
      const verifs: any[] = (res as any)?.documents || [];
      const mapped = verifs.map((v: any) => {
        const uiType = v.type === 'government_id' ? 'government_id' : v.type === 'selfie' ? 'selfie' : 'proof_of_address';
        const front = v.documentUrls?.front;
        const back = v.documentUrls?.back;
        const selfie = v.documentUrls?.selfie;
        const out: any[] = [];
        if (uiType === 'government_id') {
          out.push({ id: v.id + '_front', type: uiType, side: 'front', status: v.status || 'pending', fileUrl: front, submittedAt: v.createdAt, reviewedAt: v.updatedAt });
          if (back) out.push({ id: v.id + '_back', type: uiType, side: 'back', status: v.status || 'pending', fileUrl: back, submittedAt: v.createdAt, reviewedAt: v.updatedAt });
        } else if (uiType === 'selfie') {
          out.push({ id: v.id, type: 'selfie', status: v.status || 'pending', fileUrl: selfie || front, submittedAt: v.createdAt, reviewedAt: v.updatedAt });
        } else {
          out.push({ id: v.id, type: 'proof_of_address', status: v.status || 'pending', fileUrl: front, submittedAt: v.createdAt, reviewedAt: v.updatedAt });
        }
        return out;
      }).flat();
      setDocuments(mapped);
    } catch (e) {
      console.warn('[KYC Docs] load failed:', e);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Defer data loading past first commit so no sync setState happens in the effect body
    void Promise.resolve().then(loadDocuments);
  }, []);


  const getDocumentStatus = (typeId: string) => {
    const doc = documents.find(d => d.type === typeId);
    return doc?.status || 'not_submitted';
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return { label: 'Approved', color: Colors.semantic.success, bg: Colors.semantic.successSoft, icon: 'checkmark-circle' };
      case 'pending':
        return { label: 'Under Review', color: Colors.semantic.warning, bg: Colors.semantic.warningSoft, icon: 'time' };
      case 'rejected':
        return { label: 'Rejected', color: Colors.semantic.error, bg: Colors.semantic.errorSoft, icon: 'close-circle' };
      default:
        return { label: 'Not Submitted', color: Colors.text.muted, bg: Colors.surface.tertiary, icon: 'ellipse-outline' };
    }
  };

  const pickImage = async (documentType: any, side?: 'front' | 'back') => {
    if (uploading) return;
    
    setUploading(`${documentType.id}${side ? '_' + side : ''}`);
    
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant permission to access your photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) return;
      await actuallyUpload(documentType, result.assets[0].uri, side);
    } catch (error: any) {
      showToast(error?.message || 'Failed to upload document', 'error');
    } finally {
      setUploading(null);
    }
  };

  const takePhoto = async (documentType: any, side?: 'front' | 'back') => {
    if (uploading) return;
    
    setUploading(`${documentType.id}${side ? '_' + side : ''}`);
    
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant permission to access your camera.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) return;
      await actuallyUpload(documentType, result.assets[0].uri, side);
    } catch (error: any) {
      showToast(error?.message || 'Failed to take photo', 'error');
    } finally {
      setUploading(null);
    }
  };

  /** Cloudinary upload → backend persistence (Firestore). Returns on success. */
  const actuallyUpload = async (documentType: any, fileUri: string, side?: 'front' | 'back') => {
    showToast('Uploading…', 'info');
    const cloud = await uploadToCloudinary(fileUri, { folder: `kyc/${user?.id || 'unknown'}` });

    const docType = documentType.id as string; // 'government_id' | 'selfie' | 'proof_of_address'
    const backendType = docType === 'government_id' ? 'government_id' : docType === 'selfie' ? 'selfie' : 'address_proof';

    const payload: any = { type: backendType, documentUrls: {} as any };
    const existingFront = documents.find((d: any) => d.type === 'government_id' && d.side === 'front');
    if (side === 'back') {
      payload.documentUrls.back = cloud.secureUrl;
      payload.documentUrls.front = existingFront?.fileUrl || cloud.secureUrl; // schema requires a front URL
    } else if (backendType === 'selfie') {
      payload.documentUrls.selfie = cloud.secureUrl;
      payload.documentUrls.front = cloud.secureUrl; // schema requires front url
    } else {
      payload.documentUrls.front = cloud.secureUrl;
      const existingBack = documents.find((d: any) => d.type === 'government_id' && d.side === 'back');
      if (existingBack?.fileUrl) payload.documentUrls.back = existingBack.fileUrl;
    }

    await apiPost('/users/me/kyc', payload);

    const newDoc = {
      id: mintDocId(),
      type: documentType.id,
      side,
      status: 'pending',
      fileUrl: cloud.secureUrl,
      cloudinaryPublicId: cloud.publicId,
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
    };
    setDocuments((prev: any[]) => {
      const filtered = prev.filter((d: any) => d.type !== documentType.id || (side && d.side !== side));
      return [...filtered, newDoc];
    });
    showToast(`${documentType.title}${side ? ' ' + side : ''} submitted for review`, 'success');
    loadDocuments();
  };

  const showUploadOptions = (documentType: any) => {
    const needsBothSides = documentType.id === 'government_id';
    
    if (needsBothSides) {
      Alert.alert(
        'Upload Government ID',
        'Which side would you like to upload?',
        [
          { text: 'Front', onPress: () => showSourceOptions(documentType, 'front') },
          { text: 'Back', onPress: () => showSourceOptions(documentType, 'back') },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else {
      showSourceOptions(documentType);
    }
  };

  const showSourceOptions = (documentType: any, side?: 'front' | 'back') => {
    Alert.alert(
      `Upload ${documentType.title}${side ? ` - ${side}` : ''}`,
      'Choose how to upload',
      [
        { text: 'Take Photo', onPress: () => takePhoto(documentType, side) },
        { text: 'Choose from Gallery', onPress: () => pickImage(documentType, side) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const viewDocument = (doc: any) => {
    if (doc.fileUrl) {
      // In a real app, open full-screen image viewer
      showToast('Opening document preview', 'info');
    }
  };

  const removeDocument = (doc: any) => {
    Alert.alert(
      'Remove Document',
      'Are you sure you want to remove this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => {
          setDocuments(prev => prev.filter(d => d.id !== doc.id));
          showToast('Document removed', 'success');
        }},
      ]
    );
  };

  const allRequiredSubmitted = documentTypes
    .filter(d => d.required)
    .every(d => getDocumentStatus(d.id) !== 'not_submitted');

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <ScreenHeader title="KYC Documents" subtitle="Identity verification" onBack={() => router.back()} />
        </View>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBadge}>
            <Ionicons name="document" size={28} color={Colors.brand.accent} />
          </View>
          <Text style={styles.loadingText}>Loading documents...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <ScreenHeader title="KYC Documents" subtitle="Upload identity proofs for verification" onBack={() => router.back()} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Indicator */}
        <MotiView from={{ opacity: 0, translateY: 14 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400 }} style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressEyebrow}>VERIFICATION</Text>
              <Text style={styles.progressTitle}>Documents progress</Text>
            </View>
            <View style={styles.progressBadge}>
              <Text style={styles.progressPercent}>{Math.round((documentTypes.filter(d => getDocumentStatus(d.id) !== 'not_submitted').length / documentTypes.length) * 100)}%</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <MotiView
              from={{ width: '0%' }}
              animate={{ width: `${(documentTypes.filter(d => getDocumentStatus(d.id) !== 'not_submitted').length / documentTypes.length) * 100}%` }}
              transition={{ type: 'timing', duration: 700, delay: 250 }}
              style={styles.progressFill}
            />
          </View>
          <Text style={styles.progressText}>
            {documentTypes.filter(d => getDocumentStatus(d.id) !== 'not_submitted').length} of {documentTypes.length} document types submitted
          </Text>
        </MotiView>

        {/* Document List */}
        <View style={[styles.section, { marginTop: Spacing[4] }]}>
          <Text style={styles.sectionTitle}>Required documents</Text>
          {documentTypes.map((docType) => {
            const status = getDocumentStatus(docType.id);
            const statusConfig = getStatusConfig(status);
            const existingDoc = documents.find(d => d.type === docType.id && (docType.id !== 'government_id' || !d.side || d.side === 'front'));
            const backDoc = docType.id === 'government_id' ? documents.find(d => d.type === docType.id && d.side === 'back') : null;

            return (
              <MotiView
                key={docType.id}
                from={{ opacity: 0, translateY: 12 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 360 }}
                style={styles.documentCard}
              >
                <View style={styles.documentHeader}>
                  <View style={styles.documentIcon}>
                    <Ionicons name={docType.icon as any} size={20} color={Colors.brand.accent} />
                  </View>
                  <View style={styles.documentInfo}>
                    <View style={styles.documentTitleRow}>
                      <Text style={styles.documentTitle}>{docType.title}</Text>
                      {docType.required ? <Text style={styles.requiredBadge}>Required</Text> : null}
                    </View>
                    <Text style={styles.documentSubtitle}>{docType.subtitle}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                    <Ionicons name={statusConfig.icon as any} size={13} color={statusConfig.color} style={{ marginRight: 4 }} />
                    <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
                  </View>
                </View>

                <Text style={styles.documentDesc}>{docType.description}</Text>

                {/* Upload Buttons */}
                <View style={styles.uploadButtons}>
                  {docType.id === 'government_id' ? (
                    <>
                      <TouchableOpacity
                        style={[styles.uploadButton, uploading === docType.id + '_front' && styles.uploadButtonLoading]}
                        onPress={() => showUploadOptions(docType)}
                        disabled={uploading !== null}
                      >
                        <Ionicons name={existingDoc && existingDoc.side === 'front' ? 'image' : 'camera'} size={17} color={Colors.brand.accent} style={{ marginRight: 7 }} />
                        <Text style={styles.uploadButtonText}>Front Side</Text>
                        {existingDoc && existingDoc.side === 'front' ? (
                          <Ionicons name="checkmark-circle" size={17} color={Colors.semantic.success} />
                        ) : null}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.uploadButton, uploading === docType.id + '_back' && styles.uploadButtonLoading]}
                        onPress={() => showUploadOptions(docType)}
                        disabled={uploading !== null}
                      >
                        <Ionicons name={backDoc ? 'image' : 'camera'} size={17} color={Colors.brand.accent} style={{ marginRight: 7 }} />
                        <Text style={styles.uploadButtonText}>Back Side</Text>
                        {backDoc ? (
                          <Ionicons name="checkmark-circle" size={17} color={Colors.semantic.success} />
                        ) : null}
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={[styles.uploadButton, uploading === docType.id && styles.uploadButtonLoading, { flex: 1 }]}
                      onPress={() => showUploadOptions(docType)}
                      disabled={uploading !== null}
                    >
                      <Ionicons name={existingDoc ? 'image' : 'camera'} size={17} color={Colors.brand.accent} style={{ marginRight: 7 }} />
                      <Text style={styles.uploadButtonText}>{existingDoc ? 'Replace' : 'Upload'}</Text>
                      {existingDoc ? (
                        <Ionicons name="checkmark-circle" size={17} color={Colors.semantic.success} />
                      ) : null}
                    </TouchableOpacity>
                  )}
                </View>

                {/* Uploaded Documents */}
                {(existingDoc || backDoc) ? (
                  <View style={styles.uploadedDocs}>
                    {existingDoc ? (
                      <View style={styles.uploadedDoc} onTouchEnd={() => viewDocument(existingDoc)}>
                        <View style={[styles.uploadedDocIcon, { backgroundColor: getStatusConfig(existingDoc.status).bg }]}>
                          <Ionicons name={getStatusConfig(existingDoc.status).icon as any} size={17} color={getStatusConfig(existingDoc.status).color} />
                        </View>
                        <View style={styles.uploadedDocInfo}>
                          <Text style={styles.uploadedDocName}>{docType.title} - Front</Text>
                          <Text style={[styles.uploadedDocStatus, { color: getStatusConfig(existingDoc.status).color }]}>{getStatusConfig(existingDoc.status).label}</Text>
                        </View>
                        <TouchableOpacity onPress={() => removeDocument(existingDoc)} style={styles.docDeleteBtn} hitSlop={8}>
                          <Ionicons name="trash" size={16} color={Colors.semantic.error} />
                        </TouchableOpacity>
                      </View>
                    ) : null}
                    {backDoc ? (
                      <View style={styles.uploadedDoc} onTouchEnd={() => viewDocument(backDoc)}>
                        <View style={[styles.uploadedDocIcon, { backgroundColor: getStatusConfig(backDoc.status).bg }]}>
                          <Ionicons name={getStatusConfig(backDoc.status).icon as any} size={17} color={getStatusConfig(backDoc.status).color} />
                        </View>
                        <View style={styles.uploadedDocInfo}>
                          <Text style={styles.uploadedDocName}>{docType.title} - Back</Text>
                          <Text style={[styles.uploadedDocStatus, { color: getStatusConfig(backDoc.status).color }]}>{getStatusConfig(backDoc.status).label}</Text>
                        </View>
                        <TouchableOpacity onPress={() => removeDocument(backDoc)} style={styles.docDeleteBtn} hitSlop={8}>
                          <Ionicons name="trash" size={16} color={Colors.semantic.error} />
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </MotiView>
            );
          })}
        </View>

        {/* Guidelines */}
        <MotiView from={{ opacity: 0, translateY: 14 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400, delay: 180 }} style={[styles.section, { marginTop: Spacing[4], marginBottom: 40 }]}>
          <Text style={styles.sectionTitle}>Guidelines</Text>
          <View style={styles.guidelinesList}>
            {[
              'All documents must be clear, legible, and in color',
              'Government ID must show all four corners',
              'Selfie must be well-lit with your face clearly visible',
              'Proof of address must be less than 3 months old',
              'File size must be less than 10MB per document',
              'Accepted formats: JPG, PNG, PDF',
            ].map((guideline, index) => (
              <View key={index} style={styles.guidelineItem}>
                <View style={styles.guidelineBullet} />
                <Text style={styles.guidelineText}>{guideline}</Text>
              </View>
            ))}
          </View>
        </MotiView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  headerBar: { paddingHorizontal: Spacing[5], paddingTop: Spacing[5], paddingBottom: Spacing[3] },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing[4] },
  loadingBadge: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', ...Shadows.card,
  },
  loadingText: { fontSize: 14, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary },
  scrollContent: { paddingHorizontal: Spacing[5], paddingBottom: 40 },
  progressCard: {
    borderRadius: BorderRadius.lg, padding: Spacing[5],
    backgroundColor: Colors.brand.primary, ...Shadows.button,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[3] },
  progressEyebrow: { fontSize: 10, fontFamily: Typography.fontFamily.bold, letterSpacing: 1.6, color: 'rgba(255,255,255,0.6)', marginBottom: 3 },
  progressTitle: { fontSize: 18, fontFamily: Typography.fontFamily.display, color: '#FFFFFF' },
  progressBadge: {
    minWidth: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10,
  },
  progressPercent: { fontSize: 17, fontFamily: Typography.fontFamily.bold, color: Colors.brand.accent },
  progressBar: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.16)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: Colors.brand.accent },
  progressText: { fontSize: 11.5, fontFamily: Typography.fontFamily.body, color: 'rgba(255,255,255,0.72)', marginTop: Spacing[2] },
  section: {
    borderRadius: BorderRadius.lg, padding: Spacing[5],
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light,
    ...Shadows.card,
  },
  sectionTitle: { fontSize: 18, fontFamily: Typography.fontFamily.display, color: Colors.text.primary, marginBottom: Spacing[4] },
  documentCard: {
    marginBottom: Spacing[4], padding: Spacing[4], borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border.light, backgroundColor: Colors.surface.primary,
  },
  documentHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], marginBottom: Spacing[2] },
  documentIcon: {
    width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.brand.accentSoft,
  },
  documentInfo: { flex: 1 },
  documentTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  documentTitle: { fontSize: 14.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  requiredBadge: {
    fontSize: 9, fontFamily: Typography.fontFamily.bold, color: Colors.semantic.error,
    backgroundColor: Colors.semantic.errorSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.pill,
    textTransform: 'uppercase', letterSpacing: 0.4,
  },
  documentSubtitle: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[2] + 1, paddingVertical: 4, borderRadius: BorderRadius.pill, flexShrink: 0 },
  statusBadgeText: { fontSize: 10.5, fontFamily: Typography.fontFamily.bold },
  documentDesc: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.muted, lineHeight: 17, marginBottom: Spacing[3] },
  uploadButtons: { flexDirection: 'row', gap: Spacing[2] },
  uploadButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: Spacing[3], borderRadius: BorderRadius.pill,
    borderWidth: 1.5, borderColor: Colors.brand.accent, backgroundColor: Colors.brand.accentSoft,
  },
  uploadButtonLoading: { opacity: 0.6 },
  uploadButtonText: { fontSize: 13, fontFamily: Typography.fontFamily.semiBold, color: Colors.brand.accentPressed },
  uploadedDocs: { marginTop: Spacing[3], gap: Spacing[2] },
  uploadedDoc: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3], padding: Spacing[3],
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border.light,
    backgroundColor: Colors.surface.elevated,
  },
  uploadedDocIcon: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  uploadedDocInfo: { flex: 1 },
  uploadedDocName: { fontSize: 13, fontFamily: Typography.fontFamily.medium, color: Colors.text.primary },
  uploadedDocStatus: { fontSize: 11.5, fontFamily: Typography.fontFamily.medium, marginTop: 1 },
  docDeleteBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.semantic.errorSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  guidelinesList: { gap: Spacing[3] },
  guidelineItem: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[2] + 2 },
  guidelineBullet: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.brand.accent, marginTop: 5, flexShrink: 0 },
  guidelineText: { fontSize: 12.5, fontFamily: Typography.fontFamily.body, lineHeight: 19, color: Colors.text.secondary, flex: 1 },
});