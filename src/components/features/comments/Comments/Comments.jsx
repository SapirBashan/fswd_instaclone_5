import React, { useState, useEffect } from "react";
import { CommentAPI, UserAPI } from "../../../../utils/ServerDB";
import { UserStorage } from "../../../../utils/LocalStorage";
import CommentView from "../CommentView/CommentView";
import CommentForm from "../../../forms/CommentForm/CommentForm";
import styles from "./Comments.module.css";

const Comments = ({ postId, isVisible, onToggle }) => {
  const [comments, setComments] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isVisible && postId) {
      console.log("Comments component - fetching for postId:", postId, typeof postId);
      fetchComments();
    }
  }, [isVisible, postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Ensure postId is properly converted
      const targetPostId = typeof postId === 'string' ? parseInt(postId) : postId;
      
      console.log("Fetching comments for postId:", targetPostId);

      const commentsData = await CommentAPI.getByPost(targetPostId);
      
      console.log("Fetched comments:", commentsData);

      // Sort comments by creation date (newest first)
      const sortedComments = commentsData.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });

      setComments(sortedComments);

      // Fetch user details for comments
      await fetchUserDetails(sortedComments);
    } catch (err) {
      console.error("Error fetching comments:", err);
      setError("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (commentsData) => {
    // Extract unique emails from comments
    const emails = [...new Set(commentsData.map((comment) => comment.email))];
    const userDetails = { ...users };

    for (const email of emails) {
      if (userDetails[email]) continue;

      try {
        // Try to find user by email
        const allUsers = await UserAPI.getAll();
        const user = allUsers.find((u) => u.email === email);

        if (user) {
          userDetails[email] = user;
        } else {
          // Fallback for external commenters
          userDetails[email] = {
            username: email.split("@")[0],
            email: email,
            name:
              commentsData.find((c) => c.email === email)?.name ||
              email.split("@")[0],
          };
        }
      } catch (e) {
        console.error("Error fetching user for email:", email, e);
        // Fallback for any errors
        userDetails[email] = {
          username: email.split("@")[0],
          email: email,
          name:
            commentsData.find((c) => c.email === email)?.name ||
            email.split("@")[0],
        };
      }
    }

    setUsers(userDetails);
  };

  const handleCommentAdded = async (newComment) => {
    console.log("Comment added:", newComment, "for postId:", postId);
    
    // Verify the comment belongs to this post
    const targetPostId = typeof postId === 'string' ? parseInt(postId) : postId;
    const commentPostId = typeof newComment.postId === 'string' ? parseInt(newComment.postId) : newComment.postId;
    
    if (commentPostId !== targetPostId) {
      console.error("Comment postId mismatch:", commentPostId, "vs", targetPostId);
      return;
    }

    // Immediately add to local state
    setComments((prev) => [newComment, ...prev]);

    // Add current user to users if not already there
    const currentUser = UserStorage.getUser();
    if (currentUser && !users[currentUser.email]) {
      setUsers((prev) => ({
        ...prev,
        [currentUser.email]: currentUser,
      }));
    }

    // Optionally refresh comments after a short delay to ensure consistency
    setTimeout(() => {
      fetchComments();
    }, 500);
  };

  const handleCommentDelete = (commentId) => {
    setComments((prev) => prev.filter((comment) => comment.id !== commentId));
  };

  // Loading state JSX
  const loadingContent = loading && (
    <div className={styles.loading}>Loading comments...</div>
  );

  // Error state JSX
  const errorContent = error && (
    <div className={styles.error}>
      {error}
      <button onClick={fetchComments} className={styles.retryButton}>
        Retry
      </button>
    </div>
  );

  // Empty state JSX
  const emptyContent = !loading && !error && comments.length === 0 && (
    <div className={styles.empty}>
      No comments yet. Be the first to comment!
    </div>
  );

  // Comments list JSX
  const commentsList = comments.map((comment) => (
    <CommentView
      key={comment.id}
      comment={comment}
      user={users[comment.email]}
      onDelete={handleCommentDelete}
    />
  ));

  if (!isVisible) return null;

  return (
    <div className={styles.commentsSection}>
      <div className={styles.commentsHeader}>
        <h4>Comments ({comments.length}) - Post ID: {postId}</h4>
        <button onClick={onToggle} className={styles.closeButton}>
          ✕
        </button>
      </div>

      <CommentForm postId={postId} onCommentAdded={handleCommentAdded} />

      <div className={styles.commentsList}>
        {loadingContent}
        {errorContent}
        {emptyContent}
        {commentsList}
      </div>
    </div>
  );
};

export default Comments;