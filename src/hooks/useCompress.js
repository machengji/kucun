import { useCallback } from 'react';

/**
 * 图像压缩 Hook
 */
export function useCompress() {
  const compressImage = useCallback((dataUrl, maxWidth = 800, quality = 0.72) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          // 等比例压缩尺寸
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('无法获取 Canvas 2D 上下文'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          
          // 导出为经过压缩质量的 jpeg base64 格式
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch (err) {
          reject(err);
        }
      };
      
      img.onerror = () => {
        reject(new Error('图片加载失败，无法压缩'));
      };

      img.src = dataUrl;
    });
  }, []);

  return { compressImage };
}
