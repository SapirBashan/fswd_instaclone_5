import React, { useState } from "react";
import { CommentAPI } from "../../../utils/ServerDB";
import { UserStorage } from "../../../utils/LocalStorage";
import styles from "../../features/comments/Comments/Comments.module.css";

const CommentForm = ({ postId, onCommentAdded }) => {
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!commentText.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const currentUser = UserStorage.getUser();
      if (!currentUser) {
        setError("You must be logged in to comment");
        return;
      }

      // Debug logging
      console.log("Creating comment for postId:", postId, typeof postId);

      // Ensure postId is properly handled
      const targetPostId = typeof postId === 'string' ? parseInt(postId) : postId;
      
      if (!targetPostId || isNaN(targetPostId)) {
        setError("Invalid post ID");
        console.error("Invalid postId:", postId);
        return;
      }

      // Create comment with the correct structure matching the API
      const commentData = {
        postId: targetPostId,
        name: currentUser.name || currentUser.username,
        email: currentUser.email,
        body: commentText.trim(),
        createdAt: new Date().toISOString(),
      };

      console.log("Comment data being sent:", commentData);

      const newComment = await CommentAPI.create(commentData);
      
      console.log("Comment created successfully:", newComment);

      onCommentAdded(newComment);
      setCommentText("");
    } catch (err) {
      console.error("Error creating comment:", err);
      setError("Failed to post comment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Error message JSX
  const errorMessage = error && <div className={styles.formError}>{error}</div>;

  // Form JSX
  const commentFormContent = (
    <form onSubmit={handleSubmit} className={styles.commentForm}>
      <textarea
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        placeholder="Write a comment..."
        className={styles.commentInput}
        rows={3}
        disabled={loading}
      />
      <button
        type="submit"
        className={styles.submitButton}
        disabled={loading || !commentText.trim()}
      >
        {loading ? "Posting..." : "Post Comment"}
      </button>
    </form>
  );

  return (
    <div className={styles.commentFormContainer}>
      {errorMessage}
      {commentFormContent}
    </div>
  );
};

export default CommentForm;