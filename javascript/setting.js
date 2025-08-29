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

    const applyButton = SDImgInfoEL('button', {
      id: 'SDImageInfo-Setting-Apply-Button',
      class: 'lg primary gradio-button svelte-cmf5ev',
      text: 'Apply',
      title: 'apply the style immediately',
      onclick: () => SDImageInfoLoadSetting()
    }),
    applyWrap = SDImgInfoEL('div', { id: 'SDImageInfo-Setting-Button-Wrapper', children: applyButton }),

    preview1 = SDImgInfoEL('img', {
      id: 'SDImageInfo-Setting-Preview-1',
      class: 'sdimageinfo-setting-preview',
      src: `${window.SDImageInfoFilePath}example/fullwidth.jpg?ts=${Date.now()}`
    }),
    preview2 = SDImgInfoEL('img', {
      id: 'SDImageInfo-Setting-Preview-2',
      class: 'sdimageinfo-setting-preview',
      src: `${window.SDImageInfoFilePath}example/sidebyside.jpg?ts=${Date.now()}`
    }),
    previewWrap = SDImgInfoEL('div', { id: 'SDImageInfo-Setting-Preview-Wrapper', children: [preview1, preview2] });

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

    #SDImageInfo-Image.${sdimginfoS} #SDImageInfo-Frame { transform: scale(1); }

    #SDImageInfo-Image {
      position: relative;
      top: unset !important;
      width: 100% !important;
      flex: unset;
    }

    #SDImageInfo-Image.${sdimginfoS} {
      border-style: solid !important;
      min-width: 100% !important;
      border-width: var(--block-border-width) !important;
      min-height: 100% !important;
      border: 0 !important;
      border-radius: 1rem !important;
      box-shadow: 0 0 4px 0 #000, 0 0 1px 1px var(--background-fill-primary) !important;
    }

    #SDImageInfo-Image.${sdimginfoS} .boundedheight {
      position: relative !important;
      inset: unset !important;
      filter: unset !important;
    }

    #SDImageInfo-Image img {
      object-fit: cover !important;
      object-position: top !important;
      position: unset !important;
      max-width: 100% !important;
      max-height: 100% !important;
      border-radius: 1.2rem !important;
    }

    #SDImageInfo-Gear-Button,
    #SDImageInfo-Clear-Button {
      position: absolute !important;
    }

    #SDImageInfo-Gear-Button {
      top: -1px !important;
      left: -1px !important;
      right: unset !important;
      border-radius: 0 !important;
      border-bottom-right-radius: 1.2rem !important;
      margin: 0 !important;
    }

    #SDImageInfo-Image.${sdimginfoS} #SDImageInfo-Gear-Button {
      top: 0 !important;
      left: 0 !important;
      border-top-left-radius: 1rem !important;
    }

    #SDImageInfo-Image.sdimginfo-style #SDImageInfo-Gear-Button > svg {
      top: 0 !important;
    }

    #SDImageInfo-Clear-Button {
      margin: 0;
      border-top-right-radius: 1rem;
    }

    #SDImageInfo-Image.${sdimginfoS} #SDImageInfo-Image-Frame {
      position: absolute !important;
      top: unset !important;
      height: 100% !important;
      width: 100% !important;
      border-radius: 1rem !important;
      box-shadow: inset 0 0 1px 0 var(--background-fill-primary), inset 0 0 3px 1px var(--background-fill-primary) !important;
      filter: unset !important;
    }

    #SDImageInfo-Custom-Wrapper { position: absolute; }

    #SDImageInfo-SendButton {
      grid-template-columns: 1fr 1fr !important;
      align-self: center !important;
      gap: 4px !important;
      position: absolute !important;
      left: unset !important;
      bottom: 0 !important;
      width: 100% !important;
      padding: 0 10px 15px 10px !important;
      border-radius: 1rem !important;
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

    #SDImageInfo-img-area {
      display: none !important;
    }

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