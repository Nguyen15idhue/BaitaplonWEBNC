import { useState } from "react";

// Ảnh an toàn: link die thì hiện khung chữ thay vì vỡ layout.
export function SafeImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-[#F1F5F9] text-sm text-[#64748B] ${className ?? ""}`}>
        Chưa có ảnh
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" className={className} onError={() => setFailed(true)} />;
}
