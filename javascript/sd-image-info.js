onUiLoaded(function () {
  let imgInfoImage = document.getElementById("imgInfoImage");
  if (imgInfoImage) {
    imgInfoImage.style.removeProperty('height')
    document.addEventListener("click", SDImageInfoCopyButtonEvent);
  }
});

function SDImageInfoCopyButtonEvent(e) {
  let OutputRaw = '';

  const imgInfoRawOutput = gradioApp().querySelector("#imgInfoGenInfo > label > textarea");
  if (imgInfoRawOutput) {
    OutputRaw = imgInfoRawOutput.value;
  }

  function SDImageInfoPulseBorderSection(button) {
    var section = button.closest('.imgInfoOutputSection');
    section.classList.add('imgInfoBorderPulse');
    setTimeout(() => section.classList.remove('imgInfoBorderPulse'), 2000);
  }

  function SDImageInfoCopy(CopyCopy, whichBorder) {
    navigator.clipboard.writeText(CopyCopy);
    SDImageInfoPulseBorderSection(whichBorder);
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
    SDImageInfoCopy(promptText, e.target);
  }

  if (e.target && e.target.id === "negativePromptButton") {
    const negativePromptStart = OutputRaw.indexOf("Negative prompt:");
    const stepsStart = OutputRaw.indexOf("Steps:");
    if (negativePromptStart !== -1 && stepsStart !== -1 && stepsStart > negativePromptStart) {
      const negativePromptText = OutputRaw.slice(negativePromptStart + "Negative prompt:".length, stepsStart).trim();
      SDImageInfoCopy(negativePromptText, e.target);
    }
  }

  if (e.target && e.target.id === "paramsButton") {
    const stepsStart = OutputRaw.indexOf("Steps:");
    if (stepsStart !== -1) {
      const paramsText = OutputRaw.slice(stepsStart).trim();
      SDImageInfoCopy(paramsText, e.target);
    }
  }

  if (e.target && e.target.id === "seedButton") {
    const seedMatch = OutputRaw.match(/Seed:\s?(\d+),/i);
    if (seedMatch && seedMatch[1]) {
      const seedText = seedMatch[1].trim();
      SDImageInfoCopy(seedText, e.target);
    }
  }

  var ADModel = OutputRaw.includes("ADetailer model");

  function SDImageInfoSendButton(tabname) {
    if (e.target && e.target.id === `${tabname}_tab` && e.target.parentElement &&
        e.target.parentElement.id === "imgInfoSendButton" && ADModel
    ) {
      let Id = `script_${tabname}_adetailer_ad_main_accordion-visible-checkbox`;
      let checkbox = gradioApp().getElementById(Id);
      if (checkbox && !checkbox.checked) checkbox.click();
    }
  }

  SDImageInfoSendButton("txt2img");
  SDImageInfoSendButton("img2img");
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

async function SDImageInfoTIHashesSearchLink(n, h) {
  const nonLink = `<span class="imgInfoModelOutputNonLink">${n}: ${h}</span>`;

  if (h) {
    const link = `https://civitai.com/search/models?sortBy=models_v9&query=${h}`;
    return `<a class="imgInfoModelOutputLink" href="${link}" target="_blank">${n}</a>`;
  }

  return nonLink;
}

onUiUpdate(function() {
  var Id = 'imgInfoHidingScrollBar';
  let BS = gradioApp().querySelector('#tabs > .tab-nav > button.selected');

  if (BS && BS.textContent.trim() === 'Image Info') {
    const tabNav = document.querySelector('.tab-nav.scroll-hide');
    Object.assign(tabNav.style, { borderBottom: '0' });
    if (!document.getElementById(Id)) {
      const SB = document.createElement('style');
      SB.id = Id;
      SB.innerHTML = `::-webkit-scrollbar { width: 0 !important; height: 0 !important; }`;
      document.head.appendChild(SB);
    }
    Object.assign(document.documentElement.style, { scrollbarWidth: 'none' });

  } else if (BS && BS.textContent.trim() !== 'Image Info') {
    const tabNav = document.querySelector('.tab-nav.scroll-hide');
    Object.assign(tabNav.style, { borderBottom: '' });
    const SB = document.getElementById(Id);
    if (SB) document.head.removeChild(SB);
    Object.assign(document.documentElement.style, { scrollbarWidth: '' });
  }
});
