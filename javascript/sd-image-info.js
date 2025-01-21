onUiLoaded(function () {
  const imgInfoImageContainer = gradioApp().getElementById('imgInfoImageContainer');

  if (imgInfoImageContainer) {
    const imgInfoImage = document.createElement('div');
    imgInfoImage.id = 'imgInfoImage';
    imgInfoImage.classList.add('block', 'gradio-image');
    imgInfoImage.style.position = 'relative';
    imgInfoImage.style.overflow = 'hidden';
    imgInfoImage.style.height = '275.05px';
    imgInfoImageContainer.appendChild(imgInfoImage);

    const imgInfoInput = document.createElement('input');
    imgInfoInput.type = 'file';
    imgInfoInput.id = 'imgInfoInput';
    imgInfoInput.accept = 'image/*';
    imgInfoInput.style.display = 'none';

    imgInfoImage.appendChild(imgInfoInput);

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
      const existingImg = imgInfoImage.querySelector('img');
      if (existingImg) existingImg.remove();

      const existingButton = imgInfoImage.querySelector('.Remove-Button');
      if (existingButton) existingButton.remove();

      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100%';
      img.style.borderRadius = 'inherit';
      img.style.objectFit = 'cover';

      imgInfoImage.appendChild(img);

      if (img) image_info_parser();

      const refButton = document.querySelector('#extras_image_batch > .svelte-19sk1im');
      const removeButton = refButton.cloneNode(true);
      removeButton.classList.add('Remove-Button');
      removeButton.style.zIndex = '300';
      imgInfoImage.appendChild(removeButton);

      removeButton.addEventListener('click', function (event) {
        event.stopPropagation();

        imgInfoInput.value = '';
        img.remove();
        removeButton.remove();
        image_info_parser();

        imgInfoImage.style.height = '275.05px';
      });
    }
  }
});
