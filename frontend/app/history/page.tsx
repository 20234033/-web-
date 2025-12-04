'use client';

import { useEffect, useMemo, useState } from 'react';

// ==== 型定義 ====

type HistoryItem = {
  spot_id: number;
  score: number | null;
  answered_at: string;
  title: string | null;
  genre: string | null;
  description: string | null;
  lat: number | null;
  lng: number | null;
  image_path: string | null;
};

type MeResponse = {
  uuid: string;
};

type Hotel = {
  id: number | null;
  name: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  minCharge: number | null;
  reviewAverage: number | null;
  reviewCount: number | null;
  thumbnail: string | null;
  infoUrl: string | null;
  planUrl: string | null;
};

type HotelsApiResponse = {
  success: boolean;
  radiusKm?: number;
  count?: number;
  hotels?: any[];
};

// ====== 定数 ======

const PAGE_SIZE = 5;

// ====== ユーティリティ ======

function formatDateTime(src: string | null | undefined) {
  if (!src) return '';
  const d = new Date(src);
  if (Number.isNaN(d.getTime())) return String(src);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd} ${hh}:${mi}`;
}

function genreLabel(g: string | null | undefined) {
  switch (g) {
    case 'historic':
      return '歴史・文化';
    case 'nature':
      return '自然';
    case 'city':
      return '都市・街並み';
    case 'culture':
      return '観光・文化';
    default:
      return g || '未分類';
  }
}

// ====== コンポーネント本体 ======

export default function HistoryPage() {
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(-1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ホテル情報
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [hotelsStatus, setHotelsStatus] = useState(
    '履歴を選択すると、周辺ホテルを検索します。',
  );
  const [hotelsLoading, setHotelsLoading] = useState(false);

  // ====== 初期ロード： /api/me → /api/history/:uuid ======
  useEffect(() => {
    (async () => {
      try {
        // /api/me
        const meRes = await fetch('/api/me', { credentials: 'include' });
        if (!meRes.ok) throw new Error('認証が必要です');
        const me: MeResponse = await meRes.json();

        // /api/history/:uuid
        const histRes = await fetch(`/api/history/${encodeURIComponent(me.uuid)}`, {
          credentials: 'include',
        });
        if (!histRes.ok) {
          const text = await histRes.text();
          throw new Error(text || '履歴の取得に失敗しました');
        }
        const data = await histRes.json();
        if (!data.success) {
          throw new Error(data.error || '履歴の取得に失敗しました');
        }

        const list: HistoryItem[] = data.history || [];
        setHistoryData(list);

        // 初期ページ & 初期選択
        if (list.length > 0) {
          setCurrentPage(1);
          setSelectedIndex(0);
        } else {
          setSelectedIndex(null);
        }
      } catch (e: any) {
        console.error(e);
        setError(e.message ?? '履歴の読み込みに失敗しました。');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 総ページ数
  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(historyData.length / PAGE_SIZE)),
    [historyData.length],
  );

  // 現在ページの一覧
  const currentPageItems = useMemo(() => {
    if (!historyData.length) return [];
    const clampedPage = Math.min(Math.max(1, currentPage), pageCount);
    const start = (clampedPage - 1) * PAGE_SIZE;
    const end = Math.min(start + PAGE_SIZE, historyData.length);
    return historyData.slice(start, end);
  }, [historyData, currentPage, pageCount]);

  // ページ変更
  const changePage = (page: number) => {
    const newPage = Math.min(Math.max(1, page), pageCount);
    setCurrentPage(newPage);

    const startIndex = (newPage - 1) * PAGE_SIZE;
    if (historyData[startIndex]) {
      setSelectedIndex(startIndex);
    }
  };

  // 選択中アイテム
  const selectedItem = useMemo(
    () =>
      selectedIndex != null && selectedIndex >= 0 && selectedIndex < historyData.length
        ? historyData[selectedIndex]
        : null,
    [historyData, selectedIndex],
  );

  // ====== 選択変更時・ホテル読み込み ======
  useEffect(() => {
    const item = selectedItem;

    if (!item) {
      setHotels([]);
      setHotelsStatus('履歴を選択すると、周辺ホテルを検索します。');
      setHotelsLoading(false);
      return;
    }

    // 座標がない場合
    if (item.lat == null || item.lng == null) {
      setHotels([]);
      setHotelsStatus(
        'このスポットには座標情報がないため、周辺ホテルを検索できません。',
      );
      setHotelsLoading(false);
      return;
    }

    (async () => {
      try {
        setHotelsLoading(true);
        setHotels([]);
        setHotelsStatus('周辺ホテルを検索しています...');

        const params = new URLSearchParams({
          lat: String(item.lat),
          lng: String(item.lng),
          radiusKm: '1.0',
          hits: '5',
        });

        const res = await fetch(`/api/hotels_nearby_rakuten?${params.toString()}`, {
          credentials: 'include',
        });
        const data: HotelsApiResponse = await res.json();

        if (!data.success || !Array.isArray(data.hotels) || data.hotels.length === 0) {
          setHotels([]);
          setHotelsStatus('周辺に表示できるホテルが見つかりませんでした。');
          return;
        }

        const mapped: Hotel[] = data.hotels.map((h: any) => ({
          id: h.id ?? null,
          name: h.name ?? null,
          address: h.address ?? null,
          lat: h.lat ?? null,
          lng: h.lng ?? null,
          minCharge: h.minCharge ?? null,
          reviewAverage: h.reviewAverage ?? null,
          reviewCount: h.reviewCount ?? null,
          thumbnail:
            h.thumbnail ||
            h.imageUrl ||
            h.hotelImageUrl ||
            h.image ||
            (Array.isArray(h.imageUrls) ? h.imageUrls[0] : null),
          infoUrl: h.infoUrl ?? null,
          planUrl: h.planUrl ?? null,
        }));

        setHotels(mapped);
        setHotelsStatus(
          `検索範囲：約 ${data.radiusKm || '?'}km / ${
            data.count ?? data.hotels.length
          }件`,
        );
      } catch (e) {
        console.error('[hotels] error', e);
        setHotels([]);
        setHotelsStatus('ホテル情報の取得中にエラーが発生しました。');
      } finally {
        setHotelsLoading(false);
      }
    })();
  }, [selectedItem?.spot_id]); // spot_id が変わったら再取得

  // ====== ローディング・エラー表示 ======

  if (loading) {
    return <p>読み込み中...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  // ====== JSX（元のHTMLをほぼそのままReact化） ======

  return (
    <div className="home-layout history-layout">
      {/* 左：履歴リスト */}
      <div className="home-left history-list-panel">
        <button
          className="back-home-btn"
          type="button"
          onClick={() => {
            window.location.href = '/home';
          }}
        >
          🏠 ホームに戻る
        </button>

        <h2>📜 出題履歴</h2>

        {/* 履歴リスト本体 */}
        <ul id="history-ul">
          {historyData.length === 0 ? (
            <li style={{ padding: '8px 10px' }}>出題履歴がありません。</li>
          ) : (
            currentPageItems.map((item, indexInPage) => {
              const globalIndex = (currentPage - 1) * PAGE_SIZE + indexInPage;
              const isActive = globalIndex === selectedIndex;

              return (
                <li
                  key={`${item.spot_id}-${globalIndex}`}
                  className={`history-item ${isActive ? 'active' : ''}`}
                  data-index={globalIndex}
                  onClick={() => setSelectedIndex(globalIndex)}
                >
                  <span className="history-item-title">
                    {item.title || '(タイトルなし)'}
                  </span>
                  <span className="history-item-sub">
                    スコア: {item.score ?? '-'} / 出題日時:{' '}
                    {formatDateTime(item.answered_at)}
                  </span>
                </li>
              );
            })
          )}
        </ul>

        {/* ページネーション（1 2 3 次へ など） */}
        <div id="history-pager" className="history-pager">
          {historyData.length > 0 && pageCount > 1 && (
            <>
              {/* 前へ */}
              <span
                className={`history-page-nav ${currentPage <= 1 ? 'disabled' : ''}`}
                onClick={() => {
                  if (currentPage > 1) changePage(currentPage - 1);
                }}
              >
                ‹ 前へ
              </span>

              {/* ページ番号 */}
              {Array.from({ length: pageCount }, (_, i) => {
                const p = i + 1;
                const isActive = p === currentPage;
                return (
                  <span
                    key={p}
                    className={`history-page-link ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      if (!isActive) changePage(p);
                    }}
                  >
                    {p}
                  </span>
                );
              })}

              {/* 次へ */}
              <span
                className={`history-page-nav ${
                  currentPage >= pageCount ? 'disabled' : ''
                }`}
                onClick={() => {
                  if (currentPage < pageCount) changePage(currentPage + 1);
                }}
              >
                次へ ›
              </span>
            </>
          )}
        </div>
      </div>

      {/* 右：詳細パネル */}
      <div className="home-right history-detail-panel">
        <h2>🗺 選択した出題の詳細</h2>

        {!selectedItem ? (
          <div id="history-detail-empty">
            左の「出題履歴」から項目をクリックすると、ここに詳細が表示されます。
          </div>
        ) : (
          <div id="history-detail" className="history-detail">
            {/* 画像 */}
            <div id="detail-image-wrap" className="detail-image-wrap">
              {selectedItem.image_path && (
                <img
                  src={selectedItem.image_path}
                  alt={selectedItem.title || 'スポット画像'}
                />
              )}
            </div>

            {/* テキスト情報 */}
            <h3 id="detail-title">{selectedItem.title || '(タイトルなし)'}</h3>
            <p id="detail-genre" className="detail-genre">
              ジャンル：{genreLabel(selectedItem.genre)}
            </p>
            <p id="detail-description" className="detail-description">
              {selectedItem.description || '説明は登録されていません。'}
            </p>

            <div className="detail-meta">
              <span id="detail-score">スコア：{selectedItem.score ?? '-'}</span>
              <span id="detail-date">
                出題日時：{formatDateTime(selectedItem.answered_at)}
              </span>
            </div>

            {/* 周辺ホテル情報 */}
            <div className="detail-hotels">
              <h3>🏨 周辺ホテル</h3>
              <p id="hotels-status" className="hotels-status">
                {hotelsStatus}
                {hotelsLoading ? '（読み込み中…）' : ''}
              </p>
              <ul id="hotels-list">
                {hotels.map((h, idx) => (
                  <li key={`${h.id ?? 'hotel'}-${idx}`}>
                    <div className="hotel-card">
                      <div className="hotel-card-thumb">
                        {h.thumbnail && (
                          <img src={h.thumbnail} alt={h.name || 'ホテル画像'} />
                        )}
                      </div>
                      <div className="hotel-card-body">
                        <div className="hotel-card-name">
                          {h.name || '名称不明のホテル'}
                        </div>
                        {(h.minCharge || h.reviewAverage) && (
                          <div className="hotel-card-meta">
                            {h.minCharge && (
                              <span>最安値目安: {h.minCharge}円〜</span>
                            )}
                            {h.reviewAverage && (
                              <span>
                                評価: {h.reviewAverage}（{h.reviewCount ?? 0}件）
                              </span>
                            )}
                          </div>
                        )}
                        <div className="hotel-card-actions">
                          <a
                            href={h.planUrl || h.infoUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hotel-link-btn"
                          >
                            詳細を見る
                          </a>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
