import React, { useState, useEffect } from "react";
import style from "../../../pages/AlbumPage/AlbumPage.module.css";

export const AlbumListView = ({ 
  albums, 
  loading, 
  search, 
  newAlbumTitle, 
  handleCreateAlbum, 
  setNewAlbumTitle, 
  setSelectedAlbum, 
  setSearch 
}) => (
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

export const PhotoFormView = ({ 
  newPhotoUrl, 
  editingPhoto, 
  setNewPhotoUrl, 
  handlePhotoAction, 
  setEditingPhoto 
}) => (
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

export const LightboxView = ({ fullScreenImage, setFullScreenImage }) => 
  fullScreenImage ? (
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
  ) : null;

// export const PhotosGridView = ({ 
//   photos, 
//   hasMore, 
//   loading, 
//   loadingImages, 
//   setLoadingImages, 
//   setFullScreenImage, 
//   setEditingPhoto, 
//   setNewPhotoUrl, 
//   handlePhotoAction, 
//   setPage,
//   photosContainerRef 
// }) => (
//   <div className={style.photoGrid} ref={photosContainerRef}>
//     {photos.map((photo) => (
//       <div key={photo.id} className={style.photoCard}>
//         <div className={style.imageContainer}>
//           {!loadingImages[photo.id] && (
//             <div className={style.imagePlaceholder}></div>
//           )}
//           <img
//             src={photo.thumbnailUrl || photo.url}
//             alt={photo.title}
//             width={120}
//             height={120}
//             loading="lazy"
//             onClick={() => setFullScreenImage(photo)}
//             onLoad={() => {
//               setLoadingImages((prev) => ({ ...prev, [photo.id]: true }));
//             }}
//             style={{
//               opacity: loadingImages[photo.id] ? 1 : 0,
//               transition: "opacity 0.3s",
//               cursor: "pointer",
//             }}
//           />
//         </div>
//         <div className={style.photoTitle}>{photo.title}</div>
//         <div className={style.photoControls}>
//           <button
//             onClick={() => {
//               setEditingPhoto(photo);
//               setNewPhotoUrl(photo.url);
//             }}
//           >
//             Edit
//           </button>
//           <button onClick={() => handlePhotoAction("delete", null, photo.id)}>
//             Delete
//           </button>
//         </div>
//       </div>
//     ))}

//     {hasMore && (
//       <button
//         className={style.loadMoreButton}
//         onClick={() => setPage((p) => p + 1)}
//         disabled={loading}
//       >
//         {loading ? "Loading..." : "Load More Photos"}
//       </button>
//     )}
//   </div>
// );

export const AlbumDetailView = ({ 
  selectedAlbum, 
  setSelectedAlbum, 
  navigate,
  photoFormViewProps,
  photosGridViewProps 
}) => 
  selectedAlbum ? (
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

      <PhotoFormView {...photoFormViewProps} />
      <PhotosGridView {...photosGridViewProps} />
    </>
  ) : null;
  

const PhotoItem = ({ photo, setFullScreenImage, setEditingPhoto, setNewPhotoUrl, handlePhotoAction }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState(photo.thumbnailUrl || photo.url);
  
  // Use an image object to preload the image
  useEffect(() => {
    const img = new Image();
    img.src = photo.thumbnailUrl || photo.url;
    
    img.onload = () => {
      setIsLoaded(true);
    };
    
    img.onerror = () => {
      // If the image fails to load, use a placeholder
      setImgSrc('https://via.placeholder.com/120?text=Failed+to+Load');
      setIsLoaded(true);
    };
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [photo.thumbnailUrl, photo.url]);

  return (
    <div className={style.photoCard}>
      <div className={style.imageContainer}>
        {!isLoaded && <div className={style.imagePlaceholder}></div>}
        <img
          src={imgSrc}
          alt={photo.title}
          className={isLoaded ? style.loadedImage : style.hiddenImage}
          onClick={() => setFullScreenImage(photo)}
          width={120}
          height={120}
          loading="lazy"
        />
      </div>
      <div className={style.photoTitle}>{photo.title}</div>
      <div className={style.photoControls}>
        <button onClick={() => {
          setEditingPhoto(photo);
          setNewPhotoUrl(photo.url);
        }}>
          Edit
        </button>
        <button onClick={() => handlePhotoAction("delete", null, photo.id)}>
          Delete
        </button>
      </div>
    </div>
  );
};

export const PhotosGridView = ({
  photos,
  hasMore,
  loading,
  setFullScreenImage,
  setEditingPhoto,
  setNewPhotoUrl,
  handlePhotoAction,
  setPage,
  photosContainerRef
}) => (
  <div className={style.photoGrid} ref={photosContainerRef}>
    {photos.map((photo) => (
      <PhotoItem
        key={photo.id}
        photo={photo}
        setFullScreenImage={setFullScreenImage}
        setEditingPhoto={setEditingPhoto}
        setNewPhotoUrl={setNewPhotoUrl}
        handlePhotoAction={handlePhotoAction}
      />
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