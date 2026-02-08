import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/utils/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MessageSquare, Send, Lock, Users, Eye, Trash2, Pencil, 
  X, Check, Loader2 
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface RequestCommentsProps {
  requestId: number;
  instanceId?: number;
  taskId?: number;
  context?: "approval" | "rejection" | "clarification" | "general" | "internal_note";
}

export function RequestComments({ requestId, instanceId, taskId, context = "general" }: RequestCommentsProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [visibility, setVisibility] = useState<"private" | "group" | "requestor">("private");
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  
  const utils = trpc.useUtils();
  
  const { data: comments = [], isLoading } = trpc.comments.getByRequest.useQuery(
    { requestId },
    { enabled: !!requestId }
  );
  
  const { data: availableGroups = [] } = trpc.comments.getAvailableGroups.useQuery(
    undefined,
    { enabled: visibility === "group" }
  );
  
  const addComment = trpc.comments.add.useMutation({
    onSuccess: () => {
      setNewComment("");
      utils.comments.getByRequest.invalidate({ requestId });
      toast.success("Comment added");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
  
  const editComment = trpc.comments.edit.useMutation({
    onSuccess: () => {
      setEditingId(null);
      setEditContent("");
      utils.comments.getByRequest.invalidate({ requestId });
      toast.success("Comment updated");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
  
  const deleteComment = trpc.comments.delete.useMutation({
    onSuccess: () => {
      utils.comments.getByRequest.invalidate({ requestId });
      toast.success("Comment deleted");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
  
  const handleSubmit = () => {
    if (!newComment.trim()) return;
    addComment.mutate({
      requestId,
      instanceId,
      content: newComment.trim(),
      visibility,
      targetGroupId: visibility === "group" ? selectedGroupId : undefined,
      context,
      taskId,
    });
  };
  
  const handleEdit = (commentId: number) => {
    if (!editContent.trim()) return;
    editComment.mutate({ commentId, content: editContent.trim() });
  };
  
  const visibilityConfig = {
    private: { icon: Lock, label: "Private", color: "bg-[#F5F5F5] text-[#2C2C2C] border-[#E0E0E0]", description: "Only you can see this" },
    group: { icon: Users, label: "Group", color: "bg-[#E8DCF5] text-[#5B2C93] border-[#5B2C93]", description: "Visible to group members" },
    requestor: { icon: Eye, label: "Requestor", color: "bg-[#D1FAE5] text-[#059669] border-[#059669]", description: "Visible to the requestor" },
  };
  
  const contextLabels: Record<string, string> = {
    approval: "Approval Note",
    rejection: "Rejection Note",
    clarification: "Clarification",
    general: "General",
    internal_note: "Internal Note",
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare className="h-4 w-4 text-[#5B2C93]" />
        <h4 className="font-medium text-sm">Internal Comments & Notes</h4>
        <Badge variant="outline" className="text-xs">{comments.length}</Badge>
      </div>
      
      {/* Add Comment Form */}
      <div className="border rounded-lg p-3 bg-[#F5F5F5]/50">
        <Textarea
          placeholder="Add a comment or internal note..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[60px] bg-white text-sm resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              handleSubmit();
            }
          }}
        />
        
        <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            {/* Visibility Selector */}
            <Select value={visibility} onValueChange={(v) => setVisibility(v as any)}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">
                  <div className="flex items-center gap-1.5">
                    <Lock className="h-3 w-3" />
                    <span>Private</span>
                  </div>
                </SelectItem>
                <SelectItem value="group">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3 w-3" />
                    <span>Group</span>
                  </div>
                </SelectItem>
                <SelectItem value="requestor">
                  <div className="flex items-center gap-1.5">
                    <Eye className="h-3 w-3" />
                    <span>Requestor</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {/* Group Selector (only when group visibility) */}
            {visibility === "group" && (
              <Select 
                value={selectedGroupId?.toString() || ""} 
                onValueChange={(v) => setSelectedGroupId(Number(v))}
              >
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue placeholder="Select group..." />
                </SelectTrigger>
                <SelectContent>
                  {availableGroups.map((g: any) => (
                    <SelectItem key={g.id} value={g.id.toString()}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <span className="text-xs text-[#6B6B6B]">
              {visibilityConfig[visibility].description}
            </span>
          </div>
          
          <Button 
            size="sm" 
            onClick={handleSubmit}
            disabled={!newComment.trim() || addComment.isPending || (visibility === "group" && !selectedGroupId)}
            className="h-8"
          >
            {addComment.isPending ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Send className="h-3 w-3 mr-1" />
            )}
            Post
          </Button>
        </div>
      </div>
      
      {/* Comments List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-[#6B6B6B]" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-[#6B6B6B] italic text-center py-3">
          No comments yet. Be the first to add a note.
        </p>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {comments.map((comment: any) => {
            const isAuthor = comment.authorId === user?.id;
            const vis = visibilityConfig[comment.visibility as keyof typeof visibilityConfig];
            const VisIcon = vis?.icon || Lock;
            
            return (
              <div key={comment.id} className="border rounded-lg p-2.5 bg-white">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">
                      {comment.authorName || comment.authorEmail || "Unknown"}
                    </span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${vis?.color || ""}`}>
                      <VisIcon className="h-2.5 w-2.5 mr-0.5" />
                      {vis?.label || comment.visibility}
                    </Badge>
                    {comment.targetGroupName && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-[#E8DCF5]">
                        <Users className="h-2.5 w-2.5 mr-0.5" />
                        {comment.targetGroupName}
                      </Badge>
                    )}
                    {comment.context && comment.context !== "general" && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {contextLabels[comment.context] || comment.context}
                      </Badge>
                    )}
                    {comment.isEdited && (
                      <span className="text-[10px] text-[#6B6B6B] italic">(edited)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-[#6B6B6B]">
                      {comment.createdAt ? format(new Date(comment.createdAt), "MMM d, HH:mm") : ""}
                    </span>
                    {isAuthor && editingId !== comment.id && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => {
                            setEditingId(comment.id);
                            setEditContent(comment.content);
                          }}
                        >
                          <Pencil className="h-2.5 w-2.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-[#FF6B6B] hover:text-[#FF6B6B]"
                          onClick={() => deleteComment.mutate({ commentId: comment.id })}
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                {editingId === comment.id ? (
                  <div className="mt-1.5">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[40px] text-sm resize-none"
                    />
                    <div className="flex gap-1 mt-1">
                      <Button size="sm" className="h-6 text-xs" onClick={() => handleEdit(comment.id)}>
                        <Check className="h-3 w-3 mr-1" /> Save
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setEditingId(null)}>
                        <X className="h-3 w-3 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[#2C2C2C] mt-1 whitespace-pre-wrap">{comment.content}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
