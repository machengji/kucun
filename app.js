// 全局变量
let capturedImage = null;
let currentStream = null;
const STORAGE_KEY = 'inventory_records';

// DOM 元素
const captureBtn = document.getElementById('captureBtn');
const fileInput = document.getElementById('fileInput');
const previewArea = document.getElementById('previewArea');
const inventoryForm = document.getElementById('inventoryForm');
const cameraModal = document.getElementById('cameraModal');
const cameraVideo = document.getElementById('cameraVideo');
const cancelCamera = document.getElementById('cancelCamera');
const snapBtn = document.getElementById('snapBtn');

// ---------- 拍照功能 ----------

// 方式1：getUserMedia 摄像头
captureBtn.addEventListener('click', async () => {
    try {
        // 尝试打开摄像头
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });
        
        currentStream = stream;
        cameraVideo.srcObject = stream;
        cameraModal.classList.add('active');
    } catch (err) {
        console.warn('getUserMedia 失败，降级到文件输入方式', err);
        // 降级到文件输入
        fileInput.click();
    }
});

// 拍摄按钮
snapBtn.addEventListener('click', () => {
    if (!currentStream) return;
    
    // 创建 canvas 截取视频帧
    const canvas = document.createElement('canvas');
    canvas.width = cameraVideo.videoWidth || 1280;
    canvas.height = cameraVideo.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);
    
    // 压缩并转换为 Base64
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    capturedImage = dataUrl;
    
    // 停止摄像头流
    stopCamera();
    
    // 显示预览
    showImagePreview(dataUrl);
});

// 取消摄像头
cancelCamera.addEventListener('click', stopCamera);

function stopCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
    cameraModal.classList.remove('active');
}

// 方式2：文件输入降级
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
        // 压缩大图片
        compressImage(ev.target.result, 800, 0.7).then(compressed => {
            capturedImage = compressed;
            showImagePreview(compressed);
        });
    };
    reader.readAsDataURL(file);
    fileInput.value = '';
});

// 图片压缩函数
function compressImage(dataUrl, maxWidth, quality) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            let width = img.width;
            let height = img.height;
            
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = dataUrl;
    });
}

// 显示图片预览
function showImagePreview(dataUrl) {
    previewArea.innerHTML = `<img src="${dataUrl}" alt="预览">`;
}

// ---------- 保存记录 ----------

inventoryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('itemName').value.trim();
    const stock = parseInt(document.getElementById('itemStock').value, 10);
    
    // 验证
    if (!name) {
        alert('请输入商品名称');
        return;
    }
    if (isNaN(stock) || stock < 0) {
        alert('请输入有效的库存数量');
        return;
    }
    if (!capturedImage) {
        alert('请先拍摄商品照片');
        return;
    }
    
    // 构建记录
    const record = {
        id: Date.now(),
        name: name,
        stock: stock,
        image: capturedImage,
        timestamp: new Date().toLocaleString('zh-CN')
    };
    
    // 保存到 localStorage
    let records = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    records.unshift(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    
    // 重置表单
    inventoryForm.reset();
    capturedImage = null;
    previewArea.innerHTML = '<span class="placeholder">📷 点击拍照按钮拍摄商品照片</span>';
    
    // 刷新列表
    renderList();
    
    // 成功提示
    showToast('记录保存成功！');
});

// ---------- 渲染列表 ----------

function renderList() {
    const list = document.getElementById('inventoryList');
    const records = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    // 更新统计
    updateStats(records);
    
    if (records.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <p>暂无库存记录</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = records.map(record => `
        <div class="record-card">
            <img src="${record.image}" alt="${record.name}" loading="lazy">
            <div class="record-info">
                <div class="name">${escapeHtml(record.name)}</div>
                <div class="stock">库存: ${record.stock} 件</div>
                <div class="time">${record.timestamp}</div>
            </div>
            <button class="btn btn-danger" onclick="deleteRecord(${record.id})">删除</button>
        </div>
    `).join('');
}

// 更新统计
function updateStats(records) {
    const totalCount = records.length;
    const totalStock = records.reduce((sum, r) => sum + r.stock, 0);
    document.getElementById('totalCount').textContent = totalCount;
    document.getElementById('totalStock').textContent = totalStock;
}

// HTML 转义防止 XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ---------- 删除记录 ----------

function deleteRecord(id) {
    if (!confirm('确定要删除这条记录吗？')) return;
    
    let records = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    records = records.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    
    renderList();
    showToast('记录已删除');
}

// ---------- Toast 提示 ----------

function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: #333;
        color: white;
        padding: 12px 24px;
        border-radius: 24px;
        font-size: 14px;
        z-index: 2000;
        animation: fadeIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// ---------- 导出功能（可选） ----------

function exportToCSV() {
    const records = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (records.length === 0) {
        alert('没有可导出的记录');
        return;
    }
    
    const csv = [
        ['商品名称', '库存数量', '登记时间'].join(','),
        ...records.map(r => [
            `"${r.name.replace(/"/g, '""')}"`,
            r.stock,
            r.timestamp
        ].join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `库存记录_${new Date().toLocaleDateString()}.csv`;
    link.click();
}

// ---------- 初始化 ----------

document.addEventListener('DOMContentLoaded', () => {
    renderList();
    
    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateX(-50%) translateY(10px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
    `;
    document.head.appendChild(style);
});

// 暴露全局函数
window.deleteRecord = deleteRecord;
window.exportToCSV = exportToCSV;
