import React, { useState, useEffect } from "react";
import { PostAPI } from "../utils/ServerDB";
import { UserAPI } from "../utils/ServerDB";
import { UserStorage } from "../utils/LocalStorage";
import style from "./HomePage.module.css";

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const postsPerPage = 5;

  // Function to fetch user details for posts
  const fetchUserDetails = async (postList) => {
    const userIds = [...new Set(postList.map((post) => post.userId))];
    const userDetails = { ...users };

    for (const userId of userIds) {
      // Skip if we already have this user's details
      if (userDetails[userId]) continue;

      try {
        const user = await UserAPI.getById(userId);
        userDetails[userId] = user;
      } catch (e) {
        console.error(`Error fetching details for user ${userId}`, e);
        userDetails[userId] = { username: "Unknown User" };
      }
    }

    setUsers(userDetails);
  };

  // Initial load of posts
  const fetchRandomPosts = async () => {
    try {
      setLoading(true);

      // Get current user to exclude their posts from feed
      const currentUser = UserStorage.getUser();
      const currentUserId = currentUser ? currentUser.id : null;

      // Get random posts from other users
      const randomPosts = await PostAPI.getRandomPosts(
        currentUserId,
        postsPerPage
      );
      setPosts(randomPosts);
      setHasMore(randomPosts.length === postsPerPage);

      // Fetch user details for each post
      await fetchUserDetails(randomPosts);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("Failed to load feed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Load more posts
  const loadMorePosts = async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;

      // Get current user to exclude their posts from feed
      const currentUser = UserStorage.getUser();
      const currentUserId = currentUser ? currentUser.id : null;

      // Get more random posts
      const morePosts = await PostAPI.getRandomPosts(
        currentUserId,
        postsPerPage
      );

      // Filter out any duplicates (might happen with random posts)
      const newPosts = morePosts.filter(
        (newPost) =>
          !posts.some((existingPost) => existingPost.id === newPost.id)
      );

      if (newPosts.length === 0) {
        setHasMore(false);
      } else {
        setPosts((prevPosts) => [...prevPosts, ...newPosts]);
        setPage(nextPage);
        setHasMore(newPosts.length === postsPerPage);

        // Fetch user details for the new posts
        await fetchUserDetails(newPosts);
      }
    } catch (err) {
      console.error("Error loading more posts:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchRandomPosts();
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className={style.homePage}>
      <h1 className={style.heading}>Discover Posts</h1>

      {loading && (
        <div className={style.loadingContainer}>
          <p>Loading feed...</p>
        </div>
      )}

      {error && (
        <div className={style.errorContainer}>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className={style.emptyContainer}>
          <p>No posts available. Follow some users to see their posts!</p>
        </div>
      )}

      {posts.map((post) => (
        <div key={post.id} className={style.postCard}>
          <div className={style.postHeader}>
            <div className={style.userInfo}>
              <div className={style.userAvatar}>
                {users[post.userId]?.username?.charAt(0).toUpperCase() || "?"}
              </div>
              <div className={style.userName}>
                {users[post.userId]?.username || "Unknown User"}
              </div>
            </div>
          </div>

          <h2 className={style.postTitle}>{post.title}</h2>
          <p className={style.postBody}>{post.body}</p>

          <div className={style.postFooter}>
            <div className={style.postActions}>
              <button className={style.actionButton}>❤️ Like</button>
              <button className={style.actionButton}>💬 Comment</button>
              <button className={style.actionButton}>📤 Share</button>
            </div>
          </div>
        </div>
      ))}

      {!loading && !error && posts.length > 0 && (
        <div className={style.loadMoreContainer}>
          {hasMore ? (
            <button
              onClick={loadMorePosts}
              className={style.loadMoreButton}
              disabled={loadingMore}
            >
              {loadingMore ? "Loading..." : "Load More"}
            </button>
          ) : (
            <p className={style.noMorePosts}>No more posts to show</p>
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;
