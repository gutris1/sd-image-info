async function imgInfoPlainTextToHTML(inputs) {
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

    if (inputs.trim().includes('Nothing To See Here') || inputs.trim().includes('Nothing To Read Here')) {
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
