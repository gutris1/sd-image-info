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

  onUiUpdate(SDImageInfoTabChange);
});

async function SDImageInfoParser() {
  const RawOutput = gradioApp().querySelector('#SDImageInfo-Geninfo textarea');
  const HTMLPanel = gradioApp().getElementById('SDImageInfo-HTML');
  const ImagePanel = gradioApp().getElementById('SDImageInfo-Image');
  const img = ImagePanel.querySelector('img');

  if (!img) {
    HTMLPanel.innerHTML = await SDImageInfoPlainTextToHTML('');
    ImagePanel.classList.remove('img-enter');
    ImagePanel.style.flex = '';
    ImagePanel.style.background = '';
    return;
  }

  ImagePanel.style.flex = 'unset';
  ImagePanel.style.background = 'transparent';
  img.onload = SDImageInfoClearButton;
  img.onclick = () => SDImageInfoImageViewer(img);

  const output = await SDImageParser(img);
  RawOutput.value = output;
  updateInput(RawOutput);
  window.SDImageInfoRawOutput = output;
  HTMLPanel.classList.add('prose');
  HTMLPanel.innerHTML = await SDImageInfoPlainTextToHTML(output);
  ImagePanel.classList.add('img-enter');

  document.querySelectorAll('.sdimageinfo-output-section').forEach(s => {
    const t = s.querySelector('.sdimageinfo-output-title');
    const w = s.querySelector('.sdimageinfo-output-wrapper');
    if (!t || !w) return;
    w.onmouseenter = () => [t, w].forEach(x => x.style.background = 'var(--input-background-fill-hover)');
    w.onmouseleave = () => [t, w].forEach(x => x.style.background = '');
  });
}

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
  let modelBox = '';

  function SDImageInfoHTMLOutput(title, content) {
    const con = title === titleModels;
    const tent = con ? content : `<div class='sdimageinfo-output-wrapper'><div class='sdimageinfo-output-content'>${content}</div></div>`;
    return `<div class='sdimageinfo-output-section'>${title}${tent}</div>`;
  }

  if (inputs === undefined || inputs === null || inputs.trim() === '') {
    OutputPanel.style.marginTop = '';
    OutputPanel.style.transition = 'none';
    OutputPanel.classList.remove('display-output-panel');
    SendButton.style.display = '';

  } else {
    OutputPanel.style.transition = '';
    OutputPanel.classList.add('display-output-panel');

    if (inputs.trim().includes('Nothing To See Here') || inputs.trim().includes('Nothing To Read Here')) {
      OutputPanel.style.marginTop = '25%';
      titlePrompt = '';
      SendButton.style.display = '';
      outputHTML = SDImageInfoHTMLOutput('', inputs);

    } else if (inputs.trim().startsWith('OPPAI:')) {
      OutputPanel.style.marginTop = '5%';
      const sections = [ { title: titleEncrypt, content: EncryptInfo }, { title: titleSha, content: Sha256Info } ];
      sections.forEach(section => {
        if (section.content && section.content.trim() !== '') outputHTML += SDImageInfoHTMLOutput(section.title, section.content);
      });
      outputHTML += SDImageInfoHTMLOutput('', inputs);

    } else {
      OutputPanel.style.marginTop = '5%';
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

        modelBox = `
          <div id='SDImageInfo-ModelOutput' class='sdimageinfo-modelbox'>
            <svg xmlns='http://www.w3.org/2000/svg'x='0px' y='0px' width='100' height='100' viewBox='0 0 48 48' id='refresh-spinner'>
              <path fill='var(--primary-400)' d='M8,24c0-8.8,7.2-16,16-16c1,0,2,0.1,3,0.3l0.7-3.9C26.5,4.1,25.3,4,24,4C12.9,4,4,13,4,24
                c0,4.8,1.7,9.5,4.8,13.1l3-2.6C9.5,31.6,8,28,8,24z'/>
              <path fill='var(--primary-400)' d='M39.5,11.3l-3.1,2.5C38.6,16.6,40,20.1,40,24c0,8.8-7.2,16-16,16c-1,0-2-0.1-3-0.3l-0.7,3.8
                c1.3,0.2,2.5,0.3,3.7,0.3c11.1,0,20-8.9,20-20C44,19.4,42.4,14.8,39.5,11.3z'/>
              <polygon fill='var(--primary-400)' points='31,7 44,8.7 33.3,19'></polygon>
              <polygon fill='var(--primary-400)' points='17,41 4,39.3 14.7,29'></polygon>
            </svg>
          </div>
        `;

        setTimeout(() => {
          const modelOutput = document.getElementById('SDImageInfo-ModelOutput');
          if (modelOutput) {
            const imgInfoModelBox = modelOutput.closest('.sdimageinfo-output-section');
            if (imgInfoModelBox) imgInfoModelBox.classList.add('sdimageinfo-modelbox');
            modelOutput.innerHTML = modelBox;
          }
        }, 0);

        setTimeout(async () => {
          const fetchTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 60000));

          try {
            const ModelOutputFetched = await Promise.race([SDImageParserFetchModelOutput(paramsRAW), fetchTimeout]);
            const modelOutput = document.getElementById('SDImageInfo-ModelOutput');
            if (modelOutput) {
              modelOutput.classList.add('sdimageinfo-display-model-output');
              modelOutput.innerHTML = ModelOutputFetched;
              setTimeout(() => modelOutput.classList.remove('sdimageinfo-display-model-output'), 2000);
            }
          } catch (error) {
            if (error.message === 'Timeout') {
              const modelOutput = document.getElementById('SDImageInfo-ModelOutput');
              if (modelOutput) modelOutput.innerHTML = 'Failed to fetch...';
            }
          }
        }, 500);

        if (hashesEX && hashesEX[1]) paramsText = paramsText.replace(hashesEX[0], '').trim();
        if (paramsText.endsWith(',')) paramsText = paramsText.slice(0, -1).trim();
      } else paramsText = inputs.trim();

      const sections = [
        { title: titlePrompt, content: promptText },
        { title: titleNegativePrompt, content: negativePromptText },
        { title: titleParams, content: paramsText },
        { title: titleSoftware, content: SoftwareInfo },
        { title: titleModels, content: modelBox },
        { title: titleEncrypt, content: EncryptInfo },
        { title: titleSha, content: Sha256Info },
        { title: titleSource, content: NaiSourceInfo }
      ];

      sections.forEach(section => {
        if (section.content && section.content.trim() !== '') {
          outputHTML += SDImageInfoHTMLOutput(section.title, section.content);
        }
      });
    }
  }

  return `${outputHTML}`;
}

function SDImageInfoSendButton(Id) {
  let OutputRaw = window.SDImageInfoRawOutput;
  let ADmodel = OutputRaw?.includes('ADetailer model');
  let cb = gradioApp().getElementById(`script_${Id}_adetailer_ad_main_accordion-visible-checkbox`);
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
  let Cloned = document.getElementById('SDImageInfo-ClearImage-Button');
  let ClearButton = document.querySelector('#SDImageInfo-Image > div > div > div > button:nth-child(2)') || 
                    document.querySelector('.gradio-container-4-40-0 #SDImageInfo-Image > div > div > button');

  if (ClearButton && !Cloned) {
    let parent = ClearButton.parentElement;
    ClearButton.style.display = 'none';

    let btn = ClearButton.cloneNode(true);
    btn.id = 'SDImageInfo-ClearImage-Button';
    btn.style.display = 'flex';
    parent.prepend(btn);

    const clearImage = () => (ClearButton.click(), window.SDImageInfoRawOutput = '');
    window.SDImageInfoClearImage = clearImage;

    btn.onclick = (e) => (e.stopPropagation(), clearImage());
  }
}

function SDImageInfoTabChange() {
  var Id = 'SDImageInfo-HideScrollBar';
  let BS = gradioApp()?.querySelector('#tabs > .tab-nav > button.selected');

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
