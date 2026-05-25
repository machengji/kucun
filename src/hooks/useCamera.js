import { useState, useCallback, useRef } from 'react';

/**
 * 摄像头硬件调用 Hook
 * 针对安卓 WebView / 移动浏览器的兼容性做了深度优化：
 * - 防重入锁：避免重复调用 getUserMedia 导致闪烁
 * - 等待 loadedmetadata：确保 video 就绪后再播放，避免黑屏
 * - 超时保护：5 秒内无法就绪则自动释放并抛出异常
 */
export function useCamera() {
  const [isActive, setIsActive] = useState(false);
  const streamRef = useRef(null);
  const startingRef = useRef(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    startingRef.current = false;
    setIsActive(false);
  }, []);

  const startCamera = useCallback(async (videoElement) => {
    // 防重入：如果正在启动或已经在运行，则跳过
    if (startingRef.current || streamRef.current) {
      return streamRef.current;
    }
    startingRef.current = true;

    try {
      let mediaStream;

      try {
        // 优先请求后置摄像头，使用 ideal 而非 exact，兼容性更好
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false
        });
      } catch (err) {
        console.warn('后置摄像头调用失败，降级为默认视频流:', err);
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      // 如果在等待 getUserMedia 期间用户已关闭，则立即释放
      if (!startingRef.current) {
        mediaStream.getTracks().forEach(track => track.stop());
        return null;
      }

      streamRef.current = mediaStream;

      if (videoElement) {
        videoElement.srcObject = mediaStream;

        // 关键：等待 video 元素准备就绪后再播放，解决安卓黑屏问题
        await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('视频流加载超时'));
          }, 5000);

          const onReady = () => {
            clearTimeout(timeoutId);
            videoElement.removeEventListener('loadedmetadata', onReady);
            resolve();
          };

          // 如果 video 已经有尺寸数据（缓存命中），直接 resolve
          if (videoElement.readyState >= 1) {
            clearTimeout(timeoutId);
            resolve();
          } else {
            videoElement.addEventListener('loadedmetadata', onReady);
          }
        });

        // 显式调用 play()，部分安卓浏览器不会自动播放
        await videoElement.play().catch(() => {
          // play() 被阻止时忽略（autoPlay 会作为后备）
        });
      }

      setIsActive(true);
      startingRef.current = false;
      return mediaStream;

    } catch (error) {
      console.error('摄像头启动失败:', error);
      // 清理可能残留的流
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      startingRef.current = false;
      setIsActive(false);
      throw error;
    }
  }, []);

  const capture = useCallback((videoElement) => {
    if (!videoElement || !streamRef.current) return null;

    const w = videoElement.videoWidth;
    const h = videoElement.videoHeight;

    // 安全检查：如果视频尺寸为 0 说明流还没就绪
    if (!w || !h) return null;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(videoElement, 0, 0, w, h);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
    stopCamera();
    return dataUrl;
  }, [stopCamera]);

  return {
    isActive,
    startCamera,
    stopCamera,
    capture
  };
}
