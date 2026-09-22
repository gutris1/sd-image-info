window._ ??= id => document.getElementById(id);
window.$ ??= s => document.querySelector(s);
window.$$ ??= s => document.querySelectorAll(s);

const sdimginfoS = 'sdimginfo-style', sdimginfoC = 'sdimginfo-config', sdimginfoA = 'sdimginfo-anim';
let SDImageInfoImageViewer = null, SDImageInfoNonLocal = false;

onUiLoaded(() => {
  if (_('tab_SDImageInfo')) {
    SDImageInfoCreateSetting();

    const column = _('SDImageInfo-Column'),
    row = _('SDImageInfo-Row'),
    imgPanel = _('SDImageInfo-Image'),
    outputPanel = _('SDImageInfo-Output-Panel'),
    htmlPanel = _('SDImageInfo-HTML'),
    envInfo = _('SDImageInfo-ENV'),

    clearButton = SDImgInfoEL('div', {
      id: 'SDImageInfo-Clear-Button',
      title: SDImageInfoTranslation('clear_image', 'Clear Image'),
      html: SDImageInfoSVG.cross(),
      onclick: () => window.SDImageInfoClearImage()
    }),

    infoSpinner = SDImgInfoEL('div', { id: 'SDImageInfo-Spinner', html: SDImageInfoSVG.spinner() }),
    imgFrame = SDImgInfoEL('div', { id: 'SDImageInfo-Image-Frame' }),
    customWrap = SDImgInfoEL('div', { id: 'SDImageInfo-Custom-Wrapper', append: [imgFrame, clearButton] }),
    tabFrame = SDImgInfoEL('div', { id: 'SDImageInfo-Tab-Frame' }),
    arrow = SDImgInfoEL('div', { id: 'SDImageInfo-Arrow', html: SDImageInfoSVG.arrow() }),
    imgArea = SDImgInfoEL('div', { id: 'SDImageInfo-img-area', onclick: () => $('#SDImageInfo-Image img')?.click() }),
    outputHTML = SDImgInfoEL('div', { id: 'SDImageInfo-Output-HTML', class: 'prose' }),

    syncConfig = () => $(`#SDImageInfo-Config-Radio input[value="${window.SDImageInfoStyle}" i]`).closest('label').click(),

    gearWrapper = SDImgInfoEL('div', { id: 'SDImageInfo-Gear-Wrapper' }),
    gearButton = SDImgInfoEL('div', {
      id: 'SDImageInfo-Gear-Button',
      title: SDImageInfoTranslation('setting_title', 'Setting'),
      html: SDImageInfoSVG.gear(),
      onclick: e => {
        const cC = '#SDImageInfo-Config-Column';
        if (e.target.closest(cC)) return;

        syncConfig();
        [gearButton.querySelector(cC), gearButton].forEach(el => el.classList.add(sdimginfoC));
      }
    }),

    sendButton = _('SDImageInfo-SendButton');
    sendButton?.querySelectorAll('button').forEach(btn => btn.onclick = () => SDImageInfoSendButton(btn.id));

    document.addEventListener('click', e => {
      if (e.target?.closest?.('#tab_settings-button')) syncConfig();

      const configColumn = _('SDImageInfo-Config-Column');
      if (!configColumn?.classList.contains(sdimginfoC)) return;

      const l = [
        '#SDImageInfo-Config-Column',
        '#SDImageInfo-Gear-Button',
        '#setting_sd_image_info_layout',
        '#SDImageInfo-Setting-Apply-Button'
      ].some(s => e.target?.closest?.(s));

      if (l) return;

      [configColumn, gearButton].forEach(i => i.classList.remove(sdimginfoC));
      setTimeout(syncConfig, 300);
    });

    gearWrapper.append(gearButton),
    imgPanel.append(infoSpinner, gearWrapper, customWrap),
    column.append(arrow, tabFrame),
    htmlPanel.replaceChildren(envInfo, imgArea, outputHTML);

    const exitButton = SDImgInfoEL('div', { id: 'SDImageInfo-Image-Viewer-Exit-Button', html: SDImageInfoSVG.cross(), onclick: (e) => (e.stopPropagation(), window.SDImageInfoImageViewerExit()) }),
    controls = SDImgInfoEL('div', { id: 'SDImageInfo-Image-Viewer-Control', append: exitButton }),
    imgWrapper = SDImgInfoEL('div', { id: 'SDImageInfo-Image-Viewer-Wrapper' }),
    lightBox = SDImgInfoEL('div', { id: 'SDImageInfo-Image-Viewer', tabindex: 0, append: [controls, imgWrapper] });
    document.body.append(lightBox);

    lightBox.onkeydown = e => e.key === 'Escape' && (e.preventDefault(), e.stopPropagation(), window.SDImageInfoImageViewerExit());

    ['drop', 'dragover'].forEach(t =>
      document.addEventListener(t, e => {
        const row = _('SDImageInfo-Row'),
        dropArea = $('#SDImageInfo-Image > .image-container .boundedheight');

        if (_('tab_SDImageInfo').style.display !== 'block') return;
        e.preventDefault();
        if (SDImageInfoImageViewer) return;

        const area = row.contains(e.target); if (!area) return;

        if (t === 'drop' && dropArea) {
          const ev = new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: e.dataTransfer });
          dropArea.dispatchEvent(ev);
        }
      })
    );

    window.SDImageInfoClearImage = () => {
      const imgColumn = _('SDImageInfo-Image-Column'),
      gr3 = $('#SDImageInfo-Image > div > div > div > button:nth-child(2)'),
      gr4 = $('.gradio-container-4-40-0 #SDImageInfo-Image > div > div > button'),
      btn = gr3 || gr4;
      btn && (
        imgColumn.classList.add('popup'), setTimeout(() => imgColumn.classList.remove('popup'), 310),
        btn.click(),
        window.SDImageInfoRawOutput = window.SharedParserPostProcessingInfo = window.SharedParserExtrasInfo = '',
        document.removeEventListener('keydown', window.SDimageInfoKeydown, true)
      );
    };

    window.SDimageInfoKeydown = function(e) {
      const Tab = _('tab_SDImageInfo'),
      outputPanel = _('SDImageInfo-Output-Panel');

      if (Tab?.style.display !== 'block') return;

      if (e.key === 'Escape') {
        if (SDImageInfoImageViewer) return;
        e.preventDefault();
        e.stopPropagation();
        if ($('#SDImageInfo-Image img')) window.SDImageInfoClearImage();
      }

      const Scroll = e.key === 'ArrowUp' ? 0 : e.key === 'ArrowDown' ? outputPanel.scrollHeight : null;
      Scroll !== null && (e.preventDefault(), outputPanel.scrollTo({ top: Scroll, behavior: 'smooth' }));
    };

    SDImageInfoTabChange();
    SDImageInfoArrowEvent(arrow);

    outputPanel.addEventListener('scroll', window.SDImageInfoArrow);
    window.addEventListener('resize', SDImageInfoTabLayout);

    typeof SDHubGetTranslation === 'function' && SDImageInfoTranslate();

    let rT;
    new ResizeObserver(() => (clearTimeout(rT), rT = setTimeout(window.SDImageInfoArrow, 20))).observe(outputHTML);

    SDImageInfoNonLocal = envInfo.textContent === 'True';

    SharedImageInfo('SDImageInfo', {
      translate: (k, f) => SDImageInfoTranslation(k, f),
      rawOutput: () => window.SDImageInfoRawOutput,
      elements: () => ({ sendButton: sendButton, outputPanel: outputPanel }),
      classes: () => ({ outputDisplay: 'sdimginfo-display-output-panel', outputFail: 'sdimginfo-display-output-fail' })
    });
  }
});

function SDImageInfoArrowEvent(arrow) {
  let locked = false;

  const panel = () => _('SDImageInfo-Output-Panel');

  arrow.onclick = () => {
    if (locked) return;

    locked = true;
    arrow.classList.remove(sdimginfoS);

    const p = panel();
    p.scrollTo({ top: p.scrollHeight, behavior: 'smooth' });

    const check = () => p.scrollTop + p.clientHeight >= p.scrollHeight - 5
      ? (locked = false, window.SDImageInfoArrow())
      : requestAnimationFrame(check);

    requestAnimationFrame(check);
  };

  window.SDImageInfoArrow = () => {
    if (locked) return;

    const p = panel(), { scrollTop: sT, scrollHeight: sH, clientHeight: cH } = p;
    if (!cH) return arrow.classList.remove(sdimginfoS);
    arrow.classList.toggle(sdimginfoS, sH > cH + 1 && sT + cH < sH - 5);
  };

  window.addEventListener('resize', window.SDImageInfoArrow);
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
    const e = $(el);
    if (!e) return;
    const t = SDImageInfoTranslation(key, e.textContent);
    e.tagName === 'INPUT' || e.tagName === 'TEXTAREA' ? e.placeholder = t : e.textContent = t;
  });
}

function SDImageInfoTabLayout() {
  const Tab = _('tab_SDImageInfo'), Nav = $('.tabs.gradio-tabs');
  if (Tab?.style.display !== 'block') return;

  const rect = Nav.getBoundingClientRect(),
  top = +(rect.top + scrollY + rect.height).toFixed(2),
  height = +(document.body.clientHeight - top).toFixed(2);

  Object.assign(Tab.style, { top: `${top}px`, height: `${height}px` });
}

function SDImageInfoTabChange() {
  const styleId = 'SDImageInfo-HideScrollBar',

  tabId = 'tab_SDImageInfo',
  tabNav = $('#tabs > .tab-nav'),
  footer = _('footer'),

  css = `
    ::-webkit-scrollbar {
      width: 0 !important;
      height: 0 !important;
    }
  `,

  TabChange = (Id, ON, OFF) => {
    const tab = _(Id),
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

      [footer, tabNav].forEach(el => el?.classList.add(sdimginfoS));
      document.documentElement.style.scrollbarWidth = 'none';

      if (!_(styleId)) {
        document.head.appendChild(SDImgInfoEL('style', { id: styleId, html: css }));
      }
    },
    () => {
      [footer, tabNav].forEach(el => el?.classList.remove(sdimginfoS));
      document.documentElement.style.scrollbarWidth = '';
      _(styleId)?.remove();
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

// viewer ⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻

function SDImageInfoDisplayImageViewer(imgEL) {
  const lightBox = _('SDImageInfo-Image-Viewer'),
  controls = lightBox.querySelector('#SDImageInfo-Image-Viewer-Control'),
  imgWrapper = lightBox.querySelector('#SDImageInfo-Image-Viewer-Wrapper'),
  imgId = 'SDImageInfo-Image-Viewer-img',

  noScroll = 'sdimginfo-body-dont-scroll';

  if (SDImageInfoImageViewer) {
    SDImageInfoImageViewer.clearEV();
    SDImageInfoImageViewer = null;
  }

  lightBox.style.display = 'flex';
  lightBox.focus();

  _(imgId)?.remove();
  const img = SDImgInfoEL('img', { id: imgId, src: imgEL.src });
  imgWrapper.prepend(img);

  setTimeout(() => requestAnimationFrame(() => {
    lightBox.classList.add(sdimginfoS);
    setTimeout(() => imgWrapper.classList.add(sdimginfoS), 50);
  }, 100));

  const closing = () => {
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

// parser ⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻

async function SDImageInfoParser() {
  const Tab = _('tab_SDImageInfo'),
  RawOutput = $('#SDImageInfo-Geninfo textarea'),
  Column = _('SDImageInfo-Column'),
  Row = _('SDImageInfo-Row'),
  outputHTML = _('SDImageInfo-Output-HTML'),
  ImagePanel = _('SDImageInfo-Image'),
  img = ImagePanel.querySelector('img'),
  gearButton = _('SDImageInfo-Gear-Button'),
  spinner = _('SDImageInfo-Spinner');

  if (!img) {
    outputHTML.innerHTML = await SharedPlainTextToHTML('SDImageInfo', '');
    [Tab, Column, Row, ImagePanel].forEach(el => el.classList.remove(sdimginfoS));
    spinner.className = gearButton.className = '';
    return;
  }

  [Tab, Column, Row, ImagePanel].forEach(el => el.classList.add(sdimginfoS));
  gearButton.classList.add(sdimginfoA);
  setTimeout(() => gearButton.classList.remove(sdimginfoA), 100);

  if (SDImageInfoNonLocal) {
    spinner.style.display = 'flex';
    requestAnimationFrame(() => spinner.classList.add(sdimginfoA));
  }

  img.onclick = img.onauxclick = e => (e.button === 0 || e.button === 1) && (e.preventDefault(), SDImageInfoDisplayImageViewer(img));
  img.ondrag = img.ondragend = img.ondragstart = (e) => (e.stopPropagation(), e.preventDefault());
  img.onload = () => {
    img.style.opacity = '1';
    spinner.classList.remove(sdimginfoA)
    setTimeout(() => spinner.style.display = '', 800);
    setTimeout(() => document.addEventListener('keydown', window.SDimageInfoKeydown, true), 100);
  };

  const output = await SharedImageParser(img, true);
  window.SDImageInfoRawOutput = RawOutput.value = output;
  updateInput(RawOutput);
  outputHTML.innerHTML = await SharedPlainTextToHTML('SDImageInfo', output);
}

function SDImageInfoSendButton(id) {
  const OutputRaw = window.SDImageInfoRawOutput,

  ADetailer = (id) => {
    const i = `script_${id.replace('_tab', '')}_adetailer_ad_main_accordion-visible-checkbox`,
    cb = _(i);
    if (cb && !cb.checked) cb.click();
  },

  mahiro = (id) => {
    const i = `#${id.replace('_tab', '')}_script_container span`,
    cb = Array.from($$(i)).find(s => s.textContent.trim() === 'Enable Mahiro CFG')?.previousElementSibling;
    if (cb && !cb.checked) cb.click();
  };

  if (['txt2img_tab', 'img2img_tab'].includes(id)) {
    if (OutputRaw?.includes('ADetailer model')) ADetailer(id);
    if (OutputRaw?.includes('mahiro_cfg_enabled: True')) mahiro(id);
  }

  if ($('.gradio-container-4-40-0') && id.includes('extras_tab'))
    setTimeout(() => _('tab_extras-button').click(), 500);
}

// setting ⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻⸻

async function SDImageInfoCreateSetting() {
  const settingColumn = _('column_settings_SDImageInfo-Setting');

  if (settingColumn) {
    async function getStyle() {
      const hao = ['classic', 'neo'],
      v = $('#footer .versions > a:nth-child(1)'),
      n = v?.textContent?.toLowerCase() || '';
      if (hao.some(s => n.includes(s))) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        return opts.sd_image_info_layout;
      }

      for (;;) {
        if (window.opts && Object.keys(window.opts).length) { return window.opts.sd_image_info_layout; }
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    let style = await getStyle();
    SDImageInfoLayout(style);
    window.SDImageInfoStyle = style;
    $(`#SDImageInfo-Config-Radio input[value="${window.SDImageInfoStyle}" i]`).closest('label').click()

    const gearButton = _('SDImageInfo-Gear-Button'),
    configColumn = _('SDImageInfo-Config-Column'),

    applyButton = id => SDImgInfoEL('button', {
      id,
      class: 'lg primary gradio-button svelte-cmf5ev',
      text: 'Apply',
      title: 'apply the style immediately',
      onclick: e => {
        e.stopPropagation();

        const t = v => (
          gearButton.style.pointerEvents = gearButton.style.transition =
          gearButton.querySelector('svg').style.transition = configColumn.style.display = v
        );

        t('none');
        [gearButton, configColumn].forEach(i => i.classList.remove(sdimginfoC));
        setTimeout(() => t(''), 300);

        const style = $('#setting_sd_image_info_layout input:checked').value,
        box = $('#SDImageInfo-Box textarea');

        box.value = style;
        updateInput(box);
        SDImageInfoLayout(style);
      }
    }),

    applyButtonTab = applyButton('SDImageInfo-Apply-Button'),
    applyButtonSettingTab = applyButton('SDImageInfo-Setting-Apply-Button'),

    applyWrap1 = SDImgInfoEL('div', { id: 'SDImageInfo-Tab-Setting-Button-Wrapper', append: applyButtonTab }),
    applyWrap2 = SDImgInfoEL('div', { id: 'SDImageInfo-Setting-Button-Wrapper', append: applyButtonSettingTab }),

    preview = (n, f) => SDImgInfoEL('img', {
      id: `SDImageInfo-Setting-Preview-${n}`,
      class: 'sdimginfo-setting-preview',
      src: `${window.SDImageInfoFilePath}example/${f}?ts=${Date.now()}`
    }),

    preview1 = preview(1, 'fullwidth.jpg'),
    preview2 = preview(2, 'sidebyside.jpg'),
    previewWrap = SDImgInfoEL('div', { id: 'SDImageInfo-Setting-Preview-Wrapper', append: [preview1, preview2] }),

    previewChange = () => {
      const v = $('#setting_sd_image_info_layout input:checked')?.value;
      preview1.style.display = v === 'full width' ? 'flex' : '';
      preview2.style.display = v === 'default' ? 'flex' : '';
    };

    settingColumn.prepend(previewWrap), settingColumn.append(applyWrap2);
    previewChange();

    $$('#setting_sd_image_info_layout input').forEach(input => {input.onchange = () => previewChange();});

    configColumn.append(applyWrap1), gearButton.append(configColumn);
    SDImageInfoRadioSync();
  }
}

function SDImageInfoLayout(style) {
  window.SDImageInfoStyle = style;
  _('tab_SDImageInfo').classList.toggle('sdimginfo-fullwidth', style === 'full width');
}

function SDImageInfoRadioSync() {
  let S = false;

  const configRadio = _('SDImageInfo-Config-Radio'),
  settingRadio = _('setting_sd_image_info_layout');

  [configRadio, settingRadio].forEach(f => {
    const t = f === configRadio ? settingRadio : configRadio;
    f.querySelectorAll('input[type="radio"]').forEach((input, n) => {
      input.onchange = () => S || (S = true, t.querySelectorAll('input[type="radio"]')[n]?.click(), S = false);
    });
  });
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
</svg>`,

  cross: () => `
<svg width="35px" height="35px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" xml:space="preserve"
stroke="currentColor" style="fill-rule: evenodd; clip-rule: evenodd; stroke-linecap: round; stroke-linejoin: round;">
<path d="M3.5,3.5L20.5,20.5" style="fill: none; fill-rule: nonzero; stroke-width: 5px;"/>
<path d="M20.5,3.5L3.5,20.5" style="fill: none; fill-rule: nonzero; stroke-width: 5px;"/>
</svg>`,

  gear: () => `
<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" height="100%" width="100%" viewBox="0 0 32 32">
<path d="M27.758,10.366 l-1-1.732 c-0.552-0.957-1.775-1.284-2.732-0.732 L23.5,8.206 C21.5,9.36,19,7.917,19,5.608 V5 c0-1.105-0.895-2-2-2 h-2 c-1.105,0-2,0.895-2,2 v0.608 c0,2.309-2.5,3.753-4.5,2.598 L7.974,7.902
C7.017,7.35,5.794,7.677,5.242,8.634 l-1,1.732 c-0.552,0.957-0.225,2.18,0.732,2.732 L5.5,13.402 c2,1.155,2,4.041,0,5.196 l-0.526,0.304 c-0.957,0.552-1.284,1.775-0.732,2.732 l1,1.732 c0.552,0.957,1.775,1.284,2.732,0.732
L8.5,23.794 c2-1.155,4.5,0.289,4.5,2.598 V27 c0,1.105,0.895,2,2,2 h2 c1.105,0,2-0.895,2-2 v-0.608 c0-2.309,2.5-3.753,4.5-2.598 l0.526,0.304 c0.957,0.552,2.18,0.225,2.732-0.732 l1-1.732 c0.552-0.957,0.225-2.18-0.732-2.732
L26.5,18.598 c-2-1.155-2-4.041,0-5.196 l0.526-0.304 C27.983,12.546,28.311,11.323,27.758,10.366 z M16,20 a4,4 0 1,1 0,-8 a4,4 0 1,1 0,8 z"
fill="currentColor" stroke="" stroke-width="2"/>
</svg>`,

  arrow: () => `
<svg height="100%" width="100%" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xml:space="preserve">
<polygon fill="currentColor" points="95.936,214.656 256,378.016 416.064,214.656 366.096,165.856 256,278.208 145.904,165.856"/>
</svg>`
};