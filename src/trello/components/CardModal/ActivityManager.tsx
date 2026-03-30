// Comprehensive activity management component that handles activity display, text generation, and interaction for card modals
import React, { memo } from 'react';
import type { FC } from 'react';
import { DateTime } from 'luxon';
import { useCommentManagement } from '../../hooks/use-comment-management';
import {
  useCardActivities,
  useCardComments,
  useUsers,
  useCurrentUser,
} from '@trello/_lib/selectors';

type ActivityManagerProps = {
  cardId: string;
  showDetails: boolean;
  onToggleDetails: () => void;
};

const ActivityManager: FC<ActivityManagerProps> = memo(function ActivityManager({
  cardId,
  showDetails,
  onToggleDetails,
}) {
  const activities = useCardActivities(cardId);
  const comments = useCardComments(cardId);
  const users = useUsers();
  const currentUser = useCurrentUser();

  const commentState = useCommentManagement(cardId);

  // Generate activity text based on type and details
  const generateActivityText = (activity: any): string => {
    switch (activity.type) {
      case 'create':
        return 'created this card';
      case 'move':
        if (activity.details?.fromListTitle && activity.details?.toListTitle) {
          return `moved this card from ${activity.details.fromListTitle} to ${activity.details.toListTitle}`;
        } else if (activity.details?.toListTitle) {
          return `moved this card to ${activity.details.toListTitle}`;
        } else {
          return 'moved this card';
        }
      case 'archive':
        return 'archived this card';
      case 'unarchive':
        return 'unarchived this card';
      case 'complete':
        return 'marked this card as complete';
      case 'incomplete':
        return 'marked this card as incomplete';
      case 'join':
        return 'joined this card';
      case 'leave':
        return 'left this card';
      default:
        return 'performed an action on this card';
    }
  };

  return (
    <section className="flex h-full flex-col">
      {/* Fixed header */}
      <div className="mb-4 flex flex-shrink-0 items-center gap-3 p-6 pb-0">
        <svg
          className="h-5 w-5 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <h3 className="text-sm font-semibold text-gray-800">Comments and activity</h3>
        <button
          onClick={onToggleDetails}
          className="ml-auto rounded-sm bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-800 shadow-sm transition-colors hover:bg-gray-300"
        >
          {showDetails ? 'Hide details' : 'Show details'}
        </button>
      </div>

      {/* Scrollable content */}
      <div className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 min-h-0 flex-1 overflow-y-auto px-6 pb-6">
        <div className="space-y-3">
          {/* Add comment input */}
          <div className="flex items-start gap-2">
            <div className="flex-1">
              {commentState.isAddingComment ? (
                <div className="space-y-2">
                  <textarea
                    value={commentState.newComment}
                    onChange={(e) => commentState.setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={commentState.handleAddComment}
                      className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        commentState.setIsAddingComment(false);
                        commentState.setNewComment('');
                      }}
                      className="rounded bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => commentState.setIsAddingComment(true)}
                  className="w-full cursor-pointer rounded-md border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-600 transition-colors hover:bg-gray-50"
                >
                  Write a comment…
                </button>
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
                    <span className="text-xs text-gray-500 underline">
                      {DateTime.fromISO(comment.createdAt).toFormat('LLL d, yyyy, h:mm a')}
                    </span>
                  </div>

                  {commentState.editingCommentId === comment.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={commentState.editingCommentText}
                        onChange={(e) => commentState.setEditingCommentText(e.target.value)}
                        className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => commentState.handleUpdateComment(comment.id)}
                          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={commentState.handleCancelEdit}
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
                      {comment.userId === currentUser.id && (
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              commentState.handleEditComment(comment.id, comment.content)
                            }
                            className="text-xs text-gray-700 underline hover:text-gray-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => commentState.handleDeleteComment(comment.id)}
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
            <div className="mt-4">
              <div className="mb-3 text-xs font-medium tracking-wide text-gray-500 uppercase">
                Activity
              </div>

              {/* Dynamic activity feed */}
              <div className="space-y-3">
                {/* Real activities from backend */}
                {activities.length > 0 ? (
                  activities.map((activity) => {
                    const activityUser = users[activity.userId];
                    if (!activityUser) return null;

                    const activityText = generateActivityText(activity);

                    return (
                      <div key={activity.id} className="flex items-start gap-2">
                        {activityUser.avatar ? (
                          <img
                            src={activityUser.avatar}
                            alt={activityUser.displayName}
                            className="h-6 w-6 rounded-full"
                          />
                        ) : (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-400">
                            <span className="text-xs font-medium text-white">
                              {activityUser.displayName.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="text-sm text-gray-800">
                            <span className="font-medium">{activityUser.displayName}</span>
                            <span className="text-gray-600"> {activityText}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {DateTime.fromISO(activity.createdAt).toFormat('LLL d, yyyy, h:mm a')}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm text-gray-500 italic">
                    No activity yet. Actions on this card will appear here.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
});

export { ActivityManager };
