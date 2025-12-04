'use client';

import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';

export default function PlayPage() {
  useEffect(() => {
    let destroyed = false;

    (async () => {
      // 🌙 テーマ適用
      const theme = window.localStorage.getItem('theme') || 'light';
      document.body.className = theme;

      // ✅ ユーザーUUIDの取得 (/api/me)
      let userUuid: string | null = null;
      try {
        const res = await fetch('/api/me', { credentials: 'include' });
        if (!res.ok) throw new Error('認証失敗');
        const user = await res.json();
        userUuid = user.uuid;
      } catch (err) {
        if (destroyed) return;
        alert('ログインが必要です');
        window.location.href = 'auth/login';
        return;
      }

      if (destroyed) return;

      // ✅ クエリパラメータ
      const urlParams = new URLSearchParams(window.location.search);
      const genreParam = urlParams.get('genre');
      const regionParam = urlParams.get('region');
      console.log('🔍 条件:', { genreParam, regionParam });

      const submitBtn = document.getElementById(
        'submitAnswer',
      ) as HTMLButtonElement | null;
      if (!submitBtn) return;
      submitBtn.disabled = true;

      // Leaflet 読み込み
      const leafletModule = await import('leaflet');
      if (destroyed) return;
      const L: any = (leafletModule as any).default ?? leafletModule;

      const map = L.map('map', {
        zoomControl: false,
        attributionControl: false,
      }).setView([35.6895, 139.6917], 3);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(
        map,
      );

      let marker: any = null;
      let selectedLatLng: { lat: number; lng: number } | null = null;
      let correctSpot: any = null;

      function getRegionFromLatLng(lat: number, lng: number) {
        if (lat >= 43) return 'hokkaidou';
        if (lat >= 37 && lat < 43 && lng >= 139) return 'touhoku';
        if (lat >= 35 && lat < 37 && lng >= 138 && lng < 141) return 'kantou';
        if (lat >= 34 && lat < 37 && lng >= 136 && lng < 138) return 'chubu';
        if (lat >= 34 && lat < 35 && lng >= 135 && lng < 136) return 'kinki';
        if (lat >= 33 && lat < 35 && lng >= 132 && lng < 135) return 'chugoku';
        if (lat >= 32 && lat < 34 && lng >= 132 && lng < 134) return 'shikoku';
        if (lat >= 30 && lat < 33 && lng >= 129 && lng < 132) return 'kyusyu';
        return 'etc';
      }

      // ✅ 観光地データ読み込み
      try {
        const res = await fetch(window.location.origin + '/api/spots');
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTPエラー: ${res.status} - ${text}`);
        }
        const json = await res.json();
        const spots = json.data;
        if (!spots || !spots.length) throw new Error('観光地データが空です');

        const filteredSpots = spots.filter((spot: any) => {
          const genreOK =
            !genreParam || genreParam === 'null' || spot.genre === genreParam;
          const regionName = getRegionFromLatLng(spot.lat, spot.lng);
          const regionOK =
            !regionParam || regionParam === 'null' || regionName === regionParam;
          return genreOK && regionOK;
        });

        const candidateSpots = filteredSpots.length ? filteredSpots : spots;
        correctSpot =
          candidateSpots[Math.floor(Math.random() * candidateSpots.length)];

        window.localStorage.setItem(
          'correctSpot',
          JSON.stringify(correctSpot),
        );

        // StreetView
        const streetView = document.getElementById(
          'streetView',
        ) as HTMLIFrameElement | null;

        try {
          const svRes = await fetch(
            `${window.location.origin}/api/streetview-url?lat=${correctSpot.lat}&lng=${correctSpot.lng}`,
          );
          const svData = await svRes.json();
          if (svData.success && streetView) {
            streetView.src = svData.url;
          } else {
            throw new Error('StreetView URL取得に失敗');
          }
        } catch (err) {
          console.warn('StreetView取得失敗:', err);
          if (streetView) {
            const textNode = document.createTextNode(
              '📍 Street View を表示できません',
            );
            streetView.replaceWith(textNode);
          }
        }
      } catch (err) {
        console.error('観光地データ読み込み失敗:', err);
        alert('観光地データの読み込みに失敗しました');
        return;
      }

      // マップクリックでピン＆回答ボタン有効化
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        selectedLatLng = { lat, lng };

        if (marker) {
          marker.setLatLng([lat, lng]);
        } else {
          marker = L.marker([lat, lng]).addTo(map);
        }

        submitBtn.disabled = false;
      });

      function calcDistanceAndScore(
        lat1: number,
        lng1: number,
        lat2: number,
        lng2: number,
      ) {
        const R = 6371;
        const toRad = (deg: number) => deg * (Math.PI / 180);
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceKm = +(R * c).toFixed(2);
        const score = Math.max(0, 100 - Math.round(distanceKm));
        return { distanceKm, score };
      }

      // ✅ 回答送信ボタン
      submitBtn.addEventListener('click', async () => {
        if (!selectedLatLng || !correctSpot) return;

        const { distanceKm, score } = calcDistanceAndScore(
          selectedLatLng.lat,
          selectedLatLng.lng,
          correctSpot.lat,
          correctSpot.lng,
        );

        const newEntry = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          score,
        };

        // DB 保存
        try {
          await fetch('/api/answer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              user_uuid: userUuid,
              spot_id: correctSpot.id,
              answer_lat: selectedLatLng.lat,
              answer_lng: selectedLatLng.lng,
              distance_km: distanceKm,
              score,
            }),
          });
          console.log('✅ DB 保存完了');
        } catch (err) {
          console.warn('DB 保存失敗:', err);
        }

        // localStorage 履歴
        try {
          const old = JSON.parse(
            window.localStorage.getItem('history') || '[]',
          );
          old.push(newEntry);
          window.localStorage.setItem('history', JSON.stringify(old));
        } catch (err) {
          console.warn('履歴保存失敗:', err);
        }

        window.localStorage.setItem(
          'lastAnswerCoords',
          JSON.stringify(selectedLatLng),
        );
        window.localStorage.setItem(
          'correctCoords',
          JSON.stringify({
            lat: correctSpot.lat,
            lng: correctSpot.lng,
          }),
        );
        window.localStorage.setItem('lastScore', score.toString());

        setTimeout(() => {
          window.location.href = 'result';
        }, 200);
      });
    })();

    return () => {
      destroyed = true;
    };
  }, []);

  return (
    <>
      {/* 元HTMLに書いてあったページ専用CSSをそのまま global で注入 */}
      <style jsx global>{`
        html,
        body {
          margin: 0;
          padding: 0;
          height: 100%;
          background-color: #0e1a2b;
          color: #e0e0e0;
          font-family: 'Orbitron', sans-serif;
          overflow: hidden;
        }

        #navbar-placeholder {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 60px;
          z-index: 2000;
        }

        .streetview-wrapper {
          position: absolute;
          top: 60px;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: calc(100% - 60px);
          margin: 0;
          padding: 0;
          overflow: hidden;
        }

        .streetview-iframe {
          width: 100%;
          height: 100%;
          border: none;
          display: block;
        }

        .map-overlay {
          position: absolute;
          bottom: 20px;
          right: 20px;
          width: 150px;
          height: 125px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
          z-index: 1000;
          transition: all 0.3s ease;
        }

        .map-overlay:hover {
          width: 300px;
          height: 250px;
        }

        #map {
          width: 100%;
          height: 100%;
        }

        #submitAnswer {
          position: absolute;
          top: 20px;
          right: 20px;
          padding: 12px 20px;
          font-size: 16px;
          font-weight: bold;
          border: none;
          border-radius: 10px;
          background-color: #43a047;
          color: white;
          cursor: pointer;
          z-index: 1001;
          transition: background 0.3s ease;
        }

        #submitAnswer:hover {
          background-color: #388e3c;
        }

        #submitAnswer:disabled {
          background-color: #888;
          cursor: not-allowed;
          opacity: 0.7;
        }
      `}</style>

      <div id="navbar-placeholder" />

      <div className="streetview-wrapper">
        <iframe
          id="streetView"
          className="streetview-iframe"
          // ★ 初期 src="" を削除（または src={undefined} にする）
          allowFullScreen
          loading="lazy"
        />
        <div className="map-overlay">
          <div id="map" />
        </div>

        <button id="submitAnswer" disabled>
          📌 回答を確定する
        </button>
      </div>

    </>
  );
}
