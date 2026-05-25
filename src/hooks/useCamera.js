import { useState, useCallback, useRef } from 'react';

/**
 * 摄像头硬件调用 Hook
 */
export function useCamera() {
  const [stream, setStream] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const streamRef = useRef(null);

  const startCamera = useCallback(async (videoElement) => {
    try {
      // 优先请求后置摄像头且定义较为理想的分辨率
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setIsActive(true);

      if (videoElement) {
        videoElement.srcObject = mediaStream;
      }
      return mediaStream;
    } catch (error) {
      console.error('摄像头调用失败，启动降级上传模式:', error);
      setIsActive(false);
      throw error;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    setIsActive(false);
  }, []);

  const capture = useCallback((videoElement) => {
    if (!videoElement || !streamRef.current) return null;

    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth || 1280;
    canvas.height = videoElement.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    // 拍照捕获时直接输出中等质量 base64，以便在预览中快速反馈
    const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
    stopCamera();
    return dataUrl;
  }, [stopCamera]);

  return {
    stream,
    isActive,
    startCamera,
    stopCamera,
    capture
  };
}
