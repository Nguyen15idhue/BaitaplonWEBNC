import { useEffect, useState } from "react";

// Ảnh an toàn: link die thì hiện khung chữ thay vì vỡ layout.
// H07: reset failed khi đổi src để ảnh mới hợp lệ vẫn hiện.
export function SafeImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [src]);
  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-[#F1F5F9] text-sm text-[#64748B] ${className ?? ""}`}>
        Chưa có ảnh
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" className={className} onError={() => setFailed(true)} />;
}
