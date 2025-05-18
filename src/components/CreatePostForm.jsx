import React, { useState } from 'react';
import { PostAPI } from '../utils/ServerDB';
import { UserStorage } from '../utils/LocalStorage';
import styles from './CreatePostForm.module.css';

const CreatePostForm = ({ onPostCreated }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState({ title: '', body: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value}));
  };
  
  const handleFocus = () => {
    setIsExpanded(true);
  };
  
  const handleCancel = () => {
    setIsExpanded(false);
    setFormData({ title: '', body: '' });
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
        createdAt: new Date().toISOString()
      });
      
      // Reset form
      setFormData({ title: '', body: '' });
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
  
  return (
    <div className={styles.createPostContainer}>
      <form 
        className={`${styles.createPostForm} ${isExpanded ? styles.expanded : ''}`}
        onSubmit={handleSubmit}
      >
        <h3 className={styles.formTitle}>Create a new post</h3>
        
        {error && (
          <div className={styles.error}>{error}</div>
        )}
        
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
        
        {(isExpanded || formData.body) && (
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
        )}
        
        {isExpanded && (
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
              disabled={loading}
            >
              {loading ? "Posting..." : "Post"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default CreatePostForm;