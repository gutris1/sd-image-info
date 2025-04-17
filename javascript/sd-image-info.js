onUiLoaded(function () {
  const sendButton = document.getElementById('SDImageInfo-SendButton');
  sendButton?.querySelectorAll('#txt2img_tab, #img2img_tab').forEach(btn => {
    btn.onclick = () => SDImageInfoSendButton(btn.id.replace('_tab', ''));
  });

  document.addEventListener('keydown', (e) => {
    let Tab = document.getElementById('tab_sd_image_info');
    let img = document.querySelector('#SDImageInfo-Image img');
    if (e.key === 'Escape' && img && Tab?.style.display === 'block') {
      let LightBox = document.getElementById('SDImageInfo-Image-Viewer');
      if (LightBox?.style.display === 'flex') return;
      else (e.stopPropagation(), e.preventDefault(), window.SDImageInfoClearImage());
    }
  });

  const input = document.querySelector('#SDImageInfo-Image input');
  input.parentNode.insertBefore(Object.assign(document.createElement('div'), { id: 'SDImageInfo-Image-Frame' }), input);

  onUiUpdate(SDImageInfoTabChange);
});

async function SDImageInfoParser() {
  const RawOutput = document.querySelector('#SDImageInfo-Geninfo textarea');
  const HTMLPanel = document.getElementById('SDImageInfo-HTML');
  const ImagePanel = document.getElementById('SDImageInfo-Image');
  const img = ImagePanel.querySelector('img');

  if (!img) {
    HTMLPanel.innerHTML = await SDImageInfoPlainTextToHTML('');
    ImagePanel.classList.remove('img-enter');
    return;
  }

  ImagePanel.classList.add('img-enter');
  img.onload = SDImageInfoClearButton;
  img.onclick = () => SDImageInfoImageViewer(img);

  const output = await SDImageParser(img);
  RawOutput.value = output;
  updateInput(RawOutput);
  window.SDImageInfoRawOutput = output;
  HTMLPanel.classList.add('prose');
  HTMLPanel.innerHTML = await SDImageInfoPlainTextToHTML(output);
  img.style.opacity = '1';

  document.querySelectorAll('.sdimageinfo-output-section').forEach(s => {
    const t = s.querySelector('.sdimageinfo-output-title');
    const w = s.querySelector('.sdimageinfo-output-wrapper');
    if (!t || !w) return;
    w.onmouseenter = () => [t, w].forEach(x => x.style.background = 'var(--input-background-fill)');
    w.onmouseleave = () => [t, w].forEach(x => x.style.background = '');
  });
}

var SDImageInfoSpinnerSVG = `
  <svg id="SDImageInfo-Spinner" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="100" height="100">
    <path fill="currentColor" d="M 24.3 17.1 C 24.3 25.9 31.5 33.1 40.3 33.1 C 41.3 33.1 42.3 33 43.3 32.8 L 44 36.7 C 42.8 37 41.6 37.1 40.3 37.1 C 29.2 37.1
      20.3 28.1 20.3 17.1 C 20.3 12.3 22 7.6 25.1 4 L 28.1 6.6 C 25.8 9.5 24.3 13.1 24.3 17.1 Z" style="transform-origin: 32.15px 20.55px;" transform="matrix(-1, 0, 0, -1, 0.000002, 0)"/>
    <path fill="currentColor" d="M 23.2 43.8 L 20.1 41.3 C 22.3 38.5 23.7 35 23.7 31.1 C 23.7 22.3 16.5 15.1 7.7 15.1
      C 6.7 15.1 5.7 15.2 4.7 15.4 L 4 11.6 C 5.3 11.4 6.5 11.3 7.7 11.3 C 18.8 11.3 27.7 20.2 27.7 31.3 C 27.7 35.7 26.1 40.3 23.2 43.8 Z"
      style="transform-origin: 15.85px 27.55px;" transform="matrix(-1, 0, 0, -1, 0.000003, 0.000001)"/>
    <polygon fill="currentColor" points="4 19 17 17.3 6.3 7" style="transform-origin: 10.5px 13px;" transform="matrix(-1, 0, 0, -1, -0.000003, 0.000001)"/>
    <polygon fill="currentColor" points="44 29 31 30.7 41.7 41" style="transform-origin: 37.5px 35px;" transform="matrix(-1, 0, 0, -1, -0.000005, -0.000003)"/>
  </svg>
`;

async function SDImageInfoPlainTextToHTML(inputs) {
  const EncryptInfo = window.SDImageParserEncryptInfo;
  const Sha256Info = window.SDImageParserSha256Info;
  const NaiSourceInfo = window.SDImageParserNaiSourceInfo;
  const SoftwareInfo = window.SDImageParserSoftwareInfo;

  const SendButton = document.getElementById('SDImageInfo-SendButton');
  const OutputPanel = document.getElementById('SDImageInfo-OutputPanel');

  const titleEL = [
    { id: 'Prompt', label: 'Prompt', title: 'Copy Prompt' },
    { id: 'NegativePrompt', label: 'Negative Prompt', title: 'Copy Negative Prompt' },
    { id: 'Params', label: 'Params', title: 'Copy Parameter Settings' },
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
    return `<div class='sdimageinfo-output-section'${none ? " style='height: 200px'" : ''}>${none ? '' : title}${tent}</div>`;
  }

  if (inputs === undefined || inputs === null || inputs.trim() === '') {
    OutputPanel.classList.remove('display-output-panel');
    SendButton.style.display = '';

  } else {
    OutputPanel.classList.add('display-output-panel');

    if (inputs.trim().includes('Nothing To See Here') || inputs.trim().includes('Nothing To Read Here')) {
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

        let Id = 'SDImageInfo-ModelOutput';
        let display = 'sdimageinfo-display-model-output';
        modelOutput = `<div id='${Id}' class='sdimageinfo-modelbox'>${SDImageInfoSpinnerSVG}</div>`;

        const modelBox = document.getElementById(Id);
        if (modelBox) {
          modelBox.closest('.sdimageinfo-output-section').classList.add('sdimageinfo-modelbox');
          modelBox.innerHTML = modelOutput;
        }

        setTimeout(async () => {
          const fetchTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 60000));
          const modelBox = document.getElementById(Id);
          try {
            const fetchHash = await Promise.race([SDImageParserFetchModelOutput(paramsRAW), fetchTimeout]);
            modelBox.classList.add(display);
            modelBox.innerHTML = fetchHash;
            setTimeout(() => modelBox.classList.remove(display), 2000);
          } catch (error) {
            error.message === 'Timeout' && (modelBox.innerHTML = '<div class="sdimageinfo-output-failed">Failed to fetch...</div>');
          }
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

function SDImageInfoClearButton() {
  let Cloned = document.getElementById('SDImageInfo-Clear-Button');
  let ClearButton = document.querySelector('#SDImageInfo-Image > div > div > div > button:nth-child(2)') || 
                    document.querySelector('.gradio-container-4-40-0 #SDImageInfo-Image > div > div > button');

  if (ClearButton && !Cloned) {
    let parent = ClearButton.parentElement;
    Object.assign(parent.style, { position: 'absolute', zIndex: 1, top: 0, right: 0, gap: 0 });
    ClearButton.style.display = 'none';

    let btn = ClearButton.cloneNode(true);
    btn.id = 'SDImageInfo-Clear-Button';
    btn.style.display = 'flex';
    parent.prepend(btn);

    const clearImage = () => (ClearButton.click(), window.SDImageInfoRawOutput = '');
    window.SDImageInfoClearImage = clearImage;

    btn.onclick = (e) => (e.stopPropagation(), clearImage());
  }
}

function SDImageInfoTabChange() {
  var Id = 'SDImageInfo-HideScrollBar';
  let BS = document?.querySelector('#tabs > .tab-nav > button.selected');

  if (BS?.textContent.trim() === 'Image Info') {
    const tabNav = document.querySelector('.tab-nav.scroll-hide');
    if (tabNav) Object.assign(tabNav.style, { borderBottom: '0' });

    if (!document.getElementById(Id)) {
      const SB = document.createElement('style');
      SB.id = Id;
      SB.innerHTML = `::-webkit-scrollbar { width: 0 !important; height: 0 !important; }`;
      document.head.appendChild(SB);
    }
    Object.assign(document.documentElement.style, { scrollbarWidth: 'none' });

  } else {
    const tabNav = document.querySelector('.tab-nav.scroll-hide');
    if (tabNav) Object.assign(tabNav.style, { borderBottom: '' });

    const SB = document.getElementById(Id);
    if (SB) document.head.removeChild(SB);
    Object.assign(document.documentElement.style, { scrollbarWidth: '' });
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const vars = [
    { c: '--input-background-fill', to: '--sdimageinfo-output-bg', a: 0.5 },
  ];

  const css = await (await fetch('/theme.css')).text();
  const get = s => Object.fromEntries((css.match(new RegExp(`${s}\\s*{([^}]*)}`, 'm'))?.[1] || '')
    .split(';').map(l => l.trim().split(':').map(s => s.trim())).filter(([k, v]) => k && v));
  const toRGBA = (hex, a) => hex && /^#/.test(hex) ? `rgba(${hex.slice(1).match(/.{2}/g).map(v => parseInt(v, 16)).join(',')},${a})` : 'rgba(0,0,0,0)';
  const r = get(':root'), d = get('.dark'), S = document.createElement('style');
  vars.forEach(({ c, to, a }) => {
    S.textContent += `:root { ${to}: ${toRGBA(r[c], a)}; }\n.dark { ${to}: ${toRGBA(d[c], a)}; }\n`;
  });
  document.head.appendChild(S);
});
