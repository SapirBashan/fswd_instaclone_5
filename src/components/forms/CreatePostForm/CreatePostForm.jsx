import React, { useState } from "react";
import { PostAPI } from "../../../utils/ServerDB";
import { UserStorage } from "../../../utils/LocalStorage";
import styles from "./CreatePostForm.module.css";

const CreatePostForm = ({ onPostCreated }) => {
  // State declarations
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState({ title: "", body: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Event handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFocus = () => {
    setIsExpanded(true);
  };

  const handleCancel = () => {
    setIsExpanded(false);
    setFormData({ title: "", body: "" });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    if (!formData.body.trim()) {
      setError("Post content is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const currentUser = UserStorage.getUser();
      if (!currentUser) {
        setError("You must be logged in to create a post");
        return;
      }

      const newPost = await PostAPI.create({
        title: formData.title,
        body: formData.body,
        userId: currentUser.id,
        createdAt: new Date().toISOString(),
      });

      // Reset form
      setFormData({ title: "", body: "" });
      setIsExpanded(false);

      // Notify parent component
      if (onPostCreated) onPostCreated(newPost);
    } catch (err) {
      console.error("Failed to create post:", err);
      setError("Failed to create your post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Pre-defined JSX elements for cleaner return statement
  const errorElement = error && <div className={styles.error}>{error}</div>;

  const titleInput = (
    <div className={styles.formGroup}>
      <input
        type="text"
        name="title"
        placeholder="Post title"
        value={formData.title}
        onChange={handleChange}
        onFocus={handleFocus}
        className={styles.input}
        disabled={loading}
      />
    </div>
  );

  const bodyTextarea = (isExpanded || formData.body) && (
    <div className={styles.formGroup}>
      <textarea
        name="body"
        placeholder="What's on your mind?"
        value={formData.body}
        onChange={handleChange}
        className={styles.textarea}
        rows={5}
        disabled={loading}
      />
    </div>
  );

  const formActions = isExpanded && (
    <div className={styles.formActions}>
      <button
        type="button"
        onClick={handleCancel}
        className={styles.cancelButton}
        disabled={loading}
      >
        Cancel
      </button>
      <button
        type="submit"
        className={styles.submitButton}
        disabled={loading || !formData.title.trim() || !formData.body.trim()}
      >
        {loading ? "Posting..." : "Post"}
      </button>
    </div>
  );

  // Clean return statement
  return (
    <div className={styles.createPostContainer}>
      <form
        className={`${styles.createPostForm} ${
          isExpanded ? styles.expanded : ""
        }`}
        onSubmit={handleSubmit}
      >
        <h3 className={styles.formTitle}>Create a new post</h3>
        {errorElement}
        {titleInput}
        {bodyTextarea}
        {formActions}
      </form>
    </div>
  );
};

export default CreatePostForm;
