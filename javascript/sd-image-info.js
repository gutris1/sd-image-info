onUiLoaded(() => {
  if (document.getElementById('tab_SDImageInfo-Tab')) {
    const sendButton = document.getElementById('SDImageInfo-SendButton');
    sendButton?.querySelectorAll('#txt2img_tab, #img2img_tab').forEach(btn => {
      btn.onclick = () => SDImageInfoSendButton(btn.id.replace('_tab', ''));
    });

    SDImageInfoCreateSetting();
    SDImageInfoCreateSomething();
    onUiUpdate(SDImageInfoTabChange);
    window.addEventListener('resize', SDImageInfoTabLayout);
  }
});

function SDImageInfoCreateSomething() {
  let Tab = document.getElementById('tab_SDImageInfo-Tab');
  let column = document.getElementById('SDImageInfo-Column');
  let imgCon = document.querySelector('#SDImageInfo-Image > .image-container');
  let panel = document.getElementById('SDImageInfo-Output-Panel');
  let LightBox = document.getElementById('SDImageInfo-Image-Viewer');

  const customWrap = document.createElement('div');
  customWrap.id = 'SDImageInfo-Custom-Wrapper';

  const frame = document.createElement('div');
  frame.id = 'SDImageInfo-Frame';

  const imgFrame = document.createElement('div');
  imgFrame.id = 'SDImageInfo-Image-Frame';

  const gearButton = document.createElement('div');
  gearButton.id = 'SDImageInfo-Gear-Button';
  gearButton.innerHTML = SDImageInfoGearSVG;

  gearButton.onclick = () => {
    const setting = Array.from(document.querySelectorAll('#tab_settings #settings .tab-nav button')).find(button => button.textContent.trim() === 'SD Image Info');
    const tab = Array.from(document.querySelectorAll('#tabs .tab-nav button')).find(button => button.textContent.trim() === 'Settings');
    if (setting) (setting.click(), tab.click());
  };

  const clearButton = document.createElement('div');
  clearButton.id = 'SDImageInfo-Clear-Button';
  clearButton.title = 'Exit';
  clearButton.innerHTML = SDImageInfoCrossSVG;

  window.SDImageInfoClearImage = () => {
    const btn = document.querySelector('#SDImageInfo-Image > div > div > div > button:nth-child(2)') ||
                document.querySelector('.gradio-container-4-40-0 #SDImageInfo-Image > div > div > button');
    btn && (btn.click(), window.SDImageInfoRawOutput = '');
  };

  clearButton.onclick = () => window.SDImageInfoClearImage();

  customWrap.append(imgFrame, gearButton, clearButton);
  imgCon.append(customWrap, frame);

  const arrow = document.createElement('div');
  arrow.id = 'SDImageInfo-Arrow';
  arrow.innerHTML = SDImageInfoArrowSVG;

  column.append(arrow);
  SDImageInfoArrowScroll(arrow);

  const imgArea = document.createElement('div');
  imgArea.id = 'SDImageInfo-img-area'
  imgArea.onclick = () => document.querySelector('#SDImageInfo-Image img')?.click();
  panel.prepend(imgArea);

  ['drop', 'dragover'].forEach(t => document.addEventListener(t, e =>
    Tab?.style.display === 'block' && LightBox?.style.display !== 'flex' &&
    (e.target.id === imgArea.id || e.target.classList?.contains('sdimageinfo-output-content')) &&
    (e.preventDefault(), t === 'drop' && imgCon.querySelector('.boundedheight')?.dispatchEvent(new DragEvent('drop', {
      bubbles: true, cancelable: true, dataTransfer: e.dataTransfer })))
    )
  );

  document.addEventListener('keydown', (e) => {
    if (Tab?.style.display !== 'block' || LightBox?.style.display === 'flex') return;
    const img = document.querySelector('#SDImageInfo-Image img');
    if (e.key === 'Escape' && img) { e.preventDefault(); window.SDImageInfoClearImage(); }
    const Scroll = e.key === 'ArrowUp' ? 0 : e.key === 'ArrowDown' ? column.scrollHeight : null;
    if (Scroll !== null) { e.preventDefault(); column.scrollTo({ top: Scroll, behavior: 'smooth' }); }
  });
}

function SDImageInfoArrowScroll(arrow) {
  let clicked = false;

  const whichEL = () => {
    const column = document.getElementById('SDImageInfo-Column');
    const panel = document.getElementById('SDImageInfo-Output-Panel');
    return (panel && panel.scrollHeight > panel.clientHeight) ? panel : column;
  };

  arrow.onclick = () => {
    clicked = true;
    arrow.style.transform = '';
    const el = whichEL();
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    setTimeout(() => clicked = false, 500);
  };

  window.SDImageInfoArrowScrolling = () => {
    if (clicked) return;
    const el = whichEL();
    if (!el) return arrow.style.transform = '';
    requestAnimationFrame(() => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const overflow = scrollHeight > clientHeight + 1;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 5;
      arrow.style.transform = overflow && !atBottom ? 'scale(1)' : '';
    });
  };

  ['SDImageInfo-Column', 'SDImageInfo-Output-Panel'].forEach(id =>
    document.getElementById(id)?.addEventListener('scroll', window.SDImageInfoArrowScrolling)
  );

  ['scroll', 'resize'].forEach(e => window.addEventListener(e, () => setTimeout(window.SDImageInfoArrowScrolling, 50)));
}

async function SDImageInfoParser() {
  const RawOutput = document.querySelector('#SDImageInfo-Geninfo textarea');
  const Column = document.getElementById('SDImageInfo-Column');
  const HTMLPanel = document.getElementById('SDImageInfo-HTML');
  const ImagePanel = document.getElementById('SDImageInfo-Image');
  const img = ImagePanel.querySelector('img');

  let imgEnter = 'sdimageinfo-img-enter';

  if (!img) {
    HTMLPanel.innerHTML = await SDImageInfoPlainTextToHTML('');
    Column.classList.remove(imgEnter);
    ImagePanel.classList.remove(imgEnter);
    setTimeout(() => window.SDImageInfoArrowScrolling(), 0);
    return;
  }

  Column.classList.add(imgEnter);
  ImagePanel.classList.add(imgEnter);
  img.onclick = () => SDImageInfoImageViewer(img);
  img.onload = () => img.style.opacity = '1';

  const output = await SDImageParser(img);
  RawOutput.value = output;
  updateInput(RawOutput);
  window.SDImageInfoRawOutput = output;
  HTMLPanel.classList.add('prose');
  HTMLPanel.innerHTML = await SDImageInfoPlainTextToHTML(output);

  setTimeout(() => window.SDImageInfoArrowScrolling(), 0);

  document.querySelectorAll('.sdimageinfo-output-section').forEach(s => {
    const bg = 'var(--input-background-fill)';
    const t = s.querySelector('.sdimageinfo-output-title');
    const w = s.querySelector('.sdimageinfo-output-wrapper');
    if (!t || !w) return;
    const c = t.classList.contains('sdimageinfo-copybutton');
    w.onmouseenter = () => w.style.background = t.style.background = bg;
    w.onmouseleave = () => w.style.background = t.style.background = '';
    t.onmouseenter = () => !c ? (t.style.background = w.style.background = bg) : (w.style.background = bg);
    t.onmouseleave = () => !c ? (t.style.background = w.style.background = '') : (w.style.background = '');
  });
}

async function SDImageInfoPlainTextToHTML(inputs) {
  const EncryptInfo = window.SDImageParserEncryptInfo;
  const Sha256Info = window.SDImageParserSha256Info;
  const NaiSourceInfo = window.SDImageParserNaiSourceInfo;
  const SoftwareInfo = window.SDImageParserSoftwareInfo;

  const Column = document.getElementById('SDImageInfo-Column');
  const SendButton = document.getElementById('SDImageInfo-SendButton');
  const OutputPanel = document.getElementById('SDImageInfo-Output-Panel');

  const columnOverflow = 'sdimageinfo-column-overflow';

  const titleEL = [
    { id: 'Prompt', label: 'Prompt', title: 'Copy Prompt' },
    { id: 'NegativePrompt', label: 'Negative Prompt', title: 'Copy Negative Prompt' },
    { id: 'Params', label: 'Parameters', title: 'Copy Parameters' },
    { id: 'Encrypt', label: 'Encrypt' },
    { id: 'Sha256', label: 'EncryptPwdSha' },
    { id: 'Software', label: 'Software' },
    { id: 'Source', label: 'Source' }
  ];

  const titles = {};

  titleEL.forEach(({ id, label, title }) => {
    const button = !!title;
    const attrs = [
      button ? `id='SDImageInfo-${id}-Button'` : '',
      `class='sdimageinfo-output-title${button ? ' sdimageinfo-copybutton' : ''}'`,
      button ? `title='${title}'` : '',
      button ? `onclick='SDImageInfoCopyButtonEvent(event)'` : ''
    ].filter(Boolean).join(' ');

    titles[`title${id}`] = `<div ${attrs}>${label}</div>`;
  });

  let titlePrompt = titles.titlePrompt;
  let titleNegativePrompt = titles.titleNegativePrompt;
  let titleParams = titles.titleParams;
  let titleEncrypt = titles.titleEncrypt;
  let titleSha = titles.titleSha256;
  let titleSoftware = titles.titleSoftware;
  let titleSource = titles.titleSource;

  let titleModels = '';
  let br = /\n/g;

  let outputHTML = '';
  let promptText = '';
  let negativePromptText = '';
  let paramsText = '';
  let modelOutput = '';

  function SDImageInfoHTMLOutput(title, content) {
    const none = title === 'nothing', con = title === titleModels || none;
    const tent = con ? content : `<div class='sdimageinfo-output-wrapper'><div class='sdimageinfo-output-content'>${content}</div></div>`;
    return `<div class='sdimageinfo-output-section'${none ? " style='height: 100%'" : ''}>${none ? '' : title}${tent}</div>`;
  }

  if (inputs === undefined || inputs === null || inputs.trim() === '') {
    Column.classList.remove(columnOverflow);
    OutputPanel.classList.remove('display-output-panel', 'display-output-fail');
    SendButton.style.display = '';

  } else {
    Column.classList.add(columnOverflow);
    OutputPanel.classList.add('display-output-panel');

    if (inputs.trim().includes('Nothing To See Here') || inputs.trim().includes('Nothing To Read Here')) {
      OutputPanel.classList.add('display-output-fail');
      titlePrompt = '';
      SendButton.style.display = '';
      const none = `<div class='sdimageinfo-output-failed' style='position: absolute; bottom: 0;'>${inputs}</div>`;
      outputHTML = SDImageInfoHTMLOutput('nothing', none);

    } else if (inputs.trim().startsWith('OPPAI:')) {
      const sections = [ { title: titleEncrypt, content: EncryptInfo }, { title: titleSha, content: Sha256Info } ];
      sections.forEach(section => {
        if (section.content && section.content.trim() !== '') outputHTML += SDImageInfoHTMLOutput(section.title, section.content);
      });
      outputHTML += SDImageInfoHTMLOutput('', inputs);

    } else {
      SendButton.style.display = 'grid';
      inputs = inputs.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(br, '<br>');
      inputs = inputs.replace(/Seed:\s?(\d+),/gi, function(match, seedNumber) {
        return `<span id='SDImageInfo-Seed-Button' title='Copy Seed Value' onclick='SDImageInfoCopyButtonEvent(event)'>Seed</span>: ${seedNumber},`;
      });

      const negativePromptIndex = inputs.indexOf('Negative prompt:');
      const stepsIndex = inputs.indexOf('Steps:');
      const hashesIndex = inputs.indexOf('Hashes:');

      if (negativePromptIndex !== -1) promptText = inputs.substring(0, negativePromptIndex).trim();
      else if (stepsIndex !== -1) promptText = inputs.substring(0, stepsIndex).trim();
      else promptText = inputs.trim();

      if (negativePromptIndex !== -1 && stepsIndex !== -1 && stepsIndex > negativePromptIndex) {
        negativePromptText = inputs.slice(negativePromptIndex + 'Negative prompt:'.length, stepsIndex).trim();
      }

      if (stepsIndex !== -1) {
        const hashesEX = inputs.slice(hashesIndex).match(/Hashes:\s*(\{.*?\})(,\s*)?/);
        paramsRAW = inputs.slice(stepsIndex).trim();
        paramsText = inputs.slice(stepsIndex).trim().replace(/,\s*(Lora hashes|TI hashes):\s*'[^']+'/g, '').trim();

        let Id = 'SDImageInfo-Model-Output';
        let display = 'sdimageinfo-display-model-output';
        modelOutput = `<div id='${Id}'>${SDImageInfoSpinnerSVG}</div>`;

        const modelBox = document.getElementById(Id);
        if (modelBox) modelBox.innerHTML = modelOutput;

        setTimeout(async () => {
          const modelBox = document.getElementById(Id);
          try {
            const links = await SDImageParserFetchModelOutput(paramsRAW);
            modelBox.classList.add(display);
            modelBox.innerHTML = links;
            setTimeout(() => modelBox.classList.remove(display), 2000);
          } catch (error) {
            modelBox.innerHTML = '<div class="sdimageinfo-output-failed">Failed to fetch...</div>';
          }
          setTimeout(() => window.SDImageInfoArrowScrolling(), 0);
        }, 500);

        if (hashesEX && hashesEX[1]) paramsText = paramsText.replace(hashesEX[0], '').trim();
        if (paramsText.endsWith(',')) paramsText = paramsText.slice(0, -1).trim();

      } else {
        paramsText = inputs.trim();
      }

      const sections = [
        { title: titlePrompt, content: promptText },
        { title: titleNegativePrompt, content: negativePromptText },
        { title: titleParams, content: paramsText },
        { title: titleSoftware, content: SoftwareInfo },
        { title: titleModels, content: modelOutput },
        { title: titleEncrypt, content: EncryptInfo },
        { title: titleSha, content: Sha256Info },
        { title: titleSource, content: NaiSourceInfo }
      ];

      sections.forEach(section => {
        if (section.content?.trim() !== '') outputHTML += SDImageInfoHTMLOutput(section.title, section.content);
      });
    }
  }

  return `${outputHTML}`;
}

function SDImageInfoSendButton(Id) {
  let OutputRaw = window.SDImageInfoRawOutput;
  let ADmodel = OutputRaw?.includes('ADetailer model');
  let cb = document.getElementById(`script_${Id}_adetailer_ad_main_accordion-visible-checkbox`);
  if (ADmodel) cb?.checked === false && cb.click();
}

function SDImageInfoCopyButtonEvent(e) {
  let OutputRaw = window.SDImageInfoRawOutput;

  const CopyText = (text, target) => {
    const content = target.closest('.sdimageinfo-output-section')?.querySelector('.sdimageinfo-output-content');
    content?.classList.add('sdimageinfo-borderpulse');
    setTimeout(() => content?.classList.remove('sdimageinfo-borderpulse'), 2000);
    navigator.clipboard.writeText(text);
  };

  if (e.target?.id) {
    const { id } = e.target;
    const stepsStart = OutputRaw.indexOf('Steps:');
    const negStart = OutputRaw.indexOf('Negative prompt:');
    const seedMatch = OutputRaw.match(/Seed:\s?(\d+),/i);

    const text = {
      'SDImageInfo-Prompt-Button': () => OutputRaw.substring(0, [negStart, stepsStart].find(i => i !== -1) || OutputRaw.length).trim(),
      'SDImageInfo-NegativePrompt-Button': () => negStart !== -1 && stepsStart > negStart ? OutputRaw.slice(negStart + 16, stepsStart).trim() : null,
      'SDImageInfo-Params-Button': () => stepsStart !== -1 ? OutputRaw.slice(stepsStart).trim() : null,
      'SDImageInfo-Seed-Button': () => seedMatch?.[1]?.trim() || null
    }[id]?.();

    if (text) CopyText(text, e.target);
  }
}

function SDImageInfoTabLayout() {
  const Tab = document.getElementById('tab_SDImageInfo-Tab');
  const Frame = document.getElementById('SDImageInfo-Frame');
  const imgFrame = document.getElementById('SDImageInfo-Image-Frame');
  const Nav = document.querySelector('.tabs.gradio-tabs');

  if (Tab?.style.display !== 'block') return;

  const rect = Nav.getBoundingClientRect();
  const top = +(rect.top + scrollY + rect.height).toFixed(2);
  const height = +(document.body.clientHeight - top).toFixed(2);

  Object.assign(Tab.style, { top: `${top}px`, height: `${height}px` });
  Object.assign(Frame.style, { top: `${top}px`, height: `${height}px` });
  Object.assign(imgFrame.style, { top: `${top}px`, height: `${height}px` });
}

function SDImageInfoTabChange() {
  const id = 'SDImageInfo-HideScrollBar';
  const MainTab = document?.querySelector('#tabs > .tab-nav > button.selected')?.textContent.trim();
  const tabNav = document.querySelector('.tab-nav.scroll-hide');

  if (MainTab === 'Image Info') {
    SDImageInfoTabLayout();
    setTimeout(() => window.SDImageInfoArrowScrolling(), 0);
    if (tabNav) tabNav.style.borderBottom = '0';
    document.documentElement.style.scrollbarWidth = 'none';

    if (!document.getElementById(id)) {
      const sb = document.createElement('style');
      sb.id = id;
      sb.textContent = `::-webkit-scrollbar { width: 0 !important; height: 0 !important; }`;
      document.head.appendChild(sb);
    }

  } else {
    if (tabNav) tabNav.style.borderBottom = '';
    document.documentElement.style.scrollbarWidth = '';
    document.getElementById(id)?.remove();
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  window.getRunningScript = () => new Error().stack.match(/file=[^ \n]*\.js/)?.[0];
  const path = getRunningScript()?.match(/file=[^\/]+\/[^\/]+\//)?.[0];
  if (path) window.SDImageInfoFilePath = path;

  const vars = [
    { c: '--input-background-fill', to: '--sdimageinfo-output-bg', a: 0.6 },
  ];

  const css = await (await fetch('/theme.css')).text();
  const get = s => Object.fromEntries((css.match(new RegExp(`${s}\\s*{([^}]*)}`, 'm'))?.[1] || '').split(';').map(l => l.trim().split(':').map(s => s.trim())).filter(([k, v]) => k && v));
  const aHex = (hex, a) => {
    if (!hex || !/^#([0-9a-f]{6})$/i.test(hex)) return hex;
    const alpha = Math.round(a * 255).toString(16).padStart(2, '0');
    return hex + alpha;
  };
  const r = get(':root'), d = get('.dark'), S = document.createElement('style');
  vars.forEach(({ c, to, a }) => { S.textContent += `:root { ${to}: ${aHex(r[c], a)}; }\n`; S.textContent += `.dark { ${to}: ${aHex(d[c], a)}; }\n`; });
  document.head.append(S);

  if (/firefox/i.test(navigator.userAgent)) {
    const bg = document.createElement('style');
    bg.innerHTML = `#SDImageInfo-Image-Viewer { backdrop-filter: none !important; }`;
    document.body.append(bg);
  }
});