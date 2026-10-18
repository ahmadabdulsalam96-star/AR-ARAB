import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Sparkles, RefreshCw, Volume2, VolumeX, Camera, 
  CheckCircle2, Award, Play, AlertCircle
} from 'lucide-react';

const GAME_LEVELS = [
  { id: 1, letter: 'أ', name: 'ألف', word: 'أَسَد', emoji: '🦁', gestureName: 'كف مفتوح (✋)', gestureKey: 'OPEN_PALM' },
  { id: 2, letter: 'ب', name: 'باء', word: 'بَطَّة', emoji: '🦆', gestureName: 'علامة النصر (✌️)', gestureKey: 'PEACE' },
  { id: 3, letter: 'ت', name: 'تاء', word: 'تُفَّاحَة', emoji: '🍎', gestureName: 'قبضة يد (✊)', gestureKey: 'FIST' },
  { id: 4, letter: 'ج', name: 'جمل', word: 'جَمَل', emoji: '🐪', gestureName: 'إبهام لأعلى (👍)', gestureKey: 'THUMBS_UP' },
  { id: 5, letter: 'س', name: 'سين', word: 'سَمَكَة', emoji: '🐟', gestureName: 'قرص الأصابع (🤌)', gestureKey: 'PINCH' },
];

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [detectedGesture, setDetectedGesture] = useState('جاري التعرف...');
  const [matchSuccess, setMatchSuccess] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);

  const currentLevel = GAME_LEVELS[currentLevelIdx];

  const playSound = (type) => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'level') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.log('Audio playback error:', e);
    }
  };

  useEffect(() => {
    if (!gameStarted) return;

    let camera = null;
    let hands = null;

    if (window.Hands && videoRef.current) {
      hands = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6
      });

      hands.onResults(onHandResults);

      if (window.Camera && videoRef.current) {
        camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && hands) {
              await hands.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480
        });
        camera.start();
        setCameraActive(true);
      }
    }

    return () => {
      if (camera) camera.stop();
      if (hands) hands.close();
      setCameraActive(false);
    };
  }, [gameStarted, currentLevelIdx]);

  const onHandResults = (results) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];

      drawHandSkeleton(ctx, landmarks, canvas.width, canvas.height);

      const gesture = analyzeGesture(landmarks);
      setDetectedGesture(gesture.nameArabic);

      if (gesture.key === currentLevel.gestureKey && !matchSuccess) {
        handleMatchSuccess(landmarks, canvas.width, canvas.height);
      }
    } else {
      setDetectedGesture('لم يتم اكتشاف يد');
    }

    updateAndDrawParticles(ctx);
    ctx.restore();
  };

  const analyzeGesture = (lm) => {
    const thumbTip = lm[4], indexTip = lm[8];

    const isFingerUp = (tipIdx, pipIdx) => lm[tipIdx].y < lm[pipIdx].y;

    const indexUp = isFingerUp(8, 6);
    const middleUp = isFingerUp(12, 10);
    const ringUp = isFingerUp(16, 14);
    const pinkyUp = isFingerUp(20, 18);
    const thumbUp = lm[4].y < lm[3].y && lm[4].y < lm[2].y;

    const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);

    if (pinchDist < 0.08) {
      return { key: 'PINCH', nameArabic: 'قرص الأصابع (🤌)' };
    } else if (indexUp && middleUp && !ringUp && !pinkyUp) {
      return { key: 'PEACE', nameArabic: 'علامة النصر (✌️)' };
    } else if (thumbUp && !indexUp && !middleUp && !ringUp && !pinkyUp) {
      return { key: 'THUMBS_UP', nameArabic: 'إبهام لأعلى (👍)' };
    } else if (!indexUp && !middleUp && !ringUp && !pinkyUp) {
      return { key: 'FIST', nameArabic: 'قبضة يد (✊)' };
    } else if (indexUp && middleUp && ringUp && pinkyUp) {
      return { key: 'OPEN_PALM', nameArabic: 'كف مفتوح (✋)' };
    }

    return { key: 'UNKNOWN', nameArabic: 'تحرك كف يدك بوضوح' };
  };

  const handleMatchSuccess = (landmarks, width, height) => {
    setMatchSuccess(true);
    playSound('success');
    setScore((prev) => prev + 100);
    setStreak((prev) => prev + 1);

    const palmX = landmarks[9].x * width;
    const palmY = landmarks[9].y * height;
    
    for (let i = 0; i < 40; i++) {
      particlesRef.current.push({
        x: palmX,
        y: palmY,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        color: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'][Math.floor(Math.random() * 5)],
        radius: Math.random() * 6 + 3,
        life: 1.0
      });
    }

    setTimeout(() => {
      setMatchSuccess(false);
      setCurrentLevelIdx((prev) => (prev + 1) % GAME_LEVELS.length);
      playSound('level');
    }, 1800);
  };

  const drawHandSkeleton = (ctx, landmarks, width, height) => {
    const CONNECTIONS = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [5,9],[9,10],[10,11],[11,12],
      [9,13],[13,14],[14,15],[15,16],
      [13,17],[17,18],[18,19],[19,20],[0,17]
    ];

    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 10;

    CONNECTIONS.forEach(([i, j]) => {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      ctx.beginPath();
      ctx.moveTo(p1.x * width, p1.y * height);
      ctx.lineTo(p2.x * width, p2.y * height);
      ctx.stroke();
    });

    landmarks.forEach((pt, index) => {
      ctx.beginPath();
      ctx.arc(pt.x * width, pt.y * height, index === 8 || index === 4 ? 8 : 5, 0, 2 * Math.PI);
      ctx.fillStyle = index === 8 || index === 4 ? '#FF007A' : '#FFFFFF';
      ctx.fill();
    });
    ctx.shadowBlur = 0;
  };

  const updateAndDrawParticles = (ctx) => {
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);
    particlesRef.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0, p.radius * p.life), 0, 2 * Math.PI);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans" dir="rtl">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Sparkles className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                عالم العربية بالواقع المعزز (AR)
              </h1>
              <p className="text-xs text-slate-400">Arabic AR Gesture Quest</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              title={soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت'}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5 text-rose-400" />}
            </button>
            <button
              onClick={() => {
                setScore(0);
                setStreak(0);
                setCurrentLevelIdx(0);
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center gap-2 text-xs font-medium"
            >
              <RefreshCw className="w-4 h-4" /> إعادة اللعب
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                width={640}
                height={480}
                className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 z-10 pointer-events-none"
              />

              {!gameStarted && (
                <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center mb-6 shadow-xl shadow-amber-500/20 animate-bounce">
                    <Camera className="w-10 h-10 text-slate-950" />
                  </div>
                  <h2 className="text-3xl font-extrabold mb-3 bg-gradient-to-r from-amber-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                    مرحباً بك في عالم الحروف بالواقع المعزز
                  </h2>
                  <p className="text-slate-300 max-w-md mb-8 leading-relaxed text-sm">
                    قم بإيماءات يدك أمام الكاميرا للتفاعل مع الكلمات العربية واكتساب النقاط مع الذكاء الاصطناعي!
                  </p>
                  <button
                    onClick={() => setGameStarted(true)}
                    className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-bold text-lg shadow-xl shadow-amber-500/25 transition transform hover:scale-105 active:scale-95 flex items-center gap-3"
                  >
                    <Play className="w-6 h-6 fill-current" /> تشغيل الكاميرا واللعبة الآن
                  </button>
                </div>
              )}

              {gameStarted && (
                <>
                  <div className="absolute top-4 right-4 left-4 z-20 flex items-center justify-between pointer-events-none">
                    <div className="bg-slate-900/80 backdrop-blur border border-slate-700/60 rounded-2xl p-3 flex items-center gap-3 shadow-lg">
                      <span className="text-3xl">{currentLevel.emoji}</span>
                      <div>
                        <div className="text-xs text-amber-400 font-bold">الحرف والكلمة المطلوبة</div>
                        <div className="text-xl font-black text-white">{currentLevel.letter} - {currentLevel.word}</div>
                      </div>
                    </div>

                    <div className="bg-slate-900/80 backdrop-blur border border-slate-700/60 rounded-2xl px-4 py-2 flex items-center gap-4 shadow-lg">
                      <div className="text-center">
                        <div className="text-xs text-slate-400">النقاط</div>
                        <div className="text-lg font-bold text-emerald-400">{score}</div>
                      </div>
                      <div className="w-px h-8 bg-slate-700" />
                      <div className="text-center">
                        <div className="text-xs text-slate-400">السلسلة</div>
                        <div className="text-lg font-bold text-cyan-400">🔥 {streak}</div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-4 right-4 z-20 bg-slate-900/85 backdrop-blur border border-amber-500/40 rounded-2xl p-4 max-w-xs shadow-xl">
                    <div className="text-xs text-amber-400 font-semibold mb-1">الحركة المطلوبة للحل:</div>
                    <div className="text-lg font-bold text-white mb-2">{currentLevel.gestureName}</div>
                    <div className="text-xs text-slate-300 flex items-center gap-2 border-t border-slate-800 pt-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>تم اكتشاف: <strong className="text-cyan-300">{detectedGesture}</strong></span>
                    </div>
                  </div>

                  {matchSuccess && (
                    <div className="absolute inset-0 z-30 bg-emerald-950/60 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
                      <div className="bg-emerald-500 text-slate-950 p-4 rounded-full mb-4 shadow-2xl animate-bounce">
                        <CheckCircle2 className="w-16 h-16" />
                      </div>
                      <h3 className="text-4xl font-black text-white mb-2">ممتاز! إجابة صحيحة</h3>
                      <p className="text-emerald-200 font-bold text-lg">+100 نقطة ⭐</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col gap-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Award className="w-5 h-5 text-amber-400" /> مراحل اللعبة
              </h3>

              <div className="flex flex-col gap-2">
                {GAME_LEVELS.map((lvl, index) => {
                  const isCurrent = index === currentLevelIdx;
                  return (
                    <div
                      key={lvl.id}
                      className={`p-3.5 rounded-2xl border transition flex items-center justify-between ${
                        isCurrent
                          ? 'bg-amber-500/10 border-amber-500/50 text-amber-300'
                          : 'bg-slate-950/40 border-slate-800/80 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{lvl.emoji}</span>
                        <div>
                          <div className="font-bold text-sm text-white">{lvl.letter} - {lvl.word}</div>
                          <div className="text-xs opacity-80">{lvl.gestureName}</div>
                        </div>
                      </div>
                      {isCurrent && <span className="text-xs bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-bold">الحالي</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}