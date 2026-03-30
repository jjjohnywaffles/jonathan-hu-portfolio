// Custom hook that manages comment creation, editing, and state for card modal comment functionality
import { useState, useCallback } from 'react';
import { useTrelloOperations } from '@trello/_lib/selectors';

export function useCommentManagement(cardId: string) {
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  const { addComment, updateComment, deleteComment } = useTrelloOperations();

  // Comment handlers
  const handleAddComment = () => {
    if (newComment.trim()) {
      addComment({ cardId, content: newComment.trim() });
      setNewComment('');
      setIsAddingComment(false);
    }
  };

  const handleEditComment = (commentId: string, content: string) => {
    setEditingCommentId(commentId);
    setEditingCommentText(content);
  };

  const handleUpdateComment = (commentId: string) => {
    if (editingCommentText.trim()) {
      updateComment({ commentId, content: editingCommentText.trim() });
      setEditingCommentId(null);
      setEditingCommentText('');
    }
  };

  const handleDeleteComment = (commentId: string) => {
    deleteComment({ commentId });
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  return {
    // State
    newComment,
    setNewComment,
    isAddingComment,
    setIsAddingComment,
    editingCommentId,
    setEditingCommentId,
    editingCommentText,
    setEditingCommentText,

    // Handlers
    handleAddComment,
    handleEditComment,
    handleUpdateComment,
    handleDeleteComment,
    handleCancelEdit,
  };
}
