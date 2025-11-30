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

  setTimeout(() => document.addEventListener('keydown', window.SDimageInfoKeydown), 1000);

  [Tab, Column, ImagePanel, gear].forEach(el => el.classList.add(sdimginfoS));
  setTimeout(() => gear.classList.remove(sdimginfoS), 1200);
  img.onclick = () => SDImageInfoDisplayImageViewer(img);
  img.onload = () => img.style.opacity = '1';

  const output = await SharedImageParser(img, true);
  window.SDImageInfoRawOutput = RawOutput.value = output;
  updateInput(RawOutput);
  HTMLPanel.innerHTML = await SDImageInfoPlainTextToHTML(output);
  setTimeout(() => window.SDImageInfoArrowScrolling(), 0);
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

  let text = inputs
    .replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>').replace(/Seed:\s?(\d+),/gi, (_, seedNumber) => 
      `<span id='SDImageInfo-Seed-Button' title='${SDImageInfoTranslation("copy_seed", "Copy Seed")}' onclick='SDImageInfoCopyButtonEvent(event)'>Seed</span>: ${seedNumber},`
    ),

  spinner = `<div id='SDImageInfo-Spinner-Wrapper'><div id='SDImageInfo-Spinner'>${SDImageInfoSVG.spinner()}</div></div>`;
  const { prompt, negativePrompt, params, paramsRAW } = SharedPromptParser(text);

  if (paramsRAW) {
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
      }

      setTimeout(() => window.SDImageInfoArrowScrolling(), 0);
    }, 500);
  }

  const sections = [
    [titles.prompt, prompt], [titles.negativePrompt, negativePrompt], [titles.params, params], [titles.models, spinner],
    [titles.postProcessing, ExtrasInfo], [titles.postProcessing, PostProcessingInfo], [titles.software, window.SharedParserSoftwareInfo],
    [titles.encrypt, EncryptInfo], [titles.sha, Sha256Info], [titles.source, NaiSourceInfo]
  ];

  return sections.filter(([_, content]) => content?.trim()).map(([title, content]) => createSection(title, content)).join('');
}

function SDImageInfoCopyButtonEvent(e) {
  const OutputRaw = window.SDImageInfoRawOutput,

  CopyText = (text, btn) => {
    navigator.clipboard.writeText(text);
    const box = btn.parentElement.querySelector('.sdimageinfo-output-content');
    box?.classList.add(sdimginfoS);
    setTimeout(() => box?.classList.remove(sdimginfoS), 2000);
  };

  if (e.target?.id) {
    const { id } = e.target,

    steps = OutputRaw.indexOf('Steps:'),
    neg = OutputRaw.indexOf('Negative prompt:'),
    seed = OutputRaw.match(/Seed:\s?(\d+),/i),

    text = {
      'SDImageInfo-Prompt-Button': () => OutputRaw.substring(0, [neg, steps].find(i => i !== -1) || OutputRaw.length).trim(),
      'SDImageInfo-NegativePrompt-Button': () => neg !== -1 && steps > neg ? OutputRaw.slice(neg + 16, steps).trim() : null,
      'SDImageInfo-Params-Button': () => steps !== -1 ? OutputRaw.slice(steps).trim() : null,
      'SDImageInfo-Seed-Button': () => seed?.[1]?.trim() || null
    }[id]?.();

    text && CopyText(text, e.target);
  }
}

function SDImageInfoSendButton(id) {
  const OutputRaw = window.SDImageInfoRawOutput,

  ADetailer = (id) => {
    const i = `script_${id.replace('_tab', '')}_adetailer_ad_main_accordion-visible-checkbox`,
    cb = document.getElementById(i);
    if (cb && !cb.checked) cb.click();
  },

  mahiro = (id) => {
    const i = `#${id.replace('_tab', '')}_script_container span`,
    cb = Array.from(document.querySelectorAll(i)).find(s => s.textContent.trim() === 'Enable Mahiro CFG')?.previousElementSibling;
    if (cb && !cb.checked) cb.click();
  };

  if (['txt2img_tab', 'img2img_tab'].includes(id)) {
    if (OutputRaw?.includes('ADetailer model')) ADetailer(id);
    if (OutputRaw?.includes('mahiro_cfg_enabled: True')) mahiro(id);
  }

  if (document.querySelector('.gradio-container-4-40-0') && id.includes('extras_tab'))
    setTimeout(() => document.getElementById('tab_extras-button').click(), 500);
}