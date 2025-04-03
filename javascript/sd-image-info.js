onUiLoaded(function () {
  const sendButton = document.getElementById('SDImageInfo-SendButton');
  sendButton?.querySelectorAll('#txt2img_tab, #img2img_tab').forEach(btn => {
    btn.onclick = () => SDImageInfoSendButton(btn.id.replace('_tab', ''));
  });

  document.addEventListener('keydown', (e) => {
    let Tab = document.getElementById('tab_sd_image_info');
    let img = document.querySelector('#SDImageInfo-Image img');
    if (e.key === 'Escape' && img && Tab?.style.display === 'block') {
      let LightBox = document.getElementById('SDImageInfo-Image-Viewer');
      if (LightBox?.style.display === 'flex') return;
      else (e.stopPropagation(), e.preventDefault(), window.SDImageInfoClearImage());
    }
  });
});

onUiUpdate(function() {
  var Id = 'SDImageInfo-HideScrollBar';
  let BS = gradioApp()?.querySelector('#tabs > .tab-nav > button.selected');

  if (BS?.textContent.trim() === 'Image Info') {
    const tabNav = document.querySelector('.tab-nav.scroll-hide');
    if (tabNav) Object.assign(tabNav.style, { borderBottom: '0' });

    if (!document.getElementById(Id)) {
      const SB = document.createElement('style');
      SB.id = Id;
      SB.innerHTML = `::-webkit-scrollbar { width: 0 !important; height: 0 !important; }`;
      document.head.appendChild(SB);
    }
    Object.assign(document.documentElement.style, { scrollbarWidth: 'none' });

  } else {
    const tabNav = document.querySelector('.tab-nav.scroll-hide');
    if (tabNav) Object.assign(tabNav.style, { borderBottom: '' });

    const SB = document.getElementById(Id);
    if (SB) document.head.removeChild(SB);
    Object.assign(document.documentElement.style, { scrollbarWidth: '' });
  }
});

function SDImageInfoSendButton(Id) {
  let OutputRaw = window.SDImageInfoRawOutput;
  let ADmodel = OutputRaw?.includes('ADetailer model');
  let cb = gradioApp().getElementById(`script_${Id}_adetailer_ad_main_accordion-visible-checkbox`);
  if (ADmodel) cb?.checked === false && cb.click();
}

function SDImageInfoCopyButtonEvent(e) {
  let OutputRaw = window.SDImageInfoRawOutput;

  const SDImageInfoCopy = (text, target) => {
    const section = target.closest('.sdimageinfo-outputsection');
    section.classList.add('sdimageinfo-borderpulse');
    setTimeout(() => section.classList.remove('sdimageinfo-borderpulse'), 2000);
    navigator.clipboard.writeText(text);
  };

  if (e.target?.id) {
    const { id } = e.target;
    const stepsStart = OutputRaw.indexOf('Steps:');
    const negStart = OutputRaw.indexOf('Negative prompt:');
    const seedMatch = OutputRaw.match(/Seed:\s?(\d+),/i);

    const text = {
      'SDImageInfo-Prompt-Button': () => OutputRaw.substring(0, [negStart, stepsStart].find(i => i !== -1) || OutputRaw.length).trim(),
      'SDImageInfo-NegativePrompt-Button': () => negStart !== -1 && stepsStart > negStart ? OutputRaw.slice(negStart + 16, stepsStart).trim() : null,
      'SDImageInfo-Params-Button': () => stepsStart !== -1 ? OutputRaw.slice(stepsStart).trim() : null,
      'SDImageInfo-Seed-Button': () => seedMatch?.[1]?.trim() || null
    }[id]?.();

    if (text) SDImageInfoCopy(text, e.target);
  }
}

function SDImageInfoClearButton() {
  let img = document.querySelector('#SDImageInfo-Image img');
  let Cloned = document.getElementById('SDImageInfo-ClearImage-Button');
  let ClearButton = document.querySelector('#SDImageInfo-Image > div > div > div > button:nth-child(2)') || 
                    document.querySelector('.gradio-container-4-40-0 #SDImageInfo-Image > div > div > button');

  if (ClearButton && !Cloned) {
    let parent = ClearButton.parentElement;
    ClearButton.style.display = 'none';

    let btn = ClearButton.cloneNode(true);
    btn.id = 'SDImageInfo-ClearImage-Button';
    btn.style.display = 'flex';
    parent.prepend(btn);
    img.style.opacity = '1';

    const clearImage = () => ClearButton.click();
    window.SDImageInfoClearImage = clearImage;

    btn.onclick = (e) => (e.stopPropagation(), clearImage());
  }
}
