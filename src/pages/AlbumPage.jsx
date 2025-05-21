import React, { useEffect, useState, useRef } from "react";
import { AlbumAPI, PhotoAPI } from "../utils/ServerDB";
import style from "./AlbumPage.module.css";

const AlbumPage = ({ userId = 1 }) => {
    const [albums, setAlbums] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedAlbum, setSelectedAlbum] = useState(null);
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [newAlbumTitle, setNewAlbumTitle] = useState("");
    const [newPhotoUrl, setNewPhotoUrl] = useState("");
    const [editingPhoto, setEditingPhoto] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const PHOTOS_PER_PAGE = 6;

    const lastPhotoRef = useRef(null);



    useEffect(() => {
        
        const loadAlbums = async () => {
            try {
                setLoading(true);
                const albumData = await AlbumAPI.getByUser(userId);
                const filtered = search
                    ? albumData.filter(album =>
                        album.title.toLowerCase().includes(search.toLowerCase()) ||
                        album.id.toString().includes(search)
                    )
                    : albumData;
                setAlbums(filtered);
            } catch (err) {
                setError("Failed to load albums");
                console.error("Error loading albums:", err);
            } finally {
                setLoading(false);
            }
        };
        loadAlbums();
    }, [userId, search]);

    useEffect(() => {
        const loadPhotos = async () => {
            if (selectedAlbum) {
                try {
                    setLoading(true);
                    const photoData = await PhotoAPI.getByAlbum(selectedAlbum.id);
                    const startIndex = (page - 1) * PHOTOS_PER_PAGE;
                    const endIndex = startIndex + PHOTOS_PER_PAGE;
                    const paginatedPhotos = photoData.slice(startIndex, endIndex);

                    if (page === 1) {
                        setPhotos(paginatedPhotos);
                    } else {
                        setPhotos(prev => [...prev, ...paginatedPhotos]);
                    }

                    setHasMore(endIndex < photoData.length);
                } catch (err) {
                    setError("Failed to load photos");
                    console.error("Error loading photos:", err);
                } finally {
                    setLoading(false);
                }
            }
        };
        loadPhotos();
    }, [selectedAlbum, page]);

    const loadMorePhotos = () => setPage(prev => prev + 1);

    const handleSearch = (e) => setSearch(e.target.value);

    const handleAlbumClick = (album) => {
        setSelectedAlbum(album);
        setEditingPhoto(null);
    };

    const handleCreateAlbum = async (e) => {
        e.preventDefault();
        if (!newAlbumTitle.trim()) return;
        try {
            const album = await AlbumAPI.create({
                userId,
                title: newAlbumTitle
            });
            setAlbums(prev => [...prev, album]);
            setNewAlbumTitle("");
        } catch (err) {
            setError("Failed to create album");
            console.error("Error creating album:", err);
        }
    };

    const handleAddPhoto = async (e) => {
        e.preventDefault();
        if (!newPhotoUrl.trim()) return;
        try {
            const photo = await PhotoAPI.create({
                albumId: selectedAlbum.id,
                title: "New Photo",
                url: newPhotoUrl,
                thumbnailUrl: newPhotoUrl
            });
            setPhotos(prev => [photo, ...prev]);
            setNewPhotoUrl("");
        } catch (err) {
            setError("Failed to add photo");
            console.error("Error adding photo:", err);
        }
    };

    const handleDeletePhoto = async (photoId) => {
        try {
            await PhotoAPI.delete(photoId);
            setPhotos(prev => prev.filter(p => p.id !== photoId));
        } catch (err) {
            setError("Failed to delete photo");
            console.error("Error deleting photo:", err);
        }
    };

    const handleEditPhoto = (photo) => {
        setEditingPhoto(photo);
        setNewPhotoUrl(photo.url);
    };

    const handleUpdatePhoto = async (e) => {
        e.preventDefault();
        if (!newPhotoUrl.trim()) return;
        try {
            const updated = await PhotoAPI.update(editingPhoto.id, {
                ...editingPhoto,
                url: newPhotoUrl,
                thumbnailUrl: newPhotoUrl
            });
            setPhotos(prev => prev.map(p => p.id === updated.id ? updated : p));
            setEditingPhoto(null);
            setNewPhotoUrl("");
        } catch (err) {
            setError("Failed to update photo");
            console.error("Error updating photo:", err);
        }
    };

    const handleBackToAlbums = () => {
        setSelectedAlbum(null);
        setPhotos([]);
        setEditingPhoto(null);
        setError(null);
        setPage(1);
        setHasMore(true);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return (
            <div>
                <p className={style.error}>{error}</p>
                <button onClick={() => setError(null)}>Dismiss</button>
            </div>
        );
    }

    return (
        <div className={style.container}>
            {!selectedAlbum ? (
                <>
                    <h2>Albums</h2>
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
                        onChange={handleSearch}
                        className={style.searchInput}
                    />
                    <ul className={style.albumList}>
                        {albums.map((album) => (
                            <li key={album.id}>
                                <button
                                    className={style.albumButton}
                                    onClick={() => handleAlbumClick(album)}
                                >
                                    {album.id} - {album.title}
                                </button>
                            </li>
                        ))}
                    </ul>
                </>
            ) : (
                <>
                    <button onClick={handleBackToAlbums}>Back to Albums</button>
                    <h2>
                        Album: {selectedAlbum.id} - {selectedAlbum.title}
                    </h2>
                    <form
                        onSubmit={editingPhoto ? handleUpdatePhoto : handleAddPhoto}
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
                                onClick={() => setEditingPhoto(null)}
                                className={style.cancelButton}
                            >
                                Cancel
                            </button>
                        )}
                    </form>
                    <div className={style.photoGrid}>
                        {photos.map((photo) => (
                            <div key={photo.id} className={style.photoCard}>
                                <img src={photo.url} alt={photo.title} width={120} height={120} />
                                <div>{photo.title}</div>
                                <button onClick={() => handleEditPhoto(photo)}>Edit</button>
                                <button onClick={() => handleDeletePhoto(photo.id)}>Delete</button>
                            </div>
                        ))}
                    </div>
                    {hasMore && !loading && (
                        <button className={style.loadMoreButton} onClick={loadMorePhotos}>
                            Load More Photos
                        </button>
                    )}
                    {loading && <div>Loading more photos...</div>}
                </>
            )}
        </div>
    );
};

export default AlbumPage;
