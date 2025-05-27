import React from 'react';
import Post from '../../components/features/Post/Post';
import styles from './PostShow.module.css';

const PostModal = ({ post, user, onClose }) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        <Post post={post} user={user} variant="expanded" />
      </div>
    </div>
  );
};

export default PostModal;