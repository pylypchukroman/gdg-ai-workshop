import './style.css';

function getBirdRemovalParam() {
  return document.getElementById('removeBird').checked
    ? '/e_gen_remove:prompt_bird'
    : '';
}

export function selectColour(element, isOriginal = false) {
  document
    .querySelectorAll('.colour')
    .forEach((colour) => colour.classList.remove('selected'));
  element.classList.add('selected');

  const imageElement = document.querySelector('.image img');
  const modalImage = document.querySelector('#imageModal img');
  const birdRemoval = getBirdRemovalParam();

  if (isOriginal) {
    const originalImageUrl = `https://res.cloudinary.com/tamas-demo/image/upload${birdRemoval}/f_auto,q_auto,w_390/model4.jpg`;
    imageElement.src = originalImageUrl;
    modalImage.dataset.baseUrl = originalImageUrl;
    modalImage.src = `${originalImageUrl.replace(
      '/model4.jpg',
      '/c_pad,w_3413,ar_16:9,b_gen_fill/model4.jpg'
    )}`;
    return;
  }

  let selectedColour = element.style.backgroundColor;
  if (selectedColour === 'rgb(166, 123, 91)') {
    selectedColour = '#A67B5B';
  }

  const colourMap = {
    coral: 'FF7F50',
    '#A67B5B': 'A67B5B',
    teal: '008080',
    black: '000000',
    burlywood: 'DEB887',
  };

  const hexColour = colourMap[selectedColour] || 'FF7F50';
  const cloudinaryBaseURL = `https://res.cloudinary.com/tamas-demo/image/upload${birdRemoval}/e_gen_recolor:prompt_dress;to-color_`;
  const newImageUrl = `${cloudinaryBaseURL}${hexColour}/f_auto,q_auto,w_390/model4.jpg`;

  imageElement.src = newImageUrl;
  modalImage.dataset.baseUrl = newImageUrl;
  modalImage.src = `${newImageUrl.replace(
    '/model4.jpg',
    '/c_pad,w_3413,ar_16:9,b_gen_fill/model4.jpg'
  )}`;
}

export function openModal() {
  const modalImage = document.getElementById('imageModal').querySelector('img');
  const baseUrl =
    modalImage.dataset.baseUrl ||
    `https://res.cloudinary.com/tamas-demo/image/upload${getBirdRemovalParam()}/f_auto,q_auto/model4.jpg`;
  modalImage.src = `${baseUrl.replace(
    '/model4.jpg',
    '/c_pad,w_3413,ar_16:9,b_gen_fill/model4.jpg'
  )}`;
  document.getElementById('imageModal').classList.add('show');
}

export function closeModal() {
  document.getElementById('imageModal').classList.remove('show');
}

document.querySelectorAll('.colour').forEach((colour) => {
  colour.addEventListener('click', function () {
    selectColour(this, this.classList.contains('original'));
  });
});

document.getElementById('removeBird').addEventListener('change', () => {
  const selectedElement = document.querySelector('.colour.selected');
  if (selectedElement) {
    selectColour(
      selectedElement,
      selectedElement.classList.contains('original')
    );
  }
});
