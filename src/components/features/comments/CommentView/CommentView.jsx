import React, { useState } from "react";
import { CommentAPI } from "../../../../utils/ServerDB";
import { UserStorage } from "../../../../utils/LocalStorage";
import LikeButton from "../../../ui/LikeButton/LikeButton";
import styles from "../Comments/Comments.module.css";

const CommentView = ({ comment, user, onDelete }) => {
  const [loading, setLoading] = useState(false);
  const currentUser = UserStorage.getUser();

  // Check if current user can delete this comment
  const canDelete =
    currentUser &&
    (currentUser.email === comment.email || currentUser.id === comment.userId); // fallback for backwards compatibility

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this comment?"))
      return;

    try {
      setLoading(true);
      await CommentAPI.delete(comment.id);
      onDelete(comment.id);
    } catch (err) {
      console.error("Error deleting comment:", err);
      alert("Failed to delete comment");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Just now";

    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get display name for the comment author
  const getDisplayName = () => {
    if (user?.username) return user.username;
    if (user?.name) return user.name;
    if (comment.name) return comment.name;
    if (comment.email) return comment.email.split("@")[0];
    return "Anonymous";
  };

  // Get avatar letter
  const getAvatarLetter = () => {
    const displayName = getDisplayName();
    return displayName.charAt(0).toUpperCase();
  };

  // User avatar JSX
  const userAvatar = (
    <div className={styles.commentAvatar}>{getAvatarLetter()}</div>
  );

  // Comment header JSX
  const commentHeader = (
    <div className={styles.commentHeader}>
      <span className={styles.commentAuthor}>{getDisplayName()}</span>
      <span className={styles.commentDate}>
        {formatDate(comment.createdAt)}
      </span>
      {canDelete && (
        <button
          onClick={handleDelete}
          className={styles.deleteButton}
          disabled={loading}
          title="Delete comment"
        >
          🗑️
        </button>
      )}
    </div>
  );

  const commentContent = (
    <div className={styles.commentContent}>
      <p>{comment.body}</p>
      <div className={styles.commentActions}>
        <LikeButton
          targetType="comment"
          targetId={comment.id}
          variant="compact"
        />
      </div>
    </div>
  );

  return (
    <div className={styles.commentItem}>
      {userAvatar}
      <div className={styles.commentBody}>
        {commentHeader}
        {commentContent}
      </div>
    </div>
  );
};

export default CommentView;
