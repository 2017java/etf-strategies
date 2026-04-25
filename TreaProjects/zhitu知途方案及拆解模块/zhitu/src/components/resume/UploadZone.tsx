'use client';

import { useCallback, useState } from 'react';
import { Upload, FileText, X, Loader2 } from 'lucide-react';

export interface UploadZoneProps {
  onUpload: (file: File) => void;
  isLoading: boolean;
}

type DragState = 'idle' | 'dragging' | 'uploading' | 'error';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const ACCEPTED_EXTENSIONS = ['.pdf', '.docx'];

export default function UploadZone({ onUpload, isLoading }: UploadZoneProps) {
  const [dragState, setDragState] = useState<DragState>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isValidType = ACCEPTED_TYPES.includes(file.type) ||
      ACCEPTED_EXTENSIONS.includes(extension);

    if (!isValidType) {
      return '不支持的文件格式，请上传 PDF 或 DOCX 文件';
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `文件大小超过限制（${MAX_FILE_SIZE / 1024 / 1024}MB），请上传更小的文件`;
    }

    return null;
  }, []);

  const handleFile = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setDragState('error');
      return;
    }

    setError(null);
    setSelectedFile(file);
    setDragState('uploading');
    onUpload(file);
  }, [validateFile, onUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) {
      setDragState('dragging');
    }
  }, [isLoading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragState('idle');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    } else {
      setDragState('idle');
    }
  }, [isLoading, handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleClick = useCallback(() => {
    if (!isLoading) {
      document.getElementById('resume-file-input')?.click();
    }
  }, [isLoading]);

  const clearFile = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setError(null);
    setDragState('idle');
  }, []);

  const getStateStyles = () => {
    switch (dragState) {
      case 'dragging':
        return 'border-terracotta bg-terracotta/5';
      case 'uploading':
        return 'border-olive/50 bg-olive/5';
      case 'error':
        return 'border-red-400 bg-red-50';
      default:
        return 'border-dashed border-olive/40 hover:border-terracotta hover:bg-terracotta/5';
    }
  };

  return (
    <div
      className={`
        relative rounded-xl transition-all duration-200 cursor-pointer
        ${getStateStyles()}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        id="resume-file-input"
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleInputChange}
        className="hidden"
        disabled={isLoading}
      />

      <div className="p-8 flex flex-col items-center gap-4">
        {isLoading || dragState === 'uploading' ? (
          <>
            <div className="w-16 h-16 rounded-full bg-olive/10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-olive animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-body font-medium text-near-black">正在分析简历...</p>
              <p className="text-small text-olive-gray mt-1">请稍候</p>
            </div>
          </>
        ) : selectedFile ? (
          <>
            <div className="w-16 h-16 rounded-full bg-terracotta/10 flex items-center justify-center">
              <FileText className="w-8 h-8 text-terracotta" />
            </div>
            <div className="text-center">
              <p className="text-body font-medium text-near-black">{selectedFile.name}</p>
              <p className="text-small text-olive-gray mt-1">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              onClick={clearFile}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-olive/10 transition-colors"
            >
              <X className="w-5 h-5 text-olive-gray" />
            </button>
          </>
        ) : (
          <>
            <div className={`
              w-16 h-16 rounded-full transition-colors
              ${dragState === 'dragging' ? 'bg-terracotta/20' : 'bg-olive/10'}
              flex items-center justify-center
            `}>
              <Upload className={`
                w-8 h-8 transition-colors
                ${dragState === 'dragging' ? 'text-terracotta' : 'text-olive'}
              `} />
            </div>
            <div className="text-center">
              <p className="text-body font-medium text-near-black">
                {dragState === 'dragging' ? '松开以上传' : '拖拽简历或点击上传'}
              </p>
              <p className="text-small text-olive-gray mt-1">
                支持 PDF、DOCX 格式，最大 5MB
              </p>
            </div>
          </>
        )}

        {error && (
          <div className="mt-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-small text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}