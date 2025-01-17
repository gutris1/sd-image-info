onUiLoaded(function () {
  const imgInfoTAB = gradioApp().getElementById('tab_sd_image_info')
  if (imgInfoTAB) {
    document.addEventListener("click", imgInfoCopyButtonEvent);
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

    imgInfoimageViewer(img);

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
    imgInfoHTML.innerHTML = await imgInfoPlainTextToHTML('');
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
        output = imgInfoSwarmUI(Sui, {});
      } else {
        output = tags.parameters.description;
      }

    } else if (tags.UserComment && tags.UserComment.value) {
      const array = tags.UserComment.value;
      const UserComments = imgInfoUserComment(array);
      if (UserComments.includes("sui_image_params")) {
        const rippin = UserComments.trim().replace(/[\x00-\x1F\x7F]/g, '');
        const parSing = JSON.parse(rippin);
        if (parSing["sui_image_params"]) {
          const Sui = parSing["sui_image_params"];
          const SuiExtra = parSing["sui_extra_data"] || {};
          output = imgInfoSwarmUI(Sui, SuiExtra);
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

      output = imgInfoNovelAI(nai["prompt"]) +
        "\nNegative prompt: " + imgInfoNovelAI(nai["uc"]) +
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
      imgInfoHTML.innerHTML = await imgInfoPlainTextToHTML(output);
    }
  }
  return tags;
}

function imgInfoCopyButtonEvent(e) {
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

  var ADModel = OutputRaw.includes("ADetailer model");

  function imgInfoClickSendButton(tab) {
    if (e.target && e.target.id === `${tab}_tab` && e.target.parentElement &&
        e.target.parentElement.id === "imgInfoSendButton" && ADModel
    ) {
      let Id = `script_${tab}_adetailer_ad_main_accordion-visible-checkbox`;
      let checkbox = gradioApp().getElementById(Id);
      if (checkbox && !checkbox.checked) checkbox.click();
    }
  }

  imgInfoClickSendButton("txt2img");
  imgInfoClickSendButton("img2img");
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
