import { checkAuthOrRedirect } from './auth.js'; // または適切な相対パス
window.addEventListener('DOMContentLoaded', async () => {

  await checkAuthOrRedirect();
  const map = L.map('map').setView([35.6812, 139.7671], 5); // 東京駅付近
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const marker = L.marker([35.6812, 139.7671], { draggable: true }).addTo(map);
  updateStreetView(35.6812, 139.7671);

  map.on('click', (e) => {
    marker.setLatLng(e.latlng);
    updateStreetView(e.latlng.lat, e.latlng.lng);
  });

  marker.on('moveend', (e) => {
    const { lat, lng } = e.target.getLatLng();
    updateStreetView(lat, lng);
  });

async function updateStreetView(lat, lng) {
  try {
    const res = await fetch(`/api/streetview-url?lat=${lat}&lng=${lng}`);
    const data = await res.json();
    if (data.success && data.url) {
      document.getElementById('streetview').src = data.url;
      window.currentStreetViewUrl = data.url;
    } else {
      throw new Error('URL取得失敗');
    }
  } catch (err) {
    console.error('Street View URL取得失敗:', err);
    document.getElementById('streetview').src = '';
    window.currentStreetViewUrl = '';
  }
}


  const imageInput = document.getElementById('imageUpload');
  const preview = document.getElementById('preview');
  const deleteImageBtn = document.getElementById('deleteImage');
  let selectedImageFile = null;

  imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (!file) return;
    selectedImageFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      preview.src = reader.result;
      preview.style.display = 'block';
      deleteImageBtn.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });

  deleteImageBtn.addEventListener('click', () => {
    imageInput.value = '';
    selectedImageFile = null;
    preview.src = '';
    preview.style.display = 'none';
    deleteImageBtn.style.display = 'none';
  });

  const confirmBtn = document.getElementById('confirmBtn');
  confirmBtn.addEventListener('click', async () => {
    const latlng = marker.getLatLng();
    const title = document.getElementById('title').value.trim();
    const genre = document.getElementById('genre').value.trim();
    const description = document.getElementById('description').value.trim();

    if (!title || !description || !selectedImageFile) {
      alert("タイトル・説明・画像を入力してください");
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('genre', genre);
    formData.append('description', description);
    formData.append('lat', latlng.lat);
    formData.append('lng', latlng.lng);
    formData.append('image', selectedImageFile);
    formData.append('streetViewUrl', window.currentStreetViewUrl || '');


    try {
      const response = await fetch('/api/save-spot', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
    if (result.success) {
        const spot = result.data;
        spot.streetViewUrl = window.currentStreetViewUrl || '';
        localStorage.setItem('newSpot', JSON.stringify(spot));
        location.href = 'add_result.html';
    } else {
        alert('保存に失敗しました: ' + (result.error || ''));
      }
    } catch (err) {
      console.error(err);
      alert('通信エラーが発生しました');
    }
  });
});
