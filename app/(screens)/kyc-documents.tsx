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
import { Ionicons, MaterialCommunityIcons, Feather, AntDesign } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import * as ImagePicker from 'expo-image-picker';

export default function KYCDocumentsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { theme, showToast } = useUIStore();
  
  const isDark = theme === 'dark';
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

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock existing documents from user data
    const mockDocs = user?.kycDocuments || [
      { id: '1', type: 'government_id', status: 'approved', fileUrl: null, submittedAt: '2024-01-15T10:30:00Z', reviewedAt: '2024-01-16T14:20:00Z' },
      { id: '2', type: 'selfie', status: 'approved', fileUrl: null, submittedAt: '2024-01-15T10:35:00Z', reviewedAt: '2024-01-16T14:20:00Z' },
      { id: '3', type: 'proof_of_address', status: 'pending', fileUrl: null, submittedAt: '2024-01-15T10:40:00Z', reviewedAt: null },
    ];
    
    setDocuments(mockDocs);
    setLoading(false);
  };

  const getDocumentStatus = (typeId: string) => {
    const doc = documents.find(d => d.type === typeId);
    return doc?.status || 'not_submitted';
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return { label: 'Approved', color: '#10B981', bg: '#10B98115', icon: 'check-circle-outline' };
      case 'pending':
        return { label: 'Under Review', color: '#F59E0B', bg: '#F59E0B15', icon: 'time-outline' };
      case 'rejected':
        return { label: 'Rejected', color: '#EF4444', bg: '#EF444415', icon: 'close-circle-outline' };
      default:
        return { label: 'Not Submitted', color: '#9CA3AF', bg: '#9CA3AF15', icon: 'circle-outline' };
    }
  };

  const pickImage = async (documentType: any, side?: 'front' | 'back') => {
    if (uploading) return;
    
    setUploading(documentType.id);
    
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant permission to access your photos.');
        setUploading(null);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // Simulate upload
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const newDoc = {
          id: Date.now().toString(),
          type: documentType.id,
          side,
          status: 'pending',
          fileUrl: result.assets[0].uri,
          submittedAt: new Date().toISOString(),
          reviewedAt: null,
        };

        setDocuments(prev => {
          const filtered = prev.filter(d => d.type !== documentType.id || (side && d.side !== side));
          return [...filtered, newDoc];
        });

        showToast(`${documentType.title} ${side ? side : ''} uploaded successfully`, 'success');
      }
    } catch (error) {
      showToast('Failed to upload document', 'error');
    } finally {
      setUploading(null);
    }
  };

  const takePhoto = async (documentType: any, side?: 'front' | 'back') => {
    if (uploading) return;
    
    setUploading(documentType.id);
    
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant permission to access your camera.');
        setUploading(null);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const newDoc = {
          id: Date.now().toString(),
          type: documentType.id,
          side,
          status: 'pending',
          fileUrl: result.assets[0].uri,
          submittedAt: new Date().toISOString(),
          reviewedAt: null,
        };

        setDocuments(prev => {
          const filtered = prev.filter(d => d.type !== documentType.id || (side && d.side !== side));
          return [...filtered, newDoc];
        });

        showToast(`${documentType.title} ${side ? side : ''} uploaded successfully`, 'success');
      }
    } catch (error) {
      showToast('Failed to take photo', 'error');
    } finally {
      setUploading(null);
    }
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
      <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
        <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>KYC Documents</Text>
            <View style={{ width: 44 }} />
          </View>
        </View>
        <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
          <Ionicons name="refresh" size={32} color="#4F46E5" />
          <Text style={[styles.loadingText, { color: isDark ? '#fff' : '#000' }]}>Loading documents...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>KYC Documents</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Indicator */}
        <View style={[styles.progressCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressTitle, { color: isDark ? '#fff' : '#000' }]}>Verification Progress</Text>
            <Text style={[styles.progressPercent, { color: '#4F46E5' }]}>{Math.round((documentTypes.filter(d => getDocumentStatus(d.id) !== 'not_submitted').length / documentTypes.length) * 100)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: '#4F46E5',
                  width: `${(documentTypes.filter(d => getDocumentStatus(d.id) !== 'not_submitted').length / documentTypes.length) * 100}%`
                }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, { color: isDark ? '#888' : '#666' }]}>
            {documentTypes.filter(d => getDocumentStatus(d.id) !== 'not_submitted').length} of {documentTypes.length} documents submitted
          </Text>
        </View>

        {/* Document List */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }, { marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Required Documents</Text>
          {documentTypes.map((docType) => {
            const status = getDocumentStatus(docType.id);
            const statusConfig = getStatusConfig(status);
            const existingDoc = documents.find(d => d.type === docType.id && (!docType.id === 'government_id' || !d.side || d.side === 'front'));
            const backDoc = docType.id === 'government_id' ? documents.find(d => d.type === docType.id && d.side === 'back') : null;

            return (
              <View key={docType.id} style={styles.documentCard}>
                <View style={styles.documentHeader}>
                  <View style={[styles.documentIcon, { backgroundColor: '#4F46E515' }]}>
                    <Ionicons name={docType.icon} size={24} color="#4F46E5" />
                  </View>
                  <View style={styles.documentInfo}>
                    <View style={styles.documentTitleRow}>
                      <Text style={[styles.documentTitle, { color: isDark ? '#fff' : '#000' }]}>{docType.title}</Text>
                      {docType.required && <Text style={styles.requiredBadge}>Required</Text>}
                    </View>
                    <Text style={[styles.documentSubtitle, { color: isDark ? '#888' : '#666' }]}>{docType.subtitle}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                    <Ionicons name={statusConfig.icon} size={16} color={statusConfig.color} style={{ marginRight: 4 }} />
                    <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
                  </View>
                </View>

                <Text style={[styles.documentDesc, { color: isDark ? '#888' : '#666' }]}>{docType.description}</Text>

                {/* Upload Buttons */}
                <View style={styles.uploadButtons}>
                  {docType.id === 'government_id' ? (
                    <>
                      <TouchableOpacity 
                        style={[styles.uploadButton, uploading === docType.id + '_front' && styles.uploadButtonLoading]}
                        onPress={() => showUploadOptions(docType, 'front')}
                        disabled={uploading !== null}
                      >
                        <Ionicons name={existingDoc && existingDoc.side === 'front' ? 'image-outline' : 'camera-outline'} size={20} color="#4F46E5" style={{ marginRight: 8 }} />
                        <Text style={styles.uploadButtonText}>Front Side</Text>
                        {existingDoc && existingDoc.side === 'front' && (
                          <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.uploadButton, uploading === docType.id + '_back' && styles.uploadButtonLoading, { borderColor: '#4F46E5' }]}
                        onPress={() => showUploadOptions(docType, 'back')}
                        disabled={uploading !== null}
                      >
                        <Ionicons name={backDoc ? 'image-outline' : 'camera-outline'} size={20} color="#4F46E5" style={{ marginRight: 8 }} />
                        <Text style={styles.uploadButtonText}>Back Side</Text>
                        {backDoc && (
                          <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
                        )}
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.uploadButton, uploading === docType.id && styles.uploadButtonLoading, { flex: 1 }]}
                      onPress={() => showUploadOptions(docType)}
                      disabled={uploading !== null}
                    >
                      <Ionicons name={existingDoc ? 'image-outline' : 'camera-outline'} size={20} color="#4F46E5" style={{ marginRight: 8 }} />
                      <Text style={styles.uploadButtonText}>{existingDoc ? 'Replace' : 'Upload'}</Text>
                      {existingDoc && (
                        <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {/* Uploaded Documents */}
                {(existingDoc || backDoc) && (
                  <View style={styles.uploadedDocs}>
                    {existingDoc && (
                      <TouchableOpacity style={styles.uploadedDoc} onPress={() => viewDocument(existingDoc)}>
                        <View style={[styles.uploadedDocIcon, { backgroundColor: getStatusConfig(existingDoc.status).bg }]}>
                          <Ionicons name={getStatusConfig(existingDoc.status).icon} size={20} color={getStatusConfig(existingDoc.status).color} />
                        </View>
                        <View style={styles.uploadedDocInfo}>
                          <Text style={[styles.uploadedDocName, { color: isDark ? '#fff' : '#000' }]}>{docType.title} - Front</Text>
                          <Text style={[styles.uploadedDocStatus, { color: getStatusConfig(existingDoc.status).color }]}>{getStatusConfig(existingDoc.status).label}</Text>
                        </View>
                        <TouchableOpacity onPress={() => removeDocument(existingDoc)}>
                          <Ionicons name="trash-outline" size={20} color="#EF4444" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    )}
                    {backDoc && (
                      <TouchableOpacity style={styles.uploadedDoc} onPress={() => viewDocument(backDoc)}>
                        <View style={[styles.uploadedDocIcon, { backgroundColor: getStatusConfig(backDoc.status).bg }]}>
                          <Ionicons name={getStatusConfig(backDoc.status).icon} size={20} color={getStatusConfig(backDoc.status).color} />
                        </View>
                        <View style={styles.uploadedDocInfo}>
                          <Text style={[styles.uploadedDocName, { color: isDark ? '#fff' : '#000' }]}>{docType.title} - Back</Text>
                          <Text style={[styles.uploadedDocStatus, { color: getStatusConfig(backDoc.status).color }]}>{getStatusConfig(backDoc.status).label}</Text>
                        </View>
                        <TouchableOpacity onPress={() => removeDocument(backDoc)}>
                          <Ionicons name="trash-outline" size={20} color="#EF4444" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Guidelines */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }, { marginTop: 16, marginBottom: 40 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Guidelines</Text>
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
                <Text style={[styles.guidelineText, { color: isDark ? '#ddd' : '#444' }]}>{guideline}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, fontFamily: 'Inter_400Regular', marginTop: 12 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  progressCard: { borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#eee', marginBottom: 16 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  progressTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  progressPercent: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  progressBar: { height: 8, borderRadius: 4, backgroundColor: '#E5E7EB', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 8 },
  section: { borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#eee' },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 16 },
  documentCard: { marginBottom: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  documentHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  documentIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  documentInfo: { flex: 1 },
  documentTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  documentTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  requiredBadge: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: '#EF4444', backgroundColor: '#EF444415', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  documentSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  documentDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18, marginBottom: 12 },
  uploadButtons: { flexDirection: 'row', gap: 10 },
  uploadButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#4F46E5', backgroundColor: '#4F46E515' },
  uploadButtonLoading: { opacity: 0.7 },
  uploadButtonText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#4F46E5' },
  uploadedDocs: { marginTop: 12, gap: 8 },
  uploadedDoc: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#eee' },
  uploadedDocIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  uploadedDocInfo: { flex: 1 },
  uploadedDocName: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  uploadedDocStatus: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  guidelinesList: { gap: 10 },
  guidelineItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  guidelineBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4F46E5', marginTop: 6, flexShrink: 0 },
  guidelineText: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18, flex: 1 },
});