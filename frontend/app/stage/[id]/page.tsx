"use client";

import { useEffect, useState, use } from "react";
import { ThumbsUp, ThumbsDown, Activity, Music, Radio, ChevronRight } from "lucide-react";

export default function StagePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const stageId = resolvedParams.id;
  const [current, setCurrent] = useState<any>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [vibeScore, setVibeScore] = useState<number>(0);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentRes = await fetch(`http://localhost:3001/stages/${stageId}/current`);
        if (currentRes.ok) {
          const data = await currentRes.json();
          setCurrent(data.currentTrack);
          setVibeScore(data.vibeScore);
        }

        const queueRes = await fetch(`http://localhost:3001/stages/${stageId}/queue`);
        if (queueRes.ok) {
          const data = await queueRes.json();
          setQueue(data.queue);
        }
      } catch (e) {
        console.error("Error fetching stage data", e);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000); // Poll every 2s
    return () => clearInterval(interval);
  }, [stageId]);

  const handleVote = async (voteVal: number) => {
    if (!current || isVoting) return;
    setIsVoting(true);
    
    // Optimistic UI update
    setVibeScore(prev => prev + voteVal);

    try {
      await fetch(`http://localhost:3001/stages/${stageId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voteVal, trackId: current.track_id })
      });
    } catch (e) {
      console.error("Failed to vote", e);
      // Revert optimistic update
      setVibeScore(prev => prev - voteVal);
    } finally {
      setIsVoting(false);
    }
  };

  const getVibeColor = () => {
    if (vibeScore > 20) return "text-green-400";
    if (vibeScore < -20) return "text-red-400";
    return "text-purple-400";
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans selection:bg-purple-500/30 overflow-hidden relative">
      {/* Dynamic Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-pink-600/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />
      
      <div className="max-w-md mx-auto p-6 relative z-10 min-h-screen flex flex-col pt-12">
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
              <Radio className="text-purple-400" size={20} />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-wider text-purple-200/70 uppercase">Live Stage</h1>
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-300">Stage {stageId}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 transition-all duration-300">
            <Activity size={16} className={getVibeColor()} />
            <span className={`font-bold transition-colors duration-300 ${getVibeColor()}`}>{vibeScore}</span>
          </div>
        </header>

        {/* Now Playing Card */}
        <section className="mb-8">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4 px-1">Now Playing</h3>
          
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
            
            <div className="relative p-6 rounded-3xl bg-black/60 backdrop-blur-xl border border-white/10 flex flex-col items-center text-center shadow-2xl">
              <div className="w-24 h-24 mb-6 rounded-2xl bg-gradient-to-br from-purple-900/50 to-pink-900/50 flex items-center justify-center border border-white/5 shadow-inner relative overflow-hidden">
                <Music size={40} className="text-purple-300/50 absolute z-10" />
                {/* Pulse animation matching vibe score roughly */}
                <div className={`absolute inset-0 bg-purple-500/20 ${vibeScore < -20 ? 'animate-pulse' : ''}`} style={{ animationDuration: '0.5s' }} />
              </div>
              
              {current ? (
                <>
                  <h2 className="text-2xl font-black text-white mb-2 tracking-tight">{current.title}</h2>
                  <p className="text-purple-300/70 font-medium mb-8">{current.artist_name}</p>
                  
                  {/* Voting Controls */}
                  <div className="flex items-center gap-4 w-full">
                    <button 
                      onClick={() => handleVote(-1)}
                      disabled={isVoting}
                      className="flex-1 py-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 flex justify-center items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <ThumbsDown size={20} />
                    </button>
                    <button 
                      onClick={() => handleVote(1)}
                      disabled={isVoting}
                      className="flex-1 py-4 rounded-2xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 flex justify-center items-center gap-2 transition-all active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.1)] disabled:opacity-50"
                    >
                      <ThumbsUp size={20} />
                      <span className="font-bold tracking-wide">VIBE</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-8 animate-pulse text-white/40">Loading active track...</div>
              )}
            </div>
          </div>
        </section>

        {/* Up Next */}
        <section className="flex-1 flex flex-col">
          <div className="flex justify-between items-end mb-4 px-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Up Next</h3>
            <span className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">{queue.length} Tracks</span>
          </div>
          
          <div className="flex-1 bg-white/5 border border-white/5 rounded-3xl p-2 overflow-hidden flex flex-col relative min-h-[250px]">
             {/* Gradient overlay for scrolling indication */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#141416] to-transparent z-10 pointer-events-none rounded-b-3xl" />
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-1 custom-scrollbar pb-10">
              {queue.length > 0 ? (
                queue.map((track, idx) => (
                  <div key={`${track.track_id}-${idx}`} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors group">
                    <div className="w-6 text-center text-xs font-bold text-white/20 group-hover:text-purple-400 transition-colors">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white/90 truncate text-sm">{track.title}</div>
                      <div className="text-xs text-white/40 truncate">{track.artist_name}</div>
                    </div>
                    <ChevronRight size={14} className="text-white/10 group-hover:text-white/40 transition-colors" />
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-white/30 pt-10">
                  Queue is empty
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}} />
    </div>
  );
}
