async function SDImageInfoParser() {
  window.imgInfoEncrypt = '';
  window.imgInfoSha256 = '';
  window.imgInfoNaiSource = '';
  window.imgInfoSoftware = '';

  const imgInfoRawOutput = gradioApp().querySelector("#imgInfoGenInfo textarea");
  const imgInfoHTML = gradioApp().querySelector("#imgInfoHTML");
  const imgInfoImage = gradioApp().querySelector('#imgInfoImage');
  const img = gradioApp().querySelector('#imgInfoImage img');

  if (!img) {
    imgInfoHTML.innerHTML = await SDImageInfoPlainTextToHTML('');
    imgInfoImage.style.boxShadow = '';
    return;
  }

  SDImageInfoImageViewer(img);
  imgInfoImage.style.cssText += 'box-shadow: inset 0 0 0 0 !important;';

  img.onload = function() {
    img.style.opacity = "1";
  };

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
    console.log(tags);
    window.imgInfoEncrypt = tags.Encrypt ? tags.Encrypt.description : '';
    window.imgInfoSha256 = tags.EncryptPwdSha ? tags.EncryptPwdSha.description : '';

    if (tags.parameters && tags.parameters.description) {
      if (tags.parameters.description.includes("sui_image_params")) {
        const parSing = JSON.parse(tags.parameters.description);
        const Sui = parSing["sui_image_params"];
        output = SDImageInfoConvertSwarmUI(Sui, {});
      } else {
        output = tags.parameters.description;
      }

    } else if (tags.UserComment && tags.UserComment.value) {
      const array = tags.UserComment.value;
      const UserComments = SDImageInfoDecodeUserComment(array);
      if (UserComments.includes("sui_image_params")) {
        const rippin = UserComments.trim().replace(/[\x00-\x1F\x7F]/g, '');
        const parSing = JSON.parse(rippin);
        if (parSing["sui_image_params"]) {
          const Sui = parSing["sui_image_params"];
          const SuiExtra = parSing["sui_extra_data"] || {};
          output = SDImageInfoConvertSwarmUI(Sui, SuiExtra);
        }
      } else {
        output = UserComments;
      }

    } else if (tags["Software"] && tags["Software"].description === "NovelAI" &&
               tags.Comment && tags.Comment.description) {

      window.imgInfoSoftware = tags["Software"] ? tags["Software"].description : '';
      window.imgInfoNaiSource = tags["Source"] ? tags["Source"].description : '';

      const nai = JSON.parse(tags.Comment.description);
      nai.sampler = "Euler";

      output = SDImageInfoConvertNovelAI(nai["prompt"]) +
        "\nNegative prompt: " + SDImageInfoConvertNovelAI(nai["uc"]) +
        "\nSteps: " + nai["steps"] +
        ", Sampler: " + nai["sampler"] +
        ", CFG scale: " + parseFloat(nai["scale"]).toFixed(1) +
        ", Seed: " + nai["seed"] +
        ", Size: " + nai["width"] + "x" + nai["height"] +
        ", Clip skip: 2, ENSD: 31337";

    } else if (tags.prompt && tags.workflow && tags.prompt.description) {
      if (tags.prompt.description.includes('"filename_prefix": "ComfyUI"')) {
        output = 'ComfyUI<br>Nothing To Read Here';
      }

    } else if (tags.invokeai_graph && tags.invokeai_graph.description) {
      output = 'InvokeAI<br>Nothing To Read Here';

    } else {
      output = 'Nothing To See Here';
    }

    if (output) {
      imgInfoRawOutput.value = output;
      updateInput(imgInfoRawOutput);
      imgInfoHTML.classList.add('prose');
      imgInfoHTML.innerHTML = await SDImageInfoPlainTextToHTML(output);
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
  const output = new TextDecoder("utf-16").decode(new Uint16Array(result)).trim();
  return output.replace(/^UNICODE[\x00-\x20]*/, "");
}

function SDImageInfoConvertNovelAI(input) {
  function NAIround(v) {
    return Math.round(v * 10000) / 10000;
  }

  const re_attention = /\{|\[|\}|\]|[^\{\}\[\]]+/gmu;

  let text = input.replaceAll("(", "\\(").replaceAll(")", "\\)").replace(/\\{2,}(\(|\))/gim, '\$1');

  let res = [];
  let curly_brackets = [];
  let square_brackets = [];

  const curly_bracket_multiplier = 1.05;
  const square_bracket_multiplier = 1 / 1.05;

  function NAIMultiplyRange(start, multiplier) {
    for (let pos = start; pos < res.length; pos++) {
      res[pos][1] = NAIround(res[pos][1] * multiplier);
    }
  }

  for (const match of text.matchAll(re_attention)) {
    let word = match[0];

    if (word === "{") {
      curly_brackets.push(res.length);
    } else if (word === "[") {
      square_brackets.push(res.length);
    } else if (word === "}" && curly_brackets.length > 0) {
      NAIMultiplyRange(curly_brackets.pop(), curly_bracket_multiplier);
    } else if (word === "]" && square_brackets.length > 0) {
      NAIMultiplyRange(square_brackets.pop(), square_bracket_multiplier);
    } else {
      res.push([word, 1.0]);
    }
  }

  for (const pos of curly_brackets) {
    NAIMultiplyRange(pos, curly_bracket_multiplier);
  }
  for (const pos of square_brackets) {
    NAIMultiplyRange(pos, square_bracket_multiplier);
  }

  if (res.length === 0) {
    res = [["", 1.0]];
  }

  let i = 0;
  while (i + 1 < res.length) {
    if (res[i][1] === res[i + 1][1]) {
      res[i][0] += res[i + 1][0];
      res.splice(i + 1, 1);
    } else {
      i++;
    }
  }

  let result = "";
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

  window.imgInfoSoftware = Sui?.swarm_version ? `SwarmUI ${Sui.swarm_version}` : '';

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

async function SDImageInfoPlainTextToHTML(inputs) {
  const EncryptInfo = window.imgInfoEncrypt;
  const Sha256Info = window.imgInfoSha256;
  const NaiSourceInfo = window.imgInfoNaiSource;
  const SoftwareInfo = window.imgInfoSoftware;

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

  function SDImageInfoHTMLOutput(title, content) {
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

    if (inputs.trim().includes('Nothing To See Here') || inputs.trim().includes('Nothing To Read Here')) {
      titlePrompt = '';
      imgInfoSendButton.style.display = 'none';
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
              SDImageInfoFetchModelOutput(paramsRAW),
              fetchTimeout
            ]);

            const imgInfoModelOutput = document.querySelector("#imgInfoModelOutput");
            if (imgInfoModelOutput) {
              imgInfoModelOutput.classList.add("imgInfoModelOutputReveal");
              imgInfoModelOutput.innerHTML = ModelOutputFetched;
              setTimeout(() => {
                imgInfoModelOutput.classList.remove("imgInfoModelOutputReveal");
              }, 2000);
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
