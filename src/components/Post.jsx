import React, { useState } from "react";
import { Link } from "react-router-dom";
import { PostAPI } from "../utils/ServerDB";
import Comments from "./Comments";
import LikeButton from "./LikeButton";
import styles from "./Post.module.css";

const Post = ({
  post,
  user,
  variant = "external",
  onDelete = null,
  onUpdate = null,
}) => {
  // State declarations
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [editedPost, setEditedPost] = useState({
    title: post.title,
    body: post.body,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isInternal = variant === "internal";

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const toggleExpand = () => {
    if (!isInternal) setIsExpanded(!isExpanded);
  };

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  const handleEditClick = () => setIsEditing(true);

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedPost({ title: post.title, body: post.body });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedPost((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      setError(null);
      await PostAPI.update(post.id, {
        ...post,
        title: editedPost.title,
        body: editedPost.body,
      });
      setIsEditing(false);
      if (onUpdate) onUpdate(post.id, editedPost);
    } catch (err) {
      console.error("Failed to update post:", err);
      setError("Failed to update. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        setLoading(true);
        await PostAPI.delete(post.id);
        if (onDelete) onDelete(post.id);
      } catch (err) {
        console.error("Failed to delete post:", err);
        setError("Failed to delete post. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Edit form JSX
  const editForm = (
    <div className={styles.editForm}>
      {error && <div className={styles.error}>{error}</div>}

      <input
        type="text"
        name="title"
        value={editedPost.title}
        onChange={handleInputChange}
        className={styles.editTitle}
        placeholder="Post title"
      />

      <textarea
        name="body"
        value={editedPost.body}
        onChange={handleInputChange}
        className={styles.editBody}
        placeholder="Write your post content here..."
        rows={6}
      />

      <div className={styles.editActions}>
        <button
          onClick={handleSaveEdit}
          className={styles.saveButton}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
        <button
          onClick={handleCancelEdit}
          className={styles.cancelButton}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </div>
  );

  // User info section JSX
  const userInfoSection = (
    <div className={styles.userInfo}>
      <div className={styles.userAvatar}>
        {user?.username?.charAt(0).toUpperCase() || "?"}
      </div>
      <Link to={`/profile/${user?.id}`} className={styles.userName}>
        {user?.username || "Unknown User"}
      </Link>
    </div>
  );

  // Post actions section JSX (for internal variant)
  const postActionsSection = isInternal && (
    <div className={styles.postActions}>
      <button onClick={handleEditClick} className={styles.actionButton}>
        ✏️ Edit
      </button>
      <button
        onClick={handleDelete}
        className={styles.actionButton}
        disabled={loading}
      >
        🗑️ Delete
      </button>
    </div>
  );

  // Post body section JSX
  const postBodySection = (
    <div
      className={`${styles.postBody} ${
        isExpanded || isInternal ? styles.expanded : ""
      }`}
    >
      <p>{post.body}</p>

      {!isInternal && !isExpanded && post.body.length > 150 && (
        <button onClick={toggleExpand} className={styles.readMoreButton}>
          Read more...
        </button>
      )}
    </div>
  );

  // Post metadata section JSX (for internal variant)
  const postMetaSection = isInternal && (
    <div className={styles.postMeta}>
      <span className={styles.postDate}>
        Posted on: {formatDate(post.createdAt || new Date().toISOString())}
      </span>
      {post.updatedAt && post.updatedAt !== post.createdAt && (
        <span className={styles.postDate}>
          Updated: {formatDate(post.updatedAt)}
        </span>
      )}
    </div>
  );

  // Interaction buttons section JSX
  const interactionButtonsSection = (
    <div className={styles.interactionButtons}>
      <LikeButton
        targetType="post"
        targetId={post.id}
        variant={isInternal ? "full" : "compact"}
      />
      <button className={styles.actionButton} onClick={toggleComments}>
        💬 {showComments ? "Hide Comments" : "Comments"}
      </button>
      {!isInternal && <button className={styles.actionButton}>📤 Share</button>}
    </div>
  );

  // Post statistics section JSX (for internal variant)
  const postStatsSection = isInternal && (
    <div className={styles.postStats}>
      <span className={styles.statsItem}>Likes: {post.likes || 0}</span>
      <span className={styles.statsItem}>
        Comments: {post.commentsCount || 0}
      </span>
    </div>
  );

  // Error message JSX
  const errorMessage = error && <div className={styles.error}>{error}</div>;

  // If in editing mode, return edit form only
  if (isEditing && isInternal) {
    return (
      <div className={`${styles.post} ${styles.internal}`}>{editForm}</div>
    );
  }

  // Regular post display with clean return statement
  return (
    <div
      className={`${styles.post} ${
        isInternal ? styles.internal : styles.external
      }`}
    >
      <div className={styles.postHeader}>
        {userInfoSection}
        {postActionsSection}
      </div>

      <h2 className={styles.postTitle}>{post.title}</h2>
      {postBodySection}
      {postMetaSection}

      <div className={styles.postFooter}>
        {interactionButtonsSection}
        {postStatsSection}
      </div>

      {errorMessage}

      <Comments
        postId={post.id}
        isVisible={showComments}
        onToggle={toggleComments}
      />
    </div>
  );
};

export default Post;
