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
