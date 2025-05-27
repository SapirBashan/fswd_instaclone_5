import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { LikesAPI } from "../utils/ServerDB";
import { UserStorage } from "../utils/LocalStorage";
import styles from "./LikeButton.module.css";

const LikeButton = ({ targetType, targetId, variant = "full" }) => {
  const [likes, setLikes] = useState([]);
  const [userLike, setUserLike] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });

  const containerRef = useRef(null);
  const currentUser = UserStorage.getUser();
  const availableEmojis = ["❤️", "👍", "😂", "😍", "😮", "😢", "😡"];

  // Calculate picker position based on button position
  const calculatePickerPosition = () => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const pickerWidth = 200; // Approximate picker width
    const pickerHeight = 150; // Approximate picker height
    const margin = 8;

    let top = rect.bottom + margin;
    let left = rect.left + rect.width / 2 - pickerWidth / 2;

    // Adjust if picker would go off-screen horizontally
    if (left < margin) {
      left = margin;
    } else if (left + pickerWidth > window.innerWidth - margin) {
      left = window.innerWidth - pickerWidth - margin;
    }

    // Adjust if picker would go off-screen vertically
    if (top + pickerHeight > window.innerHeight - margin) {
      top = rect.top - pickerHeight - margin;
    }

    setPickerPosition({ top, left });
  };

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target) &&
        !event.target.closest('.emoji-picker-portal')
      ) {
        setShowEmojiPicker(false);
      }
    };

    const handleScroll = () => {
      if (showEmojiPicker) {
        calculatePickerPosition();
      }
    };

    const handleResize = () => {
      if (showEmojiPicker) {
        calculatePickerPosition();
      }
    };

    if (showEmojiPicker) {
      calculatePickerPosition();
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleResize);
      
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        window.removeEventListener("scroll", handleScroll, true);
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [showEmojiPicker]);

  useEffect(() => {
    if (targetId) {
      fetchLikes();
    }
  }, [targetId, targetType]);

  const fetchLikes = async () => {
    try {
      setLoading(true);
      const likesData = await LikesAPI.getByTarget(targetType, targetId);
      setLikes(likesData);

      // Find current user's like
      if (currentUser) {
        const currentUserLike = likesData.find(
          (like) =>
            like.userId === currentUser.id ||
            like.userId === currentUser.id.toString()
        );
        setUserLike(currentUserLike || null);
      }
    } catch (err) {
      console.error("Error fetching likes:", err);
      setError("Failed to load likes");
    } finally {
      setLoading(false);
    }
  };

  const handleEmojiClick = async (emoji) => {
    if (!currentUser) {
      alert("Please login to like this " + targetType);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await LikesAPI.toggle(
        currentUser.id,
        targetType,
        parseInt(targetId),
        emoji
      );

      // Update local state based on action
      if (result.action === "removed") {
        setLikes((prev) => prev.filter((like) => like.id !== userLike.id));
        setUserLike(null);
      } else if (result.action === "created") {
        setLikes((prev) => [...prev, result.like]);
        setUserLike(result.like);
      } else if (result.action === "updated") {
        setLikes((prev) =>
          prev.map((like) => (like.id === result.like.id ? result.like : like))
        );
        setUserLike(result.like);
      }

      setShowEmojiPicker(false);
    } catch (err) {
      console.error("Error handling like:", err);
      setError("Failed to update like");
    } finally {
      setLoading(false);
    }
  };

  const toggleEmojiPicker = () => {
    if (!currentUser) {
      alert("Please login to like this " + targetType);
      return;
    }
    setShowEmojiPicker(!showEmojiPicker);
  };

  // Group likes by emoji and count them
  const groupedLikes = likes.reduce((acc, like) => {
    if (!acc[like.emoji]) {
      acc[like.emoji] = { count: 0, users: [] };
    }
    acc[like.emoji].count++;
    acc[like.emoji].users.push(like);
    return acc;
  }, {});

  // Get total likes count
  const totalLikes = likes.length;

  // Emoji picker JSX - Using Portal to render outside component tree
  const emojiPicker = showEmojiPicker && createPortal(
    <div 
      className={`${styles.emojiPickerPortal} emoji-picker-portal`}
      style={{
        position: 'fixed',
        top: `${pickerPosition.top}px`,
        left: `${pickerPosition.left}px`,
        zIndex: 999999
      }}
    >
      <div className={styles.emojiPicker}>
        <div className={styles.emojiGrid}>
          {availableEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              className={`${styles.emojiOption} ${
                userLike?.emoji === emoji ? styles.selected : ""
              }`}
              disabled={loading}
            >
              {emoji}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowEmojiPicker(false)}
          className={styles.closeButton}
        >
          ✕
        </button>
      </div>
    </div>,
    document.body
  );

  // Like summary for compact variant
  const likeSummary = variant === "compact" && totalLikes > 0 && (
    <div className={styles.likeSummary}>
      {Object.entries(groupedLikes).map(([emoji, data]) => (
        <span key={emoji} className={styles.emojiCount}>
          {emoji} {data.count}
        </span>
      ))}
    </div>
  );

  // Detailed likes display for full variant
  const detailedLikes = variant === "full" && (
    <div className={styles.likesDisplay}>
      {Object.entries(groupedLikes).map(([emoji, data]) => (
        <div key={emoji} className={styles.emojiGroup}>
          <span className={styles.emoji}>{emoji}</span>
          <span className={styles.count}>{data.count}</span>
        </div>
      ))}
    </div>
  );

  // Main like button
  const likeButton = (
    <button
      onClick={toggleEmojiPicker}
      className={`${styles.likeButton} ${userLike ? styles.liked : ""}`}
      disabled={loading}
      ref={containerRef}
    >
      {userLike ? userLike.emoji : "👍"}
      {variant === "full" && (
        <span className={styles.buttonText}>{userLike ? "Liked" : "Like"}</span>
      )}
    </button>
  );

  // Error message
  const errorMessage = error && <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.likeContainer}>
      {errorMessage}

      <div className={styles.likeSection}>
        {likeButton}
        {totalLikes > 0 && variant === "full" && (
          <span className={styles.totalCount}>{totalLikes}</span>
        )}
      </div>

      {likeSummary}
      {detailedLikes}
      {emojiPicker}
    </div>
  );
};

export default LikeButton;