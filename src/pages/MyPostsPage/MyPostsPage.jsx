import React, { useState, useEffect } from "react";
import { PostAPI, UserAPI } from "../../utils/ServerDB";
import { UserStorage } from "../../utils/LocalStorage";
import Post from "../../components/features/Post/Post";
import CreatePostForm from "../../components/forms/CreatePostForm/CreatePostForm";
import styles from "./MyPostsPage.module.css";

const MyPostsPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user from local storage
        const userData = UserStorage.getUser();

        if (!userData) {
          setError("User not authenticated");
          return;
        }

        setCurrentUser(userData);

        // Get user's posts
        const userPosts = await PostAPI.getByUser(userData.id);

        // Sort posts by creation date (newest first)
        userPosts.sort((a, b) => {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });

        setPosts(userPosts);
      } catch (err) {
        console.error("Error fetching user posts:", err);
        setError("Failed to load your posts. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserPosts();
  }, []);

  const handlePostCreated = (newPost) => {
    // Add the new post to the beginning of the posts array
    setPosts((prevPosts) => [newPost, ...prevPosts]);
  };

  const handlePostDelete = (postId) => {
    // Remove the deleted post from state
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
  };

  const handlePostUpdate = (postId, updatedData) => {
    // Update the specific post in state
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            title: updatedData.title,
            body: updatedData.body,
            updatedAt: new Date().toISOString(),
          };
        }
        return post;
      })
    );
  };

  return (
    <div className={styles.myPostsPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.heading}>My Posts</h1>
        <p className={styles.subheading}>Create and manage your posts</p>
      </div>

      <CreatePostForm onPostCreated={handlePostCreated} />

      {loading && (
        <div className={styles.loadingContainer}>
          <p>Loading your posts...</p>
        </div>
      )}

      {error && (
        <div className={styles.errorContainer}>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className={styles.emptyContainer}>
          <p>
            You haven't created any posts yet. Use the form above to create your
            first post!
          </p>
        </div>
      )}

      {posts.map((post) => (
        <Post
          key={post.id}
          post={post}
          user={currentUser}
          variant="internal"
          onDelete={handlePostDelete}
          onUpdate={handlePostUpdate}
        />
      ))}
    </div>
  );
};

export default MyPostsPage;
