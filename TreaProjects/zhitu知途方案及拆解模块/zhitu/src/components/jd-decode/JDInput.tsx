'use client';

import { useState } from 'react';
import { Clipboard, Upload, Search, Loader2, FileText } from 'lucide-react';

interface JDInputProps {
  onAnalyze: (text: string) => void;
  isLoading: boolean;
}

export function JDInput({ onAnalyze, isLoading }: JDInputProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [textInput, setTextInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const handleTextAnalyze = () => {
    if (textInput.trim() && !isLoading) {
      onAnalyze(textInput.trim());
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleImageAnalyze = () => {
    // Image OCR feature not implemented yet
    alert('图片上传功能即将上线');
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('text')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-generous text-sm font-medium transition-all ${
            activeTab === 'text'
              ? 'bg-ivory text-near-black border border-border-cream border-b-0'
              : 'text-stone-gray hover:text-charcoal-warm'
          }`}
        >
          <Clipboard size={16} />
          粘贴文本
        </button>
        <button
          onClick={() => setActiveTab('image')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-generous text-sm font-medium transition-all ${
            activeTab === 'image'
              ? 'bg-ivory text-near-black border border-border-cream border-b-0'
              : 'text-stone-gray hover:text-charcoal-warm'
          }`}
        >
          <Upload size={16} />
          上传截图
        </button>
      </div>

      {/* Content */}
      <div className="claude-card p-6">
        {activeTab === 'text' ? (
          <div className="space-y-4">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="粘贴或输入招聘JD内容..."
              className="w-full min-h-[200px] px-4 py-3 bg-parchment border border-border-warm rounded-generous text-body text-near-black placeholder-stone-gray resize-none focus:outline-none focus:ring-1 focus:ring-ring-warm focus:border-transparent"
              disabled={isLoading}
            />

            <div className="flex justify-between items-center text-caption text-stone-gray">
              <span>
                {textInput.length} 字符
                {textInput.length < 50 && textInput.length > 0 && (
                  <span className="text-warning ml-2">
                    (内容较短，可能影响分析质量)
                  </span>
                )}
              </span>
            </div>

            <button
              onClick={handleTextAnalyze}
              disabled={!textInput.trim() || isLoading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3 px-6 rounded-generous text-body font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  解读中...
                </>
              ) : (
                <>
                  <Search size={18} />
                  开始解读
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border-warm rounded-generous p-8 text-center">
              {selectedImage ? (
                <div className="space-y-4">
                  <div className="relative mx-auto w-32 h-32 bg-parchment rounded-generous overflow-hidden">
                    <img
                      src={URL.createObjectURL(selectedImage)}
                      alt="Selected"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-body text-charcoal-warm">
                    已选择: {selectedImage.name}
                  </div>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="text-sm text-error-crimson hover:underline"
                  >
                    重新选择
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <div className="space-y-3">
                    <div className="w-16 h-16 bg-parchment rounded-generous flex items-center justify-center mx-auto">
                      <Upload size={24} className="text-stone-gray" />
                    </div>
                    <div className="text-body text-stone-gray">
                      点击或拖拽图片到此处上传
                    </div>
                    <div className="text-caption text-stone-gray">
                      支持 JPG、PNG 格式，最大 5MB
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isLoading}
                  />
                </label>
              )}
            </div>

            <button
              onClick={handleImageAnalyze}
              disabled={!selectedImage || isLoading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3 px-6 rounded-generous text-body font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  解读中...
                </>
              ) : (
                <>
                  <Search size={18} />
                  开始解读
                </>
              )}
            </button>

            <div className="text-caption text-stone-gray text-center">
              图片上传功能即将上线，敬请期待
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
