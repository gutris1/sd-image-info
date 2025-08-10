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
    preview1.src = `${window.SDImageInfoFilePath}example/fullwidth.jpg?ts=${Date.now()}`;

    const preview2 = document.createElement('img');
    preview2.id = 'SDImageInfo-Setting-Preview-2';
    preview2.className = 'sdimageinfo-setting-preview';
    preview2.src = `${window.SDImageInfoFilePath}example/sidebyside.jpg?ts=${Date.now()}`;

    previewWrap.append(preview1, preview2);

    settingColumn.prepend(previewWrap);
    settingColumn.append(applyWrap);

    const previewChange = () => {
      const v = document.querySelector('#setting_sd_image_info_layout label.selected input')?.value;
      preview1.style.display = v === 'full width' ? 'flex' : '';
      preview2.style.display = v === 'side by side' ? 'flex' : '';
    };

    previewChange();
    document.querySelectorAll('#setting_sd_image_info_layout input').forEach(input => {
      input.onchange = () => previewChange();
    });
  }
}

function SDImageInfoLoadSetting(Opts) {
  const id = 'SDImageInfo-SideBySide',
  style = Opts ?? document.querySelector('#setting_sd_image_info_layout label.selected input')?.value,
  el = document.getElementById(id),

  sideBysideCSS = `
    #SDImageInfo-Column { filter: drop-shadow(0 0 1px #000); }

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
      box-shadow: inset 0 0 7px 2px var(--background-fill-primary);
    }

    #SDImageInfo-Image.sdimageinfo-img-enter #SDImageInfo-Frame { transform: scale(1); }

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
      border-radius: 1.2rem !important;
    }

    #SDImageInfo-Gear-Button, #SDImageInfo-Clear-Button {
      position: absolute !important;
      height: 54px !important;
      width: 54px !important;
    }

    #SDImageInfo-Gear-Button {
      top: -1px !important;
      left: -1px !important;
      right: unset !important;
      border-radius: 0 !important;
      border-bottom-right-radius: 1.5rem !important;
      margin: 0 !important;
    }

    #SDImageInfo-Image.sdimageinfo-img-enter #SDImageInfo-Gear-Button {
      top: 0 !important;
      left: 0 !important;
      border-top-left-radius: 1.2rem !important;
    }

    #SDImageInfo-Clear-Button { margin: 0; border-top-right-radius: 1rem; }

    #SDImageInfo-Image.sdimageinfo-img-enter #SDImageInfo-Image-Frame {
      position: absolute !important;
      top: unset !important;
      height: 100% !important;
      width: 100% !important;
      border-radius: .9rem !important;
      box-shadow: inset 0 0 7px 2px #000, inset 0 0 7px 2px #000 !important;
      filter: unset !important;
    }

    #SDImageInfo-Custom-Wrapper { position: absolute; }

    #SDImageInfo-SendButton {
      grid-template-columns: 1fr 1fr !important;
      align-self: center !important;
      gap: 2px !important;
      position: absolute !important;
      left: unset !important;
      width: 100% !important;
      bottom: 0 !important;
      border-radius: 1rem !important;
      padding: 0 10px 15px 10px !important;
    }

    #SDImageInfo-SendButton button { border-radius: 0 !important; }
    #SDImageInfo-SendButton > :nth-child(1) { border-top-left-radius: 1rem !important; }
    #SDImageInfo-SendButton > :nth-child(2) { border-top-right-radius: 1rem !important; }
    #SDImageInfo-SendButton > :nth-child(3) { border-bottom-left-radius: 1rem !important; }
    #SDImageInfo-SendButton > :nth-child(4) { border-bottom-right-radius: 1rem !important; }

    #SDImageInfo-Output-Panel { position: relative; padding: 10px !important; }

    #SDImageInfo-Output-Panel.sdimageinfo-display-output-panel {
      height: max-content !important;
      max-height: 100%;
      pointer-events: auto !important;
      overflow: auto;
      scrollbar-width: none;
    }

    #SDImageInfo-img-area { display: none !important; }

    #SDImageInfo-HTML {
      height: max-content !important;
      margin: 0 !important;
      padding: 0 !important;
      position: relative !important;
    }

    #SDImageInfo-HTML .sdimageinfo-output-title { background: var(--input-background-fill); filter: unset !important; }
    #SDImageInfo-HTML .sdimageinfo-output-wrapper { background: var(--input-background-fill) !important; filter: unset !important; }
    #SDImageInfo-HTML .sdimageinfo-output-failed {
      position: relative !important;
      margin-top: 5px !important;
      bottom: unset !important;
    }

    @media (max-width: 600px) {
      #SDImageInfo-Column { overflow-y: auto !important; filter: unset; }
      #SDImageInfo-Column > .form { overflow: visible !important; }
      #SDImageInfo-Image-Column { padding: 10px !important; height: 70% !important; }
      #SDImageInfo-Frame {  display: none; }
      #SDImageInfo-SendButton { padding: 15px !important; }
      #SDImageInfo-Output-Panel { max-height: max-content !important; overflow: visible !important; }
    }
  `;

  style && (
    style === 'side by side'
      ? el || document.body.appendChild(Object.assign(document.createElement('style'), { id, textContent: sideBysideCSS }))
      : el?.remove()
  );

  !Opts && document.querySelector('#tab_settings #settings_submit')?.click();
}

function SDImageInfoArrowScroll(arrow) {
  let clicked = false;

  const whichEL = () => {
    const column = document.getElementById('SDImageInfo-Column'),
    panel = document.getElementById('SDImageInfo-Output-Panel');
    if (!column?.classList.contains('sdimageinfo-column-overflow')) return null;
    return panel && panel.scrollHeight > panel.clientHeight
      ? panel : column.scrollHeight > column.clientHeight
        ? column : null;
  };

  arrow.onclick = () => {
    clicked = true;
    arrow.style.transform = '';
    const el = whichEL();
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    setTimeout(() => clicked = false, 500);
  };

  window.SDImageInfoArrowScrolling = () => {
    if (clicked) return;
    const el = whichEL();
    if (!el) return arrow.style.transform = '';
    requestAnimationFrame(() => {
      const { scrollTop, scrollHeight, clientHeight } = el,
      overflow = scrollHeight > clientHeight + 1,
      atBottom = scrollTop + clientHeight >= scrollHeight - 5;
      arrow.style.transform = overflow && !atBottom ? 'scale(1)' : '';
    });
  };

  ['SDImageInfo-Column', 'SDImageInfo-Output-Panel'].forEach(id =>
    document.getElementById(id)?.addEventListener('scroll', window.SDImageInfoArrowScrolling)
  );

  ['scroll', 'resize'].forEach(e => window.addEventListener(e, () => setTimeout(window.SDImageInfoArrowScrolling, 50)));
}