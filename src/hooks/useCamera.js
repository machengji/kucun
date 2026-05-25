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
      let mediaStream;
      
      try {
        // 第一步：尝试以兼容性最好的后置摄像头参数进行请求 (省略多余分辨率强限制，防 Overconstrained 报错)
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false
        });
      } catch (err) {
        console.warn('后置摄像头首选调用失败，执行二级默认视频流降级:', err);
        // 第二步：降级为最宽泛的默认视频通道请求 (保证绝对能获取到流，不报 404/Null)
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setIsActive(true);

      if (videoElement) {
        videoElement.srcObject = mediaStream;
      }
      return mediaStream;
    } catch (error) {
      console.error('摄像头所有尝试均调用失败，启动传统文件降级:', error);
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
