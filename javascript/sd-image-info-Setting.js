async function SDImageInfoCreateSetting() {
  const settingColumn = document.getElementById('column_settings_SDImageInfo-Setting');

  if (settingColumn) {
    async function waitForOpts() {
      for (; ;) {
        if (window.opts && Object.keys(window.opts).length) {
          return window.opts;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    let get = await waitForOpts();
    SDImageInfoLoadSetting(get.sd_image_info_layout);

    const applyWrap = document.createElement('div');
    applyWrap.id = 'SDImageInfo-Setting-Button-Wrapper';

    const applyButton = document.createElement('button');
    applyButton.id = 'SDImageInfo-Setting-Apply-Button';
    applyButton.className = 'lg primary gradio-button svelte-cmf5ev';
    applyButton.textContent = 'Apply';
    applyButton.title = 'apply the style immediately';
    applyButton.onclick = () => SDImageInfoLoadSetting();

    applyWrap.append(applyButton);

    const previewWrap = document.createElement('div');
    previewWrap.id = 'SDImageInfo-Setting-Preview-Wrapper';

    const preview1 = document.createElement('img');
    preview1.id = 'SDImageInfo-Setting-Preview-1';
    preview1.className = 'sdimageinfo-setting-preview';

    const preview2 = document.createElement('img');
    preview2.id = 'SDImageInfo-Setting-Preview-2';
    preview2.className = 'sdimageinfo-setting-preview';

    previewWrap.append(preview1, preview2);

    settingColumn.parentNode?.prepend(previewWrap);
    settingColumn.append(applyWrap);

    const img1 = `${window.SDImageInfoFilePath}example/fullwidth.jpg?ts=${Date.now()}`;
    const img2 = `${window.SDImageInfoFilePath}example/sidebyside.jpg?ts=${Date.now()}`;

    try {
      const [res1, res2] = await Promise.all([
        fetch(img1),
        fetch(img2),
      ]);

      if (res1.ok && res2.ok) {
        preview1.src = img1;
        preview2.src = img2;
      } else {
        console.error("error.");
      }
    } catch (err) {
      console.error("preview images error :", err);
    }

    const previewChange = () => {
      const v = document.querySelector('#setting_sd_image_info_layout label.selected input')?.value;
      preview1.style.display = v === 'fullwidth' ? 'flex' : '';
      preview2.style.display = v === 'side by side' ? 'flex' : '';
    };

    previewChange();
    document.querySelectorAll('#setting_sd_image_info_layout input').forEach(input => {
      input.onchange = () => previewChange();
    });
  }
}

function SDImageInfoLoadSetting(Opts) {
  const id = 'SDImageInfo-SideBySide';
  const style = Opts ?? document.querySelector('#setting_sd_image_info_layout label.selected input')?.value;
  const el = document.getElementById(id);

  if (style) {
    style === 'side by side'
      ? el || document.body.appendChild(Object.assign(document.createElement('style'), { id, textContent: SDImageInfosideBysideCSS }))
      : el?.remove();
  }

  !Opts && document.querySelector('#tab_settings #settings_submit')?.click();
}

const SDImageInfosideBysideCSS = `
  #SDImageInfo-Column {
    filter: drop-shadow(0 0 1px #000);
  }

  #SDImageInfo-Column > .form {
    position: absolute !important;
    flex-direction: row !important;
    flex-wrap: wrap !important;
    overflow: hidden;
    height: 100% !important;
    width: 100% !important;
    gap: 0 !important;
  }

  #SDImageInfo-Image-Column {
    position: relative !important;
    gap: 0 !important;
    overflow: visible !important;
    padding: 10px 0 10px 10px !important;
  }

  #SDImageInfo-Frame {
    left: 0;
    top: 0 !important;
    box-shadow: inset 0 0 7px 2px #000;
  }

  #SDImageInfo-Image.sdimageinfo-img-enter #SDImageInfo-Frame {
    transform: scale(1);
  }

  #SDImageInfo-Image {
    position: relative;
    top: unset !important;
    width: 100% !important;
    flex: unset;
  }

  #SDImageInfo-Image.sdimageinfo-img-enter {
    border-style: solid !important;
    min-width: 100% !important;
    border-width: var(--block-border-width) !important;
    min-height: 100% !important;
    border: 0 !important;
    border-radius: 1rem !important;
    box-shadow: 0 0 5px 0 #000 !important;
  }

  #SDImageInfo-Image img {
    position: unset !important;
    max-width: 100% !important;
    max-height: 100% !important;
    object-fit: cover !important;
    object-position: top !important;
    border-top-right-radius: 1.5rem !important;
    border-top-left-radius: 1.5rem !important;
  }

  #SDImageInfo-Gear-Button, #SDImageInfo-Clear-Button {
    position: absolute !important;
    height: 54px !important;
    width: 54px !important;
  }

  #SDImageInfo-Gear-Button {
    border-radius: 0;
    border-bottom-right-radius: 1.5rem;
    margin: 0;
    right: unset;
    border-top-left-radius: 1rem;
  }

  #SDImageInfo-Clear-Button {
    margin: 0;
    border-top-right-radius: 1rem;
  }

  #SDImageInfo-Image.sdimageinfo-img-enter #SDImageInfo-Image-Frame {
    position: absolute !important;
    filter: unset !important;
    box-shadow: inset 0 0 7px 3px #000 !important;
    border-radius: 1rem !important;
    width: 100% !important;
    top: unset !important;
    height: 100% !important;
  }

  #SDImageInfo-Custom-Wrapper {
    position: absolute;
  }

  #SDImageInfo-SendButton {
    grid-template-columns: 1fr 1fr !important;
    left: unset !important;
    position: absolute !important;
    bottom: 0 !important;
    padding: 0 10px 15px 10px !important;
    border-radius: 1rem !important;
    width: 100% !important;
    align-self: center !important;
    gap: 2px !important;
  }

  #SDImageInfo-SendButton button {
    border-radius: 0 !important;
    box-shadow: 0 0 5px 1px #000 !important;
  }

  #SDImageInfo-SendButton > :nth-child(1) {
    border-top-left-radius: 1rem !important;
  }

  #SDImageInfo-SendButton > :nth-child(2) {
    border-top-right-radius: 1rem !important;
  }

  #SDImageInfo-SendButton > :nth-child(3) {
    border-bottom-left-radius: 1rem !important;
  }

  #SDImageInfo-SendButton > :nth-child(4) {
    border-bottom-right-radius: 1rem !important;
  }

  #SDImageInfo-Output-Panel {
    position: relative;
    padding: 10px !important;
  }

  #SDImageInfo-Output-Panel.display-output-panel {
    height: max-content !important;
    max-height: 100%;
    pointer-events: auto !important;
    overflow: auto;
    will-change: transform;
    scrollbar-width: none;
  }

  #SDImageInfo-img-area {
    display: none !important;
  }

  #SDImageInfo-img-area {  
    display: none !important;
  }

  #SDImageInfo-HTML {
    height: max-content !important;
    margin: 0 !important;
    padding: 0 !important;
    position: relative !important;
  }

  #SDImageInfo-HTML .sdimageinfo-output-title {
    background: var(--input-background-fill);
    filter: unset !important;
  }

  #SDImageInfo-HTML .sdimageinfo-output-wrapper {
    background: var(--input-background-fill) !important;
    filter: unset !important;
  }

  @media (max-width: 600px) {
    #SDImageInfo-Column {
      overflow-y: auto !important;
      filter: unset;
    }

    #SDImageInfo-Column > .form {
      overflow: visible !important;
    }

    #SDImageInfo-Image-Column {
      padding: 10px !important;
      height: 70% !important;
    }

    #SDImageInfo-Frame {
      display: none;
    }

    #SDImageInfo-SendButton {
      padding: 15px !important;
    }

    #SDImageInfo-Output-Panel {
      max-height: max-content !important;
      overflow: visible !important;
    }
  }
`;