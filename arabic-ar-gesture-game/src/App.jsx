import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, CheckCircle2, Clock3, Hand, Heart, Home, Play, RotateCcw, Star, Trophy, Volume2, VolumeX } from 'lucide-react';

// Arabic Gesture Quest 2.0 — Word Catcher, Years 1–6.
// Works with the existing Vite/React project and the MediaPipe scripts in index.html.
const BANK = {
  1: [
    ['🍎', 'Epal', 'تُفَّاحَة', ['مَوْز', 'قَلَم', 'بَاب']],
    ['🦁', 'Singa', 'أَسَد', ['قِطّ', 'بَقَرَة', 'جَمَل']],
    ['📖', 'Buku', 'كِتَاب', ['كُرْسِيّ', 'بَيْت', 'قَلَم']],
    ['🐟', 'Ikan', 'سَمَكَة', ['أَسَد', 'بَطَّة', 'حِصَان']],
    ['🚪', 'Pintu', 'بَاب', ['كِتَاب', 'مَاء', 'وَرْدَة']],
    ['✏️', 'Pensel', 'قَلَم', ['مِمْحَاة', 'حَقِيبَة', 'مَكْتَب']]
  ],
  2: [
    ['🔴', 'Merah', 'أَحْمَر', ['أَزْرَق', 'أَخْضَر', 'أَصْفَر']],
    ['☀️', 'Matahari', 'شَمْس', ['قَمَر', 'نَجْم', 'مَطَر']],
    ['🚌', 'Bas', 'حَافِلَة', ['سَيَّارَة', 'دَرَّاجَة', 'قِطَار']],
    ['🥛', 'Susu', 'حَلِيب', ['مَاء', 'عَصِير', 'خُبْز']],
    ['👟', 'Kasut', 'حِذَاء', ['قَمِيص', 'سِرْوَال', 'قُبَّعَة']],
    ['🏫', 'Sekolah', 'مَدْرَسَة', ['مَسْجِد', 'مَكْتَبَة', 'سُوق']]
  ],
  3: [
    ['📚', 'Membaca', 'يَقْرَأُ', ['يَكْتُبُ', 'يَشْرَبُ', 'يَنَامُ']],
    ['✍️', 'Menulis', 'يَكْتُبُ', ['يَلْعَبُ', 'يَأْكُلُ', 'يَجْلِسُ']],
    ['💧', 'Minum', 'يَشْرَبُ', ['يَجْرِي', 'يَقْرَأُ', 'يَفْتَحُ']],
    ['😴', 'Tidur', 'يَنَامُ', ['يَسْمَعُ', 'يَكْتُبُ', 'يَقُومُ']],
    ['⚽', 'Bermain', 'يَلْعَبُ', ['يَأْكُلُ', 'يَذْهَبُ', 'يَغْسِلُ']],
    ['🍽️', 'Makan', 'يَأْكُلُ', ['يَشْرَبُ', 'يَكْتُبُ', 'يَقْرَأُ']]
  ],
  4: [
    ['👦📖', 'Budak lelaki sedang membaca', 'الْوَلَدُ يَقْرَأُ', ['الْوَلَدُ يَنَامُ', 'الْبِنْتُ تَكْتُبُ', 'الْوَلَدُ يَجْرِي']],
    ['👧✍️', 'Budak perempuan sedang menulis', 'الْبِنْتُ تَكْتُبُ', ['الْبِنْتُ تَلْعَبُ', 'الْوَلَدُ يَكْتُبُ', 'الْبِنْتُ تَنَامُ']],
    ['🏠', 'Rumah itu besar', 'الْبَيْتُ كَبِيرٌ', ['الْبَيْتُ صَغِيرٌ', 'الْبَابُ مَفْتُوحٌ', 'الْقَلَمُ جَدِيدٌ']],
    ['📚', 'Buku itu baharu', 'الْكِتَابُ جَدِيدٌ', ['الْكِتَابُ قَدِيمٌ', 'الْقَلَمُ جَدِيدٌ', 'الْبَيْتُ جَمِيلٌ']],
    ['👨‍🏫', 'Guru itu berdiri', 'الْمُعَلِّمُ وَاقِفٌ', ['الْمُعَلِّمُ جَالِسٌ', 'الطَّالِبُ وَاقِفٌ', 'الْمُعَلِّمُ نَائِمٌ']],
    ['🌷', 'Bunga itu cantik', 'الزَّهْرَةُ جَمِيلَةٌ', ['الزَّهْرَةُ صَغِيرَةٌ', 'الْحَدِيقَةُ كَبِيرَةٌ', 'الشَّجَرَةُ طَوِيلَةٌ']]
  ],
  5: [
    ['🏫', 'Ahmad pergi ke sekolah', 'يَذْهَبُ أَحْمَدُ إِلَى الْمَدْرَسَةِ', ['يَذْهَبُ أَحْمَدُ إِلَى السُّوقِ', 'تَذْهَبُ فَاطِمَةُ إِلَى الْمَدْرَسَةِ', 'يَرْجِعُ أَحْمَدُ مِنَ الْمَدْرَسَةِ']],
    ['🥛', 'Fatimah minum susu', 'تَشْرَبُ فَاطِمَةُ الْحَلِيبَ', ['تَأْكُلُ فَاطِمَةُ الْخُبْزَ', 'يَشْرَبُ أَحْمَدُ الْمَاءَ', 'تَشْرَبُ فَاطِمَةُ الْمَاءَ']],
    ['📖', 'Ali membaca buku di kelas', 'يَقْرَأُ عَلِيٌّ الْكِتَابَ فِي الْفَصْلِ', ['يَكْتُبُ عَلِيٌّ فِي الْفَصْلِ', 'يَقْرَأُ عَلِيٌّ فِي الْبَيْتِ', 'يَفْتَحُ عَلِيٌّ الْبَابَ']],
    ['🌳', 'Kanak-kanak bermain di taman', 'يَلْعَبُ الْأَطْفَالُ فِي الْحَدِيقَةِ', ['يَدْرُسُ الْأَطْفَالُ فِي الْفَصْلِ', 'يَلْعَبُ الْأَطْفَالُ فِي الْبَيْتِ', 'يَنَامُ الْأَطْفَالُ فِي الْغُرْفَةِ']],
    ['🕌', 'Ayah bersolat di masjid', 'يُصَلِّي الْأَبُ فِي الْمَسْجِدِ', ['يُصَلِّي الْأَبُ فِي الْبَيْتِ', 'يَقْرَأُ الْأَبُ فِي الْمَسْجِدِ', 'يَذْهَبُ الْأَبُ إِلَى السُّوقِ']],
    ['🍚', 'Ibu memasak makanan di dapur', 'تَطْبُخُ الْأُمُّ الطَّعَامَ فِي الْمَطْبَخِ', ['تَأْكُلُ الْأُمُّ الطَّعَامَ', 'تَطْبُخُ الْبِنْتُ فِي الْمَطْبَخِ', 'تَغْسِلُ الْأُمُّ الْمَلَابِسَ']]
  ],
  6: [
    ['📚', 'Pilih ayat: Para murid sedang membaca buku di perpustakaan', 'يَقْرَأُ التَّلَامِيذُ الْكُتُبَ فِي الْمَكْتَبَةِ', ['يَكْتُبُ التَّلَامِيذُ فِي الْفَصْلِ', 'يَقْرَأُ الْمُعَلِّمُ الْكِتَابَ', 'يَلْعَبُ التَّلَامِيذُ فِي الْمَلْعَبِ']],
    ['🏫', 'Pilih ayat: Guru perempuan menerangkan pelajaran kepada murid-murid', 'تَشْرَحُ الْمُعَلِّمَةُ الدَّرْسَ لِلتَّلَامِيذِ', ['يَشْرَحُ الْمُعَلِّمُ الدَّرْسَ', 'تَكْتُبُ الْمُعَلِّمَةُ الْوَاجِبَ', 'يَسْمَعُ التَّلَامِيذُ الدَّرْسَ']],
    ['🕌', 'Pilih ayat: Kami menunaikan solat berjemaah di masjid', 'نُصَلِّي جَمَاعَةً فِي الْمَسْجِدِ', ['نَقْرَأُ الْقُرْآنَ فِي الْفَصْلِ', 'أُصَلِّي فِي الْبَيْتِ', 'يُصَلِّي الْإِمَامُ وَحْدَهُ']],
    ['🚌', 'Pilih ayat: Kami pergi ke sekolah dengan bas pada waktu pagi', 'نَذْهَبُ إِلَى الْمَدْرَسَةِ بِالْحَافِلَةِ صَبَاحًا', ['نَذْهَبُ إِلَى السُّوقِ بِالسَّيَّارَةِ', 'نَرْجِعُ مِنَ الْمَدْرَسَةِ مَسَاءً', 'أَذْهَبُ إِلَى الْمَدْرَسَةِ مَشْيًا']],
    ['✍️', 'Pilih ayat: Ahmad menulis kerja sekolah selepas makan', 'يَكْتُبُ أَحْمَدُ الْوَاجِبَ بَعْدَ الطَّعَامِ', ['يَكْتُبُ أَحْمَدُ قَبْلَ الطَّعَامِ', 'يَقْرَأُ أَحْمَدُ الْكِتَابَ بَعْدَ الصَّلَاةِ', 'تَكْتُبُ فَاطِمَةُ الْوَاجِبَ']],
    ['🌅', 'Pilih ayat: Saya bangun awal untuk menunaikan solat Subuh', 'أَسْتَيْقِظُ مُبَكِّرًا لِأُصَلِّيَ الصُّبْحَ', ['أَنَامُ مُبَكِّرًا بَعْدَ الصُّبْحِ', 'أَذْهَبُ إِلَى الْمَدْرَسَةِ مَسَاءً', 'أَلْعَبُ بَعْدَ صَلَاةِ الْعِشَاءِ']]
  ]
};
const LIMIT = {1:90, 2:80, 3:70, 4:60, 5:55, 6:50};
const CONNECTIONS = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
const arrange = (entry, seed) => {
  const values = [entry[2], ...entry[3].slice(0, seed < 3 ? (seed === 1 ? 1 : 2) : 3)];
  // Rotate rather than shuffle randomly to make each question's positions reproducible.
  const offset = seed % values.length;
  return [...values.slice(offset), ...values.slice(0, offset)];
};
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ar-SA'; utterance.rate = 0.78;
  window.speechSynthesis.speak(utterance);
}
export default function App() {
  const [year, setYear] = useState(1);
  const [stage, setStage] = useState('menu');
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [seconds, setSeconds] = useState(LIMIT[1]);
  const [selected, setSelected] = useState(null);
  const [sound, setSound] = useState(true);
  const [cameraMessage, setCameraMessage] = useState('Memulakan kamera...');
  const [handVisible, setHandVisible] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hint, setHint] = useState(false);
  const videoRef = useRef(null), canvasRef = useRef(null), arenaRef = useRef(null);
  const optionsRef = useRef([]), selectionRef = useRef(null), pinchedRef = useRef(false), lastPickRef = useRef(0);
  const bank = BANK[year];
  const item = bank[Math.min(index, bank.length - 1)];
  const choices = useMemo(() => arrange(item, index + year), [item, index, year]);
  const playing = stage === 'playing';

  const begin = () => {
    setIndex(0); setScore(0); setLives(3); setSeconds(LIMIT[year]);
    setSelected(null); setHint(false); setStage('playing');
  };
  const pick = (choice) => {
    if (selectionRef.current !== null || !choice) return;
    const correct = choice === item[2];
    selectionRef.current = choice;
    setSelected({ choice, correct });
    if (correct) {
      setScore(s => s + 100 + Math.min(50, Math.floor(seconds / 2)));
      if (sound) speak(item[2]);
    } else setLives(l => Math.max(0, l - 1));
  };
  useEffect(() => { selectionRef.current = null; setSelected(null); setHint(false); pinchedRef.current = false; }, [index, year, stage]);
  useEffect(() => {
    if (!playing || !selected) return;
    const t = setTimeout(() => {
      if (index === bank.length - 1 || (selected && !selected.correct && lives <= 0)) setStage('done');
      else { setIndex(i => i + 1); setSeconds(LIMIT[year]); }
    }, 1250);
    return () => clearTimeout(t);
  }, [selected, playing, index, bank.length, lives, year]);
  useEffect(() => {
    if (!playing || selected) return;
    const timer = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [playing, selected, index]);
  useEffect(() => {
    if (playing && seconds === 0 && !selected) pick('__TIMEOUT__');
  }, [seconds, playing, selected]);

  useEffect(() => {
    if (!playing) return;
    let camera, hands, cancelled = false;
    const setup = async () => {
      if (!window.Hands || !window.Camera || !videoRef.current) {
        setCameraMessage('MediaPipe belum dimuatkan. Muat semula halaman.'); return;
      }
      try {
        hands = new window.Hands({ locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
        hands.setOptions({maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.65, minTrackingConfidence: 0.6});
        hands.onResults(results => {
          if (cancelled) return;
          const landmarks = results.multiHandLandmarks?.[0];
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          if (!landmarks) { setHandVisible(false); setCursor(null); pinchedRef.current = false; return; }
          setHandVisible(true); setCameraMessage('Tangan dikesan');
          ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 3;
          for (const [a,b] of CONNECTIONS) {
            ctx.beginPath(); ctx.moveTo(landmarks[a].x * canvas.width, landmarks[a].y * canvas.height);
            ctx.lineTo(landmarks[b].x * canvas.width, landmarks[b].y * canvas.height); ctx.stroke();
          }
          const tip = landmarks[8], thumb = landmarks[4];
          const x = (1 - tip.x) * 100, y = tip.y * 100;
          const distance = Math.hypot(tip.x - thumb.x, tip.y - thumb.y);
          const pinch = distance < 0.065;
          setCursor({x, y, pinch});
          if (pinch && !pinchedRef.current && Date.now() - lastPickRef.current > 700 && selectionRef.current === null) {
            const arena = arenaRef.current;
            if (arena) {
              const rect = arena.getBoundingClientRect();
              const px = rect.left + (x / 100) * rect.width;
              const py = rect.top + (y / 100) * rect.height;
              const chosen = optionsRef.current.find(el => {
                if (!el) return false;
                const r = el.getBoundingClientRect();
                return px >= r.left && px <= r.right && py >= r.top && py <= r.bottom;
              });
              if (chosen) { lastPickRef.current = Date.now(); chosen.click(); }
            }
          }
          pinchedRef.current = pinch;
        });
        camera = new window.Camera(videoRef.current, {
          onFrame: async () => { if (!cancelled && hands && videoRef.current) await hands.send({image: videoRef.current}); },
          width: 640, height: 480
        });
        await camera.start();
        if (!cancelled) setCameraMessage('Kamera aktif — halakan tangan ke kamera');
      } catch (err) { if (!cancelled) setCameraMessage('Kamera/MediaPipe gagal: ' + (err?.message || 'ralat tidak diketahui')); }
    };
    setup();
    return () => { cancelled = true; camera?.stop(); Promise.resolve(hands?.close()).catch(() => {}); };
  }, [playing]);

  const returnHome = () => { setStage('menu'); setCursor(null); setHandVisible(false); };
  return (
    <div className="min-h-screen bg-slate-950 text-white" dir="ltr">
      <header className="border-b border-slate-800 bg-slate-900/90 px-4 py-4">
        <div className="mx-auto max-w-7xl flex flex-wrap justify-between items-center gap-3">
          <div><h1 className="text-xl sm:text-2xl font-extrabold text-amber-300">عَالَمُ الْعَرَبِيَّةِ AR 2.0</h1><p className="text-slate-400 text-sm">Arabic Gesture Quest · صَيْدُ الْكَلِمَاتِ · Word Catcher</p></div>
          <button onClick={returnHome} className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 flex gap-2 items-center"><Home size={18}/> Menu utama</button>
        </div>
      </header>
      {stage === 'menu' && <main className="max-w-5xl mx-auto px-4 py-10 text-center">
        <div className="text-6xl mb-4">🎮 🤏 📚</div><h2 className="text-3xl font-black mb-3">Word Catcher — Tangkap Perkataan</h2>
        <p className="text-slate-300 mb-8">Baca maksud atau lihat gambar. Gerakkan jari telunjuk ke jawapan Arab yang betul, kemudian cubit ibu jari dan telunjuk untuk memilih.</p>
        <h3 className="text-lg font-bold mb-4">Pilih tahun persekolahan</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          {[1,2,3,4,5,6].map(n => <button key={n} onClick={() => setYear(n)} className={`rounded-2xl border p-5 text-lg font-bold transition ${year === n ? 'bg-amber-500 text-slate-950 border-amber-300' : 'bg-slate-900 border-slate-700 hover:border-amber-400'}`}>Tahun {n}<span className="block text-xs mt-1 font-normal">{n <= 2 ? 'Kosa kata asas' : n === 3 ? 'Kata kerja' : n === 4 ? 'Frasa mudah' : 'Ayat Bahasa Arab'}</span></button>)}
        </div>
        <button onClick={begin} className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 px-8 py-4 rounded-2xl font-black text-xl inline-flex items-center gap-3"><Play/> Mula bermain — Tahun {year}</button>
        <p className="text-slate-400 text-sm mt-5">Alternatif: klik jawapan menggunakan tetikus. 6 soalan setiap tahun · 3 nyawa.</p>
      </main>}
      {playing && <main className="max-w-7xl mx-auto p-3 sm:p-5 grid lg:grid-cols-[minmax(0,1fr)_290px] gap-5">
        <section className="min-w-0">
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="rounded-xl bg-slate-900 p-3 text-center"><Star className="inline text-amber-400" size={18}/> <b>{score}</b><p className="text-xs text-slate-400">Markah</p></div>
            <div className="rounded-xl bg-slate-900 p-3 text-center"><Heart className="inline text-rose-400" size={18}/> <b>{'❤️'.repeat(lives) || '0'}</b><p className="text-xs text-slate-400">Nyawa</p></div>
            <div className="rounded-xl bg-slate-900 p-3 text-center"><Clock3 className="inline text-cyan-400" size={18}/> <b>{seconds}s</b><p className="text-xs text-slate-400">Masa</p></div>
          </div>
          <div ref={arenaRef} className="relative overflow-hidden rounded-3xl border-2 border-slate-700 bg-slate-900 aspect-[4/3] sm:aspect-video">
            <video ref={videoRef} muted playsInline autoPlay className="absolute inset-0 w-full h-full object-cover -scale-x-100"/>
            <canvas ref={canvasRef} width={640} height={480} className="absolute inset-0 w-full h-full object-cover -scale-x-100 pointer-events-none opacity-70"/>
            <div className="absolute inset-0 bg-slate-950/30 pointer-events-none"/>
            <div className="absolute top-3 left-3 right-3 text-center pointer-events-none"><div className="inline-block rounded-2xl bg-slate-950/85 border border-amber-500/40 p-3 max-w-full"><span className="text-3xl">{item[0]}</span><p className="font-black text-lg sm:text-xl">{item[1]}</p><p className="text-xs text-amber-300">Tangkap jawapan Bahasa Arab yang betul</p></div></div>
            <div className="absolute top-[37%] left-3 right-3 grid grid-cols-2 gap-3" dir="rtl">
              {choices.map((choice, i) => <button key={`${index}-${choice}`} ref={el => {optionsRef.current[i] = el;}} onClick={() => pick(choice)} disabled={!!selected} className={`min-h-[70px] sm:min-h-[84px] rounded-2xl border-2 p-2 text-base sm:text-xl font-black shadow-xl backdrop-blur-sm transition break-words ${selected?.choice === choice ? (selected.correct ? 'bg-emerald-500/95 border-emerald-200' : 'bg-rose-500/95 border-rose-200') : selected && choice === item[2] ? 'bg-emerald-600/90 border-emerald-200' : 'bg-slate-950/85 border-cyan-400/60 hover:border-amber-400 hover:bg-slate-800/95'}`}>{choice}</button>)}
            </div>
            {cursor && <div className={`absolute z-30 w-8 h-8 rounded-full border-4 pointer-events-none -translate-x-1/2 -translate-y-1/2 shadow-[0_0_18px_#22d3ee] ${cursor.pinch ? 'bg-amber-400/80 border-white scale-125' : 'bg-cyan-400/60 border-white'}`} style={{left:`${cursor.x}%`,top:`${cursor.y}%`}}/>}
            {selected && <div className="absolute z-40 bottom-14 inset-x-3 flex justify-center pointer-events-none"><div className={`rounded-xl px-5 py-3 font-black text-lg shadow-2xl ${selected.correct ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'}`}>{selected.correct ? 'مُمْتَازٌ! Betul! +100 ⭐' : 'Cuba lagi pada soalan seterusnya'}</div></div>}
            <div className="absolute bottom-2 left-3 right-3 text-xs text-white bg-slate-950/80 rounded-lg px-3 py-2 flex justify-between gap-2"><span>{handVisible ? '🟢 Tangan dikesan' : '⚪ Tunjukkan tangan'}</span><span>{cameraMessage}</span></div>
          </div>
        </section>
        <aside className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
          <div className="flex justify-between items-center"><h3 className="font-black text-amber-300">Tahun {year}</h3><span className="text-sm text-slate-300">Soalan {index+1}/{bank.length}</span></div>
          <div className="w-full h-3 rounded-full bg-slate-700 overflow-hidden"><div className="h-full bg-emerald-400" style={{width:`${((index+1)/bank.length)*100}%`}}/></div>
          <div className="rounded-xl bg-slate-950 p-4"><Hand className="text-cyan-300 mb-2"/><p className="font-bold">Cara bermain</p><p className="text-sm text-slate-300 mt-2">☝️ Halakan telunjuk ke pilihan.</p><p className="text-sm text-slate-300 mt-1">🤏 Cubit ibu jari + telunjuk untuk tangkap.</p><p className="text-sm text-slate-300 mt-1">🖱️ Klik dengan tetikus jika perlu.</p></div>
          <button onClick={() => {setHint(true); if(sound) speak(item[2]);}} className="w-full rounded-xl bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 p-3 text-amber-200 font-bold">💡 Petunjuk / Dengar jawapan</button>
          {hint && <p className="text-sm bg-slate-800 p-3 rounded-xl">Jawapan bermula dengan: <b dir="rtl">{item[2].slice(0,2)}...</b></p>}
          <button onClick={() => setSound(s => !s)} className="w-full rounded-xl bg-slate-800 p-3 flex justify-center gap-2 items-center">{sound ? <Volume2 size={18}/> : <VolumeX size={18}/>} Audio {sound ? 'aktif' : 'dimatikan'}</button>
          <p className="text-xs text-slate-400">Nota: Kosa kata dan ayat ialah bank soalan contoh. Guru boleh menyelaraskan dengan DSKP sekolah.</p>
        </aside>
      </main>}
      {stage === 'done' && <main className="max-w-xl mx-auto text-center p-8 mt-12 rounded-3xl bg-slate-900 border border-slate-700"><Trophy size={72} className="mx-auto text-amber-400 mb-4"/><h2 className="text-3xl font-black mb-2">Tahniah! 🎉</h2><p className="text-slate-300">Word Catcher Tahun {year} tamat.</p><p className="text-5xl font-black text-emerald-400 my-6">{score} <span className="text-xl">mata</span></p><div className="flex flex-wrap justify-center gap-3"><button onClick={begin} className="bg-emerald-400 text-slate-950 font-bold rounded-xl px-5 py-3 flex items-center gap-2"><RotateCcw size={18}/> Main semula</button><button onClick={returnHome} className="bg-slate-700 rounded-xl px-5 py-3">Pilih tahun lain</button></div></main>}
      <footer className="text-center text-slate-500 text-xs p-6">Arabic Gesture Quest AR 2.0 · Word Catcher · Prototype PdPc</footer>
    </div>
  );
}
