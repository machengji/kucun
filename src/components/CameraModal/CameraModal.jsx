import React, { useEffect, useRef, useState } from 'react';

/**
 * 摄像头拍照模态框
 * 核心优化：
 * - 使用 ref 追踪启动状态，彻底防止 useEffect 重复触发导致的闪烁
 * - 只依赖 isOpen 一个状态来决定是否启动/关闭摄像头
 * - 增加 loading 状态指示，让用户知道摄像头正在加载
 */
export function CameraModal({ isOpen, startCamera, stopCamera, capture, onCapture, onClose }) {
  const videoRef = useRef(null);
  const mountedRef = useRef(false);
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'ready' | 'error'

  useEffect(() => {
    // 只在 isOpen 从 false → true 时启动，防止其他依赖变化导致反复调用
    if (!isOpen) {
      mountedRef.current = false;
      setStatus('idle');
      return;
    }

    // 防重入：同一次打开只启动一次
    if (mountedRef.current) return;
    mountedRef.current = true;

    let cancelled = false;
    setStatus('loading');

    const init = async () => {
      try {
        if (!videoRef.current || cancelled) return;
        await startCamera(videoRef.current);
        if (!cancelled) {
          setStatus('ready');
        }
      } catch (err) {
        console.error('摄像头启动失败:', err);
        if (!cancelled) {
          setStatus('error');
          // 延迟关闭，让用户能看到错误提示
          setTimeout(() => {
            if (!cancelled) onClose();
          }, 800);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      stopCamera();
    };
  // 只依赖 isOpen，避免 startCamera/stopCamera/onClose 引用变化导致重新执行
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSnap = () => {
    if (videoRef.current && status === 'ready') {
      const dataUrl = capture(videoRef.current);
      if (dataUrl) {
        onCapture(dataUrl);
      }
    }
  };

  return (
    <div className={`camera-overlay ${isOpen ? 'active' : ''}`}>
      {/* 加载/错误状态提示 */}
      {status === 'loading' && (
        <div className="camera-status">
          <div className="camera-spinner"></div>
          <span>正在启动摄像头...</span>
        </div>
      )}
      {status === 'error' && (
        <div className="camera-status">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span>摄像头启动失败</span>
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          // 加载完成前隐藏 video 避免黑色闪烁
          opacity: status === 'ready' ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
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
          disabled={status !== 'ready'}
          style={{ opacity: status === 'ready' ? 1 : 0.4 }}
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
