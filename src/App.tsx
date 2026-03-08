import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Music, MapPin, Clock, Disc, Star, Send } from 'lucide-react';
import { StarBackground } from './components/StarBackground';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icons
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

type Step = 'landing' | 'nickname' | 'lyrics' | 'redemption' | 'main';

export default function App() {
  const [step, setStep] = useState<Step>(() => {
    const saved = sessionStorage.getItem('app_step');
    return (saved as Step) || 'landing';
  });
  const [user, setUser] = useState<'parik' | 'sarah' | null>(() => {
    return sessionStorage.getItem('app_user') as any;
  });
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [lyric, setLyric] = useState('');
  const [error, setError] = useState('');
  const [isRedeemed, setIsRedeemed] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [stats, setStats] = useState<{ firstVisitDate: string } | null>(null);
  const [addressForm, setAddressForm] = useState({ postalCode: '', block: '', unitNumber: '' });
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mood, setMood] = useState<number | null>(null);
  const [missesSarah, setMissesSarah] = useState<boolean | null>(null);
  const [note, setNote] = useState('');
  const [dayRating, setDayRating] = useState<number>(5);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [noteSubmitted, setNoteSubmitted] = useState(false);
  const [showAngryPopup, setShowAngryPopup] = useState(false);

  useEffect(() => {
    sessionStorage.setItem('app_step', step);
  }, [step]);

  useEffect(() => {
    if (user) sessionStorage.setItem('app_user', user);
    else sessionStorage.removeItem('app_user');
  }, [user]);

  useEffect(() => {
    if (step === 'main' && user === 'parik') {
      fetchStats();
    }
  }, [step, user]);

  useEffect(() => {
    const target = new Date('2026-05-01T00:00:00');
    const timer = setInterval(() => {
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        clearInterval(timer);
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const checkRedemption = async () => {
    try {
      const res = await fetch('/api/address-check?name=Parik');
      const data = await res.json();
      setIsRedeemed(data.exists);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats?name=Parik');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLanding = () => {
    const lowerName = name.toLowerCase().trim();
    if (lowerName === 'parik') {
      setError('');
      setUser('parik');
      setStep('nickname');
    } else if (lowerName === 'sarah') {
      setError('');
      setUser('sarah');
      // Aesthetic delay for Sarah's bypass
      setTimeout(() => setStep('main'), 800);
    } else {
      setError("Sorry… this wasn't meant for you.");
    }
  };

  const handleNickname = () => {
    if (nickname.toLowerCase() === 'the gram') {
      setError('');
      setStep('lyrics');
    } else {
      setError("Hmm… that nickname sounds suspicious.");
    }
  };

  const handleLyric = () => {
    if (lyric.toLowerCase().trim() === 'flights') {
      setError('');
      checkRedemption().then(() => setStep('redemption'));
    } else {
      setError("You might need to revisit your Drake playlist.");
    }
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRedeeming(true);
    try {
      const res = await fetch('/api/address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Parik', ...addressForm }),
      });
      if (res.ok) {
        setIsRedeemed(true);
        setTimeout(() => setStep('main'), 2000);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error. Please try again.');
    } finally {
      setIsRedeeming(false);
    }
  };

  const melbourne: [number, number] = [-37.8136, 144.9631];
  const singapore: [number, number] = [1.3521, 103.8198];

  const customIcon = new L.DivIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #E09F3E; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px #E09F3E;"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });

  return (
    <div className="min-h-screen relative flex flex-col items-center p-4 overflow-x-hidden grid-pattern">
      <StarBackground />
      <div className="grain-texture" />
      <div className="scanline" />

      {/* Top Marquee */}
      <div className="w-full bg-hunyadi-yellow/10 border-y border-hunyadi-yellow/10 py-3 overflow-hidden z-50">
        <div className="marquee-content whitespace-nowrap">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="font-cursive text-xl mx-12 opacity-40 lowercase">
              a digital keepsake, made for parik
            </span>
          ))}
        </div>
      </div>

      {/* Aesthetic Header */}
      <header className="w-full max-w-7xl mx-auto flex justify-between items-center py-8 px-8 z-50 mb-8">
        <div className="flex items-center gap-4 text-hunyadi-yellow/30">
          <Heart size={12} className="fill-current" />
          <span className="text-[10px] tracking-[0.4em] font-black">✧˖*°࿐</span>
        </div>
        
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-3 text-hunyadi-yellow/60">
            <Heart size={16} className="fill-hunyadi-yellow/20" />
          </div>
        </div>

        <div className="flex items-center gap-4 text-hunyadi-yellow/30">
          <span className="text-[10px] tracking-[0.4em] font-black">✧˖*°࿐</span>
          <Heart size={12} className="fill-current" />
        </div>
      </header>

      {/* Floating Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div 
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 5, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] left-[10%] opacity-10"
        >
          <Disc size={120} className="text-hunyadi-yellow" />
        </motion.div>
      </div>

      <main className="flex-grow flex flex-col items-center justify-center w-full relative z-10">
        <AnimatePresence mode="wait">
        {step === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card p-12 w-full max-w-md text-center z-10 border-white/5"
          >
            <h1 className="text-3xl font-retro mb-8 neon-text font-black tracking-tighter">Welcome back.</h1>
            <p className="label-small mb-8">Identity Verification Required</p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-5 mb-8 focus:outline-none focus:border-hunyadi-yellow/20 transition-all text-center text-vanilla placeholder:opacity-10"
              placeholder="Enter Name"
            />
            <button
              onClick={handleLanding}
              className="w-full bg-hunyadi-yellow/5 hover:bg-hunyadi-yellow/10 border border-hunyadi-yellow/10 rounded-2xl p-5 transition-all text-[10px] uppercase tracking-[0.4em] font-black text-hunyadi-yellow"
            >
              Initialize
            </button>
            {error && <p className="mt-8 text-red-400/60 text-[9px] uppercase tracking-widest font-bold">{error}</p>}
          </motion.div>
        )}

        {step === 'nickname' && (
          <motion.div
            key="nickname"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="glass-card p-12 w-full max-w-md text-center z-10 border-white/5"
          >
            <h2 className="text-2xl font-retro mb-8 neon-text font-black tracking-tighter">Secondary Check.</h2>
            <p className="label-small mb-8">What do people also call you?</p>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-5 mb-8 focus:outline-none focus:border-hunyadi-yellow/20 transition-all text-center text-vanilla placeholder:opacity-10"
              placeholder="Nickname"
            />
            <button
              onClick={handleNickname}
              className="w-full bg-hunyadi-yellow/5 hover:bg-hunyadi-yellow/10 border border-hunyadi-yellow/10 rounded-2xl p-5 transition-all text-[10px] uppercase tracking-[0.4em] font-black text-hunyadi-yellow"
            >
              Verify
            </button>
            {error && <p className="mt-8 text-red-400/60 text-[9px] uppercase tracking-widest font-bold">{error}</p>}
          </motion.div>
        )}

        {step === 'lyrics' && (
          <motion.div
            key="lyrics"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="glass-card p-8 w-full max-w-md text-center z-10"
          >
            <h2 className="text-xl font-retro mb-2 neon-text font-bold">Ah… there it is.</h2>
            <div className="h-px bg-hunyadi-yellow/20 w-full my-4" />
            <p className="text-[10px] uppercase tracking-wider opacity-60 mb-2 font-semibold">One Last Thing</p>
            <p className="mb-4 italic text-sm">"Finish the lyric"</p>
            <p className="mb-4 text-base font-medium">"I got my ______ booked."</p>
            <input
              type="text"
              value={lyric}
              onChange={(e) => setLyric(e.target.value)}
              className="w-full bg-dark-slate/50 border border-hunyadi-yellow/30 rounded-xl p-4 mb-4 focus:outline-none focus:border-hunyadi-yellow transition-colors text-center text-vanilla"
              placeholder="..."
            />
            <button
              onClick={handleLyric}
              className="w-full bg-hunyadi-yellow/20 hover:bg-hunyadi-yellow/40 border border-hunyadi-yellow/50 rounded-xl p-4 transition-all neon-text font-medium"
            >
              Unlock Surprise
            </button>
            {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}
          </motion.div>
        )}

        {step === 'redemption' && (
          <motion.div
            key="redemption"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-8 w-full max-w-md text-center z-10"
          >
            {isRedeemed ? (
              <div className="space-y-4">
                <h2 className="text-xl font-retro neon-text font-bold">Hey you.</h2>
                <p className="text-sm opacity-80">Your gift has already been redeemed.</p>
                <p className="text-sm opacity-80">It's already on its way to you.</p>
                <p className="text-sm italic opacity-60">You'll just have to wait and see.</p>
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex justify-center"
                >
                  <Heart className="text-hunyadi-yellow fill-hunyadi-yellow" size={32} />
                </motion.div>
                <button
                  onClick={() => setStep('main')}
                  className="w-full bg-hunyadi-yellow/20 hover:bg-hunyadi-yellow/40 border border-hunyadi-yellow/50 rounded-lg p-3 transition-all neon-text font-medium mt-4"
                >
                  Enter Main Experience
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-xl font-retro neon-text font-bold">You've got a gift waiting.</h2>
                <p className="text-sm opacity-80">Enter your address to redeem it.</p>
                <p className="text-[10px] opacity-40 italic">Don't worry… this isn't a scam. I just need somewhere to send a sweet treat.</p>
                <form onSubmit={handleRedeem} className="space-y-4 text-left">
                  <div>
                    <label className="text-xs uppercase tracking-widest opacity-60 ml-1">Postal Code</label>
                    <input
                      required
                      type="text"
                      value={addressForm.postalCode}
                      onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                      className="w-full bg-dark-slate/50 border border-hunyadi-yellow/30 rounded-3xl p-4 focus:outline-none focus:border-hunyadi-yellow transition-colors text-vanilla"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest opacity-60 ml-1">Block</label>
                    <input
                      required
                      type="text"
                      value={addressForm.block}
                      onChange={(e) => setAddressForm({ ...addressForm, block: e.target.value })}
                      className="w-full bg-dark-slate/50 border border-hunyadi-yellow/30 rounded-3xl p-4 focus:outline-none focus:border-hunyadi-yellow transition-colors text-vanilla"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest opacity-60 ml-1">Unit Number</label>
                    <input
                      required
                      type="text"
                      value={addressForm.unitNumber}
                      onChange={(e) => setAddressForm({ ...addressForm, unitNumber: e.target.value })}
                      className="w-full bg-dark-slate/50 border border-hunyadi-yellow/30 rounded-3xl p-4 focus:outline-none focus:border-hunyadi-yellow transition-colors text-vanilla"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isRedeeming}
                    className="w-full bg-hunyadi-yellow/20 hover:bg-hunyadi-yellow/40 border border-hunyadi-yellow/50 rounded-xl p-4 transition-all neon-text font-medium disabled:opacity-50"
                  >
                    {isRedeeming ? 'Processing...' : 'Redeem Gift'}
                  </button>
                  {error && <p className="mt-2 text-red-400 text-xs text-center">{error}</p>}
                </form>
              </div>
            )}
          </motion.div>
        )}

        {step === 'main' && (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-4xl z-10 space-y-8 pb-20"
          >
            <header className="text-center space-y-4">
              <div className="flex flex-col items-center">
                {stats && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="label-small mt-2"
                  >
                    {(() => {
                      const days = Math.max(1, Math.ceil((new Date().getTime() - new Date(stats.firstVisitDate).getTime()) / (1000 * 60 * 60 * 24)));
                      return `Day ${days} of our digital keepsake`;
                    })()}
                  </motion.p>
                )}
              </div>
              <div className="glass-card px-10 py-8 inline-block border-hunyadi-yellow/10">
                <p className="label-small mb-6">Until I see you again</p>
                <div className="flex gap-6 md:gap-12 justify-center">
                  {[
                    { label: 'Days', value: timeLeft.days },
                    { label: 'Hours', value: timeLeft.hours },
                    { label: 'Mins', value: timeLeft.minutes },
                    { label: 'Secs', value: timeLeft.seconds },
                  ].map((item) => (
                    <div key={item.label} className="text-center">
                      <div className="text-3xl md:text-5xl font-retro neon-text tabular-nums font-black tracking-tighter">
                        {String(item.value).padStart(2, '0')}
                      </div>
                      <div className="label-small mt-2 opacity-20">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </header>

            {/* Map Section */}
            <section className="glass-card p-2 h-[500px] relative overflow-hidden group border-white/5 -mt-4">
              <div className="absolute top-6 left-6 z-[1000]">
                <div className="bg-ink/80 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 text-[9px] uppercase tracking-[0.2em] font-bold flex items-center gap-3 shadow-xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-hunyadi-yellow" />
                  <span className="text-vanilla/70">7,680 km between us</span>
                </div>
              </div>
              
              {/* Radar Effect Overlay */}
              <div className="absolute inset-0 pointer-events-none z-10 opacity-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] border border-hunyadi-yellow/20 rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-hunyadi-yellow/10 rounded-full" />
              </div>

              <MapContainer
                center={[10, 125]}
                zoom={2}
                style={{ height: '100%', width: '100%', background: '#050505' }}
                zoomControl={false}
                attributionControl={false}
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                <Marker position={melbourne} icon={customIcon}>
                  <Popup>Sarah — Melbourne</Popup>
                </Marker>
                <Marker position={singapore} icon={customIcon}>
                  <Popup>Parik — Singapore</Popup>
                </Marker>
                <Polyline
                  positions={[melbourne, singapore]}
                  color="#E09F3E"
                  weight={3}
                  dashArray="10, 20"
                  opacity={0.6}
                />
              </MapContainer>
            </section>

            {/* Music Section */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              <div className="glass-card p-8 flex flex-col items-center justify-center space-y-6 relative overflow-visible">
                
                {/* Daily Suggestion */}
                <motion.a
                  href="https://open.spotify.com/track/5gXD4exv3XSwYh4BFQ0phf?si=a374a49e76154e82"
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-xs bg-gradient-to-r from-hunyadi-yellow/15 to-hunyadi-yellow/5 backdrop-blur-md border border-hunyadi-yellow/30 p-4 rounded-2xl flex items-center gap-4 hover:from-hunyadi-yellow/25 hover:to-hunyadi-yellow/10 transition-all group/song z-10 relative"
                >
                  <div className="w-10 h-10 rounded-xl bg-hunyadi-yellow/20 flex items-center justify-center group-hover/song:scale-110 transition-transform flex-shrink-0">
                    <Music size={16} className="text-hunyadi-yellow" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9px] uppercase tracking-[0.15em] text-hunyadi-yellow font-bold whitespace-nowrap">a song that reminds me of you today</span>
                    <span className="text-[11px] font-semibold text-vanilla/90 leading-tight truncate">
                      Don't Leave — Giveon
                    </span>
                  </div>
                </motion.a>

                <div className="relative w-full flex justify-center">
                  {/* Turntable Base Shadow */}
                  <div className="absolute inset-x-0 top-1/2 w-64 md:w-72 h-32 bg-black/30 blur-3xl rounded-full" />
                  
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="w-56 h-56 md:w-64 md:h-64 rounded-full bg-[#050505] border-[8px] border-zinc-800 flex items-center justify-center relative shadow-[0_0_60px_rgba(224,159,62,0.2)]"
                  >
                    {/* Vinyl Grooves */}
                    {[...Array(14)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute rounded-full border border-white/10"
                        style={{ width: `${35 + i * 4.5}%`, height: `${35 + i * 4.5}%` }}
                      />
                    ))}
                    
                    {/* Center Label - Larger and more visible */}
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-dark-slate border-4 border-hunyadi-yellow/40 flex items-center justify-center z-10 overflow-hidden relative shadow-xl">
                       <img 
                         src="https://i.pinimg.com/736x/85/04/7f/85047f44eeec2740bdea3c388805611d.jpg" 
                         alt="Playlist Cover" 
                         className="w-full h-full object-cover opacity-90"
                         referrerPolicy="no-referrer"
                       />
                       <div className="absolute inset-0 bg-gradient-to-tr from-hunyadi-yellow/20 to-transparent mix-blend-overlay" />
                       <div className="absolute w-3 h-3 rounded-full bg-hunyadi-yellow/50 shadow-lg z-20" />
                    </div>

                    {/* Reflection/Shine */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
                  </motion.div>

                  {/* Tonearm */}
                  <div className="absolute top-12 -right-12 w-32 h-5 bg-gradient-to-r from-zinc-700 to-zinc-800 rounded-full origin-left rotate-[-25deg] border border-white/20 hidden md:block shadow-lg">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-zinc-600 rounded-sm border border-white/30 shadow-lg" />
                  </div>
                </div>
              </div>

              <div className="glass-card overflow-hidden h-[450px] border-hunyadi-yellow/10">
                <iframe
                  src="https://open.spotify.com/embed/playlist/3QFDXIQ369DgeKoVwnFnlM?utm_source=generator&theme=0"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="opacity-90 hover:opacity-100 transition-opacity"
                />
              </div>
            </section>

            {/* Mood & Note Section */}
            <section className="glass-card p-8 md:p-12 relative overflow-hidden border-hunyadi-yellow/5">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-hunyadi-yellow/20 to-transparent" />
              
              <div className="text-center mb-12">
                <p className="text-[11px] uppercase tracking-[0.4em] opacity-40 font-black text-hunyadi-yellow">✧˖*°࿐ fill me in! ✧˖*°࿐</p>
              </div>

              {noteSubmitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <Heart className="text-hunyadi-yellow fill-hunyadi-yellow/20 mx-auto mb-6 animate-bounce" size={32} />
                  <p className="text-xs font-serif italic opacity-60 tracking-wide">Note received. I'll see it soon, Parik.</p>
                </motion.div>
              ) : (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-5">
                      <label className="label-small ml-1">current mood</label>
                      <div className="flex flex-wrap gap-2">
                        {['😢', '😠', '😐', '😊', '🥰'].map((emoji, i) => (
                          <button
                            key={i}
                            onClick={() => setMood(i + 1)}
                            className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg transition-all ${mood === i + 1 ? 'bg-hunyadi-yellow/10 border-hunyadi-yellow/30 scale-105' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-5">
                      <label className="label-small ml-1">rate your day!</label>
                      <div className="flex gap-2.5 h-11 items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setDayRating(star)}
                            className={`transition-all hover:scale-110 ${dayRating >= star ? 'text-hunyadi-yellow' : 'text-white/5'}`}
                          >
                            <Star size={18} className={dayRating >= star ? 'fill-current' : ''} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-5">
                      <label className="label-small ml-1">do you still like me?</label>
                      <div className="flex gap-4">
                        <button
                          onClick={() => setMissesSarah(true)}
                          className={`flex-1 py-4 rounded-2xl text-[9px] tracking-[0.2em] font-bold transition-all border ${missesSarah === true ? 'bg-hunyadi-yellow/10 border-hunyadi-yellow/20 text-hunyadi-yellow' : 'bg-white/5 border-white/5 opacity-40'}`}
                        >
                          yes
                        </button>
                        <button
                          onClick={() => setMissesSarah(false)}
                          className={`flex-1 py-4 rounded-2xl text-[9px] tracking-[0.2em] font-bold transition-all border ${missesSarah === false ? 'bg-hunyadi-yellow/10 border-hunyadi-yellow/20 text-hunyadi-yellow' : 'bg-white/5 border-white/5 opacity-40'}`}
                        >
                          obviously
                        </button>
                        <button
                          onClick={() => setShowAngryPopup(true)}
                          className="flex-1 py-4 rounded-2xl text-[9px] tracking-[0.2em] font-bold transition-all border bg-white/5 border-white/5 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400"
                        >
                          hell nah
                        </button>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showAngryPopup && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowAngryPopup(false)}
                      >
                        <motion.div 
                          className="glass-card p-8 max-w-xs w-full text-center space-y-4 border-red-500/20"
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="text-5xl">😡</div>
                          <p className="text-red-400 font-bold tracking-widest text-xs">pick another one.</p>
                          <button 
                            onClick={() => setShowAngryPopup(false)}
                            className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-[10px] tracking-widest font-bold text-red-400 transition-all"
                          >
                            okay sorry
                          </button>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-5">
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="..."
                      className="w-full h-32 bg-white/5 border border-white/5 rounded-2xl p-5 focus:outline-none focus:border-hunyadi-yellow/10 transition-all text-sm resize-none placeholder:opacity-20 leading-relaxed"
                    />
                  </div>

                  <button
                    onClick={() => {
                      setIsSubmittingNote(true);
                      setTimeout(() => {
                        setIsSubmittingNote(false);
                        setNoteSubmitted(true);
                      }, 1500);
                    }}
                    disabled={mood === null || missesSarah === null || isSubmittingNote}
                    className="w-full bg-hunyadi-yellow/10 hover:bg-hunyadi-yellow/20 border border-hunyadi-yellow/20 rounded-2xl p-5 transition-all flex items-center justify-center gap-3 text-hunyadi-yellow disabled:opacity-20"
                  >
                    {isSubmittingNote ? (
                      <span className="text-[10px] tracking-[0.4em] font-black">transmitting...</span>
                    ) : (
                      <Send size={18} className="fill-current" />
                    )}
                  </button>
                </div>
              )}
            </section>
          </motion.div>
        )}
      </AnimatePresence>
      </main>

      {/* Aesthetic Footer */}
      <footer className="w-full max-w-7xl mx-auto mt-12 pb-12 px-8 z-50">
        <div className="border-t border-white/5 pt-12 flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-4 text-hunyadi-yellow/30 mb-2">
              <Heart size={10} className="fill-current" />
              <span className="text-[8px] tracking-[0.4em] font-black">✧˖*°࿐</span>
              <Heart size={10} className="fill-current" />
            </div>
            <p className="font-cursive text-2xl text-hunyadi-yellow/60 tracking-wide">love, sarah</p>
            <div className="flex gap-4 mt-2">
              {[Heart, Music, Disc].map((Icon, i) => (
                <Icon key={i} size={12} className="opacity-10 hover:opacity-30 transition-opacity cursor-pointer" />
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
