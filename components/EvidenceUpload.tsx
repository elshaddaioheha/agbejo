'use client';

import { useState } from 'react';
import { Upload, FileText, X, Loader2, CheckCircle } from 'lucide-react';

interface EvidenceUploadProps {
  dealId: string;
  onUploaded?: (hash: string) => void;
}

export const EvidenceUpload = ({ dealId, onUploaded }: EvidenceUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [evidenceHash, setEvidenceHash] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
      setError('');
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess(false);

    try {
      // Step 1: Upload to IPFS/Arweave
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/ipfs/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }

      const uploadData = await uploadResponse.json();
      const hash = uploadData.hash;

      if (!hash) {
        throw new Error('No hash returned from upload');
      }

      // Step 2: Submit evidence hash to contract
      const evidenceResponse = await fetch('/api/deals/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId,
          evidenceHash: hash,
        }),
      });

      if (!evidenceResponse.ok) {
        const errorData = await evidenceResponse.json();
        throw new Error(errorData.error || 'Failed to submit evidence');
      }

      setEvidenceHash(hash);
      setSuccess(true);
      setFile(null);
      
      if (onUploaded) {
        onUploaded(hash);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload evidence');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-3">
        <FileText size={16} className="text-gray-600 dark:text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Submit Evidence</h3>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-3 p-2 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded text-xs text-emerald-700 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle size={14} />
            <span>Evidence submitted successfully!</span>
          </div>
          {evidenceHash && (
            <p className="mt-1 font-mono text-xs break-all">
              Hash: {evidenceHash}
            </p>
          )}
        </div>
      )}

      {!success && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select File (PDF, Images, Documents - Max 10MB)
            </label>
            <div className="flex items-center gap-2">
              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.txt"
                  className="hidden"
                  disabled={uploading}
                />
                <div className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2">
                  <Upload size={16} />
                  {file ? file.name : 'Choose File'}
                </div>
              </label>
              {file && (
                <button
                  onClick={() => {
                    setFile(null);
                    setError('');
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                  disabled={uploading}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {file && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={16} />
                Upload & Submit Evidence
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

