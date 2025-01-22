onUiLoaded(function () {
  const imgInfoImageContainer = document.querySelector('#imgInfoImageContainer');
  const base64Output = document.querySelector('#imgInfoImageBase64 textarea');

  if (imgInfoImageContainer) {
    const imgInfoImage = document.createElement('div');
    imgInfoImage.id = 'imgInfoImage';
    imgInfoImage.classList.add('block', 'gradio-image');
    imgInfoImageContainer.appendChild(imgInfoImage);

    const imgInfoInput = document.createElement('input');
    imgInfoInput.id = 'imgInfoInput';
    imgInfoInput.type = 'file';
    imgInfoInput.accept = 'image/*';
    imgInfoInput.style.display = 'none';

    const ClearButton = document.createElement('button');
    ClearButton.id = 'imgInfoClearButton';
    ClearButton.setAttribute('aria-label', 'Clear');
    ClearButton.setAttribute('title', 'Clear');

    ClearButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve"
        version="1.1" style="fill-rule: evenodd; clip-rule: evenodd; stroke-linecap: round; stroke-linejoin: round;"
        stroke="currentColor" width="20px" height="20px" viewBox="0 0 24 24">
        <g transform="matrix(1.14096,-0.140958,-0.140958,1.14096,-0.0559523,0.0559523)">
          <path d="M18,6L6.087,17.913" style="fill: none; fill-rule: nonzero; stroke-width: 5px;"></path>
        </g>
        <path d="M4.364,4.364L19.636,19.636" style="fill: none; fill-rule: nonzero; stroke-width: 5px;"></path>
      </svg>
    `;

    imgInfoImage.appendChild(ClearButton);
    imgInfoImage.appendChild(imgInfoInput);

    ClearButton.addEventListener('click', function (event) {
      event.stopPropagation();
      imgInfoInput.value = '';
      imgInfoImage.querySelector('img').remove();
      image_info_parser();
      imgInfoImage.style.height = '275.05px';
      ClearButton.style.display = 'none';
      base64Output.value = '';
      updateInput(base64Output);
    });

    imgInfoImage.addEventListener('click', function () {
      if (!imgInfoImage.querySelector('img')) {
        imgInfoInput.click();
      }
    });

    imgInfoImage.addEventListener('dragover', function (event) {
      event.preventDefault();
      event.stopPropagation();
    });

    imgInfoImage.addEventListener('dragleave', function (event) {
      event.preventDefault();
      event.stopPropagation();
    });

    imgInfoImage.addEventListener('drop', async function (event) {
      event.preventDefault();
      event.stopPropagation();
      const file = event.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    });

    imgInfoInput.addEventListener('change', async function (event) {
      const file = event.target.files[0];
      if (file) {
        handleFile(file);
      }
    });

    async function handleFile(file) {
      const existingImg = document.getElementById('imgInfoImageModal');
      if (existingImg) existingImg.remove();

      const img = document.createElement('img');
      img.id = 'imgInfoImageModal';
      img.src = URL.createObjectURL(file);

      imgInfoImage.appendChild(img);
      await image_info_parser();
      ClearButton.style.display = 'block';

      const reader = new FileReader();
      reader.onload = function(event) {
        const base64String = event.target.result;
        base64Output.value = base64String;
        updateInput(base64Output);
      };

      reader.readAsDataURL(file);

      img.ondrag = img.ondragend = img.ondragstart = (e) => {
        e.stopPropagation();
        e.preventDefault();
      };
    }
  }
});
