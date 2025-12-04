'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Spot = {
  title: string;
  description?: string;
  lat: number;
  lng: number;
  image?: string | null;
  streetViewUrl?: string | null;
};

const buildStreetViewUrl = (spot: Spot | null): string | null => {
  if (!spot) return null;
  if (spot.streetViewUrl) return spot.streetViewUrl;

  if (typeof spot.lat !== 'number' || typeof spot.lng !== 'number') {
    return null;
  }

  return `https://www.google.com/maps/embed?pb=!1m0!3m2!1sja!2sjp!4v1717900000000!6m8!1m7!1sCAoSLEFGMVFpcFBHNG4yTTI5UHBUMXQ3cEpNclRLclZzMXN1OGpOa2Y1b1kydGpm!2m2!1d${spot.lat}!2d${spot.lng}!3f0!4f0!5f1.1924812503605782`;
};

export default function AddResultPage() {
  const router = useRouter();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);

  const [spot, setSpot] = useState<Spot | null>(null);
  const [streetViewUrl, setStreetViewUrl] = useState<string | null>(null);

  // ===== CSS 注入 =====
  useEffect(() => {
    const existing = document.getElementById('add-result-style');
    if (!existing) {
      const style = document.createElement('style');
      style.id = 'add-result-style';
      style.textContent = `
html, body {
  margin: 0;
  height: 100%;
  overflow: hidden;
  font-family: 'Arial', sans-serif;
}

#result-map {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.info-box {
  position: absolute;
  top: 80px;
  right: 20px;
  width: 320px;
  background: rgba(255, 255, 255, 0.95);
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  z-index: 1001;
}

.info-box h3 {
  margin: 0 0 8px;
  color: #ff9800;
  font-size: 20px;
}

.info-box p {
  margin: 6px 0;
  font-size: 14px;
}

.info-box img {
  width: 100%;
  border-radius: 8px;
  margin-top: 8px;
}

#streetview-container {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 320px;
  height: 200px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  z-index: 1001;
  transition: transform 0.3s ease;
}

#streetview-container:hover {
  transform: scale(1.2);
}

#streetview-container iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.bottom-buttons {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 16px;
  z-index: 1001;
}

.bottom-buttons button {
  padding: 10px 18px;
  font-size: 16px;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  background-color: #1976d2;
  color: white;
  cursor: pointer;
  transition: background 0.3s ease;
}

.bottom-buttons button:hover {
  background-color: #0d47a1;
}
      `;
      document.head.appendChild(style);
    }
  }, []);

  // ===== localStorage から newSpot を取得 =====
  useEffect(() => {
    try {
      const raw =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('newSpot')
          : null;

      if (!raw) {
        alert('観光地の情報が見つかりません。');
        router.replace('/addition');
        return;
      }

      const parsed: any = JSON.parse(raw);

      const title = parsed?.title;
      const latNum = Number(parsed?.lat);
      const lngNum = Number(parsed?.lng);

      if (!title || Number.isNaN(latNum) || Number.isNaN(lngNum)) {
        alert('観光地の情報が不正です。');
        router.replace('/addition');
        return;
      }

      // 画像プロパティは全部ケア
      const image: string | null =
        parsed.image ??
        parsed.image_path ??
        parsed.imagePath ??
        null;

      const s: Spot = {
        title,
        description: parsed.description ?? '',
        lat: latNum,
        lng: lngNum,
        image,
        streetViewUrl: parsed.streetViewUrl ?? null,
      };

      setSpot(s);
      setStreetViewUrl(buildStreetViewUrl(s));

      // 🔸 ここは一旦削除しないようにする（リロード対応）
      // window.localStorage.removeItem('newSpot');
    } catch (e) {
      console.error('[add_result] failed to load newSpot', e);
      alert('観光地の情報の読み込みに失敗しました。');
      router.replace('/addition');
    }
  }, [router]);

  // ===== Leaflet で地図を描画 =====
  useEffect(() => {
    if (!spot) return;
    if (!mapContainerRef.current) return;

    let cancelled = false;

    (async () => {
      if (
        !document.querySelector<HTMLLinkElement>(
          'link[href*="leaflet.css"]',
        )
      ) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet/dist/leaflet.css';
        document.head.appendChild(link);
      }

      const leafletModule = await import('leaflet');
      if (cancelled) return;

      const L: any =
        (leafletModule as any).default ?? leafletModule;

      const map = L.map(mapContainerRef.current!).setView(
        [spot.lat, spot.lng],
        14,
      );
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      L.marker([spot.lat, spot.lng])
        .addTo(map)
        .bindPopup(spot.title)
        .openPopup();
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [spot]);

  return (
    <>
      <div id="navbar-placeholder" />

      <div id="result-map" ref={mapContainerRef} />

      <div className="info-box" id="infoBox">
        {spot ? (
          <>
            <p>📍 追加された観光地</p>
            <h3>{spot.title}</h3>
            <p>{spot.description}</p>
            {spot.image && (
              <img src={spot.image} alt="観光地画像" />
            )}
          </>
        ) : (
          <p>観光地情報を読み込み中...</p>
        )}
      </div>

      <div id="streetview-container">
        <iframe
          id="streetview"
          src={streetViewUrl ?? undefined}
          allowFullScreen
          loading="lazy"
        />
      </div>

      <div className="bottom-buttons">
        <button
          type="button"
          onClick={() => router.push('/addition')}
        >
          ➕ 観光地をさらに追加
        </button>
        <button
          type="button"
          onClick={() => router.push('/home')}
        >
          🏠 ホームに戻る
        </button>
      </div>
    </>
  );
}
