const sdimginfoS = 'sdimginfo-style';

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
      html: SDImageInfoCrossSVG,
      onclick: () => window.SDImageInfoClearImage()
    }),

    imgFrame = SDImgInfoEL('div', { id: 'SDImageInfo-Image-Frame' }),
    customWrap = SDImgInfoEL('div', { id: 'SDImageInfo-Custom-Wrapper', append: [imgFrame, clearButton] }),
    frame = SDImgInfoEL('div', { id: 'SDImageInfo-Frame' }),

    gearButton = SDImgInfoEL('div', {
      id: 'SDImageInfo-Gear-Button',
      title: SDImageInfoTranslation('setting_title', 'Setting'),
      html: SDImageInfoGearSVG,
      onclick: () => {
        [['#tab_settings #settings .tab-nav button', 'SD Image Info'], ['#tabs .tab-nav button', 'Settings']]
        .forEach(([el, text]) => [...document.querySelectorAll(el)].find(btn => btn.textContent.trim() === text)?.click());
      }
    });

    imgInfo.append(gearButton, customWrap, frame);

    const arrow = SDImgInfoEL('div', { id: 'SDImageInfo-Arrow', html: SDImageInfoArrowSVG });
    column.append(arrow);
    SDImageInfoArrowScroll(arrow);

    const imgArea = SDImgInfoEL('div', { id: 'SDImageInfo-img-area', onclick: () => document.querySelector('#SDImageInfo-Image img')?.click() });
    panel.prepend(imgArea);

    document.getElementById('SDImageInfo-HTML')?.classList.add('prose');

    const lightBox = SDImgInfoEL('div', { id: 'SDImageInfo-Image-Viewer', tabindex: 0 }),
    controls = SDImgInfoEL('div', { id: 'SDImageInfo-Image-Viewer-Control' }),
    exitButton = SDImgInfoEL('div', { id: 'SDImageInfo-Image-Viewer-Exit-Button', html: SDImageInfoCrossSVG, onclick: window.SDImageInfoImageViewerExit }),
    imgWrapper = SDImgInfoEL('div', { id: 'SDImageInfo-Image-Viewer-Wrapper' });
    controls.prepend(exitButton), lightBox.append(controls, imgWrapper), document.body.append(lightBox);

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

function SDImageInfoImageViewer(imgEL) {
  const lightBox = document.getElementById('SDImageInfo-Image-Viewer'),
  controls = lightBox.querySelector('#SDImageInfo-Image-Viewer-Control'),
  imgWrapper = lightBox.querySelector('#SDImageInfo-Image-Viewer-Wrapper'),

  noScroll = 'sdimageinfo-body-dont-scroll',
  imgId = 'SDImageInfo-Image-Viewer-img';

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
  },

  viewer = SharedImageViewer(img, lightBox, {
    dragStart: () => controls.classList.add(sdimginfoS),
    dragEnd: () => controls.classList.remove(sdimginfoS),
    exitStart: () => lightBox.classList.remove(sdimginfoS),
    exitEnd: closing
  });

  window.SDImageInfoImageViewerExit = viewer.state.close;
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

document.addEventListener('DOMContentLoaded', async () => {
  window.getRunningScript = () => new Error().stack.match(/file=[^ \n]*\.js/)?.[0];
  const path = getRunningScript()?.match(/file=[^\/]+\/[^\/]+\//)?.[0];
  if (path) window.SDImageInfoFilePath = path;

  const css = `
    :root {
      --sdimginfo-viewer-background: rgb(200 200 200 / 90%) !important;
    }

    .dark {
      --sdimginfo-viewer-background: rgb(0 0 0 / 90%) !important;
    }

    #SDImageInfo-Image-Viewer {
      backdrop-filter: none !important;
    }
  `;

  if (/firefox/i.test(navigator.userAgent)) {
    document.body.append(SDImgInfoEL('style', { id: 'SDImageInfo-Styles', html: css }));
  }
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