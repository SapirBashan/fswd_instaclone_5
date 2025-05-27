import React, { useState, useEffect } from "react";
import { PostAPI, UserAPI } from "../../utils/ServerDB";
import { UserStorage } from "../../utils/LocalStorage";
import Post from "../../components/features/Post/Post"; // Import the Post component
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
    try {
      const userIds = [...new Set(postList.map((post) => post.userId))];
      const userDetails = { ...users };
      console.log("User IDs to fetch:", userIds);
      console.log("Current user details:", userDetails);
      let hasNewUsers = false;

      for (const userId of userIds) {
        // Skip if we already have this user's details
        if (userDetails[userId]) continue;

        hasNewUsers = true;
        try {
          const user = await UserAPI.getById(userId);
          userDetails[userId] = user;
        } catch (e) {
          console.error(`Error fetching details for user ${userId}`, e);
          userDetails[userId] = { username: "Unknown User" };
        }
      }

      // Only update state if we have new users
      if (hasNewUsers) {
        setUsers(userDetails);
      }
    } catch (error) {
      console.error("Error in fetchUserDetails:", error);
    }
  };

  // Initial load of posts
  const fetchRandomPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user to exclude their posts from feed
      const currentUser = UserStorage.getUser();
      const currentUserId = currentUser ? currentUser.id : null;

      // Get random posts from other users
      const Posts = await PostAPI.getPosts({
        page,
        limit: postsPerPage,
        excludeUserId: currentUserId,
      });

      setPosts(Posts);
      setHasMore(Posts.length === postsPerPage);

      // Fetch user details for each post
      await fetchUserDetails(Posts);
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
      const morePosts = await PostAPI.getPosts({
        page: nextPage,
        limit: postsPerPage,
        excludeUserId: currentUserId,
      });

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

  // Note: This effect will only run once on component mount (empty dependency array)
  // For a production app, you might want to add dependencies or use a different pattern
  // to handle function recreation without useCallback
  useEffect(() => {
    fetchRandomPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <button onClick={fetchRandomPosts}>Retry</button>
        </div>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className={style.emptyContainer}>
          <p>No posts available. Follow some users to see their posts!</p>
        </div>
      )}

      {posts.map((post) => (
        <Post
          key={post.id}
          post={post}
          user={users[post.userId]}
          variant="external"
        />
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
