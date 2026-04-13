import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaPlay, FaPlus, FaArrowLeft, FaTimes, FaFilm, FaInfoCircle, FaLanguage } from 'react-icons/fa';
import { getImageUrl, fetchSeasonEpisodes } from '../api/tmdb';
import { UserAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { arrayUnion, doc, setDoc, getDoc } from 'firebase/firestore';
import MovieCard from '../components/MovieCard';
import { SkeletonHero } from '../components/SkeletonLoader';
import './MovieDetails.css';

const MovieDetails = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [playVideo, setPlayVideo] = useState(null); // 'stream' or 'trailer'
  const [fastreamInput, setFastreamInput] = useState('');
  const [isSavingUrl, setIsSavingUrl] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [episodesList, setEpisodesList] = useState([]);
  const { user } = UserAuth();

  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        // 1. Get custom Firestore data
        let customData = null;
        try {
          const docRef = doc(db, 'exclusive_movies', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            customData = { id: docSnap.id, ...docSnap.data() };
          }
        } catch (err) { /* Silencio si falla permisos */ }

        // 2. Fetch TMDB Data
        const response = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=c9ae557803081c8546b65026fec5a5bc&language=es-MX&append_to_response=videos,similar`);
        let tmdbData = await response.json();
        
        if (!tmdbData.id) {
           // Try TV
           const tvRes = await fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=c9ae557803081c8546b65026fec5a5bc&language=es-MX&append_to_response=videos,similar`);
           tmdbData = await tvRes.json();
        }

        if (tmdbData.id || customData) {
           const finalMovie = { ...tmdbData, ...customData };
           setMovie(finalMovie);
           setSimilar(tmdbData.similar?.results?.slice(0, 6) || []);

           if (!finalMovie.title && finalMovie.seasons && finalMovie.seasons.length > 0) {
             const defaultSeason = finalMovie.seasons.find(s => s.season_number > 0) || finalMovie.seasons[0];
             setSelectedSeason(defaultSeason.season_number);
           }
        }
      } catch (error) {
        console.error("Fetch Error:", error);
      }
    };
    fetchMovieData();
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const loadEpisodes = async () => {
      if (movie && (!movie.title && movie.name) && movie.seasons) {
        const data = await fetchSeasonEpisodes(movie.id, selectedSeason);
        if (data && data.episodes) {
          setEpisodesList(data.episodes);
        }
      }
    };
    loadEpisodes();
  }, [movie, selectedSeason]);

  const saveMovie = async () => {
    if (user?.email && movie) {
      const userRef = doc(db, 'users', user.email);
      await setDoc(userRef, {
        savedMovies: arrayUnion({
          id: movie.id,
          title: movie.title || movie.name,
          poster_path: movie.poster_path,
        })
      }, { merge: true });
      alert('Película guardada');
    } else {
      alert('Por favor inicia sesión para guardar una película');
    }
  };

  const addToHistory = async () => {
    if (user?.email && movie) {
      try {
        const userRef = doc(db, 'users', user.email);
        const userSnap = await getDoc(userRef);
        let currentHistory = userSnap.exists() ? (userSnap.data().history || []) : [];
        currentHistory = currentHistory.filter(m => m.id !== movie.id);
        currentHistory.push({
          id: movie.id,
          title: movie.title || movie.name,
          poster_path: movie.poster_path,
          type: movie.title ? 'movie' : 'tv'
        });
        if (currentHistory.length > 20) currentHistory.shift();
        await setDoc(userRef, { history: currentHistory }, { merge: true });
      } catch (e) { console.warn("History Error:", e); }
    }
  };

  const handlePlayClick = (type) => {
    setPlayVideo(type);
    if (type.includes('stream')) addToHistory();
  };

  const handleQuickSave = async () => {
    if (!fastreamInput.trim() || !user || user.email !== 'danielacopana@gmail.com') return;
    setIsSavingUrl(true);
    try {
      const docRef = doc(db, 'exclusive_movies', String(movie.id || movie.tmdb_id));
      await setDoc(docRef, {
        id: movie.id,
        tmdb_id: movie.id,
        title: movie.title || movie.name || '',
        poster_path: movie.poster_path || '',
        backdrop_path: movie.backdrop_path || '',
        overview: movie.overview || '',
        video_url_spanish: fastreamInput.trim(),
        sectionId: movie.sectionId || 'exclusive',
        isExclusive: true
      }, { merge: true });
      
      setMovie(prev => ({ ...prev, video_url_spanish: fastreamInput.trim(), isExclusive: true }));
      setFastreamInput('');
      alert("¡Enlace guardado! La película ahora es Premium.");
    } catch (error) {
      console.error("Error guardando enlace rápido:", error);
      alert("Error al guardar enlace.");
    }
    setIsSavingUrl(false);
  };

  const premiumStreamUrl = movie ? (movie.video_url_spanish || movie.video_url || '') : '';
  
  const getPublicStreamUrl = () => {
    if (!movie) return '';
    const movieId = movie.tmdb_id || movie.id;
    const isTv = !movie.title;
    return isTv 
      ? `https://player.videasy.net/tv/${movieId}/${selectedSeason}/${selectedEpisode}?color=4a7af7`
      : `https://player.videasy.net/movie/${movieId}?color=4a7af7`;
  };

  if (!movie) {
    return (
      <div className="details-page animate-fade-in" style={{ paddingTop: '80px', minHeight: '100vh' }}>
        <SkeletonHero />
      </div>
    );
  }

  const publicStreamUrl = getPublicStreamUrl();

  const officialTrailer = movie?.videos?.results?.find(vid => vid.type === 'Trailer' && vid.site === 'YouTube');
  const trailerUrl = officialTrailer ? `https://www.youtube.com/embed/${officialTrailer.key}?autoplay=1` : null;

  return (
    <div className="details-page animate-fade-in">
      <div className="details-hero" style={{ 
        backgroundImage: `linear-gradient(to top, var(--bg-primary) 5%, rgba(15, 16, 20, 0.4) 100%), url(${movie.isExclusive && movie.backdrop_path ? movie.backdrop_path : getImageUrl(movie.backdrop_path || movie.poster_path)})` 
      }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <Link to="/" className="back-btn-float"><FaArrowLeft /> Volver</Link>
          
          <div className="movie-main-grid">
            <div className="poster-side">
              <img 
                src={movie.isExclusive && movie.poster_path ? movie.poster_path : getImageUrl(movie.poster_path)} 
                alt={movie.title || movie.name} 
                className="floating-poster" 
              />
            </div>
            
            <div className="info-side">
              <div className="info-header">
                <h1 className="movie-title-large">{movie.title || movie.name}</h1>
                <div className="movie-meta-row">
                  <span className="year-tag">{movie.release_date?.split('-')[0] || movie.first_air_date?.split('-')[0]}</span>
                  <span className="type-tag">{movie.title ? 'Película' : 'Serie'}</span>
                  {movie.vote_average > 0 && <span className="rating-tag">⭐ {movie.vote_average.toFixed(1)}</span>}
                </div>
              </div>

              <p className="movie-description-large">
                {movie.overview || 'Esta increíble producción no cuenta con una descripción detallada todavía, pero promete ser una experiencia inolvidable.'}
              </p>
              
              {!movie.title && movie.seasons && (
                <div className="series-selector-container">
                  <div className="season-selector">
                    <label>Temporada:</label>
                    <select 
                      className="glass-select" 
                      value={selectedSeason} 
                      onChange={(e) => {
                        setSelectedSeason(Number(e.target.value));
                        setSelectedEpisode(1);
                      }}
                    >
                      {movie.seasons.filter(s => s.season_number > 0).map(s => (
                        <option key={s.id} value={s.season_number}>
                          {s.name} ({s.episode_count} eps)
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {episodesList.length > 0 && (
                     <div className="episodes-selector">
                       <label>Capítulo:</label>
                       <div className="episodes-pills">
                          {episodesList.map(ep => (
                            <button 
                              key={ep.id} 
                              className={`ep-pill ${selectedEpisode === ep.episode_number ? 'active' : ''}`}
                              onClick={() => setSelectedEpisode(ep.episode_number)}
                            >
                              {ep.episode_number}. {ep.name || 'Episodio'}
                            </button>
                          ))}
                       </div>
                     </div>
                  )}
                </div>
              )}

              <div className="main-action-group">
                {(premiumStreamUrl && movie.title) ? (
                  <button className="btn-premium-play" onClick={() => handlePlayClick('stream_premium')}>
                    <FaPlay /> Ver (Latino HD)
                  </button>
                ) : (
                  <button className="btn-premium-play fallback-btn" style={{ opacity: 0.5, cursor: 'not-allowed' }} title={movie.title ? "El administrador aún no ha subido el video para esta película" : "Usa el servidor público para series"}>
                    <FaPlay /> {movie.title ? 'Premium Bloqueado' : 'Sólo Público'}
                  </button>
                )}

                <button className="btn-glass-secondary" onClick={() => handlePlayClick('stream_public')}>
                  <FaPlay /> Ver Público (Videasy)
                </button>

                {trailerUrl && (
                  <button className="btn-glass-secondary" onClick={() => handlePlayClick('trailer')}>
                    Trailer
                  </button>
                )}
                <button className="btn-glass-icon" onClick={saveMovie} title="Añadir a mi lista">
                  <FaPlus />
                </button>
              </div>

              {user?.email === 'danielacopana@gmail.com' && movie.title && (
                <div className="admin-quick-edit">
                  <p className="admin-badge"><FaInfoCircle /> Panel Admin Rápido (1-Clic)</p>
                  <div className="quick-edit-row">
                    <input 
                      type="text" 
                      placeholder="Pega aquí el enlace de Fastream (https://fastream.to/...)" 
                      value={fastreamInput} 
                      onChange={(e) => setFastreamInput(e.target.value)} 
                    />
                    <button onClick={handleQuickSave} disabled={isSavingUrl || !fastreamInput.trim()}>
                      {isSavingUrl ? 'Guardando...' : 'Hacer Premium'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {playVideo && (
          <div className="video-modal-overlay">
            <div className="video-modal-content glass">
              <div className="player-top-bar">
                <div className="player-controls-left">
                  <div className="server-tabs">
                    {playVideo === 'stream_premium' && (
                      <button className="server-tab active">⭐ Fastream (Latino HD)</button>
                    )}
                    {playVideo === 'stream_public' && (
                      <button className="server-tab active">🌐 Videasy (Servidor Público)</button>
                    )}
                    {playVideo === 'trailer' && (
                      <button className="server-tab active">🎬 Trailer</button>
                    )}
                  </div>
                  {playVideo === 'stream_public' && (
                    <div className="language-tip">
                      <FaInfoCircle /> <span>Audio: Elige Gekko en el boton ☁️ superior derecho</span>
                    </div>
                  )}
                </div>
                <button className="close-player-btn" onClick={() => setPlayVideo(null)}><FaTimes /></button>
              </div>

              <div className="iframe-wrapper">
                <iframe 
                  src={
                    playVideo === 'stream_premium' ? premiumStreamUrl : 
                    playVideo === 'stream_public' ? publicStreamUrl : 
                    trailerUrl
                  } 
                  title="Reproduction"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>
        )}
      </div>

      {similar.length > 0 && (
        <div className="similar-movies">
          <h2>Títulos Similares</h2>
          <div className="similar-grid">
            {similar.map(item => <MovieCard key={item.id} movie={item} />)}
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieDetails;
