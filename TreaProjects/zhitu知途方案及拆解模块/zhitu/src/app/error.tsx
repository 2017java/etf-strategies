'use client';

import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <AlertCircle size={48} strokeWidth={1.5} className="text-error-crimson mb-4" />
      <h2 className="font-serif text-heading-4 text-near-black mb-2">
        出错了
      </h2>
      <p className="text-olive-gray text-body-sm max-w-md mb-6">
        {error.message || '页面加载时发生错误，请重试。'}
      </p>
      <div className="flex gap-3">
        <button onClick={reset} className="btn-primary">
          重试
        </button>
        <a href="/" className="btn-secondary">
          返回首页
        </a>
      </div>
    </div>
  );
}
