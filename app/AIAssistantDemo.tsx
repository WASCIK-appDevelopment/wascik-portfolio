"use client";

import { useEffect, useRef, useState } from "react";

const captions = [
  "Meet the kind of assistant WASCIK can build for your business.",
  "It can welcome visitors and answer common questions.",
  "Its look, voice, and knowledge can match your company.",
  "And it can help connect customers with a real person.",
];

export default function AIAssistantDemo() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [caption, setCaption] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const update = () => {
      const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 16.8;
      setProgress(Math.min(100, (audio.currentTime / duration) * 100));
      setCaption(Math.min(captions.length - 1, Math.floor((audio.currentTime / duration) * captions.length)));
    };
    const stop = () => setIsPlaying(false);
    audio.addEventListener("timeupdate", update);
    audio.addEventListener("pause", stop);
    audio.addEventListener("ended", stop);
    return () => {
      audio.removeEventListener("timeupdate", update);
      audio.removeEventListener("pause", stop);
      audio.removeEventListener("ended", stop);
    };
  }, []);

  const playMessage = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    if (audio.ended || audio.currentTime >= (audio.duration || 16.8) - .1) {
      audio.currentTime = 0;
      setProgress(0);
      setCaption(0);
    }
    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  const replay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setProgress(0);
    setCaption(0);
    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  return (
    <section className={`ai-preview ${isPlaying ? "assistant-speaking" : ""}`}>
      <div className="ai-preview-copy">
        <p className="wascik-eyebrow">COMING TO WASCIK</p>
        <h2>An AI representative that feels like part of your business.</h2>
        <p>We&apos;re developing a branded on-screen character that can welcome visitors, answer common questions, guide them toward the right service, collect leads, and help connect them with a real person when needed.</p>
        <div className="ai-capabilities"><span>24/7 first response</span><span>Custom business knowledge</span><span>Human handoff</span></div>
      </div>

      <div className="ai-demo-stage">
        <div className="ai-bot-lockup" aria-hidden="true">
          <div className="ai-preview-bot">
            <i className="bot-ear bot-ear-left" /><i className="bot-ear bot-ear-right" />
            <i className="bot-eye bot-eye-left" /><i className="bot-eye bot-eye-right" />
            <b className="bot-mouth" />
          </div>
          <span className="ai-side-label">AI</span>
        </div>
        <div className="ai-speech" aria-live="polite">
        <span className="portion-label">WASCIK AI ASSISTANT</span>
        <strong>Hear the complete message</strong>
        <p className="assistant-caption">{captions[caption]}</p>
        <div className="assistant-progress" aria-label="Recording progress"><i style={{ width: `${progress}%` }} /></div>
        <button className="assistant-learn-button" type="button" onClick={playMessage}>
          {isPlaying ? "Pause Assistant" : progress > 0 && progress < 100 ? "Continue Message" : "Learn About My Assistant"}
        </button>
        <button className="assistant-replay-button" type="button" onClick={replay}>Replay Message</button>
          <audio ref={audioRef} src="/wascik-ai-assistant.mp3" preload="metadata" />
        </div>
      </div>
    </section>
  );
}
