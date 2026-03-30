import React, { memo } from 'react';
import type { FC } from 'react';
import { DateTime } from 'luxon';
import { IconComment } from '../../icons/card-modal/icon-comment';
import { Button, Input, Text, FlexContainer } from '../../ui';
import type { Comment, User, Activity } from '@trello/_lib/types';

type CommentSidebarProps = {
  cardId: string;
  comments: Comment[];
  users: Record<string, User>;
  activities: Activity[];
  currentUserId: string;
  showDetails: boolean;
  onToggleDetails: () => void;
  // Comment state
  newComment: string;
  setNewComment: (value: string) => void;
  isAddingComment: boolean;
  setIsAddingComment: (value: boolean) => void;
  editingCommentId: string | null;
  editingCommentText: string;
  setEditingCommentText: (value: string) => void;
  // Comment handlers
  onAddComment: () => void;
  onEditComment: (commentId: string, content: string) => void;
  onUpdateComment: (commentId: string) => void;
  onDeleteComment: (commentId: string) => void;
  onCancelEdit: () => void;
};

const CommentSidebar: FC<CommentSidebarProps> = memo(function CommentSidebar({
  cardId,
  comments,
  users,
  activities,
  currentUserId,
  showDetails,
  onToggleDetails,
  newComment,
  setNewComment,
  isAddingComment,
  setIsAddingComment,
  editingCommentId,
  editingCommentText,
  setEditingCommentText,
  onAddComment,
  onEditComment,
  onUpdateComment,
  onDeleteComment,
  onCancelEdit,
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Scrollable content */}
      <div className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-3">
          {/* Add comment input */}
          <div className="flex items-start gap-2">
            <div className="flex-1">
              {isAddingComment ? (
                <div className="space-y-2">
                  <Input
                    variant="textarea"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    rows={3}
                    autoFocus
                  />
                  <FlexContainer gap="2">
                    <Button onClick={onAddComment}>Save</Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setIsAddingComment(false);
                        setNewComment('');
                      }}
                    >
                      Cancel
                    </Button>
                  </FlexContainer>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => setIsAddingComment(true)}
                  className="w-full justify-start"
                >
                  Write a comment...
                </Button>
              )}
            </div>
          </div>

          {/* Comments list */}
          {comments.map((comment) => {
            const commentUser = users[comment.userId];
            if (!commentUser) return null;

            return (
              <div key={comment.id} className="flex items-start gap-2">
                {commentUser.avatar ? (
                  <img
                    src={commentUser.avatar}
                    alt={commentUser.displayName}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-400">
                    <span className="text-xs font-medium text-white">
                      {commentUser.displayName.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {commentUser.displayName}
                    </span>
                    <Text variant="caption" size="xs" className="underline">
                      {DateTime.fromISO(comment.createdAt).toFormat('LLL d, yyyy, h:mm a')}
                    </Text>
                  </div>

                  {editingCommentId === comment.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value)}
                        className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => onUpdateComment(comment.id)}
                          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={onCancelEdit}
                          className="rounded bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-2 rounded-md border border-gray-200 bg-white px-3 py-2">
                        <p className="text-sm whitespace-pre-wrap text-gray-800">
                          {comment.content}
                        </p>
                      </div>
                      {comment.userId === currentUserId && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => onEditComment(comment.id, comment.content)}
                            className="text-xs text-gray-700 underline hover:text-gray-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDeleteComment(comment.id)}
                            className="text-xs text-gray-700 underline hover:text-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Activity details - shown when showDetails is true */}
          {showDetails && (
            <>
              {activities.map((activity) => {
                const activityUser = users[activity.userId];
                if (!activityUser) return null;

                return (
                  <div key={activity.id} className="flex items-start gap-2">
                    {activityUser.avatar ? (
                      <img
                        src={activityUser.avatar}
                        alt={activityUser.displayName}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-400">
                        <span className="text-xs font-medium text-white">
                          {activityUser.displayName.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {activityUser.displayName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {DateTime.fromISO(activity.createdAt).toFormat('LLL d, yyyy, h:mm a')}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {activity.type === 'create' && 'created this card'}
                        {activity.type === 'move' &&
                          `moved this card from ${activity.details.fromListTitle} to ${activity.details.toListTitle}`}
                        {activity.type === 'archive' && 'archived this card'}
                        {activity.type === 'unarchive' && 'unarchived this card'}
                        {activity.type === 'complete' && 'marked this card complete'}
                        {activity.type === 'incomplete' && 'marked this card incomplete'}
                        {activity.type === 'join' && 'joined this card'}
                        {activity.type === 'leave' && 'left this card'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export { CommentSidebar };
