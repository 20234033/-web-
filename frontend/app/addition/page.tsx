'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

export default function AdditionPage() {
  const router = useRouter();

  // ==== refs ====
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const streetviewRef = useRef<HTMLIFrameElement | null>(null);
  const leftPanelRef = useRef<HTMLElement | null>(null);

  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const currentStreetViewUrlRef = useRef<string>('');
  const lastGeocodeQueryRef = useRef<string>('');
  const isComposingRef = useRef<boolean>(false);

  // ==== 状態 ====
  const [streetViewUrl, setStreetViewUrl] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('historic');
  const [description, setDescription] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  const [aiStatus, setAiStatus] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // ==== CSS 注入 & テーマ / body クラス ====
  useEffect(() => {
    const existing = document.getElementById('addition-page-style');
    if (!existing) {
      const style = document.createElement('style');
      style.id = 'addition-page-style';
      style.textContent = `
        :root[data-theme="light"]{
          color-scheme:light;
          --bg:#f7f7f8; --text:#0f172a; --subtle:#475569;
          --panel:#ffffff; --border:#e5e7eb; --primary:#4f46e5;
        }
        :root[data-theme="dark"] {
          color-scheme:dark;
          --bg:#0b0f14; --text:#e5e7eb; --subtle:#9aa4b2;
          --panel:#111827; --border:#1f2937; --primary:#6366f1;
        }
        :root{ --nav-h:56px; }

        html, body{
          margin:0; padding:0; height:100%;
          font-family:'Orbitron','Arial',sans-serif;
          background:var(--bg); color:var(--text);
          overflow:hidden;
        }

        .addition-layout{
          display:grid;
          grid-template-columns: 360px 1fr;
          gap:12px;
          height:calc(100dvh - var(--nav-h));
          padding:12px;
          box-sizing:border-box;
        }

        #leftPanel{
          display:grid;
          grid-template-rows: var(--left-sv-h, 260px) 8px 1fr;
          gap:12px;
          background:var(--panel);
          border:1px solid var(--border);
          border-radius:12px;
          padding:12px;
          overflow:hidden;
        }
        #streetview-container{
          width:100%; height:100%;
          border:1px solid var(--border);
          border-radius:12px;
          overflow:hidden;
          background:#0001;
          position:static;
          box-shadow:none;
          transition:none;
        }
        #streetview{ width:100%; height:100%; border:none; }

        .left-resizer{
          align-self:stretch;
          cursor:row-resize;
          position:relative;
          user-select:none; touch-action:none;
          border-radius:6px; background:transparent;
        }
        .left-resizer::before{
          content:""; position:absolute; left:50%; top:50%;
          transform:translate(-50%,-50%);
          width:64px; height:3px;
          border-radius:2px; background:var(--border); opacity:.9;
        }

        .left-form{
          overflow:auto; padding-right:4px;
        }
        .left-form label{ display:block; margin-top:10px; font-weight:600; }
        .left-form input[type="text"],
        .left-form textarea,
        .left-form select{
          width:100%; margin-top:6px; padding:8px 10px;
          border:1px solid var(--border); border-radius:8px; font-size:14px;
          background:var(--panel); color:var(--text);
        }
        .left-form textarea{ min-height:96px; resize:vertical; }
        .custom-file-upload{
          display:inline-block; padding:8px 12px; margin-top:8px;
          border:1px solid #888; border-radius:8px; cursor:pointer; user-select:none;
          background:#f6f6f6;
        }
        .custom-file-upload input{ display:none; }
        #aiStatus{ margin-left:6px; color:#666; font-size:12px; }
        #fileNameDisplay{ margin-left:8px; color:#444; font-size:12px; }
        #preview{
          display:none; width:100%; max-height:220px; object-fit:cover;
          margin-top:10px; border-radius:10px; border:1px solid #ddd;
        }
        #deleteImage{ display:none; margin-top:8px; }
        #confirmBtn{
          width:100%; margin-top:14px; padding:12px;
          border:none; border-radius:10px; font-weight:700; cursor:pointer;
          background:var(--primary); color:#fff;
        }

        .right-panel{
          display:grid; grid-template-rows:1fr;
          gap:12px; min-height:0;
        }
        #map{
          width:100%; height:100%;
          border:1px solid var(--border);
          border-radius:12px;
          background:#0001;
          position:static;
          margin:0;
        }

        /* 📍ピン用 */
        .custom-pin-icon {
          font-size: 24px;
          line-height: 24px;
          text-align: center;
          transform: translateY(-4px);
        }

        @media (max-width: 820px){
          .addition-layout{
            grid-template-columns: 1fr;
            grid-template-rows: auto 60vh;
          }
        }
      `;
      document.head.appendChild(style);
    }

    if (!document.documentElement.hasAttribute('data-theme')) {
      document.documentElement.setAttribute('data-theme', 'light');
    }
    document.body.classList.add('addition-page');

    return () => {
      document.body.classList.remove('addition-page');
    };
  }, []);

  // ==== ナビ高さ → CSS変数 ====
  useEffect(() => {
    const applyNavHeight = () => {
      const host = document.getElementById('navbar-placeholder');
      const navEl =
        host && host.firstElementChild ? host.firstElementChild : host;
      const h = Math.max(
        0,
        Math.round(navEl?.getBoundingClientRect().height || 56),
      );
      document.documentElement.style.setProperty('--nav-h', `${h}px`);
      if (host) host.style.height = `${h}px`;
    };

    applyNavHeight();
    window.addEventListener('resize', applyNavHeight);

    const host = document.getElementById('navbar-placeholder');
    let obs: MutationObserver | null = null;
    if (host) {
      obs = new MutationObserver(applyNavHeight);
      obs.observe(host, { childList: true, subtree: true });
    }

    return () => {
      window.removeEventListener('resize', applyNavHeight);
      obs?.disconnect();
    };
  }, []);

  // ==== StreetView URL 更新 ====
  const updateStreetViewUrl = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/streetview-url?lat=${lat}&lng=${lng}`,
      );
      const data = await res.json();
      if (data.success && data.url) {
        setStreetViewUrl(data.url);
        currentStreetViewUrlRef.current = data.url;
      } else {
        throw new Error('URL取得失敗');
      }
    } catch (err) {
      console.error('Street View URL取得失敗:', err);
      setStreetViewUrl(null);
      currentStreetViewUrlRef.current = '';
    }
  };

  // ==== Leaflet 初期化 ====
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!mapContainerRef.current) return;

      if (
        !document.querySelector<HTMLLinkElement>('link[href*="leaflet.css"]')
      ) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet/dist/leaflet.css';
        document.head.appendChild(link);
      }

      const leafletModule = await import('leaflet');
      const L = (leafletModule as any).default ?? leafletModule;
      if (cancelled) return;

      const defaultLL: [number, number] = [35.6812, 139.7671]; // 東京駅

      const map = L.map(mapContainerRef.current!).setView(defaultLL, 5);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      const pinIcon = L.divIcon({
        className: 'custom-pin-icon',
        html: '📍',
        iconSize: [24, 24],
        iconAnchor: [12, 24],
      });

      const marker = L.marker(defaultLL, {
        draggable: true,
        icon: pinIcon,
      }).addTo(map);
      markerRef.current = marker;

      // 初期 Street View
      updateStreetViewUrl(defaultLL[0], defaultLL[1]);

      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng);
        updateStreetViewUrl(e.latlng.lat, e.latlng.lng);
      });

      marker.on('moveend', (e: any) => {
        const { lat, lng } = e.target.getLatLng();
        updateStreetViewUrl(lat, lng);
      });

      setTimeout(() => {
        try {
          map.invalidateSize();
        } catch {
          /* noop */
        }
      }, 0);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // ==== 左パネル内：SV高さリサイズ ====
  useEffect(() => {
    const panel = leftPanelRef.current;
    if (!panel) return;

    const resizer = panel.querySelector<HTMLDivElement>('.left-resizer');
    if (!resizer) return;

    const savedPx = parseInt(
      (typeof window !== 'undefined'
        ? window.localStorage.getItem('leftSvHeightPx')
        : '') || '',
      10,
    );
    if (!Number.isNaN(savedPx)) {
      panel.style.setProperty('--left-sv-h', `${savedPx}px`);
    }

    let dragging = false;
    let startY = 0;
    let startH = 0;

    const getPanelRect = () => panel.getBoundingClientRect();

    const applyHeight = (px: number) => {
      const rect = getPanelRect();
      const min = 140;
      const max = Math.max(180, rect.height - 140);
      const h = Math.max(min, Math.min(max, px | 0));
      panel.style.setProperty('--left-sv-h', `${h}px`);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('leftSvHeightPx', String(h));
      }
      if (mapRef.current) {
        try {
          mapRef.current.invalidateSize();
        } catch {
          /* noop */
        }
      }
    };

    const onMove = (clientY: number) => {
      const delta = clientY - startY;
      applyHeight(startH + delta);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      onMove(e.clientY);
    };
    const onMouseUp = () => {
      dragging = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!dragging) return;
      const t = e.touches[0];
      if (t) onMove(t.clientY);
    };
    const onTouchEnd = () => {
      dragging = false;
    };

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      dragging = true;
      startY = e.clientY;
      const current =
        getComputedStyle(panel).getPropertyValue('--left-sv-h').trim() ||
        '260';
      startH = parseInt(current, 10) || 260;
    };

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      dragging = true;
      startY = t.clientY;
      const current =
        getComputedStyle(panel).getPropertyValue('--left-sv-h').trim() ||
        '260';
      startH = parseInt(current, 10) || 260;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const step = (e as any).shiftKey ? 60 : 20;
      const current =
        parseInt(
          getComputedStyle(panel).getPropertyValue('--left-sv-h') || '260',
          10,
        ) || 260;
      if ((e as any).key === 'ArrowUp') {
        applyHeight(current + step);
        e.preventDefault();
      } else if ((e as any).key === 'ArrowDown') {
        applyHeight(current - step);
        e.preventDefault();
      }
    };

    resizer.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    resizer.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);

    resizer.addEventListener('keydown', onKeyDown as any);

    return () => {
      resizer.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      resizer.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);

      resizer.removeEventListener('keydown', onKeyDown as any);
    };
  }, []);

  // ==== ジオコーディング ====
  const normalizeQuery = (s: string) => s.replace(/\s+/g, ' ').trim();

  const geocodeAndMove = async (raw: string) => {
    const q = normalizeQuery(raw);
    if (!q) return;
    if (q === lastGeocodeQueryRef.current) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/geocode?q=${encodeURIComponent(q)}`,
      );
      const data = await res.json();
      if (!data.success || !data.lat || !data.lng) {
        alert('場所が見つかりませんでした。キーワードを変えてお試しください。');
        return;
      }
      lastGeocodeQueryRef.current = q;

      const newLatLng: [number, number] = [data.lat, data.lng];

      if (markerRef.current) {
        markerRef.current.setLatLng(newLatLng);
      }
      if (mapRef.current) {
        mapRef.current.setView(newLatLng, 15);
      }

      updateStreetViewUrl(data.lat, data.lng);
    } catch (err) {
      console.error('ジオコーディングエラー:', err);
      alert('住所の変換に失敗しました。');
    }
  };

  // ==== 画像アップロード ====
  const handleImageChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImageFile(file);

    setPreviewUrl((prev) => {
      if (prev && prev.startsWith('blob:')) {
        URL.revokeObjectURL(prev);
      }
      return URL.createObjectURL(file);
    });
  };

  const handleDeleteImage = () => {
    setSelectedImageFile(null);
    setPreviewUrl((prev) => {
      if (prev && prev.startsWith('blob:')) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
  };

  // ==== AI 自動生成 ====
  const handleAiSuggest = async () => {
    try {
      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        alert('観光地のタイトルを入力してください。');
        return;
      }

      setAiLoading(true);
      setAiStatus('生成中…');

      let lat: number | null = null;
      let lng: number | null = null;
      try {
        if (markerRef.current) {
          const pos = markerRef.current.getLatLng();
          lat = pos.lat;
          lng = pos.lng;
        }
      } catch {
        /* noop */
      }

      const res = await fetch(`${API_BASE}/api/ai/spot-suggestion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmedTitle, lat, lng }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || '生成に失敗しました');
      }

      const s = json.suggestion;
      // 生成後タイトルを geocode 用に保持
      let nextTitle = trimmedTitle;

      if (s.title) {
        setTitle(s.title);
        nextTitle = s.title;
      }
      if (s.genre) setGenre(s.genre);
      if (s.description) setDescription(s.description);

      // ★ 生成結果タイトルでピンを移動
      await geocodeAndMove(nextTitle);

      setAiStatus(json.fallback ? '（ローカル推定で生成）' : '✓ 生成しました');
      setTimeout(() => setAiStatus(''), 2000);
    } catch (e) {
      console.error('[AI生成エラー]', e);
      setAiStatus('生成に失敗しました');
    } finally {
      setAiLoading(false);
    }
  };

  // ==== 送信 ====
  const handleSubmit = async () => {
    if (!markerRef.current) {
      alert('地図の初期化がまだ完了していません。少し待ってから再度お試しください。');
      return;
    }

    const latlng = markerRef.current.getLatLng();
    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();

    if (!trimmedTitle || !trimmedDesc || !selectedImageFile) {
      alert('タイトル・説明・画像を入力してください');
      return;
    }

    const formData = new FormData();
    formData.append('title', trimmedTitle);
    formData.append('genre', genre);
    formData.append('description', trimmedDesc);
    // ← number → string に修正
    formData.append('lat', String(latlng.lat));
    formData.append('lng', String(latlng.lng));
    formData.append('image', selectedImageFile);
    formData.append('streetViewUrl', currentStreetViewUrlRef.current || '');

    try {
      const response = await fetch(`${API_BASE}/api/save-spot`, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (result.success) {
        const spot = result.data;
        spot.streetViewUrl = currentStreetViewUrlRef.current || '';
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('newSpot', JSON.stringify(spot));
        }
        router.push('/add_result');
      } else {
        alert('保存に失敗しました: ' + (result.error || ''));
      }
    } catch (err) {
      console.error(err);
      alert('通信エラーが発生しました');
    }
  };

  // ==== JSX ====
  return (
    <>
      <div id="navbar-placeholder" />

      <main className="addition-layout">
        {/* 左：ストビュー + 仕切り + フォーム */}
        <section
          id="leftPanel"
          aria-label="操作パネル"
          ref={leftPanelRef}
        >
          <div id="streetview-container">
            <iframe
              id="streetview"
              ref={streetviewRef}
              src={streetViewUrl ?? undefined}
              allowFullScreen
            />
          </div>

          <div
            className="left-resizer"
            role="separator"
            aria-orientation="horizontal"
            tabIndex={0}
          />

          <div className="left-form">
            <label>📍 観光地のタイトル：</label>
            <input
              type="text"
              id="title"
              placeholder="例：白川郷"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onCompositionStart={() => {
                isComposingRef.current = true;
              }}
              onCompositionEnd={() => {
                isComposingRef.current = false;
              }}
              onKeyDown={(e) => {
                if (
                  e.key === 'Enter' &&
                  !e.shiftKey &&
                  !isComposingRef.current
                ) {
                  e.preventDefault();
                  geocodeAndMove(title);
                }
              }}
              onBlur={() => {
                const q = normalizeQuery(title);
                if (q && q !== lastGeocodeQueryRef.current) {
                  geocodeAndMove(q);
                }
              }}
            />

            <div style={{ marginTop: 10 }}>
              <button
                id="aiSuggestBtn"
                type="button"
                onClick={handleAiSuggest}
                disabled={aiLoading}
              >
                ✨ AIで自動生成
              </button>
              <span id="aiStatus">{aiStatus}</span>
            </div>

            <label>🎨 ジャンル：</label>
            <select
              id="genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            >
              <option value="historic">歴史的建造物</option>
              <option value="nature">自然</option>
              <option value="city">都市景観</option>
              <option value="culture">文化的名所</option>
            </select>

            <label>📝 観光地の説明：</label>
            <textarea
              id="description"
              placeholder="ここに観光地の説明を入力してください..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <label htmlFor="imageUpload">🖼 観光地の写真をアップロード：</label>
            <label className="custom-file-upload">
              ファイルを選択
              <input
                type="file"
                id="imageUpload"
                accept="image/*"
                onChange={handleImageChange}
              />
            </label>
            <span id="fileNameDisplay">
              {selectedImageFile ? selectedImageFile.name : '未選択'}
            </span>

            {previewUrl && (
              <img
                id="preview"
                src={previewUrl}
                alt="プレビュー画像"
                style={{ display: 'block' }}
              />
            )}
            {previewUrl && (
              <button
                id="deleteImage"
                type="button"
                style={{ display: 'block' }}
                onClick={handleDeleteImage}
              >
                削除
              </button>
            )}

            <button
              id="confirmBtn"
              type="button"
              onClick={handleSubmit}
            >
              ✅ この観光地を追加
            </button>
          </div>
        </section>

        {/* 右：地図 */}
        <section className="right-panel" aria-label="地図">
          <div id="map" ref={mapContainerRef} />
        </section>
      </main>
    </>
  );
}
