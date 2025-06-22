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

    settingColumn.prepend(previewWrap);
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
  const id = 'SDImageInfo-SideBySide';
  const style = Opts ?? document.querySelector('#setting_sd_image_info_layout label.selected input')?.value;
  const el = document.getElementById(id);

  const sideBysideCSS = `
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
      box-shadow: inset 0 0 7px 2px #000;
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
      border-radius: 0 !important;
      border-bottom-right-radius: 1.5rem !important;
      margin: 0 !important;
      left: 0 !important;
      right: unset !important;
    }

    #SDImageInfo-Image.sdimageinfo-img-enter #SDImageInfo-Gear-Button {
      border-top-left-radius: 1.2rem !important;
    }

    #SDImageInfo-Clear-Button { margin: 0; border-top-right-radius: 1rem; }

    #SDImageInfo-Image.sdimageinfo-img-enter #SDImageInfo-Image-Frame {
      position: absolute !important;
      filter: unset !important;
      box-shadow: inset 0 0 7px 3px #000 !important;
      border-radius: 1rem !important;
      width: 100% !important;
      top: unset !important;
      height: 100% !important;
    }

    #SDImageInfo-Custom-Wrapper { position: absolute; }

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

    #SDImageInfo-SendButton button { border-radius: 0 !important; box-shadow: 0 0 5px 1px #000 !important; }
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
      will-change: transform;
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

function SDImageInfoCreateSomething() {
  const column = document.getElementById('SDImageInfo-Column');
  const imgCon = document.querySelector('#SDImageInfo-Image > .image-container');
  const panel = document.getElementById('SDImageInfo-Output-Panel');

  const HTMLPanel = document.getElementById('SDImageInfo-HTML');
  HTMLPanel.classList.add('prose');

  const customWrap = document.createElement('div');
  customWrap.id = 'SDImageInfo-Custom-Wrapper';

  const frame = document.createElement('div');
  frame.id = 'SDImageInfo-Frame';

  const imgFrame = document.createElement('div');
  imgFrame.id = 'SDImageInfo-Image-Frame';

  const gearButton = document.createElement('div');
  gearButton.id = 'SDImageInfo-Gear-Button';
  gearButton.innerHTML = SDImageInfoGearSVG;

  gearButton.onclick = () => {
    [['#tab_settings #settings .tab-nav button', 'SD Image Info'],  ['#tabs .tab-nav button', 'Settings']]
      .forEach(([el, text]) => [...document.querySelectorAll(el)].find(btn => btn.textContent.trim() === text)?.click()
    );
  };

  const clearButton = document.createElement('div');
  clearButton.id = 'SDImageInfo-Clear-Button';
  clearButton.title = 'Exit';
  clearButton.innerHTML = SDImageInfoCrossSVG;

  window.SDImageInfoClearImage = () => {
    const btn = document.querySelector('#SDImageInfo-Image > div > div > div > button:nth-child(2)') ||
                document.querySelector('.gradio-container-4-40-0 #SDImageInfo-Image > div > div > button');
    btn && (btn.click(), window.SDImageInfoRawOutput = '');
  };

  clearButton.onclick = () => window.SDImageInfoClearImage();

  customWrap.append(imgFrame, clearButton);
  imgCon.append(gearButton, customWrap, frame);

  const arrow = document.createElement('div');
  arrow.id = 'SDImageInfo-Arrow';
  arrow.innerHTML = SDImageInfoArrowSVG;

  column.append(arrow);
  SDImageInfoArrowScroll(arrow);

  const imgArea = document.createElement('div');
  imgArea.id = 'SDImageInfo-img-area'
  imgArea.onclick = () => document.querySelector('#SDImageInfo-Image img')?.click();
  panel.prepend(imgArea);

  ['drop', 'dragover'].forEach(t =>
    document.addEventListener(t, e => {
      const Tab = document.getElementById('tab_SDImageInfo-Tab');
      const LightBox = document.getElementById('SDImageInfo-Image-Viewer');
      const column = document.getElementById('SDImageInfo-Column');
      const form = document.querySelector('#SDImageInfo-Column > .form');
      const imgColumn = document.getElementById('SDImageInfo-Image-Column');
      const imgArea = document.getElementById('SDImageInfo-img-area');
      const panel = document.getElementById('SDImageInfo-Output-Panel');
      const imgCon = document.querySelector('#SDImageInfo-Image > .image-container');

      if (Tab?.style.display !== 'block' || LightBox?.style.display === 'flex') return;

      const el =
        e.target?.id === column?.id || e.target?.id === form?.id || e.target?.id === imgColumn?.id || 
        e.target?.id === imgArea?.id || e.target?.id === panel?.id || e.target?.classList?.contains('sdimageinfo-output-content');

      if (!el) return;
      e.preventDefault();

      if (t === 'drop') {
        const dropArea = imgCon?.querySelector('.boundedheight');
        if (dropArea) {
          const dropEvent = new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: e.dataTransfer });
          dropArea.dispatchEvent(dropEvent);
        }
      }
    })
  );

  document.addEventListener('keydown', (e) => {
    const Tab = document.getElementById('tab_SDImageInfo-Tab');
    const LightBox = document.getElementById('SDImageInfo-Image-Viewer');
    const column = document.getElementById('SDImageInfo-Column');

    if (Tab?.style.display !== 'block') return;

    const img = document.querySelector('#SDImageInfo-Image img');
    if (e.key === 'Escape') {
      e.preventDefault();
      if (LightBox?.style.display === 'flex') return window.SDImageInfoImageViewerExit();
      if (img) window.SDImageInfoClearImage();
    }

    const Scroll = e.key === 'ArrowUp' ? 0 : e.key === 'ArrowDown' ? column.scrollHeight : null;
    if (Scroll !== null) { e.preventDefault(); column.scrollTo({ top: Scroll, behavior: 'smooth' }); }
  });
}

function SDImageInfoArrowScroll(arrow) {
  let clicked = false;

  const whichEL = () => {
    const column = document.getElementById('SDImageInfo-Column');
    const panel = document.getElementById('SDImageInfo-Output-Panel');
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
      const { scrollTop, scrollHeight, clientHeight } = el;
      const overflow = scrollHeight > clientHeight + 1;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 5;
      arrow.style.transform = overflow && !atBottom ? 'scale(1)' : '';
    });
  };

  ['SDImageInfo-Column', 'SDImageInfo-Output-Panel'].forEach(id =>
    document.getElementById(id)?.addEventListener('scroll', window.SDImageInfoArrowScrolling)
  );

  ['scroll', 'resize'].forEach(e => window.addEventListener(e, () => setTimeout(window.SDImageInfoArrowScrolling, 50)));
}