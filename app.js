document.addEventListener('DOMContentLoaded', () => {
  // ============= الإعدادات الافتراضية =============
  const DEFAULT_SERVER_URL = "https://airshare-ahxb.onrender.com";

  // قراءة الإعدادات من localStorage
  const settings = {
    language: localStorage.getItem('as_lang') || 'ar',
    theme: localStorage.getItem('as_theme') || 'light',
    accent: localStorage.getItem('as_accent') || 'blue',
    autoSave: localStorage.getItem('as_autoSave') === '1',
    hideFromPeers: localStorage.getItem('as_hideFromPeers') === '1',
    blockIncoming: localStorage.getItem('as_blockIncoming') === '1',
    serverUrl: localStorage.getItem('as_serverUrl') || DEFAULT_SERVER_URL,
    debug: localStorage.getItem('as_debug') === '1'
  };

  // نستخدم هذا كرابط السيرفر الفعلي
  let SERVER_URL = settings.serverUrl || DEFAULT_SERVER_URL;

  // ============= عناصر الواجهة الرئيسية =============
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
  const debugPanel = document.getElementById('debugPanel');
  const debugSocketId = document.getElementById('debugSocketId');
  const debugPeersCount = document.getElementById('debugPeersCount');


  // عناصر داخل الإعدادات
  const languageSelect = document.getElementById('languageSelect');
  const themeSelect = document.getElementById('themeSelect');
  const accentSelect = document.getElementById('accentSelect');
  const settingsDeviceNameInput = document.getElementById('settingsDeviceName');
  const autoSaveCheckbox = document.getElementById('autoSaveCheckbox');
  const hideFromPeersCheckbox = document.getElementById('hideFromPeersCheckbox');
  const blockIncomingCheckbox = document.getElementById('blockIncomingCheckbox');
  const pingBtn = document.getElementById('pingBtn');
  const pingResult = document.getElementById('pingResult');
  const clearDataBtn = document.getElementById('clearDataBtn');
  const debugCheckbox = document.getElementById('debugCheckbox');

  let selectedFile = null;
  let currentPeers = {};
  let socket = null;

  // ============= ترجمة بسيطة (عربي / إنجليزي) =============
  const i18n = {
    ar: {
      title: "AirShare",
      deviceNameLabel: "اسم جهازي:",
      uploadTitle: "ارفع ملف",
      dropzoneText: "اسحب الملف هنا أو",
      browseBtn: "اختر ملف",
      peersTitle: "الأجهزة المتصلة",
      inboxTitle: "الملفات الواردة",
      emptyInbox: "لا توجد ملفات مستلمة.",
      debugTitle: "وضع المطوّر",
      debugPeersCount: "عدد الأجهزة",
      settingsTitle: "الإعدادات",
      generalSettings: "الإعدادات العامة",
      languageLabel: "اللغة:",
      themeLabel: "الثيم:",
      themeLight: "فاتح",
      themeDark: "داكن",
      accentLabel: "اللون المميز:",
      accentBlue: "أزرق",
      accentGreen: "أخضر",
      accentPurple: "بنفسجي",
      accentRed: "أحمر",
      deviceSettings: "إعدادات الجهاز",
      filesSettings: "الملفات",
      autoSaveLabel: "حفظ الملفات المستلمة تلقائيًا (تحميل مباشر)",
      privacySettings: "الخصوصية",
      hideFromPeersLabel: "عدم الظهور في قائمة الأجهزة (لن تستقبل ملفات)",
      blockIncomingLabel: "منع استقبال الملفات (مع بقاء الاتصال)",
      connectionSettings: "الاتصال",
      serverUrlLabel: "رابط السيرفر (Render):",
      pingBtn: "اختبار الاتصال بالسيرفر",
      debugLabel: "تفعيل وضع المطوّر (إظهار معلومات إضافية)",
      systemSettings: "النظام",
      clearDataBtn: "مسح جميع بيانات الإعدادات",
      aboutTitle: "عن AirShare",
      aboutText: "AirShare تم تطويره بواسطة idzrq كمشروع من الصفر بمساعدة الذكاء الاصطناعي، من مرحلة الفكرة حتى الإطلاق على Vercel و Render. هذا المشروع مجرد بداية لمشاريع أكبر بإذن الله.",
      versionLabel: "الإصدار:",
      techLabel: "التقنيات المستخدمة:"
    },
    en: {
      title: "AirShare",
      deviceNameLabel: "My device name:",
      uploadTitle: "Upload file",
      dropzoneText: "Drop a file here or",
      browseBtn: "Choose file",
      peersTitle: "Connected devices",
      inboxTitle: "Received files",
      emptyInbox: "No files received yet.",
      debugTitle: "Developer Mode",
      debugPeersCount: "Peers count",
      settingsTitle: "Settings",
      generalSettings: "General settings",
      languageLabel: "Language:",
      themeLabel: "Theme:",
      themeLight: "Light",
      themeDark: "Dark",
      accentLabel: "Accent color:",
      accentBlue: "Blue",
      accentGreen: "Green",
      accentPurple: "Purple",
      accentRed: "Red",
      deviceSettings: "Device settings",
      filesSettings: "Files",
      autoSaveLabel: "Auto-download received files",
      privacySettings: "Privacy",
      hideFromPeersLabel: "Hide from peers list (you won't receive files)",
      blockIncomingLabel: "Block incoming files (stay connected)",
      connectionSettings: "Connection",
      serverUrlLabel: "Server URL (Render):",
      pingBtn: "Test server connection",
      debugLabel: "Enable developer mode (extra info)",
      systemSettings: "System",
      clearDataBtn: "Clear all settings",
      aboutTitle: "About AirShare",
      aboutText: "AirShare was built by idzrq from scratch with the help of AI, from idea to deployment on Vercel and Render. This is just the beginning of more projects in the future.",
      versionLabel: "Version:",
      techLabel: "Tech stack:"
    }
  };

  function applyLanguage(lang) {
    const dict = i18n[lang] || i18n.ar;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });
  }

  function applyTheme(theme) {
    document.body.classList.toggle('dark', theme === 'dark');
  }

  function applyAccent(accent) {
    document.body.dataset.accent = accent;
  }

  // ============= تهيئة الإعدادات على الواجهة =============
  function initSettingsUI() {
    languageSelect.value = settings.language;
    themeSelect.value = settings.theme;
    accentSelect.value = settings.accent;
    autoSaveCheckbox.checked = settings.autoSave;
    hideFromPeersCheckbox.checked = settings.hideFromPeers;
    blockIncomingCheckbox.checked = settings.blockIncoming;
    serverUrlInput.value = SERVER_URL;
    debugCheckbox.checked = settings.debug;

    // اسم الجهاز
    let deviceName = localStorage.getItem('deviceName');
    if (!deviceName) {
      deviceName = `جهازي - ${navigator.platform}`;
      localStorage.setItem('deviceName', deviceName);
    }
    deviceNameInput.value = deviceName;
    settingsDeviceNameInput.value = deviceName;

    applyLanguage(settings.language);
    applyTheme(settings.theme);
    applyAccent(settings.accent);

    // Debug panel
    debugPanel.classList.toggle('hidden', !settings.debug);
  }

  initSettingsUI();

  // ============= التعامل مع الإعدادات (تغيير القيم) =============
  languageSelect.addEventListener('change', () => {
    settings.language = languageSelect.value;
    localStorage.setItem('as_lang', settings.language);
    applyLanguage(settings.language);
  });

  themeSelect.addEventListener('change', () => {
    settings.theme = themeSelect.value;
    localStorage.setItem('as_theme', settings.theme);
    applyTheme(settings.theme);
  });

  accentSelect.addEventListener('change', () => {
    settings.accent = accentSelect.value;
    localStorage.setItem('as_accent', settings.accent);
    applyAccent(settings.accent);
  });

  autoSaveCheckbox.addEventListener('change', () => {
    settings.autoSave = autoSaveCheckbox.checked;
    localStorage.setItem('as_autoSave', settings.autoSave ? '1' : '0');
  });

  hideFromPeersCheckbox.addEventListener('change', () => {
    settings.hideFromPeers = hideFromPeersCheckbox.checked;
    localStorage.setItem('as_hideFromPeers', settings.hideFromPeers ? '1' : '0');
    // ملاحظة: لو فعّل الإخفاء، يفضّل ينعاد تحميل الصفحة لتطبيق المنطق بشكل نظيف
  });

  blockIncomingCheckbox.addEventListener('change', () => {
    settings.blockIncoming = blockIncomingCheckbox.checked;
    localStorage.setItem('as_blockIncoming', settings.blockIncoming ? '1' : '0');
  });

  debugCheckbox.addEventListener('change', () => {
    settings.debug = debugCheckbox.checked;
    localStorage.setItem('as_debug', settings.debug ? '1' : '0');
    debugPanel.classList.toggle('hidden', !settings.debug);
  });

  // توحيد اسم الجهاز بين الحقلين
  function updateDeviceName(newName) {
    const name = newName.trim();
    if (!name) return;
    deviceNameInput.value = name;
    settingsDeviceNameInput.value = name;
    localStorage.setItem('deviceName', name);
    if (socket && socket.connected && !settings.hideFromPeers) {
      socket.emit('announce', { name });
    }
  }

  deviceNameInput.addEventListener('blur', () => updateDeviceName(deviceNameInput.value));
  deviceNameInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      updateDeviceName(deviceNameInput.value);
      deviceNameInput.blur();
    }
  });

  settingsDeviceNameInput.addEventListener('blur', () => updateDeviceName(settingsDeviceNameInput.value));
  settingsDeviceNameInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      updateDeviceName(settingsDeviceNameInput.value);
      settingsDeviceNameInput.blur();
    }
  });

 // ============= لوحات الإعدادات والتعريف =============

// عناصر لوحة الإعدادات
const settingsBtn   = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const settingsClose = document.getElementById('settingsClose');

// عناصر لوحة التعريف
const aboutBtn   = document.getElementById('aboutBtn');
const aboutPanel = document.getElementById('aboutPanel');
const aboutClose = document.getElementById('aboutClose');

// فتح / إغلاق الإعدادات
function openSettings() {
  if (!settingsPanel) return;
  settingsPanel.classList.remove('hidden');
}

function closeSettings() {
  if (!settingsPanel) return;
  settingsPanel.classList.add('hidden');
}

// فتح / إغلاق التعريف
function openAbout() {
  if (!aboutPanel) return;
  aboutPanel.classList.remove('hidden');
}

function closeAbout() {
  if (!aboutPanel) return;
  aboutPanel.classList.add('hidden');
}

// ربط الأحداث بلوحة الإعدادات
if (settingsBtn && settingsPanel && settingsClose) {
  settingsBtn.addEventListener('click', openSettings);
  settingsClose.addEventListener('click', closeSettings);

  // إغلاق عند الضغط على الخلفية الداكنة
  settingsPanel.addEventListener('click', (e) => {
    if (e.target === settingsPanel) {
      closeSettings();
    }
  });
}

// ربط الأحداث بلوحة التعريف
if (aboutBtn && aboutPanel && aboutClose) {
  aboutBtn.addEventListener('click', openAbout);
  aboutClose.addEventListener('click', closeAbout);

  // إغلاق عند الضغط على الخلفية الداكنة
  aboutPanel.addEventListener('click', (e) => {
    if (e.target === aboutPanel) {
      closeAbout();
    }
  });
}

// إغلاق أي لوحة مفتوحة بزر Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeSettings();
    closeAbout();
  }
});


  // ============= Ping Test =============
  pingBtn.addEventListener('click', async () => {
    pingResult.textContent = '';
    const url = serverUrlInput.value.trim() || DEFAULT_SERVER_URL;
    const start = performance.now();
    try {
      const res = await fetch(url + '/download/test', { method: 'GET' });
      const ms = Math.round(performance.now() - start);
      if (res.ok || res.status === 404) {
        pingResult.textContent = (settings.language === 'ar')
          ? `متصل ✅ (${ms} ms)`
          : `Reachable ✅ (${ms} ms)`;
      } else {
        pingResult.textContent = (settings.language === 'ar')
          ? `الاستجابة غير متوقعة (${res.status})`
          : `Unexpected response (${res.status})`;
      }
    } catch (err) {
      pingResult.textContent = (settings.language === 'ar')
        ? 'تعذّر الاتصال ❌'
        : 'Connection failed ❌';
    }
  });

  // ============= تغيير رابط السيرفر =============
  serverUrlInput.addEventListener('blur', () => {
    const url = serverUrlInput.value.trim();
    if (!url) return;
    settings.serverUrl = url;
    localStorage.setItem('as_serverUrl', url);
    // أسهل شيء: نعيد تحميل الصفحة لتطبيق الرابط الجديد
    if (settings.language === 'ar') {
      alert('تم حفظ رابط السيرفر. سيتم إعادة تحميل الصفحة الآن لتطبيق التغيير.');
    } else {
      alert('Server URL saved. The page will reload now to apply the change.');
    }
    location.reload();
  });

  // ============= مسح البيانات =============
  clearDataBtn.addEventListener('click', () => {
    const confirmMsg = (settings.language === 'ar')
      ? 'هل أنت متأكد من مسح جميع بيانات الإعدادات؟'
      : 'Are you sure you want to clear all settings?';
    if (!confirm(confirmMsg)) return;
    localStorage.clear();
    location.reload();
  });

  // ============= الاتصال بـ Socket.IO =============
  function createSocketConnection() {
    socket = io(SERVER_URL, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      connectionStatus.textContent = (settings.language === 'ar')
        ? '• متصل بالسيرفر'
        : '• Connected to server';
      connectionStatus.classList.remove('disconnected');
      connectionStatus.classList.add('connected');

      const deviceName = localStorage.getItem('deviceName') || `جهازي - ${navigator.platform}`;
      if (!settings.hideFromPeers) {
        socket.emit('announce', { name: deviceName });
      }

      if (settings.debug && debugSocketId) {
        debugSocketId.textContent = socket.id;
      }
    });

    socket.on('disconnect', () => {
      connectionStatus.textContent = (settings.language === 'ar')
        ? '• غير متصل'
        : '• Disconnected';
      connectionStatus.classList.remove('connected');
      connectionStatus.classList.add('disconnected');
      currentPeers = {};
      updatePeerList([]);
      if (settings.debug && debugSocketId) {
        debugSocketId.textContent = '-';
        debugPeersCount.textContent = '0';
      }
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connect error:', err);
      connectionStatus.textContent = (settings.language === 'ar')
        ? '• فشل الاتصال بالسيرفر'
        : '• Connection failed';
      connectionStatus.classList.remove('connected');
      connectionStatus.classList.add('disconnected');
      showMessage(
        (settings.language === 'ar'
          ? 'خطأ في الاتصال بالسيرفر: '
          : 'Error connecting to server: ') + err.message,
        'error'
      );
    });

    socket.on('peers', (peersArray) => {
      currentPeers = {};
      peersArray.forEach((p) => {
        currentPeers[p.id] = p;
      });
      updatePeerList(Object.values(currentPeers));
    });

    socket.on('peer-joined', (peer) => {
      currentPeers[peer.id] = peer;
      updatePeerList(Object.values(currentPeers));
    });

    socket.on('peer-left', (peer) => {
      delete currentPeers[peer.id];
      updatePeerList(Object.values(currentPeers));
    });

    socket.on('file-received', (payload) => {
      if (settings.blockIncoming) {
        showMessage(
          settings.language === 'ar'
            ? 'تم حظر ملف وارد حسب إعدادات الخصوصية.'
            : 'Incoming file blocked by privacy settings.',
          'info'
        );
        return;
      }
      addIncomingFile(payload);
    });
  }

  createSocketConnection();

  // ============= رسائل واجهة =============
  function showMessage(text, type = 'info') {
    if (!messageArea) return;
    messageArea.textContent = text;
    messageArea.className = 'message ' + type;
  }

  // ============= التعامل مع الملفات (اختيار/سحب) =============
  if (browseBtn) {
    browseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      fileInput.click();
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelection(e.target.files[0]);
      }
    });
  }

  if (dropzone) {
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelection(e.dataTransfer.files[0]);
      }
    });

    dropzone.addEventListener('click', (e) => {
      if (e.target !== browseBtn && !e.target.closest('#browseBtn')) {
        fileInput.click();
      }
    });
  }

  function handleFileSelection(file) {
    selectedFile = file;
    fileStatus.classList.remove('hidden');
    fileNameSpan.textContent = (settings.language === 'ar' ? 'الملف: ' : 'File: ') + file.name;
    fileSizeSpan.textContent =
      (settings.language === 'ar' ? 'الحجم: ' : 'Size: ') +
      (file.size / 1024 / 1024).toFixed(2) +
      ' MB';

    showMessage(
      settings.language === 'ar'
        ? 'الملف جاهز، اختر جهاز من القائمة لإرساله.'
        : 'File ready. Choose a device from the list to send.',
      'info'
    );
  }

  // ============= قائمة الأجهزة =============
  function updatePeerList(peersArray) {
    if (!peerList) return;
    peerList.innerHTML = '';

    const visiblePeers = peersArray.filter((p) => p.id !== (socket && socket.id));

    if (!visiblePeers.length) {
      const li = document.createElement('li');
      li.className = 'empty-state';
      li.textContent = settings.language === 'ar'
        ? 'لا توجد أجهزة قريبة حالياً.'
        : 'No devices available right now.';
      peerList.appendChild(li);
      if (settings.debug && debugPeersCount) debugPeersCount.textContent = '0';
      return;
    }

    visiblePeers.forEach((peer) => {
      const li = document.createElement('li');
      li.className = 'peer-item';

      const nameSpan = document.createElement('span');
      nameSpan.innerHTML = `💻 ${peer.name}`;

      const btn = document.createElement('button');
      btn.className = 'primary-btn small';
      btn.textContent = settings.language === 'ar' ? 'إرسال إليه' : 'Send';
      btn.addEventListener('click', () => {
        sendFileToPeer(peer.id, peer.name);
      });

      li.appendChild(nameSpan);
      li.appendChild(btn);
      peerList.appendChild(li);
    });

    if (settings.debug && debugPeersCount) {
      debugPeersCount.textContent = String(visiblePeers.length);
    }
  }

  // ============= إرسال الملف لجهاز معيّن =============
  async function sendFileToPeer(peerId, peerName) {
    if (!socket || !socket.connected) {
      showMessage(
        settings.language === 'ar' ? 'غير متصل بالسيرفر.' : 'Not connected to server.',
        'error'
      );
      return;
    }

    if (!selectedFile) {
      showMessage(
        settings.language === 'ar' ? 'اختر ملف أولاً قبل الإرسال.' : 'Select a file first.',
        'error'
      );
      return;
    }

    showMessage(
      (settings.language === 'ar' ? 'جاري إرسال الملف إلى ' : 'Sending file to ') +
      peerName +
      '...',
      'info'
    );

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('targetPeerId', peerId);
    formData.append('fromPeerId', socket.id);

    try {
      const res = await fetch(`${SERVER_URL}/upload-peer`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        showMessage(
          (settings.language === 'ar'
            ? 'تم إرسال الملف إلى '
            : 'File sent to ') + peerName + ' ✅',
          'success'
        );
      } else {
        showMessage(
          data.message ||
          (settings.language === 'ar'
            ? 'فشل إرسال الملف.'
            : 'Failed to send file.'),
          'error'
        );
      }
    } catch (err) {
      console.error(err);
      showMessage(
        settings.language === 'ar'
          ? 'حدث خطأ أثناء إرسال الملف.'
          : 'An error occurred while sending the file.',
        'error'
      );
    }
  }

  // ============= إضافة ملف وارد للصندوق =============
  function addIncomingFile(payload) {
    if (!inbox) return;

    const empty = inbox.querySelector('.empty-inbox');
    if (empty) empty.remove();

    const card = document.createElement('div');
    card.className = 'file-card';

    const title = document.createElement('div');
    title.className = 'file-title';
    title.textContent = payload.originalName || (settings.language === 'ar' ? 'ملف بدون اسم' : 'Unnamed file');

    const meta = document.createElement('div');
    meta.className = 'file-meta';
    const sizeMB = (payload.size / 1024 / 1024).toFixed(2);
    meta.textContent =
      (settings.language === 'ar'
        ? `من: ${payload.fromName} • الحجم: ${sizeMB} MB`
        : `From: ${payload.fromName} • Size: ${sizeMB} MB`);

    const link = document.createElement('a');
    const href = payload.downloadUrl
      ? `${SERVER_URL}${payload.downloadUrl}`
      : `${SERVER_URL}${payload.url}`;
    link.href = href;
    link.className = 'secondary-btn small';
    link.textContent = settings.language === 'ar' ? 'تحميل الملف' : 'Download file';
    link.setAttribute('download', payload.originalName || 'file');

    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(link);
    inbox.appendChild(card);

    // Auto-save (تحميل تلقائي)
    if (settings.autoSave) {
      // نعمل كليك تلقائي على الرابط لبدء التحميل
      link.click();
    }

    showMessage(
      settings.language === 'ar'
        ? `وصل ملف جديد من ${payload.fromName}.`
        : `New file received from ${payload.fromName}.`,
      'success'
    );
  }
});
