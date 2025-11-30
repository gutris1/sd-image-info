const sdimginfoS = 'sdimginfo-style';
let SDImageInfoImageViewer = null

onUiLoaded(() => {
  if (document.getElementById('tab_SDImageInfo')) {
    SDImageInfoCreateSetting();

    const sendButton = document.getElementById('SDImageInfo-SendButton');
    sendButton?.querySelectorAll('button').forEach(btn => btn.onclick = () => SDImageInfoSendButton(btn.id));

    window.SDImageInfoClearImage = () => {
      const gr3 = document.querySelector('#SDImageInfo-Image > div > div > div > button:nth-child(2)'),
      gr4 = document.querySelector('.gradio-container-4-40-0 #SDImageInfo-Image > div > div > button'),
      btn = gr3 || gr4;
      btn && (
        btn.click(),
        window.SDImageInfoRawOutput = '',
        document.removeEventListener('keydown', window.SDimageInfoKeydown)
      );
    };

    const column = document.getElementById('SDImageInfo-Column'),
    imgInfo = document.getElementById('SDImageInfo-Image'),
    panel = document.getElementById('SDImageInfo-Output-Panel'),

    clearButton = SDImgInfoEL('div', {
      id: 'SDImageInfo-Clear-Button',
      title: SDImageInfoTranslation('clear_image', 'Clear Image'),
      html: SDImageInfoSVG.cross(),
      onclick: () => window.SDImageInfoClearImage()
    }),

    imgFrame = SDImgInfoEL('div', { id: 'SDImageInfo-Image-Frame' }),
    customWrap = SDImgInfoEL('div', { id: 'SDImageInfo-Custom-Wrapper', append: [imgFrame, clearButton] }),
    frame = SDImgInfoEL('div', { id: 'SDImageInfo-Frame' }),

    gearButton = SDImgInfoEL('div', {
      id: 'SDImageInfo-Gear-Button',
      title: SDImageInfoTranslation('setting_title', 'Setting'),
      html: SDImageInfoSVG.gear(),
      onclick: () => {
        [['#tab_settings #settings .tab-nav button', 'SD Image Info'], ['#tabs .tab-nav button', 'Settings']]
        .forEach(([el, text]) => [...document.querySelectorAll(el)].find(btn => btn.textContent.trim() === text)?.click());
      }
    });

    imgInfo.append(gearButton, customWrap, frame);

    const arrow = SDImgInfoEL('div', { id: 'SDImageInfo-Arrow', html: SDImageInfoSVG.arrow() });
    column.append(arrow);
    SDImageInfoArrowScroll(arrow);

    const imgArea = SDImgInfoEL('div', { id: 'SDImageInfo-img-area', onclick: () => document.querySelector('#SDImageInfo-Image img')?.click() });
    panel.prepend(imgArea);

    document.getElementById('SDImageInfo-HTML')?.classList.add('prose');

    const exitButton = SDImgInfoEL('div', { id: 'SDImageInfo-Image-Viewer-Exit-Button', html: SDImageInfoSVG.cross(), onclick: (e) => (e.stopPropagation(), window.SDImageInfoImageViewerExit()) }),
    controls = SDImgInfoEL('div', { id: 'SDImageInfo-Image-Viewer-Control', append: exitButton }),
    imgWrapper = SDImgInfoEL('div', { id: 'SDImageInfo-Image-Viewer-Wrapper' });
    lightBox = SDImgInfoEL('div', { id: 'SDImageInfo-Image-Viewer', tabindex: 0, append: [controls, imgWrapper] }),
    document.body.append(lightBox);

    ['drop', 'dragover'].forEach(t =>
      document.addEventListener(t, e => {
        const Tab = document.getElementById('tab_SDImageInfo'),
        lightBox = document.getElementById('SDImageInfo-Image-Viewer'),
        column = document.getElementById('SDImageInfo-Column'),
        form = column.querySelector('.form'),
        imgColumn = document.getElementById('SDImageInfo-Image-Column'),
        imgArea = document.getElementById('SDImageInfo-img-area'),
        panel = document.getElementById('SDImageInfo-Output-Panel'),
        imgCon = document.querySelector('#SDImageInfo-Image > .image-container');

        if (Tab?.style.display !== 'block' || lightBox?.style.display === 'flex') return;

        const el =
          e.target?.id === column?.id || e.target?.id === form?.id || e.target?.id === imgColumn?.id || 
          e.target?.id === imgArea?.id || e.target?.id === panel?.id || e.target?.classList?.contains('sdimageinfo-output-content');

        if (!el) return;
        e.preventDefault();

        if (t === 'drop') {
          const dropArea = imgCon?.querySelector('.boundedheight');
          if (dropArea) {
            const dropEvent = new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: e.dataTransfer });
            dropArea.dispatchEvent(dropEvent);
          }
        }
      })
    );

    window.SDimageInfoKeydown = function(e) {
      const Tab = document.getElementById('tab_SDImageInfo'),
      lightBox = document.getElementById('SDImageInfo-Image-Viewer'),
      column = document.getElementById('SDImageInfo-Column'),
      panel = document.getElementById('SDImageInfo-Output-Panel');

      if (Tab?.style.display !== 'block') return;

      const img = document.querySelector('#SDImageInfo-Image img');

      if (e.key === 'Escape') {
        e.preventDefault();
        if (lightBox?.style.display === 'flex') return;
        if (img) window.SDImageInfoClearImage();
      }

      const el = window.SDImageInfoStyle === 'side by side' ? panel : column,
      Scroll = e.key === 'ArrowUp' ? 0 : e.key === 'ArrowDown' ? el.scrollHeight : null;
      if (Scroll !== null) { e.preventDefault(); el.scrollTo({ top: Scroll, behavior: 'smooth' }); }
    };

    typeof SDHubGetTranslation === 'function' && SDImageInfoTranslate();
    window.addEventListener('resize', SDImageInfoTabLayout);
    SDImageInfoTabChange();
  }
});

function SDImageInfoDisplayImageViewer(imgEL) {
  const lightBox = document.getElementById('SDImageInfo-Image-Viewer'),
  controls = lightBox.querySelector('#SDImageInfo-Image-Viewer-Control'),
  imgWrapper = lightBox.querySelector('#SDImageInfo-Image-Viewer-Wrapper'),

  noScroll = 'sdimageinfo-body-dont-scroll',
  imgId = 'SDImageInfo-Image-Viewer-img';

  if (SDImageInfoImageViewer) {
    SDImageInfoImageViewer.cleanup();
    SDImageInfoImageViewer = null;
  }

  lightBox.style.display = 'flex';
  lightBox.focus();

  document.getElementById(imgId)?.remove();
  const img = SDImgInfoEL('img', { id: imgId, src: imgEL.src });
  imgWrapper.prepend(img);

  setTimeout(() => requestAnimationFrame(() => {
    lightBox.classList.add(sdimginfoS);
    setTimeout(() => imgWrapper.classList.add(sdimginfoS), 50);
  }, 100));

  setTimeout(() => {
    lightBox.onkeydown = (e) => {
      if (e.key === 'Escape') window.SDImageInfoImageViewerExit();
    };
  }, 400);

  const closing = () => {
    lightBox.onkeydown = null;
    document.body.classList.remove(noScroll);
    imgWrapper.classList.remove(sdimginfoS);
    SDImageInfoImageViewer = null;
  };

  SDImageInfoImageViewer = new SDImageScriptsViewer(img, lightBox, controls, {
    dragStart: () => controls.classList.add(sdimginfoS),
    dragEnd: () => controls.classList.remove(sdimginfoS),
    exitStart: () => lightBox.classList.remove(sdimginfoS),
    exitEnd: closing
  });

  window.SDImageInfoImageViewerExit = () => SDImageInfoImageViewer?.close();
}

const SDImageInfoTranslation = (k, f) => {
  if (typeof SDHubGetTranslation === 'function') {
    const t = SDHubGetTranslation(k);
    return (t && t !== k) ? t : f;
  }
  return f;
};

function SDImageInfoTranslate() {
  const EL = [
    { el: '#SDImageInfo-SendButton > #txt2img_tab', key: 'send_txt2img' },
    { el: '#SDImageInfo-SendButton > #img2img_tab', key: 'send_img2img' },
    { el: '#SDImageInfo-SendButton > #inpaint_tab', key: 'send_inpaint' },
    { el: '#SDImageInfo-SendButton > #extras_tab', key: 'send_extras' }
  ];

  EL.forEach(({ el, key }) => {
    const e = document.querySelector(el);
    if (!e) return;
    const t = SDImageInfoTranslation(key, e.textContent);
    e.tagName === 'INPUT' || e.tagName === 'TEXTAREA' ? e.placeholder = t : e.textContent = t;
  });
}

function SDImageInfoTabLayout() {
  const Tab = document.getElementById('tab_SDImageInfo'),
  Nav = document.querySelector('.tabs.gradio-tabs');

  if (Tab?.style.display !== 'block') return;

  const rect = Nav.getBoundingClientRect(),
  top = +(rect.top + scrollY + rect.height).toFixed(2),
  height = +(document.body.clientHeight - top).toFixed(2);

  Object.assign(Tab.style, { top: `${top}px`, height: `${height}px` });
}

function SDImageInfoTabChange() {
  const styleId = 'SDImageInfo-HideScrollBar',

  tabId = 'tab_SDImageInfo',
  tabNav = document.querySelector('#tabs > .tab-nav'),
  footer = document.getElementById('footer'),

  css = `
    ::-webkit-scrollbar {
      width: 0 !important;
      height: 0 !important;
    }
  `,

  TabChange = (Id, ON, OFF) => {
    const tab = document.getElementById(Id),
    check = () => {
      const d = window.getComputedStyle(tab).display !== 'none';
      if (d !== tab.__l) { tab.__l = d; d ? ON?.(tab) : OFF?.(tab); }
    };

    check();

    const obs = new MutationObserver(check);
    obs.observe(tab, { attributes: true, attributeFilter: ['style'] });
  };

  TabChange(tabId,
    () => {
      SDImageInfoTabLayout();
      setTimeout(() => window.SDImageInfoArrowScrolling?.(), 0);

      [footer, tabNav].forEach(el => el?.classList.add(sdimginfoS));
      document.documentElement.style.scrollbarWidth = 'none';

      if (!document.getElementById(styleId)) {
        document.head.appendChild(SDImgInfoEL('style', { id: styleId, html: css }));
      }
    },
    () => {
      [footer, tabNav].forEach(el => el?.classList.remove(sdimginfoS));
      document.documentElement.style.scrollbarWidth = '';
      document.getElementById(styleId)?.remove();
    }
  );
}

document.addEventListener('DOMContentLoaded', () => {
  const getRunningScript = () => new Error().stack.match(/file=[^ \n]*\.js/)?.[0],
  path = getRunningScript()?.match(/file=[^\/]+\/[^\/]+\//)?.[0];
  if (path) window.SDImageInfoFilePath = path;
});

function SDImgInfoEL(t, o = {}) {
  const l = document.createElement(t);
  for (const [k, v] of Object.entries(o)) {
    if (k === 'class') l.className = Array.isArray(v) ? v.join(' ') : v;
    else if (k === 'style' && typeof v === 'object') Object.assign(l.style, v);
    else if (k === 'html') l.innerHTML = v;
    else if (k === 'text') l.textContent = v;
    else if (k === 'append') l.append(...(Array.isArray(v) ? v : [v]));
    else if (k === 'dataset') Object.assign(l.dataset, v);
    else if (k in l) l[k] = v;
    else l.setAttribute(k, v);
  }
  return l;
}

const SDImageInfoSVG = {
  spinner: () => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="100" height="100">
<path fill="currentColor" d="M 24.3 17.1 C 24.3 25.9 31.5 33.1 40.3 33.1 C 41.3 33.1 42.3 33 43.3 32.8 L 44 36.7 C 42.8 37 41.6 37.1 40.3 37.1 C 29.2 37.1
20.3 28.1 20.3 17.1 C 20.3 12.3 22 7.6 25.1 4 L 28.1 6.6 C 25.8 9.5 24.3 13.1 24.3 17.1 Z" style="transform-origin: 32.15px 20.55px;" transform="matrix(-1, 0, 0, -1, 0.000002, 0)"/>
<path fill="currentColor" d="M 23.2 43.8 L 20.1 41.3 C 22.3 38.5 23.7 35 23.7 31.1 C 23.7 22.3 16.5 15.1 7.7 15.1
C 6.7 15.1 5.7 15.2 4.7 15.4 L 4 11.6 C 5.3 11.4 6.5 11.3 7.7 11.3 C 18.8 11.3 27.7 20.2 27.7 31.3 C 27.7 35.7 26.1 40.3 23.2 43.8 Z"
style="transform-origin: 15.85px 27.55px;" transform="matrix(-1, 0, 0, -1, 0.000003, 0.000001)"/>
<polygon fill="currentColor" points="4 19 17 17.3 6.3 7" style="transform-origin: 10.5px 13px;" transform="matrix(-1, 0, 0, -1, -0.000003, 0.000001)"/>
<polygon fill="currentColor" points="44 29 31 30.7 41.7 41" style="transform-origin: 37.5px 35px;" transform="matrix(-1, 0, 0, -1, -0.000005, -0.000003)"/>
</svg>
  `,

  cross: () => `
<svg width="100%" height="100%" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" xml:space="preserve"
stroke="currentColor" style="fill-rule: evenodd; clip-rule: evenodd; stroke-linecap: round; stroke-linejoin: round;">
<g transform="matrix(1.14096,-0.140958,-0.140958,1.14096,-0.0559523,0.0559523)">
<path d="M18,6L6.087,17.913" style="fill: none; fill-rule: nonzero; stroke-width: 5px;"/>
</g>
<path d="M4.364,4.364L19.636,19.636" style="fill: none; fill-rule: nonzero; stroke-width: 5px;"/>
</svg>
  `,

  gear: () => `
<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" height="100%" width="100%" viewBox="0 0 32 32">
<path d="M27.758,10.366 l-1-1.732 c-0.552-0.957-1.775-1.284-2.732-0.732 L23.5,8.206 C21.5,9.36,19,7.917,19,5.608 V5 c0-1.105-0.895-2-2-2 h-2 c-1.105,0-2,0.895-2,2 v0.608 c0,2.309-2.5,3.753-4.5,2.598 L7.974,7.902
C7.017,7.35,5.794,7.677,5.242,8.634 l-1,1.732 c-0.552,0.957-0.225,2.18,0.732,2.732 L5.5,13.402 c2,1.155,2,4.041,0,5.196 l-0.526,0.304 c-0.957,0.552-1.284,1.775-0.732,2.732 l1,1.732 c0.552,0.957,1.775,1.284,2.732,0.732
L8.5,23.794 c2-1.155,4.5,0.289,4.5,2.598 V27 c0,1.105,0.895,2,2,2 h2 c1.105,0,2-0.895,2-2 v-0.608 c0-2.309,2.5-3.753,4.5-2.598 l0.526,0.304 c0.957,0.552,2.18,0.225,2.732-0.732 l1-1.732 c0.552-0.957,0.225-2.18-0.732-2.732
L26.5,18.598 c-2-1.155-2-4.041,0-5.196 l0.526-0.304 C27.983,12.546,28.311,11.323,27.758,10.366 z M16,20 a4,4 0 1,1 0,-8 a4,4 0 1,1 0,8 z"
fill="currentColor" stroke="" stroke-width="2"/>
</svg>
  `,

  arrow: () => `
<svg height="100%" width="100%" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xml:space="preserve">
<polygon fill="currentColor" points="95.936,214.656 256,378.016 416.064,214.656 366.096,165.856 256,278.208 145.904,165.856"/>
</svg>
  `
};