import React, { useEffect, useState, useRef } from "react";
import { AlbumAPI, PhotoAPI } from "../utils/ServerDB";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { UserStorage } from "../utils/LocalStorage";
import style from "./AlbumPage.module.css";

const AlbumPage = () => {
  // Router hooks
  const navigate = useNavigate();
  const { albumId } = useParams();
  const location = useLocation();

  // Get current user ID from storage
  const userId = UserStorage.getUser()?.id || 1;

  // Core states
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // Input states
  const [search, setSearch] = useState("");
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [error, setError] = useState(null);

  // Refs
  const photosContainerRef = useRef(null);

  // Loading states
  const [loadingImages, setLoadingImages] = useState({});

  // Fullscreen image state
  const [fullScreenImage, setFullScreenImage] = useState(null);

  // Constants
  const PHOTOS_PER_PAGE = 10;

  // Load albums on component mount
  useEffect(() => {
    loadAlbums();
  }, [userId, search]);

  // Handle album selection from URL
  useEffect(() => {
    if (albumId && albums.length > 0) {
      const albumIdParts = albumId.split("-");
      const id = parseInt(albumIdParts[0]);
      const album = albums.find((a) => a.id === id);
      if (album) setSelectedAlbum(album);
    }
  }, [albumId, albums]);

  // Load photos when album changes
  useEffect(() => {
    if (selectedAlbum) {
      loadPhotos(1, true);
      if (!location.pathname.includes(`/albums/${selectedAlbum.id}-`)) {
        navigate(
          `/albums/${selectedAlbum.id}-${encodeURIComponent(
            selectedAlbum.title.replace(/\s+/g, "-")
          )}`
        );
      }
    }
  }, [selectedAlbum]);

  // Load more photos when page changes
  useEffect(() => {
    if (selectedAlbum && page > 1) {
      loadPhotos(page, false);
    }
  }, [page]);

  const loadAlbums = async () => {
    try {
      setLoading(true);
      const albumData = await AlbumAPI.getByUser(userId);
      setAlbums(
        search
          ? albumData.filter(
              (album) =>
                album.title.toLowerCase().includes(search.toLowerCase()) ||
                album.id.toString().includes(search)
            )
          : albumData
      );
    } catch (err) {
      setError("Failed to load albums");
    } finally {
      setLoading(false);
    }
  };

  const loadPhotos = async (pageNum, reset) => {
    if (!selectedAlbum) return;

    try {
      setLoading(true);
      const photoData = await PhotoAPI.getByAlbum(selectedAlbum.id, {
        page: pageNum,
        limit: PHOTOS_PER_PAGE,
      });

      setPhotos((prev) => (reset ? photoData : [...prev, ...photoData]));
      setHasMore(photoData.length === PHOTOS_PER_PAGE);
      setPage(pageNum);
    } catch (err) {
      setError("Failed to load photos");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    if (!newAlbumTitle.trim()) return;

    try {
      const album = await AlbumAPI.create({ userId, title: newAlbumTitle });
      setAlbums((prev) => [...prev, album]);
      setNewAlbumTitle("");
    } catch (err) {
      setError("Failed to create album");
    }
  };

  const handlePhotoAction = async (
    action,
    photoData = null,
    photoId = null
  ) => {
    try {
      switch (action) {
        case "add":
          const newPhoto = await PhotoAPI.create({
            albumId: selectedAlbum.id,
            title: "New Photo",
            url: newPhotoUrl,
            thumbnailUrl: newPhotoUrl,
          });
          setPhotos((prev) => [newPhoto, ...prev]);
          setNewPhotoUrl("");
          break;

        case "update":
          const updated = await PhotoAPI.update(editingPhoto.id, {
            ...editingPhoto,
            url: newPhotoUrl,
            thumbnailUrl: newPhotoUrl,
          });
          setPhotos((prev) =>
            prev.map((p) => (p.id === updated.id ? updated : p))
          );
          setEditingPhoto(null);
          setNewPhotoUrl("");
          break;

        case "delete":
          await PhotoAPI.delete(photoId);
          setPhotos((prev) => prev.filter((p) => p.id !== photoId));
          break;
      }
    } catch (err) {
      setError(`Failed to ${action} photo`);
    }
  };

  // Component views
  const AlbumListView = (
    <>
      <h2>My Albums</h2>
      <div className={style.albumControls}>
        <form onSubmit={handleCreateAlbum} className={style.albumInput}>
          <input
            type="text"
            placeholder="New album title"
            value={newAlbumTitle}
            onChange={(e) => setNewAlbumTitle(e.target.value)}
          />
          <button type="submit">Create Album</button>
        </form>

        <input
          type="text"
          placeholder="Search by id or title"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={style.searchInput}
        />
      </div>

      <ul className={style.albumList}>
        {albums.map((album) => (
          <li key={album.id}>
            <button
              className={style.albumButton}
              onClick={() => setSelectedAlbum(album)}
            >
              {album.id} - {album.title}
            </button>
          </li>
        ))}
      </ul>

      {albums.length === 0 && !loading && <p>No albums found</p>}
    </>
  );

  const PhotoFormView = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!newPhotoUrl.trim()) return;

        if (editingPhoto) {
          handlePhotoAction("update");
        } else {
          handlePhotoAction("add");
        }
      }}
      className={style.photoInput}
    >
      <input
        type="text"
        placeholder="Photo URL"
        value={newPhotoUrl}
        onChange={(e) => setNewPhotoUrl(e.target.value)}
      />
      <button type="submit">
        {editingPhoto ? "Update Photo" : "Add Photo"}
      </button>
      {editingPhoto && (
        <button
          type="button"
          onClick={() => {
            setEditingPhoto(null);
            setNewPhotoUrl("");
          }}
          className={style.cancelButton}
        >
          Cancel
        </button>
      )}
    </form>
  );

  // Add a Lightbox component
  const LightboxView = fullScreenImage && (
    <div className={style.lightbox} onClick={() => setFullScreenImage(null)}>
      <div
        className={style.lightboxContent}
        onClick={(e) => e.stopPropagation()}
      >
        <img src={fullScreenImage.url} alt={fullScreenImage.title} />
        <div
          className={style.closeLightbox}
          onClick={() => setFullScreenImage(null)}
        >
          X
        </div>
      </div>
    </div>
  );

  // Modify the PhotosGridView to add click handler for opening the lightbox
  const PhotosGridView = (
    <div className={style.photoGrid} ref={photosContainerRef}>
      {photos.map((photo) => (
        <div key={photo.id} className={style.photoCard}>
          <div className={style.imageContainer}>
            {!loadingImages[photo.id] && (
              <div className={style.imagePlaceholder}></div>
            )}
            <img
              src={photo.thumbnailUrl || photo.url}
              alt={photo.title}
              width={120}
              height={120}
              loading="lazy"
              onClick={() => setFullScreenImage(photo)}
              onLoad={() => {
                setLoadingImages((prev) => ({ ...prev, [photo.id]: true }));
              }}
              style={{
                opacity: loadingImages[photo.id] ? 1 : 0,
                transition: "opacity 0.3s",
                cursor: "pointer",
              }}
            />
          </div>
          <div className={style.photoTitle}>{photo.title}</div>
          <div className={style.photoControls}>
            <button
              onClick={() => {
                setEditingPhoto(photo);
                setNewPhotoUrl(photo.url);
              }}
            >
              Edit
            </button>
            <button onClick={() => handlePhotoAction("delete", null, photo.id)}>
              Delete
            </button>
          </div>
        </div>
      ))}

      {hasMore && (
        <button
          className={style.loadMoreButton}
          onClick={() => setPage((p) => p + 1)}
          disabled={loading}
        >
          {loading ? "Loading..." : "Load More Photos"}
        </button>
      )}
    </div>
  );

  const AlbumDetailView = selectedAlbum && (
    <>
      <div className={style.albumHeader}>
        <button
          onClick={() => {
            setSelectedAlbum(null);
            navigate("/albums");
          }}
        >
          Back to Albums
        </button>
        <h2>
          Album: {selectedAlbum.id} - {selectedAlbum.title}
        </h2>
      </div>

      {PhotoFormView}
      {PhotosGridView}
    </>
  );

  return (
    <div className={style.container}>
      {LightboxView}

      {error && (
        <div className={style.errorMessage}>
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {loading && <div className={style.loadingIndicator}>Loading...</div>}

      {selectedAlbum ? AlbumDetailView : AlbumListView}
    </div>
  );
};

export default AlbumPage;
