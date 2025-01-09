onUiLoaded(function () {
  const imgInfoTAB = gradioApp().getElementById('tab_sd_image_info')
  if (imgInfoTAB) {
    document.addEventListener("click", imgInfoEvent);
  }
});

async function image_info_parser() {
  window.EnCrypt = '';
  window.PWSha = '';
  window.sourceNAI = '';
  window.softWare = '';

  const imgInfoRawOutput = gradioApp().querySelector("#imgInfoGenInfo > label > textarea");
  const imgInfoHTML = gradioApp().querySelector("#imgInfoHTML");
  const imgInfoImage = document.getElementById("imgInfoImage");

  let img = imgInfoImage.querySelector('img');

  if (img) {
    img.style.opacity = "0";
    img.style.transition = 'opacity 1s ease';

    img.onload = function() {
      img.style.opacity = "1";
      const imgAspectRatio = img.naturalWidth / img.naturalHeight;
      const containerWidth = imgInfoImage.clientWidth;
      const newHeight = containerWidth / imgAspectRatio;
      const fullSizeHeight = getComputedStyle(imgInfoImage).getPropertyValue('var(--size-full)').trim();
      const fullSizeHeightValue = parseFloat(fullSizeHeight);

      if (newHeight > fullSizeHeightValue) {
        imgInfoImage.style.height = `${newHeight}px`;
      } else {
        imgInfoImage.style.height = fullSizeHeight;
      }
    };
  } else {
    const fullSizeHeight = getComputedStyle(imgInfoImage).getPropertyValue('var(--size-full)').trim();
    imgInfoImage.style.height = fullSizeHeight;
    imgInfoHTML.innerHTML = await plainTextToHTML('');
    return;
  }

  let response = await fetch(img.src);
  let img_blob = await response.blob();
  let blobUrl = URL.createObjectURL(img_blob);
  img.src = blobUrl;

  const openInNewTab = document.createElement('a');
  openInNewTab.href = blobUrl;
  openInNewTab.target = '_blank';
  openInNewTab.textContent = 'Open Image in New Tab';

  openInNewTab.addEventListener('click', () => {
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 1000);
  });

  let arrayBuffer = await img_blob.arrayBuffer();
  let tags = ExifReader.load(arrayBuffer);
  let output = "";

  if (tags) {
    window.EnCrypt = tags.Encrypt ? tags.Encrypt.description : '';
    window.PWSha = tags.EncryptPwdSha ? tags.EncryptPwdSha.description : '';

    if (tags.parameters && tags.parameters.description) {
      if (tags.parameters.description.includes("sui_image_params")) {
        const parSing = JSON.parse(tags.parameters.description);
        const Sui = parSing["sui_image_params"];
        output = convertSwarmUI(Sui, {});
      } else {
        output = tags.parameters.description;
      }

    } else if (tags.UserComment && tags.UserComment.value) {
      const array = tags.UserComment.value;
      const UserComments = UserCommentDecoder(array);
      if (UserComments.includes("sui_image_params")) {
        const rippin = UserComments.trim().replace(/[\x00-\x1F\x7F]/g, '');
        const parSing = JSON.parse(rippin);
        if (parSing["sui_image_params"]) {
          const Sui = parSing["sui_image_params"];
          const SuiExtra = parSing["sui_extra_data"] || {};
          output = convertSwarmUI(Sui, SuiExtra);
        }
      } else {
        output = UserComments;
      }

    } else if (tags["Software"] && tags["Software"].description === "NovelAI" &&
               tags.Comment && tags.Comment.description) {

      window.softWare = tags["Software"] ? tags["Software"].description : '';
      window.sourceNAI = tags["Source"] ? tags["Source"].description : '';

      const nai = JSON.parse(tags.Comment.description);
      nai.sampler = "Euler";

      output = convertNAI(nai["prompt"]) +
        "\nNegative prompt: " + convertNAI(nai["uc"]) +
        "\nSteps: " + nai["steps"] +
        ", Sampler: " + nai["sampler"] +
        ", CFG scale: " + parseFloat(nai["scale"]).toFixed(1) +
        ", Seed: " + nai["seed"] +
        ", Size: " + nai["width"] + "x" + nai["height"] +
        ", Clip skip: 2, ENSD: 31337";

    } else {
      output = "Nothing To See Here";
    }

    if (output) {
      imgInfoRawOutput.value = output;
      updateInput(imgInfoRawOutput);
      imgInfoHTML.classList.add('prose');
      imgInfoHTML.innerHTML = await plainTextToHTML(output);
    }
  }
  return tags;
}

function round(v) { return Math.round(v * 10000) / 10000 }

function convertNAI(input) {
  const re_attention = /\{|\[|\}|\]|[^\{\}\[\]]+/gmu;
  let text = input.replaceAll("(", "\(").replaceAll(")", "\)").replace(/\\{2,}(\(|\))/gim, '\$1');
  let res = [], curly_brackets = [], square_brackets = [];
  const curly_bracket_multiplier = 1.05, square_bracket_multiplier = 1 / 1.05;
  function multiply_range(start, multiplier) {
    for (let pos = start; pos < res.length; pos++) res[pos][1] = round(res[pos][1] * multiplier);
  }
  for (const match of text.matchAll(re_attention)) {
    let word = match[0];
    if (word == "{") curly_brackets.push(res.length);
    else if (word == "[") square_brackets.push(res.length);
    else if (word == "}" && curly_brackets.length > 0) multiply_range(curly_brackets.pop(), curly_bracket_multiplier);
    else if (word == "]" && square_brackets.length > 0) multiply_range(square_brackets.pop(), square_bracket_multiplier);
    else res.push([word, 1.0]);
  }
  for (const pos of curly_brackets) multiply_range(pos, curly_bracket_multiplier);
  for (const pos of square_brackets) multiply_range(pos, square_bracket_multiplier);
  if (res.length == 0) res = [["", 1.0]];
  let i = 0;
  while (i + 1 < res.length) {
    if (res[i][1] == res[i + 1][1]) {
      res[i][0] += res[i + 1][0];
      res.splice(i + 1, 1);
    } else i++;
  }

  let result = "";
  for (let i = 0; i < res.length; i++) {
    if (res[i][1] == 1.0) result += res[i][0];
    else result += `(${res[i][0]}:${res[i][1]})`;
  }
  return result;
}

function convertSwarmUI(Sui, extraData = {}) {
  let output = "";

  if (Sui.prompt) output += `${Sui.prompt}\n`;
  if (Sui.negativeprompt) output += `Negative prompt: ${Sui.negativeprompt}\n`;
  if (Sui.steps) output += `Steps: ${Sui.steps}, `;
  if (Sui.sampler) {
    Sui.sampler = Sui.sampler.replace(/\beuler\b|\beuler(-\w+)?/gi, (match) => {
      return match.replace(/euler/i, "Euler");
    });
    output += `Sampler: ${Sui.sampler}, `;
  }
  if (Sui.scheduler) output += `Schedule type: ${Sui.scheduler}, `;
  if (Sui.cfgscale) output += `CFG scale: ${Sui.cfgscale}, `;
  if (Sui.seed) output += `Seed: ${Sui.seed}, `;
  if (Sui.width && Sui.height) 
    output += `Size: ${Sui.width}x${Sui.height}, `;
  if (Sui.model) output += `Model: ${Sui.model}, `;
  if (Sui.vae) {
    const vaeParts = Sui.vae.split('/');
    output += `VAE: ${vaeParts[vaeParts.length - 1]}, `;
  }

  window.softWare = Sui?.swarm_version ? `SwarmUI ${Sui.swarm_version}` : '';

  output = output.trim().replace(/,$/, "");

  let otherParams = Object.entries(Sui)
    .filter(([key]) => {
      return ![
        "prompt", 
        "negativeprompt", 
        "steps", 
        "sampler", 
        "scheduler", 
        "cfgscale", 
        "seed", 
        "width", 
        "height", 
        "model", 
        "vae", 
        "swarm_version"
      ].includes(key);
    })
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");

  let extraParams = Object.entries(extraData)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");

  if (otherParams || extraParams) {
    output += (output ? ", " : "") + [otherParams, extraParams].filter(Boolean).join(", ");
  }

  return output.trim();
}

function UserCommentDecoder(array) {
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
  const output = new TextDecoder("utf-16").decode(new Uint16Array(result)).trim();
  return output.replace(/^UNICODE[\x00-\x20]*/, "");
}

function imgInfoEvent(e) {
  let OutputRaw = '';

  const imgInfoRawOutput = gradioApp().querySelector("#imgInfoGenInfo > label > textarea");
  if (imgInfoRawOutput) {
    OutputRaw = imgInfoRawOutput.value;
  }

  function pulseBorderSection(button) {
    var section = button.closest('.imgInfoOutputSection');
    section.classList.add('imgInfoBorderPulse');
    setTimeout(() => {
      section.classList.remove('imgInfoBorderPulse');
      section.classList.add('fadeOutBorder');
      setTimeout(() => {
        section.classList.remove('fadeOutBorder');
      }, 1000);
    }, 1500);
  }

  function imgInfoCopy(CopyCopy, whichBorder) {
    navigator.clipboard.writeText(CopyCopy);
    pulseBorderSection(whichBorder);
  }

  if (e.target && e.target.id === "promptButton") {
    const negativePromptIndex = OutputRaw.indexOf("Negative prompt:");
    let promptText;
    if (negativePromptIndex !== -1) {
      promptText = OutputRaw.substring(0, negativePromptIndex).trim();
    } else {
      const stepsIndex = OutputRaw.indexOf("Steps:");
      if (stepsIndex !== -1) {
        promptText = OutputRaw.substring(0, stepsIndex).trim();
      } else {
        promptText = OutputRaw.trim();
      }
    }
    imgInfoCopy(promptText, e.target);
  }

  if (e.target && e.target.id === "negativePromptButton") {
    const negativePromptStart = OutputRaw.indexOf("Negative prompt:");
    const stepsStart = OutputRaw.indexOf("Steps:");
    if (negativePromptStart !== -1 && stepsStart !== -1 && stepsStart > negativePromptStart) {
      const negativePromptText = OutputRaw.slice(negativePromptStart + "Negative prompt:".length, stepsStart).trim();
      imgInfoCopy(negativePromptText, e.target);
    }
  }

  if (e.target && e.target.id === "paramsButton") {
    const stepsStart = OutputRaw.indexOf("Steps:");
    if (stepsStart !== -1) {
      const paramsText = OutputRaw.slice(stepsStart).trim();
      imgInfoCopy(paramsText, e.target);
    }
  }

  if (e.target && e.target.id === "seedButton") {
    const seedMatch = OutputRaw.match(/Seed:\s?(\d+),/i);
    if (seedMatch && seedMatch[1]) {
      const seedText = seedMatch[1].trim();
      imgInfoCopy(seedText, e.target);
    }
  }
}

async function FetchingModelOutput(i) {
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
  const hashesIndex = i.indexOf("Hashes:");
  const hashesEX = hashesIndex !== -1
    ? i.slice(hashesIndex).match(/Hashes:\s*(\{.*?\})(,\s*)?/)
    : null;

  let HashesDict = {};
  let TIHashDict = {};

  if (hashesEX && hashesEX[1]) {
    const s = JSON.parse(hashesEX[1].trim());
    for (const [k, h] of Object.entries(s)) {
      if (k.startsWith("embed:")) {
        const n = k.replace("embed:", "");
        HashesDict[n] = h;

        const fetchedHash = await FetchingModels(n, h, false);
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

        const fetchedHash = await TIHashesSearchLink(n, h);
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
      <div class="output-line">
        <div class="label">${l}</div>
        <div class="hashes">${m.join(' ')}</div>
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
          return await FetchingModels(n, h, false);
        }));
      } else {
        const isTHat = category === 'checkpoint' || category === 'vae';
        models = await Promise.all(items.map(async ({ n, h }) => {
          return await FetchingModels(n, h, isTHat);
        }));
      }

      FetchedModels += FetchResult(category, models);
    }
  }

  return `${FetchedModels}`;
}

async function FetchingModels(n, h, isTHat = false) {
  const nonLink = isTHat 
    ? `<span class="imgInfoModelOutputNonLink">${n}</span>` 
    : `<span class="imgInfoModelOutputNonLink">${n}: ${h}</span>`;

  if (h) {
    const r = await fetch(`https://civitai.com/api/v1/model-versions/by-hash/${h}`);
    const d = await r.json();
    if (d.error === "Model not found") {
      return nonLink;
    } else {
      const modelName = d.model?.name;
      if (modelName) {
        const { modelId, id } = d;
        const link = `https://civitai.com/models/${modelId}?modelVersionId=${id}`;
        return `<a class="imgInfoModelOutputLink" href="${link}" target="_blank">${modelName}</a>`;
      } else {
        return nonLink;
      }
    }
  }
  return nonLink;
}

async function TIHashesSearchLink(n, h) {
  const nonLink = `<span class="imgInfoModelOutputNonLink">${n}: ${h}</span>`;

  if (h) {
    const link = `https://civitai.com/search/models?sortBy=models_v9&query=${h}`;
    return `<a class="imgInfoModelOutputLink" href="${link}" target="_blank">${n}</a>`;
  }

  return nonLink;
}

async function plainTextToHTML(inputs) {
  const EnCrypt = window.EnCrypt;
  const PWSha = window.PWSha;
  const sourceNAI = window.sourceNAI;
  const softWare = window.softWare;

  const buttonColor = 'var(--primary-400)';

  const imgInfoSendButton = document.querySelector("#imgInfoSendButton");
  var imgInfoOutputPanel = document.querySelector("#imgInfoOutputPanel");
  var sty = `display: block; margin-bottom: 2px; color: ${buttonColor};`;

  var buttonStyle = `
    color: ${buttonColor};
    font-size: 15px;
    font-weight: bold;
    text-align: center;
    margin-bottom: 2px;
    display: block;
    background-color: transparent;
    cursor: pointer;`;

  var titlePrompt = `
    <button id="promptButton"
      class="imgInfoButtons"
      style="${buttonStyle}; padding-top: 0px; margin-bottom: 2px;"
      title="Copy Prompt">
      Prompt
    </button>`;

  var titleNegativePrompt = `
    <button id="negativePromptButton"
      class="imgInfoButtons"
      style="${buttonStyle}"
      title="Copy Negative Prompt">
      Negative Prompt
    </button>`;

  var titleParams = `
    <button id="paramsButton"
      class="imgInfoButtons"
      style="${buttonStyle}"
      title="Copy Parameter Settings">
      Params
    </button>`;

  const titleModels = '';
  const titleEncrypt = `<b style="${sty};">Encrypt</b>`;
  const titleSha = `<b style="${sty};">EncryptPwdSha</b>`;
  const titleSoftware = `<b style="${sty};">Software</b>`;
  const titleSource = `<b style="${sty};">Source</b>`;

  const br = /\n/g;

  let outputHTML = '';
  let promptText = '';
  let negativePromptText = '';
  let paramsText = '';
  let modelBox = '';

  function imgInfoOutput(title, content) {
    return `<div class="imgInfoOutputSection"><p>${title}${content}</p></div>`;
  }

  if (inputs === undefined || inputs === null || inputs.trim() === '') {
    imgInfoOutputPanel.style.transition = 'none';
    imgInfoOutputPanel.style.opacity = '0';
    imgInfoOutputPanel.classList.remove('show');
    imgInfoSendButton.style.display = 'none';

  } else {
    imgInfoOutputPanel.classList.add('show');
    imgInfoOutputPanel.style.transition = '';
    imgInfoOutputPanel.style.opacity = '1';

    if (inputs.trim().includes("Nothing To See Here")) {
      titlePrompt = '';
      imgInfoSendButton.style.display = 'none';
      outputHTML = imgInfoOutput('', inputs);

    } else {
      imgInfoSendButton.style.display = 'grid';
      inputs = inputs.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(br, '<br>');
      inputs = inputs.replace(/Seed:\s?(\d+),/gi, function(match, seedNumber) {
        return `
          <button id="seedButton"
            class="imgInfoButtons"
            style="color: ${buttonColor}; margin-bottom: -5px; cursor: pointer;"
            title="Copy Seed Value">
            Seed
          </button>: ${seedNumber},`;
      });

      const negativePromptIndex = inputs.indexOf("Negative prompt:");
      const stepsIndex = inputs.indexOf("Steps:");
      const hashesIndex = inputs.indexOf("Hashes:");

      if (negativePromptIndex !== -1) {
        promptText = inputs.substring(0, negativePromptIndex).trim();
      } else if (stepsIndex !== -1) {
        promptText = inputs.substring(0, stepsIndex).trim();
      } else {
        promptText = inputs.trim();
      }

      if (negativePromptIndex !== -1 && stepsIndex !== -1 && stepsIndex > negativePromptIndex) {
        negativePromptText = inputs.slice(negativePromptIndex + "Negative prompt:".length, stepsIndex).trim();
      }

      if (stepsIndex !== -1) {
        const hashesEX = inputs.slice(hashesIndex).match(/Hashes:\s*(\{.*?\})(,\s*)?/);
        paramsRAW = inputs.slice(stepsIndex).trim();
        paramsText = inputs.slice(stepsIndex).trim()
        .replace(/,\s*(Lora hashes|TI hashes):\s*"[^"]+"/g, '')
        .trim();

        modelBox = `
          <div id="imgInfoModelOutput" class="modelBox">
            <svg xmlns="http://www.w3.org/2000/svg"
                x="0px" y="0px" width="100" height="100"
                viewBox="0 0 48 48" id="refresh-spinner">
              <path fill="${buttonColor}"
                d="M8,24c0-8.8,7.2-16,16-16c1,0,2,0.1,3,0.3l0.7-3.9C26.5,4.1,25.3,4,24,4C12.9,4,4,13,4,24
                c0,4.8,1.7,9.5,4.8,13.1l3-2.6C9.5,31.6,8,28,8,24z">
              </path>
              <path fill="${buttonColor}"
                d="M39.5,11.3l-3.1,2.5C38.6,16.6,40,20.1,40,24c0,8.8-7.2,16-16,16c-1,0-2-0.1-3-0.3l-0.7,3.8
                c1.3,0.2,2.5,0.3,3.7,0.3c11.1,0,20-8.9,20-20C44,19.4,42.4,14.8,39.5,11.3z">
              </path>
              <polygon fill="${buttonColor}" points="31,7 44,8.7 33.3,19"></polygon>
              <polygon fill="${buttonColor}" points="17,41 4,39.3 14.7,29"></polygon>
            </svg>
          </div>
        `;

        setTimeout(() => {
          const imgInfoModelOutput = document.querySelector("#imgInfoModelOutput");
          if (imgInfoModelOutput) {
            const imgInfoModelBox = imgInfoModelOutput.closest(".imgInfoOutputSection");
            if (imgInfoModelBox) {
              imgInfoModelBox.classList.add("modelBox");
            }

            imgInfoModelOutput.innerHTML = modelBox;
          }
        }, 0);

        setTimeout(async () => {
          const fetchTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 60000)
          );

          try {
            const ModelOutputFetched = await Promise.race([
              FetchingModelOutput(paramsRAW),
              fetchTimeout
            ]);

            const imgInfoModelOutput = document.querySelector("#imgInfoModelOutput");
            if (imgInfoModelOutput) {
              imgInfoModelOutput.classList.add("imgInfoModelOutputReveal");
              imgInfoModelOutput.innerHTML = ModelOutputFetched;
            }
          } catch (error) {
            if (error.message === 'Timeout') {
              const imgInfoModelOutput = document.querySelector("#imgInfoModelOutput");
              if (imgInfoModelOutput) {
                imgInfoModelOutput.innerHTML = 'Failed to fetch...';
              }
            }
          }
        }, 500);

        if (hashesEX && hashesEX[1]) {
          paramsText = paramsText.replace(hashesEX[0], '').trim();
        }
        if (paramsText.endsWith(',')) {
          paramsText = paramsText.slice(0, -1).trim();
        }
      } else {
        paramsText = inputs.trim();
      }

      const sections = [
        { title: titlePrompt, content: promptText },
        { title: titleNegativePrompt, content: negativePromptText },
        { title: titleParams, content: paramsText },
        { title: titleSoftware, content: softWare },
        { title: titleModels, content: modelBox },
        { title: titleEncrypt, content: EnCrypt },
        { title: titleSha, content: PWSha },
        { title: titleSource, content: sourceNAI }
      ];

      sections.forEach(section => {
        if (section.content && section.content.trim() !== '') {
          outputHTML += imgInfoOutput(section.title, section.content);
        }
      });
    }
  }

  return `${outputHTML}`;
}
