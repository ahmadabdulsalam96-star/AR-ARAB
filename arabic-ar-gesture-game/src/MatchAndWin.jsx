import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Camera, Heart, RotateCcw, Star, Trophy } from 'lucide-react';

// Each entry: [Arabic word/phrase, Malay meaning, emoji].
const DATA = {
  1: [['تُفَّاحَةٌ', 'Epal', '🍎'], ['أَسَدٌ', 'Singa', '🦁'], ['كِتَابٌ', 'Buku', '📖']],
  2: [['شَمْسٌ', 'Matahari', '☀️'], ['حَافِلَةٌ', 'Bas', '🚌'], ['مَدْرَسَةٌ', 'Sekolah', '🏫']],
  3: [['يَقْرَأُ', 'Membaca', '📖'], ['يَكْتُبُ', 'Menulis', '✍️'], ['يَشْرَبُ', 'Minum', '🥛']],
  4: [['الْبَيْتُ كَبِيرٌ', 'Rumah itu besar', '🏠'], ['الْبِنْتُ تَكْتُبُ', 'Budak perempuan menulis', '👧✍️'], ['الْوَلَدُ يَقْرَأُ', 'Budak lelaki membaca', '👦📖']],
  5: [['يَذْهَبُ أَحْمَدُ إِلَى الْمَدْرَسَةِ', 'Ahmad pergi ke sekolah', '🏫'], ['تَشْرَبُ فَاطِمَةُ الْحَلِيبَ', 'Fatimah minum susu', '🥛'], ['يَلْعَبُ الْأَطْفَالُ فِي الْحَدِيقَةِ', 'Kanak-kanak bermain di taman', '🌳']],
  6: [['نَذْهَبُ إِلَى الْمَدْرَسَةِ بِالْحَافِلَةِ', 'Kami pergi ke sekolah dengan bas', '🚌'], ['تَشْرَحُ الْمُعَلِّمَةُ الدَّرْسَ', 'Guru perempuan menerangkan pelajaran', '👩‍🏫'], ['نُصَلِّي جَمَاعَةً فِي الْمَسْجِدِ', 'Kami bersolat berjemaah di masjid', '🕌']],
};

const CONNECTIONS = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
const shuffled = (items) => [...items].sort(() => Math.random() - 0.5);

export default function MatchAndWin({ onBack }) {
  const [year, setYear] = useState(1);
  const [stage, setStage] = useState('menu');
  const [cards, setCards] = useState([]);
  const [targets, setTargets] = useState([]);
  const [matched, setMatched] = useState([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [cursor, setCursor] = useState(null);
  const [held, setHeld] = useState(null);
  const [message, setMessage] = useState('');
  const [cameraStatus, setCameraStatus] = useState('Memulakan kamera...');
  const arenaRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const sourceRefs = useRef({});
  const targetRefs = useRef({});
  const pinchRef = useRef(false);
  const heldRef = useRef(null);
  const matchedRef = useRef([]);
  const livesRef = useRef(3);
  const activeRef = useRef(false);
  const lastActionRef = useRef(0);
  const positionRef = useRef({x: 50, y: 50});
  const pairs = useMemo(() => DATA[year].map(([arabic, malay, emoji], id) => ({id, arabic, malay, emoji})), [year]);

  const start = () => {
    const items = pairs.map(p => p.id);
    setCards(shuffled(items));
    setTargets(shuffled(items));
    setMatched([]); matchedRef.current = [];
    setScore(0); setLives(3); livesRef.current = 3;
    setHeld(null); heldRef.current = null; pinchRef.current = false;
    setMessage('Cubit kad Arab, seret ke padanan dan lepaskan.');
    setStage('playing'); activeRef.current = true;
  };

  const finishDrop = (id, x, y) => {
    if (id === null || id === undefined || !arenaRef.current) return;
    const arena = arenaRef.current.getBoundingClientRect();
    const px = arena.left + x * arena.width / 100;
    const py = arena.top + y * arena.height / 100;
    const targetId = targets.find(tid => {
      const rect = targetRefs.current[tid]?.getBoundingClientRect();
      return rect && px >= rect.left && px <= rect.right && py >= rect.top && py <= rect.bottom;
    });
    if (targetId === undefined) { setMessage('Lepaskan kad di dalam kotak padanan.'); return; }
    if (targetId === id) {
      if (matchedRef.current.includes(id)) return;
      matchedRef.current = [...matchedRef.current, id];
      setMatched([...matchedRef.current]);
      setScore(s => s + 100);
      setMessage('مُمْتَازٌ! Padanan betul! +100 ⭐');
      if (matchedRef.current.length === pairs.length) {
        activeRef.current = false;
        setTimeout(() => setStage('done'), 650);
      }
    } else {
      livesRef.current = Math.max(0, livesRef.current - 1);
      setLives(livesRef.current);
      setMessage('Padanan belum tepat. Cuba lagi!');
      if (livesRef.current === 0) {
        activeRef.current = false;
        setTimeout(() => setStage('done'), 650);
      }
    }
  };

  useEffect(() => {
    if (stage !== 'playing') return;
    let camera, hands, cancelled = false;
    const setup = async () => {
      if (!window.Hands || !window.Camera) {
        setCameraStatus('MediaPipe tidak dimuatkan. Sila refresh halaman.'); return;
      }
      try {
        hands = new window.Hands({locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
        hands.setOptions({maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.65, minTrackingConfidence: 0.6});
        hands.onResults(results => {
          if (cancelled) return;
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
          const lm = results.multiHandLandmarks?.[0];
          if (!lm) { setCursor(null); setCameraStatus('Tunjukkan tangan kepada kamera'); pinchRef.current = false; return; }
          setCameraStatus('Tangan dikesan');
          if (ctx) {
            ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 3;
            for (const [a,b] of CONNECTIONS) {
              ctx.beginPath(); ctx.moveTo(lm[a].x*canvas.width, lm[a].y*canvas.height);
              ctx.lineTo(lm[b].x*canvas.width, lm[b].y*canvas.height); ctx.stroke();
            }
          }
          const x = Math.max(0, Math.min(100, (1 - lm[8].x)*100));
          const y = Math.max(0, Math.min(100, lm[8].y*100));
          const pinch = Math.hypot(lm[8].x-lm[4].x, lm[8].y-lm[4].y) < 0.065;
          positionRef.current = {x,y};
          setCursor({x,y,pinch});
          const now = Date.now();
          if (pinch && !pinchRef.current && heldRef.current === null && now - lastActionRef.current > 500 && activeRef.current) {
            const rect = arenaRef.current?.getBoundingClientRect();
            if (rect) {
              const px = rect.left + x*rect.width/100;
              const py = rect.top + y*rect.height/100;
              const id = cards.find(cid => {
                if (matchedRef.current.includes(cid)) return false;
                const r = sourceRefs.current[cid]?.getBoundingClientRect();
                return r && px >= r.left && px <= r.right && py >= r.top && py <= r.bottom;
              });
              if (id !== undefined) { heldRef.current = id; setHeld(id); setMessage('Teruskan cubitan, seret kad ke kotak padanan.'); }
            }
          }
          if (!pinch && pinchRef.current && heldRef.current !== null && activeRef.current) {
            const id = heldRef.current;
            heldRef.current = null; setHeld(null); lastActionRef.current = now;
            finishDrop(id, x, y);
          }
          pinchRef.current = pinch;
        });
        camera = new window.Camera(videoRef.current, {
          onFrame: async () => { if (!cancelled && hands && videoRef.current) await hands.send({image: videoRef.current}); },
          width: 640, height: 480
        });
        await camera.start();
        if (!cancelled) setCameraStatus('Kamera aktif — tunjukkan tangan');
      } catch (err) { if (!cancelled) setCameraStatus('Ralat kamera: ' + (err?.message || 'Tidak diketahui')); }
    };
    setup();
    return () => { cancelled = true; activeRef.current = false; camera?.stop(); Promise.resolve(hands?.close()).catch(() => {}); };
  }, [stage, cards]);

  const back = () => {
    activeRef.current = false;
    if (onBack) onBack(); else setStage('menu');
  };

  return <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6" dir="ltr">
    <div className="max-w-6xl mx-auto">
      <header className="flex justify-between items-center gap-3 mb-6">
        <div><h1 className="text-2xl font-black text-amber-300">طَابِقْ وَارْبَحْ</h1><p className="text-slate-400">Arabic Gesture Quest 2.0 · Match & Win</p></div>
        <button onClick={back} className="bg-slate-800 rounded-xl px-4 py-2 flex items-center gap-2"><ArrowLeft size={18}/> Kembali</button>
      </header>
      {stage === 'menu' && <section className="max-w-3xl mx-auto text-center bg-slate-900 rounded-3xl p-6 sm:p-10">
        <div className="text-6xl mb-4">🤏 🎯 📚</div><h2 className="text-3xl font-black mb-3">Match & Win</h2>
        <p className="text-slate-300 mb-6">Padankan tiga kad Bahasa Arab dengan gambar atau maksud yang betul. Cubit, seret dan lepaskan menggunakan tangan!</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">{[1,2,3,4,5,6].map(n => <button key={n} onClick={() => setYear(n)} className={`rounded-xl border p-4 font-bold ${year === n ? 'bg-amber-400 text-slate-950 border-amber-200' : 'bg-slate-800 border-slate-600'}`}>Tahun {n}</button>)}</div>
        <button onClick={start} className="bg-emerald-400 text-slate-950 font-black px-8 py-4 rounded-2xl text-xl"><Camera className="inline mr-2"/> Mula Tahun {year}</button>
      </section>}
      {stage === 'playing' && <>
        <div className="grid grid-cols-3 gap-3 mb-4 text-center">
          <div className="bg-slate-900 rounded-xl p-3"><Star className="inline text-amber-300"/> {score} markah</div>
          <div className="bg-slate-900 rounded-xl p-3"><Heart className="inline text-rose-400"/> {'❤️'.repeat(lives) || '0'} nyawa</div>
          <div className="bg-slate-900 rounded-xl p-3">{matched.length}/{pairs.length} padanan</div>
        </div>
        <div ref={arenaRef} className="relative aspect-[4/5] sm:aspect-video min-h-[440px] bg-slate-900 border-2 border-slate-700 rounded-3xl overflow-hidden">
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover -scale-x-100"/>
          <canvas ref={canvasRef} width={640} height={480} className="absolute inset-0 w-full h-full object-cover -scale-x-100 pointer-events-none opacity-60"/>
          <div className="absolute inset-0 bg-slate-950/45 pointer-events-none"/>
          <div className="absolute top-2 left-2 right-2 bg-slate-950/85 rounded-lg p-2 text-center text-sm z-10">{message}</div>
          <div className="absolute top-[17%] bottom-[12%] left-2 right-2 grid grid-cols-2 gap-3" dir="rtl">
            <div className="grid grid-rows-3 gap-3 min-h-0">{cards.map(id => <div key={id} ref={el => {sourceRefs.current[id] = el;}} className={`flex items-center justify-center text-center rounded-xl border-2 p-2 text-sm sm:text-xl font-bold break-words ${matched.includes(id) ? 'bg-emerald-900/85 border-emerald-300 opacity-50' : held === id ? 'bg-amber-400 text-slate-950 border-white' : 'bg-slate-950/90 border-cyan-300'}`}>{matched.includes(id) ? '✓ ' : ''}{pairs[id].arabic}</div>)}</div>
            <div className="grid grid-rows-3 gap-3 min-h-0">{targets.map(id => <div key={id} ref={el => {targetRefs.current[id] = el;}} className={`flex flex-col items-center justify-center text-center rounded-xl border-2 p-2 ${matched.includes(id) ? 'bg-emerald-700/90 border-emerald-300' : 'bg-slate-950/90 border-amber-300'}`}><span className="text-xl sm:text-3xl">{pairs[id].emoji}</span><span className="text-xs sm:text-base font-bold">{pairs[id].malay}</span></div>)}</div>
          </div>
          {held !== null && cursor && <div className="absolute z-30 pointer-events-none -translate-x-1/2 -translate-y-[130%] bg-amber-400 text-slate-950 font-bold text-sm rounded-lg px-3 py-2 max-w-[45%] text-center" style={{left:`${cursor.x}%`,top:`${cursor.y}%`}} dir="rtl">{pairs[held].arabic}</div>}
          {cursor && <div className={`absolute z-40 w-7 h-7 border-4 border-white rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 ${cursor.pinch ? 'bg-amber-400' : 'bg-cyan-400'}`} style={{left:`${cursor.x}%`,top:`${cursor.y}%`}}/>}
          <div className="absolute bottom-2 left-2 right-2 bg-slate-950/85 rounded-lg p-2 text-xs text-center">{cameraStatus}</div>
        </div>
        <p className="text-slate-400 text-sm mt-3 text-center">☝️ Halakan jari · 🤏 Cubit kad Arab · ↔️ Seret · ✋ Lepaskan pada padanan</p>
        <div className="mt-3 text-center"><button onClick={() => { if (heldRef.current !== null) { finishDrop(heldRef.current, positionRef.current.x, positionRef.current.y); heldRef.current = null; setHeld(null); } }} className="bg-slate-800 rounded-lg px-4 py-2 text-sm">Alternatif: Lepaskan kad secara manual</button></div>
      </>}
      {stage === 'done' && <section className="max-w-xl mx-auto text-center bg-slate-900 rounded-3xl p-10"><Trophy size={70} className="text-amber-400 mx-auto mb-4"/><h2 className="text-3xl font-black">{matched.length === pairs.length ? 'مُمْتَازٌ! Tahniah!' : 'Cubaan tamat!'}</h2><p className="text-slate-300 mt-3">{matched.length} daripada {pairs.length} padanan tepat</p><p className="text-5xl font-black text-emerald-400 my-6">{score} mata</p><button onClick={start} className="bg-emerald-400 text-slate-950 rounded-xl px-6 py-3 font-bold"><RotateCcw className="inline mr-2"/> Main semula</button><button onClick={back} className="ml-3 bg-slate-700 rounded-xl px-6 py-3">Menu</button></section>}
    </div>
  </div>;
}
