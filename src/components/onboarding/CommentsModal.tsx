import { X } from "lucide-react";
import { PollComments, type Comment } from "./PollComments";

interface CommentsModalProps {
  isOpen: boolean;
  pollId: string;
  pollQuestion: string;
  comments: Comment[];
  onClose: () => void;
  onAddComment: (pollId: string, content: string) => void;
  onLikeComment: (pollId: string, commentId: string) => void;
}

export function CommentsModal({
  isOpen,
  pollQuestion,
  comments,
  onClose,
  onAddComment,
  onLikeComment,
  pollId,
}: CommentsModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-2xl rounded-3xl border border-raw-border/40 bg-gradient-to-b from-raw-surface/50 to-raw-black/95 shadow-2xl pointer-events-auto max-h-[80vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-raw-border/30 px-6 py-4 flex-shrink-0">
            <h2 className="font-display text-lg text-raw-text">Community Insights</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-raw-black/40 text-raw-silver/50 hover:text-raw-silver transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <PollComments
              pollId={pollId}
              pollQuestion={pollQuestion}
              comments={comments}
              onAddComment={(content) => onAddComment(pollId, content)}
              onLikeComment={(commentId) => onLikeComment(pollId, commentId)}
            />
          </div>
        </div>
      </div>
    </>
  );
}
