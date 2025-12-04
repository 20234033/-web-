'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export default function ResultPage() {
  useEffect(() => {
    // ===== CSS を注入（元の <style> 相当） =====
    const existingStyle = document.getElementById('result-style');
    if (!existingStyle) {
      const style = document.createElement('style');
      style.id = 'result-style';
      style.textContent = `
    :root {
      --nav-h: 56px;
    }

    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      width: 100%;
      font-family: 'Orbitron', sans-serif;
      overflow: hidden;
    }

    #navbar-placeholder {
      z-index: 2000;
    }

    #result-layout {
      position: fixed;
      top: var(--nav-h, 56px);
      left: 0;
      right: 0;
      bottom: 0;

      display: flex;
      gap: 12px;
      align-items: stretch;

      padding: 8px;
      box-sizing: border-box;
      overflow: hidden;
      margin: 0;
    }

    #result-sidebar {
      width: clamp(260px, 28vw, 340px);
      height: 100%;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;

      padding-right: 6px;
      padding-top: var(--sidebar-pad, 14px);

      border-radius: 12px;
      border: 1px solid transparent;
      background: transparent;
    }

    #scoreText { padding: 12px; }
    #place-info { margin-top: 16px; }

    #map-wrap {
      flex: 1 1 auto;
      min-width: 0;
      height: 100%;
      min-height: 0;
      overflow: hidden;
    }

    #result-map {
      width: 100%;
      height: 100%;
    }

    .streetview-frame {
      width: 100%;
      height: 200px;
      border: 0;
      border-radius: 12px;
      transition: transform .2s ease;
    }
    .streetview-frame:hover {
      transform: scale(1.02);
    }
      `;
      document.head.appendChild(style);
    }

    // Leaflet の CSS を（念のため）注入
    if (
      !document.querySelector<HTMLLinkElement>(
        'link[href*="leaflet.css"]',
      )
    ) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // ========= 数学ユーティリティ =========
    const getDistanceKm = (
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number,
    ) => {
      const R = 6371;
      const toRad = (d: number) => (d * Math.PI) / 180;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) *
          Math.cos(toRad(lat2)) *
          Math.sin(dLon / 2) ** 2;
      return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const decodePolyline = (encoded: string): [number, number][] => {
      const pts: [number, number][] = [];
      let i = 0;
      let lat = 0;
      let lng = 0;
      while (i < encoded.length) {
        let b: number;
        let shift = 0;
        let result = 0;
        do {
          b = encoded.charCodeAt(i++) - 63;
          result |= (b & 0x1f) << shift;
          shift += 5;
        } while (b >= 0x20);
        const dlat = (result & 1) ? ~(result >> 1) : result >> 1;
        lat += dlat;
        shift = 0;
        result = 0;
        do {
          b = encoded.charCodeAt(i++) - 63;
          result |= (b & 0x1f) << shift;
          shift += 5;
        } while (b >= 0x20);
        const dlng = (result & 1) ? ~(result >> 1) : result >> 1;
        lng += dlng;
        pts.push([lat / 1e5, lng / 1e5]);
      }
      return pts;
    };

    // ========= Street View 埋め込みヘルパ =========
    const buildStreetViewEmbedURL = (lat: number, lng: number) => {
      const L = encodeURIComponent(lat);
      const G = encodeURIComponent(lng);
      return `https://www.google.com/maps?q=&layer=c&cbll=${L},${G}&cbp=11,0,0,0,0&output=svembed`;
    };

    const isEmbeddableGoogleURL = (url: string | null | undefined) => {
      if (!url) return false;
      try {
        const u = new URL(url);
        return (
          u.hostname.endsWith('google.com') &&
          (u.pathname.includes('/maps/embed') ||
            u.searchParams.get('output') === 'svembed')
        );
      } catch {
        return false;
      }
    };

    // ========= テーマ / ナビまわり =========
    const isDarkSiteTheme = () =>
      document.body.classList.contains('dark');

    let resultMap: any | null = null;

    const measureAndApplyNavHeight = () => {
      const host = document.getElementById('navbar-placeholder');
      const navEl =
        host && host.firstElementChild
          ? (host.firstElementChild as HTMLElement)
          : host;
      const navH = Math.max(
        0,
        Math.round(navEl?.getBoundingClientRect().height || 56),
      );

      document.documentElement.style.setProperty(
        '--nav-h',
        `${navH}px`,
      );
      if (host) host.style.height = `${navH}px`;

      if (resultMap) {
        setTimeout(() => {
          resultMap.invalidateSize();
        }, 0);
      }
    };

    // ========= 下部ボタン & 画面遷移 =========
    const retry = () => {
      const fromAddition = localStorage.getItem('fromAddition');
      localStorage.removeItem('fromAddition');
      if (fromAddition) {
        location.href = 'addition';
      } else {
        location.href = 'play';
      }
    };

    const goHome = () => {
      location.href = 'home';
    };

    const injectBottomButtons = (sidebarEl: HTMLElement | null) => {
      if (!sidebarEl) return;
      if (sidebarEl.querySelector('.sidebar-actions')) return;

      const actions = document.createElement('div');
      actions.className = 'sidebar-actions';

      const row = document.createElement('div');
      row.className = 'btn-row';
      row.style.display = 'flex';
      row.style.gap = '8px';
      row.style.flexWrap = 'wrap';

      const retryBtn = document.createElement('button');
      retryBtn.type = 'button';
      retryBtn.className = 'btn';
      retryBtn.innerHTML = 'もう一度<br>プレイ';
      retryBtn.addEventListener('click', retry);

      const homeBtn = document.createElement('button');
      homeBtn.type = 'button';
      homeBtn.className = 'btn primary';
      homeBtn.textContent = 'ホームへ';
      homeBtn.addEventListener('click', goHome);

      row.appendChild(retryBtn);
      row.appendChild(homeBtn);
      actions.appendChild(row);
      sidebarEl.appendChild(actions);
    };

    // ====== メイン処理（元の DOMContentLoaded 相当） ======
    const navHost = document.getElementById('navbar-placeholder');
    const layout = document.getElementById('result-layout') as
      | HTMLElement
      | null;
    const sidebarEl = document.getElementById('result-sidebar') as
      | HTMLElement
      | null;
    const mapWrapper = document.getElementById('map-wrap') as
      | HTMLElement
      | null;
    const mapEl = document.getElementById('result-map') as
      | HTMLElement
      | null;
    const scoreText = document.getElementById('scoreText') as
      | HTMLElement
      | null;

    // レイアウト調整（JSで上書き）
    if (layout) {
      Object.assign(layout.style, {
        position: 'fixed',
        top: 'var(--nav-h, 56px)',
        left: '0',
        right: '0',
        bottom: '0',
        display: 'flex',
        gap: '12px',
        alignItems: 'stretch',
        padding: '8px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        margin: '0',
      });
    }
    if (sidebarEl) {
      Object.assign(sidebarEl.style, {
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        width: 'clamp(260px, 28vw, 340px)',
      });
    }
    if (mapWrapper) {
      Object.assign(mapWrapper.style, {
        flex: '1 1 auto',
        minWidth: '0',
        height: '100%',
        overflow: 'hidden',
      });
    }
    if (mapEl) {
      Object.assign(mapEl.style, {
        width: '100%',
        height: '100%',
      });
    }

    // ナビ高さの初期測定 & 監視
    measureAndApplyNavHeight();
    const navObserver =
      navHost &&
      new MutationObserver(measureAndApplyNavHeight);
    if (navObserver && navHost) {
      navObserver.observe(navHost, {
        childList: true,
        subtree: true,
      });
    }
    window.addEventListener('resize', measureAndApplyNavHeight);
    window.addEventListener('load', () =>
      setTimeout(measureAndApplyNavHeight, 0),
    );

    // メインの async ロジック
    let bodyObserver: MutationObserver | null = null;

    (async () => {
      // Leaflet 読み込み
      const leafletModule = await import('leaflet');
      const L: any =
        (leafletModule as any).default ?? leafletModule;

      // ===== 地図初期化 =====
      resultMap = L.map('result-map', {
        zoomControl: true,
      }).setView([35.7, 139.7], 10);

      const lightTiles = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; OpenStreetMap contributors',
        },
      );
      const darkTiles = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution:
            '&copy; OpenStreetMap &copy; CARTO',
        },
      );

      const applyTiles = () => {
        if (!resultMap) return;
        const wantDark = isDarkSiteTheme();
        if (wantDark) {
          if (resultMap.hasLayer(lightTiles)) {
            resultMap.removeLayer(lightTiles);
          }
          if (!resultMap.hasLayer(darkTiles)) {
            darkTiles.addTo(resultMap);
          }
        } else {
          if (resultMap.hasLayer(darkTiles)) {
            resultMap.removeLayer(darkTiles);
          }
          if (!resultMap.hasLayer(lightTiles)) {
            lightTiles.addTo(resultMap);
          }
        }
        setTimeout(() => {
          resultMap.invalidateSize();
        }, 0);
      };

      applyTiles();

      // body の class 変化（テーマ切り替え）を監視
      bodyObserver = new MutationObserver(applyTiles);
      bodyObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['class'],
      });

      // ===== 必要データ取得 =====
      const correctRaw = localStorage.getItem('correctCoords');
      const answerRaw = localStorage.getItem('lastAnswerCoords');
      const correctSpotRaw = localStorage.getItem('correctSpot');

      const correct = correctRaw ? JSON.parse(correctRaw) : null;
      const answer = answerRaw ? JSON.parse(answerRaw) : null;
      const correctSpot = correctSpotRaw
        ? JSON.parse(correctSpotRaw)
        : null;

      if (!correct || !answer || !correctSpot) {
        if (scoreText) {
          scoreText.innerHTML =
            '<p>情報が足りません。再度プレイしてください。</p>';
        }
        injectBottomButtons(sidebarEl);
        return;
      }

      // ===== スコア表示 =====
      try {
        const res = await fetch(
          `/api/score?SelLat=${answer.lat}&SelLng=${answer.lng}&CorLat=${correct.lat}&CorLng=${correct.lng}`,
        );
        const data = await res.json();
        if (!data.success) throw new Error('スコア取得に失敗');
        const distanceKm = Number(data.Distance || 0);
        const score = Number(data.score || 0);
        localStorage.setItem('lastScore', String(score));

        if (scoreText) {
          const title = correctSpot.title || '観光地';
          const desc = correctSpot.description || '';
          const img = correctSpot.image_path || '';

          scoreText.innerHTML = `
        <div style="height: var(--sidebar-pad, 32px);"></div>
        <h2 style="margin:0 0 12px 0; font-size:1.2rem; font-weight:700;">${title}</h2>
        距離: <span>${distanceKm.toFixed(
          1,
        )}km</span><br>
        スコア: <span>${score}</span> / 100
        <div id="place-info" style="margin-top: 16px;">
          <p>${desc}</p>
          ${
            img
              ? `<img src="${img}" alt="観光地画像" style="max-width:100%; border-radius:10px; margin-top:10px;">`
              : ''
          }
        </div>
      `;
        }
      } catch (err) {
        console.error('スコアAPI通信エラー:', err);
        if (scoreText) {
          scoreText.innerHTML = `
        <div style="height: var(--sidebar-pad, 32px);"></div>
        <h2 style="margin:0 0 12px 0; font-size:1.2rem; font-weight:700;">情報の取得に失敗</h2>
        <p>スコア情報の取得に失敗しました。</p>
      `;
        }
      }

      // ===== マーカー・線 =====
      L.marker([correct.lat, correct.lng])
        .addTo(resultMap)
        .bindPopup('🎯 正解地点')
        .openPopup();
      L.marker([answer.lat, answer.lng])
        .addTo(resultMap)
        .bindPopup('📍 あなたのピン');
      L.polyline(
        [
          [answer.lat, answer.lng],
          [correct.lat, correct.lng],
        ],
        { color: 'red', weight: 2 },
      ).addTo(resultMap);
      resultMap.fitBounds(
        L.latLngBounds(
          [
            [answer.lat, answer.lng],
            [correct.lat, correct.lng],
          ],
        ),
        { padding: [30, 30] },
      );

      // ===== Street View 埋め込み =====
      try {
        let finalUrl: string | null = null;
        try {
          const r = await fetch(
            `/api/streetview-url?lat=${correct.lat}&lng=${correct.lng}`,
          );
          const j = await r.json();
          if (j?.success && j?.url) {
            finalUrl = isEmbeddableGoogleURL(j.url)
              ? j.url
              : null;
          }
        } catch {
          // ignore
        }
        if (!finalUrl) {
          finalUrl = buildStreetViewEmbedURL(
            correct.lat,
            correct.lng,
          );
        }

        if (sidebarEl) {
          const wrap = document.createElement('div');
          wrap.id = 'streetview-container';
          wrap.style.marginTop = '12px';
          wrap.innerHTML = `
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div style="font-weight:600;">📷 Google ストリートビュー</div>
            <a href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${encodeURIComponent(
              correct.lat,
            )},${encodeURIComponent(
            correct.lng,
          )}" target="_blank" rel="noopener" class="btn">新しいタブで開く</a>
          </div>
          <iframe class="streetview-frame" loading="lazy" allow="fullscreen" referrerpolicy="no-referrer-when-downgrade" style="width:100%;height:200px;border:0;border-radius:10px;"></iframe>
          <div class="sv-fallback" style="display:none;margin-top:8px;font-size:.9rem;color:var(--subtle);">ストリートビューを読み込めませんでした。上のボタンから Google マップでご確認ください。</div>
        </div>
      `;
          sidebarEl.appendChild(wrap);
          const iframe = wrap.querySelector(
            'iframe',
          ) as HTMLIFrameElement | null;
          const fallbackMsg = wrap.querySelector(
            '.sv-fallback',
          ) as HTMLElement | null;
          if (iframe) {
            let loaded = false;
            iframe.addEventListener('load', () => {
              loaded = true;
            });
            iframe.src = finalUrl;
            setTimeout(() => {
              if (!loaded && fallbackMsg) {
                fallbackMsg.style.display = 'block';
              }
            }, 4000);
          }
        }
      } catch (err) {
        console.warn('Street View 埋め込み処理エラー:', err);
      }

      // ===== 自宅 → 観光地：距離・ルート =====
      try {
        const locRes = await fetch('/api/has_location', {
          credentials: 'include',
        });
        if (!locRes.ok)
          throw new Error('住所情報取得に失敗');
        const locData = await locRes.json();

        if (
          locData.hasLocation &&
          locData.lat != null &&
          locData.lng != null
        ) {
          const userLat = Number(locData.lat);
          const userLng = Number(locData.lng);

          const houseIcon = L.icon({
            iconUrl:
              'https://cdn-icons-png.flaticon.com/512/25/25694.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -30],
          });

          L.marker([userLat, userLng], { icon: houseIcon })
            .addTo(resultMap)
            .bindPopup('🏠 自宅');

          const d = getDistanceKm(
            userLat,
            userLng,
            correct.lat,
            correct.lng,
          );
          const carH = (d / 60).toFixed(1);
          const trainH = (d / 80).toFixed(1);
          const cost = Math.round(d * 15);

          if (scoreText) {
            const travelInfo = document.createElement('div');
            travelInfo.innerHTML = `
          <hr style="margin: 20px 0;">
          <h4>🧭 自宅からの移動情報</h4>
          <p>
            🏠 登録住所 ➡ ${
              correctSpot.title || '目的地'
            }（観光地）<br>
            直線距離: 約 <strong>${d.toFixed(
              1,
            )} km</strong><br>
            🚗 車（概算）: 約 <strong>${carH} 時間</strong><br>
            🚃 電車（概算）: 約 <strong>${trainH} 時間</strong>・運賃 約 <strong>${cost} 円</strong>
          </p>`;
            scoreText.appendChild(travelInfo);
          }

          const directionsRes = await fetch(
            `/api/directions?fromLat=${userLat}&fromLng=${userLng}&toLat=${correct.lat}&toLng=${correct.lng}&mode=driving`,
          );
          const dir = await directionsRes.json();
          if (
            dir.success &&
            dir.route?.overview_polyline?.points
          ) {
            const points = decodePolyline(
              dir.route.overview_polyline.points,
            );
            const routeLine = L.polyline(points, {
              color: 'blue',
              weight: 4,
            })
              .addTo(resultMap)
              .bindPopup('🚗 推奨ルート');
            resultMap.fitBounds(routeLine.getBounds(), {
              padding: [30, 30],
            });

            const minutes = Math.round(
              (dir.route.duration || 0) / 60,
            );
            const km = (dir.route.distance || 0) / 1000;
            if (scoreText) {
              const routeInfo =
                document.createElement('div');
              routeInfo.style.marginTop = '8px';
              routeInfo.innerHTML = `<p>🗺️ 経路（実測）: 距離 約 <strong>${km.toFixed(
                1,
              )} km</strong>・所要 約 <strong>${minutes} 分</strong></p>`;
              scoreText.appendChild(routeInfo);
            }
          } else {
            console.warn(
              '経路が見つかりませんでした:',
              dir?.message,
            );
          }
        }
      } catch (err) {
        console.warn('移動情報の取得に失敗:', err);
      }

      // ===== 楽天ホテル（簡易カード） =====
      try {
        const r = await fetch(
          `/api/hotels_nearby_rakuten?lat=${correct.lat}&lng=${correct.lng}`,
        );
        const rk = await r.json();
        if (rk.success && rk.count > 0) {
          const wrap = document.createElement('div');
          wrap.innerHTML = `
        <hr style="margin:20px 0;">
        <h4>🏨 観光地付近のホテル（半径 ${
          rk.radiusKm
        } km・楽天）</h4>
        <div id="r-hotel-list" style="display:grid; gap:12px; grid-template-columns: repeat(auto-fill,minmax(260px,1fr));"></div>
      `;
          if (scoreText) scoreText.appendChild(wrap);
          const list = wrap.querySelector(
            '#r-hotel-list',
          ) as HTMLElement | null;

          rk.hotels.forEach((h: any) => {
            if (h.lat && h.lng) {
              L.marker([h.lat, h.lng])
                .addTo(resultMap)
                .bindPopup(`🏨 ${h.name || 'ホテル'}`);
            }
            if (!list) return;
            const card = document.createElement('div');
            card.className = 'card';
            const priceText =
              h.minCharge != null
                ? `最安目安: ¥${Number(
                    h.minCharge,
                  ).toLocaleString()}`
                : '';
            const rateText =
              h.reviewAverage != null &&
              h.reviewCount != null
                ? `評価 ${h.reviewAverage} / 5（${h.reviewCount}件）`
                : '';
            card.innerHTML = `
          ${
            h.thumbnail
              ? `<img src="${h.thumbnail}" alt="${
                  h.name || ''
                }" style="width:100%;height:140px;object-fit:cover;border-radius:8px;margin-bottom:8px;">`
              : ''
          }
          ${
            h.name
              ? `<div style="font-weight:600;margin-bottom:4px;">${h.name}</div>`
              : ''
          }
          ${
            h.address
              ? `<div style="font-size:.9rem;color:var(--subtle);margin-bottom:4px;">${h.address}</div>`
              : ''
          }
          ${
            priceText
              ? `<div style="font-size:.9rem;margin-bottom:4px;">${priceText}</div>`
              : ''
          }
          ${
            rateText
              ? `<div style="font-size:.9rem;color:var(--subtle);margin-bottom:8px;">${rateText}</div>`
              : ''
          }
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            ${
              h.infoUrl
                ? `<a href="${h.infoUrl}" target="_blank" rel="noopener" class="btn">施設情報</a>`
                : ''
            }
            ${
              h.planUrl
                ? `<a href="${h.planUrl}" target="_blank" rel="noopener" class="btn primary">空室・料金を確認</a>`
                : ''
            }
          </div>
        `;
            list.appendChild(card);
          });

          const pts = rk.hotels
            .filter((h: any) => h.lat && h.lng)
            .map((h: any) => [h.lat, h.lng]);
          if (pts.length > 0) {
            const bounds = L.latLngBounds(
              [[correct.lat, correct.lng] as [number, number]],
              ...pts,
            );
            resultMap.fitBounds(bounds, {
              padding: [30, 30],
            });
          }
        } else {
          const wrap = document.createElement('div');
          wrap.innerHTML =
            '<hr style="margin:20px 0;"><p>🏨 楽天: 付近のホテルは見つかりませんでした（最大3.0km）。</p>';
          if (scoreText) scoreText.appendChild(wrap);
        }
      } catch (err) {
        console.warn('楽天ホテル取得エラー:', err);
        const wrap = document.createElement('div');
        wrap.innerHTML =
          '<hr style="margin:20px 0;"><p>🏨 楽天ホテル情報の取得に失敗しました。</p>';
        if (scoreText) scoreText.appendChild(wrap);
      }

      injectBottomButtons(sidebarEl);
    })();

    // クリーンアップ
    return () => {
      window.removeEventListener('resize', measureAndApplyNavHeight);
      if (navObserver) navObserver.disconnect();
      if (bodyObserver) bodyObserver.disconnect();
    };
  }, []);

  return (
    <>
      {/* navbar.js 用プレースホルダ */}
      <div id="navbar-placeholder" />

      <main id="result-layout">
        <aside id="result-sidebar">
          <div id="scoreText">スコア計算中...</div>
          <div id="place-info" />
          {/* injectBottomButtons がここにボタンを追加 */}
        </aside>

        <section id="map-wrap">
          <div id="result-map" />
        </section>
      </main>

      {/* 既存の navbar.js をそのまま利用 */}
      <Script src="/js/navbar.js" strategy="afterInteractive" />
    </>
  );
}
