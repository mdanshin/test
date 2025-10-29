const cards = document.querySelectorAll('.card');

const diagElements = {};
const locale = navigator.languages?.[0] ?? navigator.language ?? 'ru-RU';
let timeZoneInterval;

const connection =
  navigator.connection || navigator.mozConnection || navigator.webkitConnection;

function cacheDiagElements() {
  const ids = [
    'userAgent',
    'platform',
    'languages',
    'timezone',
    'localTime',
    'hardware',
    'memory',
    'mobile',
    'touch',
    'battery',
    'screen',
    'viewport',
    'pixelRatio',
    'visibility',
    'navigation',
    'performance',
    'storage',
    'ip',
    'network',
    'location',
    'online',
    'connection',
    'referrer',
    'uaBrands',
    'geoStatus',
    'geo',
    'geoAccuracy',
  ];

  ids.forEach((key) => {
    diagElements[key] = document.getElementById(`diag-${key}`);
  });
}

function setText(key, value) {
  const el = diagElements[key];
  if (!el) return;
  el.textContent = value;
}

function formatBytes(bytes) {
  if (!(bytes >= 0)) {
    return 'Недоступно';
  }

  const units = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 || value < 1 ? 1 : 2)} ${units[unitIndex]}`;
}

function updateLocalTime(timeZone) {
  const options = timeZone ? { timeZone } : undefined;
  try {
    setText('localTime', new Date().toLocaleString(locale, options));
  } catch (error) {
    setText('localTime', new Date().toLocaleString(locale));
  }
}

function startLocalTimeUpdates(timeZone) {
  updateLocalTime(timeZone);
  if (timeZoneInterval) {
    clearInterval(timeZoneInterval);
  }
  timeZoneInterval = setInterval(() => updateLocalTime(timeZone), 1000);
}

function describeNavigationType() {
  const entry = performance.getEntriesByType('navigation')[0];

  if (entry) {
    const mapping = {
      navigate: 'Первая загрузка или переход',
      reload: 'Перезагрузка страницы',
      'back_forward': 'Переход по истории',
      prerender: 'Предварительная загрузка',
    };
    return mapping[entry.type] ?? entry.type;
  }

  if (performance.navigation) {
    const mapping = ['Первая загрузка или переход', 'Перезагрузка страницы', 'Переход по истории'];
    return mapping[performance.navigation.type] ?? 'Недоступно';
  }

  return 'Недоступно';
}

function updatePerformanceMetrics() {
  const navigationEntry = performance.getEntriesByType('navigation')[0];

  if (navigationEntry) {
    const domComplete = Math.round(navigationEntry.domComplete);
    const ttfb = Math.round(
      navigationEntry.responseStart - navigationEntry.requestStart || navigationEntry.responseStart,
    );
    const load = Math.round(navigationEntry.duration);

    setText(
      'performance',
      `${domComplete} мс до полной готовности · TTFB ${ttfb} мс · общая загрузка ${load} мс`,
    );
    return;
  }

  if (performance.timing) {
    const { navigationStart, loadEventEnd, responseStart, requestStart } = performance.timing;
    if (loadEventEnd && navigationStart) {
      const domComplete = Math.round(loadEventEnd - navigationStart);
      const ttfb = Math.round((responseStart || loadEventEnd) - (requestStart || navigationStart));
      setText(
        'performance',
        `${domComplete} мс до полной готовности · TTFB ${ttfb} мс`,
      );
      return;
    }
  }

  setText('performance', 'Недоступно');
}

function updateDisplayMetrics() {
  const screenWidth = window.screen?.width ?? 0;
  const screenHeight = window.screen?.height ?? 0;
  const colorDepth = window.screen?.colorDepth;
  const resolution = screenWidth && screenHeight ? `${screenWidth} × ${screenHeight}` : 'Недоступно';
  const depth = colorDepth ? ` · ${colorDepth}-бит` : '';
  setText('screen', `${resolution}${depth}`);

  const viewport = `${window.innerWidth} × ${window.innerHeight}`;
  setText('viewport', viewport);

  const pixelRatio = window.devicePixelRatio ? `${window.devicePixelRatio.toFixed(2)}x` : '1x';
  const orientation = window.screen?.orientation?.type
    ? ` · ${window.screen.orientation.type}`
    : '';
  setText('pixelRatio', `${pixelRatio}${orientation}`);
}

function updateVisibilityState() {
  const visible = document.visibilityState === 'visible';
  const focus = document.hasFocus?.() ? ' · в фокусе' : '';
  setText('visibility', `${visible ? 'Страница видима' : 'Страница скрыта'}${focus}`);
}

function updateNavigationInfo() {
  setText('navigation', describeNavigationType());
}

function updateOnlineStatus() {
  const label = navigator.onLine ? 'Онлайн' : 'Оффлайн';
  const since = new Date().toLocaleTimeString(locale);
  setText('online', `${label} (с ${since})`);
}

function describeConnection() {
  if (!connection) {
    return 'Недоступно';
  }

  const details = [];

  if (connection.effectiveType) {
    details.push(connection.effectiveType.toUpperCase());
  }

  if (connection.downlink) {
    details.push(`${connection.downlink.toFixed(1)} Мбит/с`);
  }

  if (connection.rtt) {
    details.push(`${connection.rtt} мс RTT`);
  }

  if (connection.saveData) {
    details.push('Экон. трафика');
  }

  return details.length ? details.join(' · ') : 'Не удалось определить';
}

function updateConnectionInfo() {
  setText('connection', describeConnection());
}

function updateReferrer() {
  if (!document.referrer) {
    setText('referrer', '—');
    return;
  }

  try {
    const url = new URL(document.referrer);
    setText('referrer', `${url.hostname}${url.pathname}`);
  } catch (error) {
    setText('referrer', document.referrer);
  }
}

function updateLanguageInfo() {
  const languages = navigator.languages?.length
    ? navigator.languages.join(', ')
    : navigator.language;
  setText('languages', languages || 'Недоступно');
}

function updateHardwareInfo() {
  const cores = navigator.hardwareConcurrency
    ? `${navigator.hardwareConcurrency} потоков`
    : 'Недоступно';
  setText('hardware', cores);

  const memory = navigator.deviceMemory ? `${navigator.deviceMemory} ГБ` : 'Недоступно';
  setText('memory', memory);

  const hasTouch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
  setText('touch', hasTouch ? 'Да' : 'Нет');

  if (navigator.userAgentData) {
    const brands = navigator.userAgentData.brands
      .map((brand) => `${brand.brand} ${brand.version}`)
      .join(', ');
    setText('uaBrands', brands || 'Не удалось определить');
    setText('mobile', navigator.userAgentData.mobile ? 'Да' : 'Нет');
  } else {
    setText('uaBrands', 'Недоступно в этом браузере');
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );
    setText('mobile', isMobile ? 'Предположительно да' : 'Нет');
  }

  setText('userAgent', navigator.userAgent || 'Недоступно');
  setText('platform', navigator.userAgentData?.platform || navigator.platform || 'Недоступно');
}

function updateTimeZoneInfo() {
  let timeZone = 'Недоступно';
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    timeZone = 'Недоступно';
  }

  setText('timezone', timeZone || 'Недоступно');
  startLocalTimeUpdates(timeZone && timeZone !== 'Undefined' ? timeZone : undefined);
}

async function updateStorageUsage() {
  if (!navigator.storage?.estimate) {
    setText('storage', 'Недоступно');
    return;
  }

  setText('storage', 'Определяем...');

  try {
    const { usage, quota } = await navigator.storage.estimate();

    if (usage && quota) {
      setText('storage', `${formatBytes(usage)} из ${formatBytes(quota)}`);
    } else {
      setText('storage', 'Не удалось определить');
    }
  } catch (error) {
    setText('storage', 'Ошибка доступа');
  }
}

async function fetchIpDetails() {
  const endpoints = [
    {
      url: 'https://ipapi.co/json/',
      parse: (data) => ({
        ip: data.ip,
        location: [data.city, data.region, data.country_name].filter(Boolean).join(', '),
        network: [data.org, data.asn].filter(Boolean).join(' · '),
      }),
    },
    {
      url: 'https://ipwho.is/?lang=ru',
      parse: (data) => ({
        ip: data.ip,
        location: [data.city, data.region, data.country].filter(Boolean).join(', '),
        network: data.connection?.isp,
      }),
    },
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, { cache: 'no-store' });
      if (!response.ok) continue;
      const data = await response.json();
      if (!data) continue;
      const parsed = endpoint.parse(data);

      if (parsed.ip) {
        setText('ip', parsed.ip);
      } else {
        setText('ip', 'Не удалось определить');
      }

      if (parsed.location) {
        setText('location', parsed.location);
      } else {
        setText('location', 'Не удалось определить');
      }

      if (parsed.network) {
        setText('network', parsed.network);
      } else {
        setText('network', 'Не удалось определить');
      }

      return;
    } catch (error) {
      // пробуем следующий сервис
    }
  }

  setText('ip', 'Не удалось получить данные');
  setText('location', 'Сервисы IP не ответили');
  setText('network', '—');
}

function setupGeoLocation() {
  const button = document.getElementById('diag-geo-btn');
  if (!button) return;

  button.addEventListener('click', () => {
    if (!navigator.geolocation) {
      setText('geoStatus', 'Геолокация не поддерживается');
      return;
    }

    setText('geoStatus', 'Запрашиваем разрешение...');
    setText('geo', '—');
    setText('geoAccuracy', '—');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setText('geoStatus', 'Разрешение получено');
        setText('geo', `${latitude.toFixed(6)}°, ${longitude.toFixed(6)}°`);
        setText('geoAccuracy', `${Math.round(accuracy)} м`);
      },
      (error) => {
        const errors = {
          1: 'Доступ отклонён пользователем',
          2: 'Позиция недоступна',
          3: 'Тайм-аут ожидания',
        };
        setText('geoStatus', errors[error.code] ?? 'Ошибка получения данных');
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  });
}

function setupBatteryInfo() {
  if (!('getBattery' in navigator)) {
    setText('battery', 'Недоступно');
    return;
  }

  setText('battery', 'Определяем...');

  navigator
    .getBattery()
    .then((battery) => {
      const updateBattery = () => {
        const level = Math.round(battery.level * 100);
        const status = battery.charging ? 'заряжается' : 'разряжается';
        setText('battery', `${level}% · ${status}`);
      };

      updateBattery();
      battery.addEventListener('levelchange', updateBattery);
      battery.addEventListener('chargingchange', updateBattery);
    })
    .catch(() => {
      setText('battery', 'Не удалось получить данные');
    });
}

function setupConnectionListeners() {
  if (!connection) return;
  connection.addEventListener('change', () => {
    updateConnectionInfo();
    updateOnlineStatus();
  });
}

function setupOnlineListeners() {
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
}

function initDiagnostics() {
  cacheDiagElements();
  updateLanguageInfo();
  updateHardwareInfo();
  updateTimeZoneInfo();
  updateDisplayMetrics();
  updateVisibilityState();
  updateNavigationInfo();
  updateOnlineStatus();
  updateConnectionInfo();
  updateReferrer();
  setupBatteryInfo();
  setupGeoLocation();
  updateStorageUsage();
  fetchIpDetails();
  setupConnectionListeners();
  setupOnlineListeners();

  window.addEventListener('resize', updateDisplayMetrics);
  if (window.screen?.orientation?.addEventListener) {
    window.screen.orientation.addEventListener('change', updateDisplayMetrics);
  }
  document.addEventListener('visibilitychange', updateVisibilityState);

  if (document.readyState === 'complete') {
    updatePerformanceMetrics();
  } else {
    window.addEventListener('load', updatePerformanceMetrics);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  cards.forEach((card, index) => {
    card.style.animationDelay = `${index * 120}ms`;
    card.classList.add('fade-in');
  });

  initDiagnostics();
});
