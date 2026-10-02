import { useEffect, useState } from 'react';

export const PHONE_W = 393;
export const PHONE_H = 852;

/** 按窗口尺寸等比缩放手机框（393×852 设计稿基准） */
export default function usePhoneScale() {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const f = () =>
      setScale(
        Math.min(1, (window.innerHeight - 56) / PHONE_H, (window.innerWidth - 24) / PHONE_W)
      );
    f();
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  return scale;
}
