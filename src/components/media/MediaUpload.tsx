'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Check, AlertCircle, File, Loader } from 'lucide-react';
import { mediaService } from '../../lib/services/mediaService';
import { MediaFile } from '../../types/course';
import Button from '../ui/Button';

interface MediaUploadProps {
  contentType: 'video' | 'document' | 'audio' | 'presentation' | 'h5p' | 'image';
  lessonId?: string;
  courseId?: string;
  onUploadSuccess: (mediaFile: MediaFile) => void;
  onUploadError?: (error: string) => void;
  maxFileSize?: number;
  acceptedFormats?: string[];
  className?: string;
}

export default function MediaUpload({
  contentType,
  lessonId,
  courseId,
  onUploadSuccess,
  onUploadError,
  maxFileSize,
  acceptedFormats,
  className = '',
}: MediaUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<MediaFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSize = maxFileSize || mediaService.getMaxFileSize(contentType);
  const allowedTypes = acceptedFormats || mediaService.getAllowedFileTypes(contentType);

  const handleFileSelect = async (file: File) => {
    // Validation
    if (!mediaService.validateFileType(file, contentType)) {
      const errorMsg = `Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`;
      setError(errorMsg);
      onUploadError?.(errorMsg);
      return;
    }

    if (file.size > maxSize) {
      const errorMsg = `Fichier trop volumineux. Taille max: ${mediaService.formatFileSize(maxSize)}`;
      setError(errorMsg);
      onUploadError?.(errorMsg);
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const mediaFile = await mediaService.uploadFile(
        { file, contentType, lessonId, courseId },
        (progress) => setUploadProgress(progress)
      );

      setUploadedFile(mediaFile);
      onUploadSuccess(mediaFile);
    } catch (err: any) {
      const errorMsg = err.message || 'Erreur lors de l\'upload';
      setError(errorMsg);
      onUploadError?.(errorMsg);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    if (uploadedFile) {
      mediaService.deleteMediaFile(uploadedFile.id.toString()).catch(console.error);
    }
    setUploadedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={allowedTypes.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
        id={`media-upload-${contentType}`}
      />

      {!uploadedFile ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center transition-colors
            ${dragActive ? 'border-mdsc-blue-primary bg-blue-50' : 'border-gray-300'}
            ${isUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-mdsc-blue-primary'}
          `}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="space-y-4">
              <Loader className="h-8 w-8 text-mdsc-blue-primary animate-spin mx-auto" />
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Upload en cours...</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-mdsc-blue-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">{uploadProgress}%</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className="h-12 w-12 text-gray-400 mx-auto" />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Cliquez ou glissez-déposez pour uploader
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Types acceptés: {allowedTypes.join(', ')}
                </p>
                <p className="text-xs text-gray-500">
                  Taille max: {mediaService.formatFileSize(maxSize)}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Check className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">{uploadedFile.originalFilename}</p>
                <p className="text-xs text-gray-500">
                  {mediaService.formatFileSize(uploadedFile.fileSize)}
                </p>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
              aria-label="Supprimer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
