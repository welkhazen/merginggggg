import { useState, useRef, useEffect } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import type { Comment } from "./PollComments";
import { DiagonalSplitProgress } from "@/components/ui/diagonal-split-progress";

interface SwipeablePollCardProps {
  id: string;
  question: string;
  options: string[];
  selectedOption?: string;
  isAnswered: boolean;
  totalResponses: number;
  responseStats: Record<string, number>;
  comments?: Comment[];
  onSwipe: (option: string) => void;
  onAddComment?: (content: string) => void;
}

export function SwipeablePollCard({
  question,
  options,
  selectedOption,
  isAnswered,
  totalResponses,
  responseStats,
  comments = [],
  onSwipe,
  onAddComment,
}: SwipeablePollCardProps) {
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [updatedComments, setUpdatedComments] = useState<Comment[]>(comments);
  const isDraggingRef = useRef(false);
  const touchStartX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync comments when they change from parent
  useEffect(() => {
    setUpdatedComments(comments);
  }, [comments]);

  // Global mouse move handler for desktop dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const currentX = e.clientX;
      const diff = currentX - touchStartX.current;
      const containerWidth = containerRef.current.offsetWidth;
      const progress = (diff / containerWidth) * 100;
      setSwipeProgress(Math.max(-100, Math.min(100, progress)));
    };

    const handleMouseUp = () => {
      if (!isDraggingRef.current) return;
      if (Math.abs(swipeProgress) > 30) {
        const selectedIdx = swipeProgress > 0 ? 0 : 1;
        onSwipe(options[selectedIdx]);
      }
      setSwipeProgress(0);
      isDraggingRef.current = false;
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, swipeProgress, options, onSwipe]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    isDraggingRef.current = true;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX.current;
    const containerWidth = containerRef.current.offsetWidth;
    const progress = (diff / containerWidth) * 100;
    setSwipeProgress(Math.max(-100, Math.min(100, progress)));
  };

  const handleTouchEnd = () => {
    if (Math.abs(swipeProgress) > 30) {
      const selectedIdx = swipeProgress > 0 ? 0 : 1;
      onSwipe(options[selectedIdx]);
    }
    setSwipeProgress(0);
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    touchStartX.current = e.clientX;
    isDraggingRef.current = true;
    setIsDragging(true);
  };

  const getCalculatedPercentage = (optionIndex: number): number => {
    if (totalResponses === 0) return 0;
    return Math.round((responseStats[options[optionIndex]] || 0) / totalResponses * 100);
  };

  const yesPct = options.length === 2 ? getCalculatedPercentage(0) : 0;
  const noPct = options.length === 2 ? 100 - yesPct : 0;

  return (
    <div className="space-y-6">
      {/* Swipeable Card - More Compact and Prominent */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        className={`relative w-full max-w-xl mx-auto rounded-3xl border-2 overflow-hidden transition-all ${
          isDragging
            ? "border-raw-gold/60 bg-raw-gold/5 cursor-grabbing shadow-lg shadow-raw-gold/20"
            : "border-raw-border/40 bg-gradient-to-br from-raw-gold/5 to-raw-black/40 cursor-grab hover:border-raw-gold/40"
        }`}
      >
        {/* Swipe indicator overlays */}
        <div
          className={`absolute inset-0 transition-opacity pointer-events-none z-20 ${
            Math.abs(swipeProgress) > 15 ? "opacity-100" : "opacity-0"
          }`}
        >
          {swipeProgress > 0 ? (
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/15 via-transparent to-transparent flex items-center justify-start pl-8">
              <div className="flex flex-col items-center gap-2">
                <ThumbsUp className="w-10 h-10 text-green-400 animate-bounce" />
                <span className="text-xs font-bold text-green-400">{options[0]}</span>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-l from-red-500/15 via-transparent to-transparent flex items-center justify-end pr-8">
              <div className="flex flex-col items-center gap-2">
                <ThumbsDown className="w-10 h-10 text-red-400 animate-bounce" />
                <span className="text-xs font-bold text-red-400">{options[1]}</span>
              </div>
            </div>
          )}
        </div>

        {/* Card Content */}
        <div
          className="p-8 transition-all duration-150"
          style={{
            transform: `translateX(${swipeProgress * 1.5}px) scale(${1 - Math.abs(swipeProgress) * 0.005})`,
          }}
        >
          {/* Main Question - Large and Prominent */}
          <p className="text-lg sm:text-2xl font-bold text-raw-text text-center leading-relaxed mb-8">
            {question}
          </p>

          {!isAnswered && (
            <>
              {/* Option buttons */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {options.map((option, idx) => (
                  <button
                    key={option}
                    onClick={() => {
                      onSwipe(option);
                      setSwipeProgress(0);
                    }}
                    className={`rounded-2xl border-2 px-4 py-3 text-sm font-semibold transition-all transform hover:scale-105 ${
                      options.length === 2
                        ? idx === 0
                          ? "border-white/20 bg-black/80 text-white/80 hover:border-white/40 hover:bg-black/70"
                          : "border-white/80 bg-[#7b6205] text-[#f3d24f] shadow-[0_0_12px_rgba(241,196,45,0.25)] hover:bg-[#8d6f08]"
                        : "border-raw-border/40 bg-raw-black/30 text-raw-silver/70 hover:border-raw-gold/50 hover:bg-raw-gold/10"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              {/* Swipe hint */}
              <p className="text-xs text-raw-silver/40 text-center italic">
                👉 Drag to swipe: <span className="text-green-400/70">right for {options[0]}</span> • <span className="text-red-400/70">left for {options[1]}</span>
              </p>
            </>
          )}

          {isAnswered && options.length === 2 && totalResponses > 0 && (
            <DiagonalSplitProgress
              leftLabel={options[0]}
              rightLabel={options[1]}
              leftValue={yesPct}
              rightValue={noPct}
              leftColor="#050505"
              rightColor="#8b6d08"
              leftTextColor="#ffffff"
              rightTextColor="#f3d24f"
              leftActive={selectedOption === options[0]}
              rightActive={selectedOption === options[1]}
              onLeftClick={() => onSwipe(options[0])}
              onRightClick={() => onSwipe(options[1])}
              className="mt-4 mx-auto w-full max-w-[460px]"
            />
          )}

          {isAnswered && !(options.length === 2) && totalResponses > 0 && (
            <div className="mt-6 pt-6 border-t border-raw-border/30 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-raw-silver/80 uppercase tracking-[0.15em]">
                  Community Response
                </p>
                <span className="text-xs text-raw-gold/80 font-bold">{totalResponses} votes</span>
              </div>

              {options.map((option, idx) => {
                const percentage = getCalculatedPercentage(idx);
                const count = responseStats[option] || 0;

                return (
                  <div key={option} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-raw-text">{option}</span>
                      <span className="font-bold text-raw-gold/85">{percentage}%</span>
                    </div>
                    <div className="relative h-2 rounded-full bg-raw-border/25 overflow-hidden shadow-inner">
                      <div
                        className={`absolute inset-y-0 left-0 rounded-full transition-all shadow-md ${
                          selectedOption === option
                            ? "bg-gradient-to-r from-raw-gold via-raw-gold/80 to-raw-gold/60 shadow-raw-gold/50"
                            : "bg-gradient-to-r from-raw-silver/50 to-raw-silver/30"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-raw-silver/50">{count} responses</p>
                  </div>
                );
              })}
            </div>
          )}

          {isAnswered && (
            <p className="mt-4 text-center text-sm font-semibold text-emerald-300/90 animate-pulse">
              ✓ Answer captured
            </p>
          )}
        </div>
      </div>

      {/* Comments Button to Toggle */}
      {isAnswered && (
        <button
          onClick={() => setShowComments(!showComments)}
          className="w-full max-w-xl mx-auto block rounded-2xl border-2 border-raw-border/40 bg-raw-black/20 px-6 py-3 text-sm font-semibold text-raw-silver/70 hover:border-raw-gold/50 hover:bg-raw-gold/10 hover:text-raw-gold/80 transition-all"
        >
          {showComments ? "▲ Hide" : "▼ Show"} 💬 Comments & Insights ({comments.length})
        </button>
      )}

      {/* Inline Comments Section */}
      {isAnswered && showComments && (
        <div className="max-w-xl mx-auto space-y-4">
          {/* Add Comment Form */}
          {onAddComment && (
            <div className="rounded-2xl border border-raw-border/30 bg-raw-black/20 p-4">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts on this question..."
                className="w-full bg-raw-black/40 border border-raw-border/30 rounded-lg px-3 py-2 text-sm text-raw-text placeholder-raw-silver/30 focus:outline-none focus:border-raw-gold/50 resize-none"
                rows={3}
              />
              <button
                onClick={() => {
                  if (commentText.trim()) {
                    onAddComment(commentText);
                    setCommentText("");
                  }
                }}
                disabled={!commentText.trim()}
                className="mt-3 w-full rounded-lg bg-raw-gold px-3 py-2 text-xs font-semibold text-raw-ink transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
              >
                Post Comment
              </button>
            </div>
          )}

          {/* Comments List */}
          {updatedComments.length > 0 ? (
            <div className="space-y-4">
              {updatedComments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-2xl border border-raw-border/30 bg-gradient-to-br from-raw-gold/5 to-raw-black/20 p-4 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-raw-gold/20 border border-raw-gold/30 flex items-center justify-center text-xs font-bold">
                      {comment.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-raw-text">
                          {comment.isAnonymous ? "Anonymous" : comment.author}
                        </span>
                        <span className="text-[9px] text-raw-silver/40">{comment.timestamp}</span>
                      </div>
                      <p className="mt-2 text-xs text-raw-silver/75 leading-relaxed">{comment.content}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <button className="text-xs text-raw-silver/50 hover:text-raw-gold/70 transition-colors">
                          👍 {comment.likes > 0 && comment.likes}
                        </button>
                        <button 
                          onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}
                          className="text-xs text-raw-silver/50 hover:text-raw-gold/70 transition-colors"
                        >
                          💬 Reply
                        </button>
                      </div>

                      {/* Reply Input Form */}
                      {replyingToId === comment.id && (
                        <div className="mt-4 space-y-2 rounded-xl border border-raw-border/30 bg-raw-black/30 p-3">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write a reply..."
                            className="w-full bg-raw-black/40 border border-raw-border/30 rounded-lg px-2.5 py-2 text-xs text-raw-text placeholder-raw-silver/30 focus:outline-none focus:border-raw-gold/50 resize-none"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (replyText.trim()) {
                                  const newReply: Comment = {
                                    id: `${comment.id}-reply-${Date.now()}`,
                                    author: "You",
                                    avatar: 5,
                                    content: replyText,
                                    timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
                                    likes: 0,
                                    replies: [],
                                    isAnonymous: false,
                                  };
                                  setUpdatedComments((prev) =>
                                    prev.map((c) =>
                                      c.id === comment.id
                                        ? { ...c, replies: [...(c.replies || []), newReply] }
                                        : c
                                    )
                                  );
                                  setReplyText("");
                                  setReplyingToId(null);
                                }
                              }}
                              disabled={!replyText.trim()}
                              className="flex-1 rounded-lg bg-raw-gold px-2.5 py-1.5 text-[10px] font-semibold text-raw-ink transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                            >
                              Post Reply
                            </button>
                            <button
                              onClick={() => {
                                setReplyingToId(null);
                                setReplyText("");
                              }}
                              className="flex-1 rounded-lg border border-raw-border/30 bg-raw-black/20 px-2.5 py-1.5 text-[10px] font-semibold text-raw-silver/70 hover:border-raw-gold/50 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Nested Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-4 ml-4 space-y-3 border-l-2 border-raw-gold/20 pl-4">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="text-[10px]">
                              <div className="flex items-start gap-2">
                                <div className="w-6 h-6 rounded-full bg-raw-gold/15 border border-raw-gold/20 flex items-center justify-center text-[8px] font-bold flex-shrink-0 mt-0.5">
                                  ↳
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-raw-silver/80 text-[9px]">
                                      {reply.isAnonymous ? "Anonymous" : reply.author}
                                    </span>
                                    <span className="text-[7px] text-raw-silver/40">{reply.timestamp}</span>
                                  </div>
                                  <p className="mt-1 text-raw-silver/65 leading-relaxed">{reply.content}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-raw-border/20 bg-raw-black/10 px-4 py-6 text-center">
              <p className="text-xs text-raw-silver/40">No comments yet. Be the first to share!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
