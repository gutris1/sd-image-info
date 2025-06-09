function SDImageInfoImageViewer(img) {
  const LightBox = document.getElementById('SDImageInfo-Image-Viewer');
  const Control = LightBox.querySelector('#SDImageInfo-Image-Viewer-Control');
  const Wrapper = LightBox.querySelector('#SDImageInfo-Image-Viewer-Wrapper');
  const scroll = 'sdimageinfo-body-dont-scroll';
  const pointer = 'sdimageinfo-pointer-events-none';

  LightBox.style.display = 'flex';
  LightBox.focus();

  document.getElementById('SDImageInfo-Image-Viewer-img')?.remove();

  const imgEL = img.cloneNode();
  imgEL.id = 'SDImageInfo-Image-Viewer-img';
  Wrapper.prepend(imgEL);

  requestAnimationFrame(() => setTimeout(() => {
    LightBox.style.opacity = '1';
    Wrapper.style.transition = '';
    Wrapper.style.transform = 'translate(0px, 0px) scale(1)';
    Wrapper.style.opacity = '1';
  }, 50));

  const imageViewer = SharedImageViewer(imgEL, LightBox, Control, Wrapper, {
    noScroll: scroll, noPointer: pointer
  });

  window.SDImageInfoImageViewerExit = imageViewer.state.close;
}

function SDImageInfoCreateLightBox() {
  const LightBox = document.createElement('div');
  LightBox.id = 'SDImageInfo-Image-Viewer';
  LightBox.setAttribute('tabindex', '0');

  const Control = document.createElement('div');
  Control.id = 'SDImageInfo-Image-Viewer-Control';

  const exit = document.createElement('div');
  exit.id = 'SDImageInfo-Image-Viewer-Exit-Button';
  exit.innerHTML = SDImageInfoCrossSVG;
  exit.onclick = window.SDImageInfoImageViewerExit;

  const Wrapper = document.createElement('div');
  Wrapper.id = 'SDImageInfo-Image-Viewer-Wrapper';

  Control.prepend(exit), LightBox.append(Control, Wrapper), document.body.append(LightBox);
}