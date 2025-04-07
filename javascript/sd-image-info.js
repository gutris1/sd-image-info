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

async function SDImageInfoParser() {
  const RawOutput = gradioApp().querySelector('#SDImageInfo-Geninfo textarea');
  const HTMLPanel = gradioApp().getElementById('SDImageInfo-HTML');
  const ImagePanel = gradioApp().getElementById('SDImageInfo-Image');
  const img = ImagePanel.querySelector('img');

  if (!img) {
    HTMLPanel.innerHTML = await SDImageInfoPlainTextToHTML('');
    ImagePanel.style.boxShadow = '';
    return;
  }

  ImagePanel.style.cssText += 'box-shadow: inset 0 0 0 0 !important;';
  img.onload = SDImageInfoClearButton;
  img.onclick = () => SDImageInfoImageViewer(img);

  const output = await SDImageParser(img);
  RawOutput.value = output;
  updateInput(RawOutput);
  window.SDImageInfoRawOutput = output;
  HTMLPanel.classList.add('prose');
  HTMLPanel.innerHTML = await SDImageInfoPlainTextToHTML(output);
}

async function SDImageInfoPlainTextToHTML(inputs) {
  const EncryptInfo = window.SDImageParserEncryptInfo;
  const Sha256Info = window.SDImageParserSha256Info;
  const NaiSourceInfo = window.SDImageParserNaiSourceInfo;
  const SoftwareInfo = window.SDImageParserSoftwareInfo;

  const SendButton = document.getElementById('SDImageInfo-SendButton');
  const OutputPanel = document.getElementById('SDImageInfo-OutputPanel');

  let titlePrompt = `
    <button id='SDImageInfo-Prompt-Button'
      class='sdimageinfo-copybutton'
      title='Copy Prompt'
      onclick='SDImageInfoCopyButtonEvent(event)'>
      Prompt
    </button>`;

  let titleNegativePrompt = `
    <button id='SDImageInfo-NegativePrompt-Button'
      class='sdimageinfo-copybutton'
      title='Copy Negative Prompt'
      onclick='SDImageInfoCopyButtonEvent(event)'>
      Negative Prompt
    </button>`;

  let titleParams = `
    <button id='SDImageInfo-Params-Button'
      class='sdimageinfo-copybutton'
      title='Copy Parameter Settings'
      onclick='SDImageInfoCopyButtonEvent(event)'>
      Params
    </button>`;

  let titleModels = '';
  let titleEncrypt = `<b id='SDImageInfo-Encrypt-Title'>Encrypt</b>`;
  let titleSha = `<b id='SDImageInfo-Sha256-Title'>EncryptPwdSha</b>`;
  let titleSoftware = `<b id='SDImageInfo-Software-Title'>Software</b>`;
  let titleSource = `<b id='SDImageInfo-Source-Title'>Source</b>`;
  let br = /\n/g;

  let outputHTML = '';
  let promptText = '';
  let negativePromptText = '';
  let paramsText = '';
  let modelBox = '';

  function SDImageInfoHTMLOutput(title, content) {
    return `<div class='sdimageinfo-outputsection'><p>${title}${content}</p></div>`;
  }

  if (inputs === undefined || inputs === null || inputs.trim() === '') {
    OutputPanel.style.transition = 'none';
    OutputPanel.style.opacity = '0';
    OutputPanel.classList.remove('show');
    SendButton.style.display = 'none';

  } else {
    OutputPanel.classList.add('show');
    OutputPanel.style.transition = '';
    OutputPanel.style.opacity = '1';

    if (inputs.trim().includes('Nothing To See Here') || inputs.trim().includes('Nothing To Read Here')) {
      titlePrompt = '';
      SendButton.style.display = 'none';
      outputHTML = SDImageInfoHTMLOutput('', inputs);

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
        return `
          <a id='SDImageInfo-Seed-Button'
            title='Copy Seed Value'
            onclick='SDImageInfoCopyButtonEvent(event)'>
            Seed
          </a>: ${seedNumber},`;
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
            const imgInfoModelBox = modelOutput.closest('.sdimageinfo-outputsection');
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
        if (section.content && section.content.trim() !== '') outputHTML += SDImageInfoHTMLOutput(section.title, section.content);
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
    const section = target.closest('.sdimageinfo-outputsection');
    section.classList.add('sdimageinfo-borderpulse');
    setTimeout(() => section.classList.remove('sdimageinfo-borderpulse'), 2000);
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
  let img = document.querySelector('#SDImageInfo-Image img');
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
    img.style.opacity = '1';

    const clearImage = () => (ClearButton.click(), window.SDImageInfoRawOutput = '');
    window.SDImageInfoClearImage = clearImage;

    btn.onclick = (e) => (e.stopPropagation(), clearImage());
  }
}
