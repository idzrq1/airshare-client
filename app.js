// public/app.js
document.addEventListener('DOMContentLoaded', () => {

  const SERVER_URL = "https://airshare-ahxb.onrender.com";

  // عناصر الواجهة
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const browseBtn = document.getElementById('browseBtn');
  const fileStatus = document.getElementById('fileStatus');
  const fileNameSpan = document.getElementById('fileName');
  const fileSizeSpan = document.getElementById('fileSize');
  const messageArea = document.getElementById('messageArea');
  const connectionStatus = document.getElementById('connectionStatus');
  const deviceNameInput = document.getElementById('deviceNameInput');
  const peerList = document.getElementById('peerList');
  const inbox = document.getElementById('inbox');

  let selectedFile = null;
  let currentPeers = {};
  let socket = null;

  // ===================== اسم الجهاز =====================
  let deviceName = localStorage.getItem('deviceName');
  if (!deviceName) {
    deviceName = `جهازي - ${navigator.platform}`;
    localStorage.setItem('deviceName', deviceName);
  }
  deviceNameInput.value = deviceName;

  function showMessage(text, type = 'info') {
    messageArea.textContent = text;
    messageArea.className = 'message ' + type;
  }

  // ===================== Socket.IO =====================
  socket = io(SERVER_URL, {
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    connectionStatus.textContent = '• متصل بالسيرفر';
    connectionStatus.classList.add('connected');
    connectionStatus.classList.remove('disconnected');
    socket.emit('announce', { name: deviceNameInput.value.trim() || deviceName });
  });

  socket.on('disconnect', () => {
    connectionStatus.textContent = '• غير متصل';
    connectionStatus.classList.add('disconnected');
    connectionStatus.classList.remove('connected');
    currentPeers = {};
    updatePeerList([]);
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connect error:', err);
    connectionStatus.textContent = '• فشل الاتصال بالسيرفر';
    connectionStatus.classList.add('disconnected');
    connectionStatus.classList.remove('connected');
  });

  socket.on('peers', (arr) => {
    currentPeers = {};
    arr.forEach(p => currentPeers[p.id] = p);
    updatePeerList(arr);
  });

  socket.on('peer-joined', (peer) => {
    currentPeers[peer.id] = peer;
    updatePeerList(Object.values(currentPeers));
  });

  socket.on('peer-left', (peer) => {
    delete currentPeers[peer.id];
    updatePeerList(Object.values(currentPeers));
  });

  socket.on('file-received', addIncomingFile);

  // ===================== تعديل اسم الجهاز =====================
  function updateDeviceName() {
    const newName = deviceNameInput.value.trim();
    if (newName && newName !== deviceName) {
      deviceName = newName;
      localStorage.setItem('deviceName', deviceName);
      socket.emit('announce', { name: deviceName });
    }
  }

  deviceNameInput.addEventListener('blur', updateDeviceName);
  deviceNameInput.addEventListener('keyup', e => {
    if (e.key === 'Enter') {
      updateDeviceName();
      deviceNameInput.blur();
    }
  });

  // ===================== اختيار / سحب ملف =====================
  browseBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', e => handleFile(e.target.files[0]));

  dropzone.addEventListener('dragover', e => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  });

  dropzone.addEventListener('click', () => fileInput.click());

  function handleFile(file) {
    selectedFile = file;
    fileNameSpan.textContent = `الملف: ${file.name}`;
    fileSizeSpan.textContent = `الحجم: ${(file.size / 1024 / 1024).toFixed(2)} MB`;
    fileStatus.style.display = 'block';
    showMessage('الملف جاهز — اختر جهاز لإرساله', 'info');
  }

  // ===================== قائمة الأجهزة =====================
  function updatePeerList(arr) {
    peerList.innerHTML = '';

    if (!arr.length) {
      const li = document.createElement('li');
      li.textContent = 'لا توجد أجهزة حالياً.';
      peerList.appendChild(li);
      return;
    }

    arr.forEach(peer => {
      if (peer.id === socket.id) return;

      const li = document.createElement('li');
      li.className = 'peer-item';

      const name = document.createElement('span');
      name.innerHTML = `💻 ${peer.name}`;

      const btn = document.createElement('button');
      btn.className = 'primary-btn small';
      btn.textContent = 'إرسال إليه';
      btn.addEventListener('click', () => sendFile(peer.id, peer.name));

      li.appendChild(name);
      li.appendChild(btn);
      peerList.appendChild(li);
    });
  }

  // ===================== إرسال الملفات =====================
  async function sendFile(peerId, peerName) {
    if (!selectedFile) return showMessage('اختر ملف أولاً', 'error');

    showMessage(`يتم الإرسال إلى ${peerName} ...`, 'info');

    const data = new FormData();
    data.append('file', selectedFile);
    data.append('targetPeerId', peerId);
    data.append('fromPeerId', socket.id);

    try {
      const res = await fetch(`${SERVER_URL}/upload-peer`, {
        method: 'POST',
        body: data
      });
      const json = await res.json();

      if (json.ok) {
        showMessage(`تم الإرسال إلى ${peerName} ✔`, 'success');
      } else {
        showMessage('فشل إرسال الملف', 'error');
      }
    } catch {
      showMessage('خطأ أثناء الإرسال', 'error');
    }
  }

  // ===================== الملفات الواردة =====================
  function addIncomingFile(payload) {
    const empty = inbox.querySelector('.empty-inbox');
    if (empty) empty.remove();

    const card = document.createElement('div');
    card.className = 'file-card';

    card.innerHTML = `
      <div class="file-title">${payload.originalName}</div>
      <div class="file-meta">من: ${payload.fromName} • ${(payload.size / 1024 / 1024).toFixed(2)} MB</div>
    `;

    const link = document.createElement('a');
    link.href = `${SERVER_URL}${payload.downloadUrl}`;
    link.textContent = 'تحميل';
    link.className = 'secondary-btn small';
    link.download = payload.originalName;

    card.appendChild(link);
    inbox.appendChild(card);
  }

  // ===================== نافذة التعريف =====================
  const aboutBtn = document.getElementById('aboutBtn');
  const aboutModal = document.getElementById('aboutModal');
  const aboutClose = document.getElementById('aboutClose');

  function openAbout() {
    aboutModal.classList.remove('hidden');
  }

  function closeAbout() {
    aboutModal.classList.add('hidden');
  }

  aboutBtn.addEventListener('click', openAbout);
  aboutClose.addEventListener('click', closeAbout);

  aboutModal.addEventListener('click', e => {
    if (e.target === aboutModal) closeAbout();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAbout();
  });

});
