'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type MeResponse = {
  uuid: string;
  id: string;
  avatar_url?: string | null;
};

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

type PanelState = {
  score: string;
  genreLabel: string;
  regionLabel: string;
  title: string;
  description: string;
  playedAt: string;
  image: string;
};

// もとの home.js と同じ NoImage
const NO_IMAGE_DATA_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200">
       <rect width="100%" height="100%" fill="#e0e0e0"/>
       <text x="50%" y="50%" font-family="sans-serif" font-size="20" fill="#666" text-anchor="middle" dominant-baseline="middle">
         No Image
       </text>
     </svg>`,
  );

export default function HomePage() {
  const router = useRouter();

  // ユーザー名（「○○さん、ようこそ！」用）
  const [username, setUsername] = useState<string>('');

  // セレクトの状態
  const [region, setRegion] = useState<string>('null'); // 「指定しない」
  const [genre, setGenre] = useState<string>('null');  // 「指定しない」
  const [mode, setMode] = useState<string>('play');    // デフォルト：観光地を探す

  // 右ペイン表示用
  const [panel, setPanel] = useState<PanelState>({
    score: '--',
    genreLabel: '--',
    regionLabel: '--',
    title: '--',
    description: '--',
    playedAt: '--',
    image: NO_IMAGE_DATA_URL,
  });

  // 連続ログイン日数
  const [streakDays, setStreakDays] = useState<number | null>(null);

  // 画像フェールバック用（無限ループ防止）
  const [imageErrorOnce, setImageErrorOnce] = useState(false);

  // ===============================
  // 初期処理：/api/me → /api/history → テーマ & 連続ログイン日数
  // ===============================
  useEffect(() => {
    (async () => {
      try {
        // 認証 & /api/me（相対パスに変更）
        const res = await fetch('/api/me', {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Unauthorized');
        const user: MeResponse = await res.json();

        setUsername(user.id);

        // localStorage に各種保存（旧 home.js と同じ）
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_uuid', user.uuid);
          localStorage.setItem('username', user.id);
          localStorage.setItem('avatar_url', user.avatar_url || '');
        }

        // テーマ反映
        if (typeof document !== 'undefined') {
          const savedTheme = localStorage.getItem('theme') || 'light';
          document.body.className = savedTheme;
        }

        // 履歴取得
        await loadLastHistory(user.uuid);

        // 連続ログイン日数
        updateStreak();
      } catch (err) {
        console.error(err);
        if (typeof window !== 'undefined') {
          localStorage.clear();
          alert('ログインが必要です。ログインページへ移動します。');
          router.push('/auth/login');
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===============================
  // 最新履歴1件の読み込み（右ペイン用）
  // ===============================
  async function loadLastHistory(uuid: string) {
    try {
      const hisRes = await fetch(`/api/history/${uuid}`, {
        credentials: 'include',
      });
      if (!hisRes.ok) throw new Error('履歴取得HTTP失敗');

      const json = await hisRes.json();
      const history: HistoryItem[] = json.history || [];
      if (!json.success || !history.length) {
        throw new Error('履歴がありません');
      }

      // 念のため最新順にソート（answered_at 降順）
      history.sort(
        (a, b) =>
          new Date(b.answered_at).getTime() -
          new Date(a.answered_at).getTime(),
      );
      const latest = history[0];

      const genreMap: Record<string, string> = {
        historic: '歴史的建造物',
        nature: '自然',
        city: '都市景観',
        culture: '文化的名所',
      };

      const regionLabel = getRegionFromLatLng(
        Number(latest.lat),
        Number(latest.lng),
      );
      const genreLabel = genreMap[latest.genre ?? ''] || '不明';

      setPanel({
        score: `${latest.score ?? '--'} / 100`,
        genreLabel,
        regionLabel,
        title: latest.title || '--',
        description: latest.description || '--',
        playedAt: new Date(latest.answered_at).toLocaleDateString('ja-JP'),
        image: latest.image_path || NO_IMAGE_DATA_URL,
      });
    } catch (e) {
      console.error('履歴読み込み失敗:', e);
      // 失敗時は初期プレースホルダのまま
      setPanel((prev) => ({
        ...prev,
        image: NO_IMAGE_DATA_URL,
      }));
    }
  }

  // ===============================
  // 地方判定（home.js の getRegionFromLatLng）
  // ===============================
  function getRegionFromLatLng(lat: number, lng: number): string {
    if (Number.isNaN(lat) || Number.isNaN(lng)) return 'その他';
    if (lat >= 43) return '北海道';
    if (lat >= 38) return '東北';
    if (lat >= 35 && lng >= 138 && lng < 141) return '関東';
    if (lat >= 34 && lng >= 135 && lng < 138) return '中部';
    if (lat >= 34 && lng >= 133 && lng < 135) return '関西';
    if (lat >= 33 && lng >= 130) return '九州';
    if (lat < 30) return '沖縄';
    return 'その他';
  }

  // ===============================
  // 連続ログイン日数（home.js のロジック）
  // ===============================
  function updateStreak() {
    if (typeof window === 'undefined') return;

    const today = new Date().toISOString().slice(0, 10);
    const lastLogin = localStorage.getItem('lastLoginDate');
    let streak = parseInt(localStorage.getItem('streakDays') || '0', 10);

    if (lastLogin !== today) {
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .slice(0, 10);
      streak = lastLogin === yesterday ? streak + 1 : 1;
      localStorage.setItem('lastLoginDate', today);
      localStorage.setItem('streakDays', String(streak));
    }
    setStreakDays(streak);
  }

  // ===============================
  // ボタンハンドラ
  // ===============================

  const handleStart = () => {
    // 旧 home.js と同じ値の扱い
    const regionValue = region || 'unspecified';
    const genreValue = genre || 'unspecified';
    const modeValue = mode || 'search';

    const params = new URLSearchParams({
      region: regionValue,
      genre: genreValue,
      mode: modeValue,
    }).toString();

    if (modeValue === 'play') {
      router.push(`/play?${params}`);
    } else if (modeValue === 'addition') {
      router.push(`/addition?${params}`);
    } else {
      alert('モードが正しく選択されていません。');
    }
  };

  const handleHistory = () => {
    router.push('/history');
  };

  // 画像 onError（1回だけ NoImage に切り替え）
  const handleImageError: React.ReactEventHandler<HTMLImageElement> = (e) => {
    if (imageErrorOnce) return;
    setImageErrorOnce(true);
    const img = e.currentTarget;
    img.removeAttribute('srcset');
    img.src = NO_IMAGE_DATA_URL;
  };

  // region / genre セレクトを無効にするかどうか（addition モードのとき）
  const isAdditionMode = mode === 'addition';

  return (
    <div className="home-layout">
      {/* 左側：設定 */}
      <div className="home-left">
        <h2 id="welcome" className="heading">
          {username ? `${username} さん、ようこそ！` : 'ようこそ'}
        </h2>

        <label htmlFor="region">地域を選択：</label>
        <select
          id="region"
          value={region}
          disabled={isAdditionMode}
          onChange={(e) => setRegion(e.target.value)}
        >
          <option value="null">指定しない</option>
          <option value="hokkaidou">北海道</option>
          <option value="touhoku">東北</option>
          <option value="kantou">関東</option>
          <option value="chubu">中部</option>
          <option value="kinki">近畿</option>
          <option value="chugoku">中国</option>
          <option value="shikoku">四国</option>
          <option value="kyusyu">九州</option>
        </select>

        <label htmlFor="genre">ジャンルを選択：</label>
        <select
          id="genre"
          value={genre}
          disabled={isAdditionMode}
          onChange={(e) => setGenre(e.target.value)}
        >
          <option value="null">指定しない</option>
          <option value="historic">歴史的建造物</option>
          <option value="nature">自然</option>
          <option value="city">都市景観</option>
          <option value="culture">文化的名所</option>
        </select>

        <label htmlFor="mode">モードを選択：</label>
        <select
          id="mode"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          <option value="play">観光地を探す</option>
          <option value="addition">観光地を追加する</option>
        </select>

        <button
          id="startButton"
          className="primary-btn"
          type="button"
          onClick={handleStart}
        >
          📌 開始する
        </button>
      </div>

      {/* 右側：前回の結果 */}
      <div className="home-right">
        {/* 観光地の画像 */}
        <img
          id="lastImage"
          className="last-image"
          src={panel.image || NO_IMAGE_DATA_URL}
          alt="前回の観光地画像"
          onError={handleImageError}
        />

        <p id="lastScore" className="info-text">
          前回のスコア：{panel.score}
        </p>
        <p id="lastGenre" className="info-text">
          ジャンル：{panel.genreLabel}
        </p>
        <p id="lastRegion" className="info-text">
          地域：{panel.regionLabel}
        </p>
        <p id="lastPlace" className="info-text">
          観光地：{panel.title}
        </p>
        <p id="lastInfo" className="info-text">
          説明：{panel.description}
        </p>
        <p id="lastPlayed" className="info-text">
          最終プレイ日：{panel.playedAt}
        </p>
        <p id="streak" className="info-text">
          {streakDays != null ? `連続ログイン日数：${streakDays}日` : '--'}
        </p>

        <button
          id="historyButton"
          className="secondary-btn"
          type="button"
          onClick={handleHistory}
        >
          📖 出題履歴を表示する
        </button>
      </div>
    </div>
  );
}
