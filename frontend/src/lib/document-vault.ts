export interface TrackedDocument {
  id: string;
  roadmapId: string;
  stepId: string;
  requirementId?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  dataUrl?: string; // Base64 data URI for offline persistence and preview
  status?: 'attached_locally';
  notes?: string;
}

export interface RoadmapTrackingState {
  isTrackingActive: boolean;
  hasStartedTracking?: boolean;
  startedAt?: string;
  lastActiveAt?: string;
  documents: TrackedDocument[];
  stepNotes?: Record<string, string>;
}

const TRACKING_PREFIX = 'untangle_tracking_';

export function getStoredTrackingState(roadmapId: string): RoadmapTrackingState {
  if (typeof window === 'undefined') {
    return { isTrackingActive: false, documents: [] };
  }
  try {
    const raw = localStorage.getItem(`${TRACKING_PREFIX}${roadmapId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.isTrackingActive === 'boolean' && Array.isArray(parsed.documents)) {
        return {
          ...parsed,
          documents: parsed.documents.filter((doc: unknown) =>
            doc && typeof doc === 'object' && 'id' in doc && 'fileName' in doc &&
            typeof doc.id === 'string' && typeof doc.fileName === 'string'
          ),
        };
      }
    }
  } catch {
    // LocalStorage quota or access exception
  }
  return { isTrackingActive: false, documents: [] };
}

export function saveTrackingState(roadmapId: string, state: RoadmapTrackingState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${TRACKING_PREFIX}${roadmapId}`, JSON.stringify(state));
  } catch (err) {
    // If quota exceeded due to large base64, save without heavy dataUrl or warn
    console.warn('UntangleAI: Document vault storage quota reached. Metadata preserved.', err);
    const trimmedState: RoadmapTrackingState = {
      ...state,
      documents: state.documents.map((doc) => ({
        ...doc,
        // Trim large dataUrl if quota is an issue
        dataUrl: doc.dataUrl && doc.dataUrl.length > 500000 ? undefined : doc.dataUrl,
      })),
    };
    try {
      localStorage.setItem(`${TRACKING_PREFIX}${roadmapId}`, JSON.stringify(trimmedState));
    } catch {
      // Storage fully unavailable
    }
  }
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function downloadTrackedDocument(doc: TrackedDocument): void {
  if (!doc.dataUrl) return;
  const link = document.createElement('a');
  link.href = doc.dataUrl;
  link.download = doc.fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportDossierJSON(
  roadmapTitle: string,
  roadmapLocation: string,
  completedStepIds: string[],
  totalStepsCount: number,
  documents: TrackedDocument[]
): void {
  const exportPayload = {
    applicationTitle: roadmapTitle,
    jurisdiction: roadmapLocation,
    exportedAt: new Date().toISOString(),
    status: {
      stepsCompleted: completedStepIds.length,
      totalSteps: totalStepsCount,
      completionRate: `${Math.round((completedStepIds.length / totalStepsCount) * 100)}%`,
      documentsAttached: documents.length,
    },
    documentChecklist: documents.map((d) => ({
      name: d.fileName,
      size: formatFileSize(d.fileSize),
      uploadedOn: new Date(d.uploadedAt).toLocaleString('en-IN'),
      stepId: d.stepId,
    })),
  };

  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `UntangleAI-Dossier-${roadmapTitle.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
