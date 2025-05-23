async function SDImageInfoParser() {
  window.SDImageInfoEncrypt = '';
  window.SDImageInfoSha256 = '';
  window.SDImageInfoNaiSource = '';
  window.SDImageInfoSoftwareInfo = '';
  window.SDImageInfoRawOutput = '';

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

  let res = await fetch(img.src);
  let blob = await res.blob();
  let url = URL.createObjectURL(blob);
  img.src = url;

  const openInNewTab = document.createElement('a');
  openInNewTab.href = url;
  openInNewTab.target = '_blank';
  openInNewTab.textContent = 'Open Image in New Tab';

  openInNewTab.addEventListener('click', () => {
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  });

  let array = await blob.arrayBuffer();
  let tags = ExifReader.load(array);
  let output = '';

  if (tags) {
    window.SDImageInfoEncrypt = tags.Encrypt ? tags.Encrypt.description : '';
    window.SDImageInfoSha256 = tags.EncryptPwdSha ? tags.EncryptPwdSha.description : '';

    if (tags.parameters?.description) {
      if (tags.parameters.description.includes('sui_image_params')) {
        const parSing = JSON.parse(tags.parameters.description);
        const Sui = parSing['sui_image_params'];
        output = SDImageInfoConvertSwarmUI(Sui, {});
      } else {
        output = tags.parameters.description;
      }

    } else if (tags.UserComment?.value) {
      const array = tags.UserComment.value;
      const UserComments = SDImageInfoDecodeUserComment(array);
      if (UserComments.includes('sui_image_params')) {
        const rippin = UserComments.trim().replace(/[\x00-\x1F\x7F]/g, '');
        const parSing = JSON.parse(rippin);
        if (parSing['sui_image_params']) {
          const Sui = parSing['sui_image_params'];
          const SuiExtra = parSing['sui_extra_data'] || {};
          output = SDImageInfoConvertSwarmUI(Sui, SuiExtra);
        }
      } else {
        output = UserComments;
      }

    } else if (tags['Software']?.description === 'NovelAI' && tags.Comment?.description) {
      window.SDImageInfoSoftwareInfo = tags['Software'] ? tags['Software'].description : '';
      window.SDImageInfoNaiSource = tags['Source'] ? tags['Source'].description : '';
      const nai = JSON.parse(tags.Comment.description);
      nai.sampler = 'Euler';

      output = SDImageInfoConvertNovelAI(nai['prompt']) +
        '\nNegative prompt: ' + SDImageInfoConvertNovelAI(nai['uc']) +
        '\nSteps: ' + nai['steps'] +
        ', Sampler: ' + nai['sampler'] +
        ', CFG scale: ' + parseFloat(nai['scale']).toFixed(1) +
        ', Seed: ' + nai['seed'] +
        ', Size: ' + nai['width'] + 'x' + nai['height'] +
        ', Clip skip: 2, ENSD: 31337';

    } else if (tags.prompt?.description && tags.workflow) {
      if (tags.prompt.description.includes("'filename_prefix': 'ComfyUI'")) {
        output = 'ComfyUI<br>Nothing To Read Here';
      }

    } else if (tags.invokeai_graph?.description) {
      output = 'InvokeAI<br>Nothing To Read Here';

    } else {
      output = 'Nothing To See Here';
    }

    if (output) {
      window.SDImageInfoRawOutput = output;
      RawOutput.value = output;
      updateInput(RawOutput);
      HTMLPanel.classList.add('prose');
      HTMLPanel.innerHTML = await SDImageInfoPlainTextToHTML(output);
    }
  }

  return tags;
}

function SDImageInfoDecodeUserComment(array) {
  const result = [];
  let pos = 7;

  if (array[8] === 123) {
    for (let i = pos; i < array.length; i+=2) {
      const inDEX = array[i];
      const nEXT = array[i + 1];
      if (inDEX === 0 && nEXT === 32) {
        result.push(32);
        continue;
      }
      const vaLUE = inDEX * 256 + nEXT;
      result.push(vaLUE);
    }
  } else {
    for (let i = pos; i < array.length; i++) {
      if (i === 7 && array[i] === 0) {
        continue;
      }
      if (array[i] === 0) {
        if (i + 1 < array.length && array[i + 1] === 0) {
          i++;
          continue;
        }
      }
      if (i + 1 < array.length) {
        const inDEX = array[i];
        const nEXT = array[i + 1];

        if (inDEX === 0 && nEXT === 32) {
          result.push(32);
          i++;
          continue;
        }
        const vaLUE = inDEX * 256 + nEXT;
        result.push(vaLUE);
        i++;
      }
    }
  }

  const output = new TextDecoder('utf-16').decode(new Uint16Array(result)).trim();
  return output.replace(/^UNICODE[\x00-\x20]*/, '');
}

function SDImageInfoConvertNovelAI(input) {
  const NAIMultiplyRange = (start, multiplier) => res.slice(start).forEach(row => row[1] = NAIround(row[1] * multiplier));
  const NAIround = v => Math.round(v * 10000) / 10000;
  const re_attention = /\{|\[|\}|\]|[^\{\}\[\]]+/gmu;
  let text = input.replaceAll('(', '\\(').replaceAll(')', '\\)').replace(/\\{2,}(\(|\))/gim, '\$1');
  let res = [];
  let curly_brackets = [];
  let square_brackets = [];
  const curly_bracket_multiplier = 1.05;
  const square_bracket_multiplier = 1 / 1.05;

  for (const match of text.matchAll(re_attention)) {
    let word = match[0];
    if (word === '{') curly_brackets.push(res.length);
    else if (word === '[') square_brackets.push(res.length);
    else if (word === '}' && curly_brackets.length > 0) NAIMultiplyRange(curly_brackets.pop(), curly_bracket_multiplier);
    else if (word === ']' && square_brackets.length > 0) NAIMultiplyRange(square_brackets.pop(), square_bracket_multiplier);
    else res.push([word, 1.0]);
  }

  for (const pos of curly_brackets) NAIMultiplyRange(pos, curly_bracket_multiplier);
  for (const pos of square_brackets) NAIMultiplyRange(pos, square_bracket_multiplier);
  if (res.length === 0) res = [['', 1.0]];

  let i = 0;
  while (i + 1 < res.length) {
    if (res[i][1] === res[i + 1][1]) {
      res[i][0] += res[i + 1][0];
      res.splice(i + 1, 1);
    } else {
      i++;
    }
  }

  let result = '';
  for (let i = 0; i < res.length; i++) {
    if (res[i][1] === 1.0) {
      result += res[i][0];
    } else {
      result += `(${res[i][0]}:${res[i][1]})`;
    }
  }

  return result;
}

function SDImageInfoConvertSwarmUI(Sui, extraData = {}) {
  let output = '';

  if (Sui.prompt) output += `${Sui.prompt}\n`;
  if (Sui.negativeprompt) output += `Negative prompt: ${Sui.negativeprompt}\n`;
  if (Sui.steps) output += `Steps: ${Sui.steps}, `;
  if (Sui.sampler) {
    Sui.sampler = Sui.sampler.replace(/\beuler\b|\beuler(-\w+)?/gi, (match) => {
      return match.replace(/euler/i, 'Euler');
    });
    output += `Sampler: ${Sui.sampler}, `;
  }
  if (Sui.scheduler) output += `Schedule type: ${Sui.scheduler}, `;
  if (Sui.cfgscale) output += `CFG scale: ${Sui.cfgscale}, `;
  if (Sui.seed) output += `Seed: ${Sui.seed}, `;
  if (Sui.width && Sui.height) output += `Size: ${Sui.width}x${Sui.height}, `;
  if (Sui.model) output += `Model: ${Sui.model}, `;
  if (Sui.vae) {
    const vaeParts = Sui.vae.split('/');
    output += `VAE: ${vaeParts[vaeParts.length - 1]}, `;
  }

  window.SDImageInfoSoftwareInfo = Sui?.swarm_version ? `SwarmUI ${Sui.swarm_version}` : '';
  output = output.trim().replace(/,$/, '');

  let otherParams = Object.entries(Sui)
    .filter(([key]) => {
      return ![
        'prompt', 
        'negativeprompt', 
        'steps', 
        'sampler', 
        'scheduler', 
        'cfgscale', 
        'seed', 
        'width', 
        'height', 
        'model', 
        'vae', 
        'swarm_version'
      ].includes(key);
    }).map(([key, value]) => `${key}: ${value}`).join(', ');

  let extraParams = Object.entries(extraData).map(([key, value]) => `${key}: ${value}`).join(', ');
  if (otherParams || extraParams) output += (output ? ', ' : '') + [otherParams, extraParams].filter(Boolean).join(', ');
  return output.trim();
}

async function SDImageInfoFetchModelOutput(i) {
  let FetchedModels = '';
  const Cat = {
    checkpoint: [], vae: [], lora: [], embed: [],
  };

  let modelEX;
  if (i.includes('Model: "')) {
    modelEX = i.match(/Model:\s*"?([^"]+)"/);
  } else {
    modelEX = i.match(/Model:\s*([^,]+)/);
  }

  const modelHashEX = i.match(/Model hash:\s*([^,]+)/);
  const vaeEX = i.match(/VAE:\s*([^,]+)/);
  const vaeHashEX = i.match(/VAE hash:\s*([^,]+)/);
  const loraHashEX = i.match(/Lora hashes:\s*"([^"]+)"/);
  const tiHashEX = i.match(/TI hashes:\s*"([^"]+)"/);
  const hashesIndex = i.indexOf('Hashes:');
  const hashesEX = hashesIndex !== -1
    ? i.slice(hashesIndex).match(/Hashes:\s*(\{.*?\})(,\s*)?/)
    : null;

  let HashesDict = {};
  let TIHashDict = {};

  if (hashesEX && hashesEX[1]) {
    const s = JSON.parse(hashesEX[1].trim());
    for (const [k, h] of Object.entries(s)) {
      if (k.startsWith('embed:')) {
        const n = k.replace('embed:', '');
        HashesDict[n] = h;

        const fetchedHash = await SDImageInfoFetchingModels(n, h, false);
        Cat.embed.push(fetchedHash);
      }
    }
  }

  if (tiHashEX) {
    const embedPairs = tiHashEX[1].split(',').map(pair => pair.trim());
    for (const pair of embedPairs) {
      const [n, h] = pair.split(':').map(item => item.trim());
      if (h && !HashesDict[n]) {
        TIHashDict[n] = h;

        const fetchedHash = await SDImageInfoTIHashesSearchLink(n, h);
        Cat.embed.push(fetchedHash);
      }
    }
  }

  if (modelEX) {
    const modelValue = modelEX[1];
    const modelHash = modelHashEX ? modelHashEX[1] : null;
    const vaeValue = vaeEX ? vaeEX[1] : null;
    const vaeHash = vaeHashEX ? vaeHashEX[1] : null;

    if (modelHash || vaeValue || vaeHash) {
      Cat.checkpoint.push({ n: modelValue, h: modelHash });
    }
  }

  const vaeValue = vaeEX ? vaeEX[1] : null;
  const vaeHash = vaeHashEX ? vaeHashEX[1] : null;
  if (vaeValue || vaeHash) {
    Cat.vae.push({ n: vaeValue, h: vaeHash });
  }

  if (loraHashEX) {
    const loraPairs = loraHashEX[1].split(',').map(pair => pair.trim());
    for (const pair of loraPairs) {
      const [n, h] = pair.split(':').map(item => item.trim());
      if (h) {
        Cat.lora.push({ n, h });
      }
    }
  }

  const FetchResult = (l, m) => {
    return `
      <div class='sdimageinfo-modeloutput-line'>
        <div class='sdimageinfo-modeloutput-label'>${l}</div>
        <div class='sdimageinfo-modeloutput-hashes'>${m.join(' ')}</div>
      </div>
    `;
  };

  for (const [category, items] of Object.entries(Cat)) {
    if (items.length > 0) {
      let models;

      if (category === 'embed') {
        models = items.map(item => item);
      } else if (category === 'lora') {
        models = await Promise.all(items.map(async ({ n, h }) => {
          return await SDImageInfoFetchingModels(n, h, false);
        }));
      } else {
        const isTHat = category === 'checkpoint' || category === 'vae';
        models = await Promise.all(items.map(async ({ n, h }) => {
          return await SDImageInfoFetchingModels(n, h, isTHat);
        }));
      }

      FetchedModels += FetchResult(category, models);
    }
  }

  return `${FetchedModels}`;
}

async function SDImageInfoFetchingModels(n, h, isTHat = false) {
  const nonLink = `<span class='sdimageinfo-nonlink'>${n}${isTHat ? '' : `: ${h}`}</span>`;
  if (!h) return nonLink;

  const r = await fetch(`https://civitai.com/api/v1/model-versions/by-hash/${h}`);
  const d = await r.json();

  if (d.error === 'Model not found' || !d.model?.name) return nonLink;
  return `<a class='sdimageinfo-link' href='https://civitai.com/models/${d.modelId}?modelVersionId=${d.id}' target='_blank'>${d.model.name}</a>`;
}

async function SDImageInfoTIHashesSearchLink(n, h) {
  return h 
    ? `<a class='sdimageinfo-link' href='https://civitai.com/search/models?sortBy=models_v9&query=${h}' target='_blank'>${n}</a>` 
    : `<span class='sdimageinfo-nonlink'>${n}: ${h}</span>`;
}

async function SDImageInfoPlainTextToHTML(inputs) {
  const EncryptInfo = window.SDImageInfoEncrypt;
  const Sha256Info = window.SDImageInfoSha256;
  const NaiSourceInfo = window.SDImageInfoNaiSource;
  const SoftwareInfo = window.SDImageInfoSoftwareInfo;

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
      const sections = [
        { title: titleEncrypt, content: EncryptInfo },
        { title: titleSha, content: Sha256Info }
      ];

      sections.forEach(section => {
        if (section.content && section.content.trim() !== '') {
          outputHTML += SDImageInfoHTMLOutput(section.title, section.content);
        }
      });

      outputHTML += SDImageInfoHTMLOutput('', inputs);

    } else {
      SendButton.style.display = 'grid';
      inputs = inputs.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(br, '<br>');
      inputs = inputs.replace(/Seed:\s?(\d+),/gi, function(match, seedNumber) {
        return `
          <button id='SDImageInfo-Seed-Button'
            title='Copy Seed Value'
            onclick='SDImageInfoCopyButtonEvent(event)'>
            Seed
          </button>: ${seedNumber},`;
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
          const fetchTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 60000)
          );

          try {
            const ModelOutputFetched = await Promise.race([
              SDImageInfoFetchModelOutput(paramsRAW),
              fetchTimeout
            ]);

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
