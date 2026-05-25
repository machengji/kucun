import React, { useEffect, useRef } from 'react';

export function CameraModal({ isOpen, startCamera, stopCamera, capture, onCapture, onClose }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      // 模态框打开时自动请求开启摄像头媒体流
      startCamera(videoRef.current).catch((err) => {
        // 如果调用失败，自动触发关闭回调，外层组件将以降级文件上传进行兜底
        onClose();
      });
    }
    return () => {
      // 模态框卸载或关闭时，确保停止摄像头媒体流释放硬件资源
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera, onClose]);

  const handleSnap = () => {
    if (videoRef.current) {
      const dataUrl = capture(videoRef.current);
      if (dataUrl) {
        onCapture(dataUrl);
      }
    }
  };

  return (
    <div className={`camera-overlay ${isOpen ? 'active' : ''}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        webkit-playsinline="true"
        x5-video-player-type="h5-page"
        muted
      />
      <div className="camera-btns">
        <button
          type="button"
          className="btn-cam btn-cam-cancel"
          onClick={onClose}
        >
          取消
        </button>
        <button
          type="button"
          className="btn-cam btn-cam-snap"
          onClick={handleSnap}
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            拍摄
          </span>
        </button>
      </div>
    </div>
  );
}
