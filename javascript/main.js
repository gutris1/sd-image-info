let sdimginfoS = 'sdimginfo-style';

onUiLoaded(() => {
  if (document.getElementById('tab_SDImageInfo')) {
    SDImageInfoCreateSetting();

    const sendButton = document.getElementById('SDImageInfo-SendButton');
    sendButton?.querySelectorAll('button').forEach(btn => btn.onclick = () => SDImageInfoSendButton(btn.id));

    window.SDImageInfoClearImage = () => {
      const gradio3 = document.querySelector('#SDImageInfo-Image > div > div > div > button:nth-child(2)'),
      gradio4 = document.querySelector('.gradio-container-4-40-0 #SDImageInfo-Image > div > div > button'),
      btn = gradio3 || gradio4;
      btn && (btn.click(), window.SDImageInfoRawOutput = '');
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
    customWrap = SDImgInfoEL('div', { id: 'SDImageInfo-Custom-Wrapper', children: [imgFrame, clearButton] }),
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

    const LightBox = SDImgInfoEL('div', { id: 'SDImageInfo-Image-Viewer', tabindex: 0 }),
    Control = SDImgInfoEL('div', { id: 'SDImageInfo-Image-Viewer-Control' }),
    exitButton = SDImgInfoEL('div', { id: 'SDImageInfo-Image-Viewer-Exit-Button', html: SDImageInfoCrossSVG, onclick: window.SDImageInfoImageViewerExit }),
    Wrapper = SDImgInfoEL('div', { id: 'SDImageInfo-Image-Viewer-Wrapper' });
    Control.prepend(exitButton), LightBox.append(Control, Wrapper), document.body.append(LightBox);

    ['drop', 'dragover'].forEach(t =>
      document.addEventListener(t, e => {
        const Tab = document.getElementById('tab_SDImageInfo'),
        LightBox = document.getElementById('SDImageInfo-Image-Viewer'),
        column = document.getElementById('SDImageInfo-Column'),
        form = column.querySelector('.form'),
        imgColumn = document.getElementById('SDImageInfo-Image-Column'),
        imgArea = document.getElementById('SDImageInfo-img-area'),
        panel = document.getElementById('SDImageInfo-Output-Panel'),
        imgCon = document.querySelector('#SDImageInfo-Image > .image-container');

        if (Tab?.style.display !== 'block' || LightBox?.style.display === 'flex') return;

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

    document.addEventListener('keydown', (e) => {
      const Tab = document.getElementById('tab_SDImageInfo'),
      LightBox = document.getElementById('SDImageInfo-Image-Viewer'),
      column = document.getElementById('SDImageInfo-Column');

      if (Tab?.style.display !== 'block') return;

      const img = document.querySelector('#SDImageInfo-Image img');
      if (e.key === 'Escape') {
        e.preventDefault();
        if (LightBox?.style.display === 'flex') return window.SDImageInfoImageViewerExit();
        if (img) window.SDImageInfoClearImage();
      }

      const Scroll = e.key === 'ArrowUp' ? 0 : e.key === 'ArrowDown' ? column.scrollHeight : null;
      if (Scroll !== null) { e.preventDefault(); column.scrollTo({ top: Scroll, behavior: 'smooth' }); }
    });

    typeof SDHubGetTranslation === 'function' && SDImageInfoTranslate();
    window.addEventListener('resize', SDImageInfoTabLayout);
    SDImageInfoTabChange();
  }
});

async function SDImageInfoParser() {
  const Tab = document.getElementById('tab_SDImageInfo'),
  RawOutput = document.querySelector('#SDImageInfo-Geninfo textarea'),
  Column = document.getElementById('SDImageInfo-Column'),
  HTMLPanel = document.getElementById('SDImageInfo-HTML'),
  ImagePanel = document.getElementById('SDImageInfo-Image'),
  img = ImagePanel.querySelector('img'),
  gear = document.getElementById('SDImageInfo-Gear-Button');

  if (!img) {
    window.SharedParserPostProcessingInfo = window.SharedParserExtrasInfo = '';
    HTMLPanel.innerHTML = await SDImageInfoPlainTextToHTML('');
    [Tab, Column, ImagePanel, gear].forEach(el => el.classList.remove(sdimginfoS));
    setTimeout(() => window.SDImageInfoArrowScrolling(), 0);
    return;
  }

  [Tab, Column, ImagePanel, gear].forEach(el => el.classList.add(sdimginfoS));
  setTimeout(() => gear.classList.remove(sdimginfoS), 1200);
  img.onclick = () => SDImageInfoImageViewer(img);
  img.onload = () => img.style.opacity = '1';

  const output = await SharedImageParser(img);
  window.SDImageInfoRawOutput = RawOutput.value = output;
  updateInput(RawOutput);
  HTMLPanel.innerHTML = await SDImageInfoPlainTextToHTML(output);
}

async function SDImageInfoPlainTextToHTML(inputs) {
  const { SharedParserExtrasInfo: ExtrasInfo, SharedParserPostProcessingInfo: PostProcessingInfo,
          SharedParserEncryptInfo: EncryptInfo, SharedParserSha256Info: Sha256Info, SharedParserNaiSourceInfo: NaiSourceInfo,
        } = window,

  Column = document.getElementById('SDImageInfo-Column'),
  SendButton = document.getElementById('SDImageInfo-SendButton'),
  OutputPanel = document.getElementById('SDImageInfo-Output-Panel'),

  columnOverflow = 'sdimageinfo-column-overflow',
  outputDisplay = 'sdimageinfo-display-output-panel',
  outputFail = 'sdimageinfo-display-output-fail',

  createTitle = (id, label, copyBtn = false, fl = '', ft = '') => {
    const L = SDImageInfoTranslation(label, fl),
    C = copyBtn ? SDImageInfoTranslation(`copy_${label}`, ft) : ft,

    att = [
      copyBtn && `id='SDImageInfo-${id}-Button'`,
      `class='sdimageinfo-output-title${copyBtn ? ' sdimageinfo-copybutton' : ''}'`,
      copyBtn && `title='${C}'`,
      copyBtn && `onclick='SDImageInfoCopyButtonEvent(event)'`
    ].filter(Boolean).join(' ');

    return `<div ${att}>${L}</div>`;
  },

  titles = {
    prompt: createTitle('Prompt', 'prompt', true, 'Prompt', 'Copy Prompt'),
    negativePrompt: createTitle('NegativePrompt', 'negative_prompt', true, 'Negative Prompt', 'Copy Negative Prompt'),
    params: createTitle('Params', 'parameters', true, 'Parameters', 'Copy Parameters'),
    postProcessing: createTitle('PostProcessing', 'post_processing', false, 'Post Processing'),
    encrypt: createTitle('Encrypt', 'encrypt', false, 'Encrypt'),
    sha: createTitle('Sha256', 'encryptpwdsha', false, 'EncryptPwdSha'),
    software: createTitle('Software', 'software', false, 'Software'),
    source: createTitle('Source', 'source', false, 'Source'),
    models: ''
  },

  createSection = (title, content) => {
    if (!content?.trim()) return '';
    const empty = title === 'nothing', model = title === titles.models, wrapper = !empty && !model,
    text = wrapper ? `<div class='sdimageinfo-output-wrapper'><div class='sdimageinfo-output-content'>${content}</div></div>` : content,
    extra = model ? ' sdimageinfo-output-models-section' : '';
    return `<div class='sdimageinfo-output-section${extra}'${empty ? " style='height: 100%'" : ''}>${empty ? '' : title}${text}</div>`;
  };

  if (!inputs?.trim() && !(window.SharedParserExtrasInfo?.trim() || window.SharedParserPostProcessingInfo?.trim())) {
    Column.classList.remove(columnOverflow);
    OutputPanel.classList.remove(outputDisplay, outputFail);
    SendButton.classList.remove(outputDisplay);
    return '';
  }

  Column.classList.add(columnOverflow);
  OutputPanel.classList.add(outputDisplay);

  if (inputs.trim().includes('Nothing To See Here') || inputs.trim().includes('Nothing To Read Here')) {
    OutputPanel.classList.add(outputFail);
    SendButton.classList.remove(outputDisplay);
    const failContent = `<div class='sdimageinfo-output-failed' style='position: absolute; bottom: 0;'>${inputs}</div>`;
    return createSection('nothing', failContent);
  }

  if (inputs.trim().startsWith('OPPAI:')) {
    let output = '';
    if (EncryptInfo?.trim()) output += createSection(titles.encrypt, EncryptInfo);
    if (Sha256Info?.trim()) output += createSection(titles.sha, Sha256Info);
    output += createSection('', inputs);
    return output;
  }

  SendButton.classList.add(outputDisplay);

  let process = inputs
    .replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>').replace(/Seed:\s?(\d+),/gi, (_, seedNumber) => 
      `<span id='SDImageInfo-Seed-Button' title='${SDImageInfoTranslation("copy_seed", "Copy Seed")}' onclick='SDImageInfoCopyButtonEvent(event)'>Seed</span>: ${seedNumber},`
    );

  const negativePromptIndex = process.indexOf('Negative prompt:'),
  stepsIndex = process.indexOf('Steps:'),
  hashesIndex = process.indexOf('Hashes:');

  let promptText = '', negativePromptText = '', paramsText = '', modelOutput = '';

  if (negativePromptIndex !== -1) promptText = process.substring(0, negativePromptIndex).trim();
  else if (stepsIndex !== -1) promptText = process.substring(0, stepsIndex).trim();
  else promptText = process.trim();

  if (negativePromptIndex !== -1 && stepsIndex !== -1 && stepsIndex > negativePromptIndex) {
    negativePromptText = process.slice(negativePromptIndex + 'Negative prompt:'.length, stepsIndex).trim();
  }

  if (stepsIndex !== -1) {
    const paramsRAW = process.slice(stepsIndex).trim();
    paramsText = paramsRAW.replace(/,\s*(Lora hashes|TI hashes):\s*"[^"]+"/g, '').trim();

    const hashes = process.slice(hashesIndex).match(/Hashes:\s*(\{.*?\})(,\s*)?/);
    if (hashes?.[1]) paramsText = paramsText.replace(hashes[0], '').trim();
    if (paramsText.endsWith(',')) paramsText = paramsText.slice(0, -1).trim();

    modelOutput = `<div id='SDImageInfo-Spinner-Wrapper'><div id='SDImageInfo-Spinner'>${SDImageInfoSpinnerSVG}</div></div>`;

    setTimeout(async () => {
      const modelsBox = OutputPanel.querySelector('.sdimageinfo-output-models-section');
      if (modelsBox) {
        try {
          const links = await SharedModelsFetch(paramsRAW);
          if (!links?.trim()) return modelsBox.remove();

          modelsBox.innerHTML = links;
        } catch {
          modelsBox.innerHTML = '<div class="sdimageinfo-output-failed">Failed to fetch...</div>';
        }
        setTimeout(() => window.SDImageInfoArrowScrolling(), 0);
      }
    }, 500);

  } else {
    paramsText = process.trim();
  }

  const sections = [
    [titles.prompt, promptText], [titles.negativePrompt, negativePromptText], [titles.params, paramsText], [titles.models, modelOutput],
    [titles.postProcessing, ExtrasInfo], [titles.postProcessing, PostProcessingInfo], [titles.software, window.SharedParserSoftwareInfo],
    [titles.encrypt, EncryptInfo], [titles.sha, Sha256Info], [titles.source, NaiSourceInfo]
  ];

  return sections.filter(([_, content]) => content?.trim()).map(([title, content]) => createSection(title, content)).join('');
}

function SDImageInfoSendButton(id) {
  if (['txt2img_tab', 'img2img_tab'].includes(id)) {
    const OutputRaw = window.SDImageInfoRawOutput,
    ADmodel = OutputRaw?.includes('ADetailer model'),
    mahiro = OutputRaw?.includes('mahiro_cfg_enabled: True');

    if (ADmodel) {
      const i = `script_${id.replace('_tab', '')}_adetailer_ad_main_accordion-visible-checkbox`,
      cb = document.getElementById(i);
      if (cb && !cb.checked) cb.click();
    }

    if (mahiro) {
      const i = `#${id.replace('_tab', '')}_script_container span`,
      cb = Array.from(document.querySelectorAll(i)).find(s => s.textContent.trim() === 'Enable Mahiro CFG')?.previousElementSibling;
      if (cb && !cb.checked) cb.click();
    }
  }

  if (document.querySelector('.gradio-container-4-40-0') && id.includes('extras_tab'))
    setTimeout(() => document.getElementById('tab_extras-button').click(), 500);
}

function SDImageInfoCopyButtonEvent(e) {
  const OutputRaw = window.SDImageInfoRawOutput,

  CopyText = (text, target) => {
    const content = target.closest('.sdimageinfo-output-section')?.querySelector('.sdimageinfo-output-content');
    content?.classList.add('sdimageinfo-borderpulse');
    setTimeout(() => content?.classList.remove('sdimageinfo-borderpulse'), 2000);
    navigator.clipboard.writeText(text);
  };

  if (e.target?.id) {
    const { id } = e.target,

    stepsStart = OutputRaw.indexOf('Steps:'),
    negStart = OutputRaw.indexOf('Negative prompt:'),
    seedMatch = OutputRaw.match(/Seed:\s?(\d+),/i),

    text = {
      'SDImageInfo-Prompt-Button': () => OutputRaw.substring(0, [negStart, stepsStart].find(i => i !== -1) || OutputRaw.length).trim(),
      'SDImageInfo-NegativePrompt-Button': () => negStart !== -1 && stepsStart > negStart ? OutputRaw.slice(negStart + 16, stepsStart).trim() : null,
      'SDImageInfo-Params-Button': () => stepsStart !== -1 ? OutputRaw.slice(stepsStart).trim() : null,
      'SDImageInfo-Seed-Button': () => seedMatch?.[1]?.trim() || null
    }[id]?.();

    if (text) CopyText(text, e.target);
  }
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

function SDImageInfoImageViewer(img) {
  const LightBox = document.getElementById('SDImageInfo-Image-Viewer'),
  Control = LightBox.querySelector('#SDImageInfo-Image-Viewer-Control'),
  Wrapper = LightBox.querySelector('#SDImageInfo-Image-Viewer-Wrapper'),

  scroll = 'sdimageinfo-body-dont-scroll',
  pointer = 'sdimageinfo-pointer-events-none',
  imgId = 'SDImageInfo-Image-Viewer-img';

  LightBox.style.display = 'flex';
  LightBox.focus();

  document.getElementById(imgId)?.remove();
  const imgEL = SDImgInfoEL('img', { id: imgId, src: img.src });
  Wrapper.prepend(imgEL);

  requestAnimationFrame(() => setTimeout(() => {
    LightBox.classList.add(sdimginfoS);
    setTimeout(() => Wrapper.style.transform = 'translate(0px, 0px) scale(1)', 50);
  }, 50));

  const imageViewer = SharedImageViewer(imgEL, LightBox, Control, Wrapper, {
    noScroll: scroll, noPointer: pointer,
    onLightboxClose: () => LightBox.classList.remove(sdimginfoS)
  });

  window.SDImageInfoImageViewerExit = imageViewer.state.close;
}

document.addEventListener('DOMContentLoaded', async () => {
  window.getRunningScript = () => new Error().stack.match(/file=[^ \n]*\.js/)?.[0];
  const path = getRunningScript()?.match(/file=[^\/]+\/[^\/]+\//)?.[0];
  if (path) window.SDImageInfoFilePath = path;

  if (/firefox/i.test(navigator.userAgent)) {
    const bg = SDImgInfoEL('style', { id: id, html: `#SDImageInfo-Image-Viewer { backdrop-filter: none !important; }` });
    document.body.append(bg);
  }
});

function SDImgInfoEL(t, o = {}) {
  const l = document.createElement(t);
  for (const [k, v] of Object.entries(o)) {
    if (k === 'class') l.className = Array.isArray(v) ? v.join(' ') : v;
    else if (k === 'style' && typeof v === 'object') Object.assign(l.style, v);
    else if (k === 'html') l.innerHTML = v;
    else if (k === 'text') l.textContent = v;
    else if (k === 'children') (Array.isArray(v) ? v : [v]).forEach(child => l.appendChild(child));
    else if (k === 'dataset') Object.assign(l.dataset, v);
    else if (k in l) l[k] = v;
    else l.setAttribute(k, v);
  }
  return l;
}