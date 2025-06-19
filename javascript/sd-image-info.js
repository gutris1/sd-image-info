onUiLoaded(() => {
  if (document.getElementById('tab_SDImageInfo-Tab')) {
    const sendButton = document.getElementById('SDImageInfo-SendButton');
    sendButton?.querySelectorAll('#txt2img_tab, #img2img_tab').forEach(btn => {
      btn.onclick = () => SDImageInfoSendButton(btn.id.replace('_tab', ''));
    });

    SDImageInfoCreateSetting();
    SDImageInfoCreateSomething();
    SDImageInfoCreateLightBox();
    onUiUpdate(SDImageInfoTabChange);
    window.addEventListener('resize', SDImageInfoTabLayout);
  }
});

async function SDImageInfoParser() {
  const Tab = document.getElementById('tab_SDImageInfo-Tab');
  const RawOutput = document.querySelector('#SDImageInfo-Geninfo textarea');
  const Column = document.getElementById('SDImageInfo-Column');
  const HTMLPanel = document.getElementById('SDImageInfo-HTML');
  const ImagePanel = document.getElementById('SDImageInfo-Image');
  const img = ImagePanel.querySelector('img');

  let imgEnter = 'sdimageinfo-img-enter';

  if (!img) {
    HTMLPanel.innerHTML = await SDImageInfoPlainTextToHTML('');
    [Tab, Column, ImagePanel].forEach(el => el.classList.remove(imgEnter));
    setTimeout(() => window.SDImageInfoArrowScrolling(), 0);
    return;
  }

  [Tab, Column, ImagePanel].forEach(el => el.classList.add(imgEnter));
  img.onclick = () => SDImageInfoImageViewer(img);
  img.onload = () => img.style.opacity = '1';

  const output = await SharedImageParser(img);
  window.SDImageInfoRawOutput = RawOutput.value = output;
  updateInput(RawOutput);
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
  const { SharedParserEncryptInfo: EncryptInfo, SharedParserSha256Info: Sha256Info, 
          SharedParserNaiSourceInfo: NaiSourceInfo, SharedParserSoftwareInfo: SoftwareInfo
        } = window;

  const Column = document.getElementById('SDImageInfo-Column');
  const SendButton = document.getElementById('SDImageInfo-SendButton');
  const OutputPanel = document.getElementById('SDImageInfo-Output-Panel');

  const columnOverflow = 'sdimageinfo-column-overflow';
  const outputDisplay = 'sdimageinfo-display-output-panel';
  const outputFail = 'sdimageinfo-display-output-fail';

  const createTitle = (id, label, title = null) => {
    const copyBtn = !!title;
    const att = [
      copyBtn && `id='SDImageInfo-${id}-Button'`,
      `class='sdimageinfo-output-title${copyBtn ? ' sdimageinfo-copybutton' : ''}'`,
      copyBtn && `title='${title}'`,
      copyBtn && `onclick='SDImageInfoCopyButtonEvent(event)'`
    ].filter(Boolean).join(' ');
    return `<div ${att}>${label}</div>`;
  };

  const titles = {
    prompt: createTitle('Prompt', 'Prompt', 'Copy Prompt'),
    negativePrompt: createTitle('NegativePrompt', 'Negative Prompt', 'Copy Negative Prompt'),
    params: createTitle('Params', 'Parameters', 'Copy Parameters'),
    encrypt: createTitle('Encrypt', 'Encrypt'),
    sha: createTitle('Sha256', 'EncryptPwdSha'),
    software: createTitle('Software', 'Software'),
    source: createTitle('Source', 'Source'),
    models: ''
  };

  const createSection = (title, content) => {
    if (!content?.trim()) return '';
    const empty = title === 'nothing';
    const wrapper = title !== titles.models && !empty;
    const text = wrapper ? `<div class='sdimageinfo-output-wrapper'><div class='sdimageinfo-output-content'>${content}</div></div>` : content;
    return `<div class='sdimageinfo-output-section'${empty ? " style='height: 100%'" : ''}>${empty ? '' : title}${text}</div>`;
  };

  if (!inputs?.trim()) {
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
      `<span id='SDImageInfo-Seed-Button' title='Copy Seed Value' onclick='SDImageInfoCopyButtonEvent(event)'>Seed</span>: ${seedNumber},`
    );

  const negativePromptIndex = process.indexOf('Negative prompt:');
  const stepsIndex = process.indexOf('Steps:');
  const hashesIndex = process.indexOf('hashes:');

  let promptText = '';
  let negativePromptText = '';
  let paramsText = '';
  let modelOutput = '';

  if (negativePromptIndex !== -1) promptText = process.substring(0, negativePromptIndex).trim();
  else if (stepsIndex !== -1) promptText = process.substring(0, stepsIndex).trim();
  else promptText = process.trim();

  if (negativePromptIndex !== -1 && stepsIndex !== -1 && stepsIndex > negativePromptIndex) {
    negativePromptText = process.slice(negativePromptIndex + 'Negative prompt:'.length, stepsIndex).trim();
  }

  if (stepsIndex !== -1) {
    const paramsRAW = process.slice(stepsIndex).trim();
    paramsText = paramsRAW.replace(/,\s*(Lora hashes|TI hashes):\s*'[^']+'/g, '').trim();

    const hashes = process.slice(hashesIndex).match(/Hashes:\s*(\{.*?\})(,\s*)?/);
    if (hashes?.[1]) paramsText = paramsText.replace(hashes[0], '').trim();
    if (paramsText.endsWith(',')) paramsText = paramsText.slice(0, -1).trim();

    const modelId = 'SDImageInfo-Model-Output';
    modelOutput = `<div id='${modelId}'>${SDImageInfoSpinnerSVG}</div>`;

    const boxModels = document.getElementById(modelId);
    if (boxModels) boxModels.innerHTML = modelOutput;

    setTimeout(async () => {
      const modelsBox = document.getElementById(modelId);
      if (!modelsBox) return;

      try {
        const links = await SharedModelsFetch(paramsRAW);
        modelsBox.classList.add('sdimageinfo-display-model-output');
        modelsBox.innerHTML = links;
        setTimeout(() => modelsBox.classList.remove('sdimageinfo-display-model-output'), 2000);
      } catch (error) {
        modelsBox.innerHTML = '<div class="sdimageinfo-output-failed">Failed to fetch...</div>';
      }
      setTimeout(() => window.SDImageInfoArrowScrolling(), 0);
    }, 500);

  } else {
    paramsText = process.trim();
  }

  const sections = [
    [titles.prompt, promptText], [titles.negativePrompt, negativePromptText], [titles.params, paramsText],
    [titles.software, SoftwareInfo], [titles.models, modelOutput], [titles.encrypt, EncryptInfo],
    [titles.sha, Sha256Info], [titles.source, NaiSourceInfo]
  ];

  return sections.filter(([_, content]) => content?.trim()).map(([title, content]) => createSection(title, content)).join('');
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
  const Nav = document.querySelector('.tabs.gradio-tabs');

  if (Tab?.style.display !== 'block') return;

  const rect = Nav.getBoundingClientRect();
  const top = +(rect.top + scrollY + rect.height).toFixed(2);
  const height = +(document.body.clientHeight - top).toFixed(2);

  Object.assign(Tab.style, { top: `${top}px`, height: `${height}px` });
}

function SDImageInfoTabChange() {
  const id = 'SDImageInfo-HideScrollBar';
  const MainTab = document?.querySelector('#tabs > .tab-nav > button.selected')?.textContent.trim();
  const tabNav = document.querySelector('.tab-nav.scroll-hide');
  const footer = document.getElementById('footer');
  const tabBlock = 'sdimageinfo-tab-block';

  if (MainTab === 'Image Info') {
    SDImageInfoTabLayout();
    setTimeout(() => window.SDImageInfoArrowScrolling?.(), 0);

    if (tabNav) tabNav.style.borderBottom = '0';
    if (footer) footer.classList.add(tabBlock);
    document.documentElement.style.scrollbarWidth = 'none';

    if (!document.getElementById(id)) {
      const sb = document.createElement('style');
      sb.id = id;
      sb.textContent = `::-webkit-scrollbar { width: 0 !important; height: 0 !important; }`;
      document.head.appendChild(sb);
    }

  } else {
    if (footer) footer.classList.remove(tabBlock);
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