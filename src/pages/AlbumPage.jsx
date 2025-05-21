import React, { useEffect, useState, useRef } from "react";
import { AlbumAPI, PhotoAPI } from "../utils/ServerDB";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { UserStorage } from "../utils/LocalStorage";
import style from "./AlbumPage.module.css";
import {
  AlbumListView,
  PhotoFormView,
  LightboxView,
  PhotosGridView,
  AlbumDetailView,
} from "../components/AlbumPageViews";

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

  // All useEffects and handler functions remain the same
  useEffect(() => {
    loadAlbums();
  }, [userId, search]);

  useEffect(() => {
    if (albumId && albums.length > 0) {
      const albumIdParts = albumId.split("-");
      const id = parseInt(albumIdParts[0]);
      const album = albums.find((a) => a.id === id);
      if (album) setSelectedAlbum(album);
    }
  }, [albumId, albums]);

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

  // Prepare props for components
  const photoFormViewProps = {
    newPhotoUrl,
    editingPhoto,
    setNewPhotoUrl,
    handlePhotoAction,
    setEditingPhoto,
  };

//   const photosGridViewProps = {
//     photos,
//     hasMore,
//     loading,
//     loadingImages,
//     setLoadingImages,
//     setFullScreenImage,
//     setEditingPhoto,
//     setNewPhotoUrl,
//     handlePhotoAction,
//     setPage,
//     photosContainerRef,
//   };

  const photosGridViewProps = {
    photos,
    hasMore,
    loading,
    setFullScreenImage,
    setEditingPhoto,
    setNewPhotoUrl,
    handlePhotoAction,
    setPage,
    photosContainerRef,
  };
  const albumListViewProps = {
    albums,
    loading,
    search,
    newAlbumTitle,
    handleCreateAlbum,
    setNewAlbumTitle,
    setSelectedAlbum,
    setSearch,
  };

  const albumDetailViewProps = {
    selectedAlbum,
    setSelectedAlbum,
    navigate,
    photoFormViewProps,
    photosGridViewProps,
  };

  return (
    <div className={style.container}>
      <LightboxView
        fullScreenImage={fullScreenImage}
        setFullScreenImage={setFullScreenImage}
      />

      {error && (
        <div className={style.errorMessage}>
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {loading && <div className={style.loadingIndicator}>Loading...</div>}

      {selectedAlbum ? (
        <AlbumDetailView {...albumDetailViewProps} />
      ) : (
        <AlbumListView {...albumListViewProps} />
      )}
    </div>
  );
};

export default AlbumPage;
