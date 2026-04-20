import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '../components/Hero';
import ExploreStrip from '../components/ExploreStrip';
import MovieRow from '../components/MovieRow';
import { fetchMovies, requests } from '../api/tmdb';
import { db } from '../firebase';
import { collection, getDocs, getDoc, doc, onSnapshot } from 'firebase/firestore';
import { UserAuth } from '../context/AuthContext';
import { FaCompass } from 'react-icons/fa';

import { SkeletonHero, SkeletonRow } from '../components/SkeletonLoader';

const Home = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [trending, setTrending] = useState([]);
  const [exclusive, setExclusive] = useState([]);
  const [netflixOriginals, setNetflixOriginals] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [horror, setHorror] = useState([]);
  const [romance, setRomance] = useState([]);
  const [documentaries, setDocumentaries] = useState([]);
  const [marvel, setMarvel] = useState([]);
  const [dc, setDc] = useState([]);
  const [sciFi, setSciFi] = useState([]);
  const [asianDramas, setAsianDramas] = useState([]);
  const [top2026, setTop2026] = useState([]);
  const [top2025, setTop2025] = useState([]);
  const [top2024, setTop2024] = useState([]);
  const [anime, setAnime] = useState([]);
  const [animeMovies, setAnimeMovies] = useState([]);
  const [kids, setKids] = useState([]);
  const [history, setHistory] = useState([]);
  const [sections, setSections] = useState([]); // Dynamic layout config
  const [announcementText, setAnnouncementText] = useState('');
  const [isAnnouncementActive, setIsAnnouncementActive] = useState(false);
  const { user } = UserAuth();

  useEffect(() => {
    // 1. Live listener for Announcement
    const unsubAnn = onSnapshot(doc(db, 'settings', 'app_config'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setIsAnnouncementActive(!!data.isAnnouncementActive);
        setAnnouncementText(data.announcementText || '');
      }
    });

    const getData = async () => {
      try {
        const [
          trendingData, originalsData, horrorData, romanceData, docData, 
          topData, upcomingData, marvelData, dcData, sciFiData, 
          asianDramasData, top2026Data, top2025Data, top2024Data, animeData, 
          animeMoviesData, kidsData
        ] = await Promise.all([
          fetchMovies(requests.fetchTrending),
          fetchMovies(requests.fetchNetflixOriginals),
          fetchMovies(requests.fetchHorrorMovies),
          fetchMovies(requests.fetchRomanceMovies),
          fetchMovies(requests.fetchDocumentaries),
          fetchMovies(requests.fetchTopRated),
          fetchMovies(requests.fetchUpcoming),
          fetchMovies(requests.fetchMarvel),
          fetchMovies(requests.fetchDC),
          fetchMovies(requests.fetchSciFi),
          fetchMovies(requests.fetchAsianDramas),
          fetchMovies(requests.fetchTop2026),
          fetchMovies(requests.fetchTop2025),
          fetchMovies(requests.fetchTop2024),
          fetchMovies(requests.fetchAnime),
          fetchMovies(requests.fetchAnimeMovies),
          fetchMovies(requests.fetchKidsAnimation)
        ]);

        setTrending(trendingData);
        setNetflixOriginals(originalsData);
        setHorror(horrorData);
        setRomance(romanceData);
        setDocumentaries(docData);
        setTopRated(topData);
        setUpcoming(upcomingData);
        setMarvel(marvelData);
        setDc(dcData);
        setSciFi(sciFiData);
        setAsianDramas(asianDramasData);
        setTop2026(top2026Data);
        setTop2025(top2025Data);
        setTop2024(top2024Data);
        setAnime(animeData);
        setAnimeMovies(animeMoviesData);
        setKids(kidsData);
      } catch (err) {
        console.error("TMDB Error:", err);
      }

      // Load Home Configuration
      const fallbackSections = [
        { id: 'top2026', label: 'Estrenos 2026', visible: true, order: 0.5 },
        { id: 'history', label: 'Continuar Viendo', visible: true, order: 1 },
        { id: 'exclusive', label: 'Películas Seleccionadas', visible: true, order: 2 },
        { id: 'netflixOriginals', label: 'Destacados', visible: true, order: 3 },
        { id: 'trending', label: 'Tendencias Hoy', visible: true, order: 4 },
        { id: 'top2025', label: 'Top Estrenos 2025', visible: true, order: 5 },
        { id: 'marvel', label: 'Universo Marvel', visible: true, order: 6 },
        { id: 'dc', label: 'Universo DC', visible: true, order: 6.5 },
        { id: 'asianDramas', label: 'Doramas y Asia', visible: true, order: 7 },
        { id: 'scifi', label: 'Ciencia Ficción', visible: true, order: 8.5 },
        { id: 'anime', label: 'Series de Anime', visible: true, order: 8.6 },
        { id: 'animeMovies', label: 'Películas de Anime', visible: true, order: 8.7 },
        { id: 'kids', label: 'Animación y Niños', visible: true, order: 9 },
        { id: 'top2024', label: 'Mejores del 2024', visible: true, order: 9 },
        { id: 'horror', label: 'Terror', visible: true, order: 10 },
        { id: 'romance', label: 'Romance', visible: true, order: 11 },
        { id: 'topRated', label: 'Mejor Valoradas', visible: true, order: 12 },
        { id: 'upcoming', label: 'Próximos Estrenos', visible: true, order: 13 },
        { id: 'documentaries', label: 'Documentales', visible: true, order: 14 },
      ];

      try {
        const configSnap = await getDoc(doc(db, 'settings', 'homepage_sections'));
        if (configSnap.exists()) {
          let loadedSections = configSnap.data().sections || [];
          // Mandatory check: if we are in 2026, ensure top2026 is present at the top
          if (!loadedSections.find(s => s.id === 'top2026')) {
            loadedSections = [
              { id: 'top2026', label: 'Estrenos 2026', visible: true, order: 0.5 },
              ...loadedSections
            ];
          }
          setSections(loadedSections);
        } else {
          setSections(fallbackSections);
        }
      } catch (err) { setSections(fallbackSections); }

      // Exclusive Data
      try {
        const querySnapshot = await getDocs(collection(db, 'exclusive_movies'));
        const exclusiveData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setExclusive(exclusiveData);
      } catch (err) {}

      // History Data
      try {
        if (user?.email) {
          const userSnap = await getDoc(doc(db, 'users', user.email));
          if (userSnap.exists()) {
             setHistory(userSnap.data().history?.slice().reverse() || []);
          }
        }
      } catch (err) {}
      
      setLoading(false);
    };

    getData();
    return () => unsubAnn();
  }, [user]);

  const heroMovies = netflixOriginals.length > 0 ? netflixOriginals : trending;

  const getSectionData = (id) => {
    switch(id) {
       case 'history': return history;
       case 'exclusive': return exclusive.filter(m => !m.sectionId || m.sectionId === 'exclusive');
       case 'netflixOriginals': return netflixOriginals;
       case 'trending': return trending;
       case 'topRated': return topRated;
       case 'upcoming': return upcoming;
       case 'horror': return horror;
       case 'romance': return romance;
       case 'documentaries': return documentaries;
       case 'marvel': return marvel;
       case 'dc': return dc;
       case 'scifi': return sciFi;
       case 'asianDramas': return asianDramas;
       case 'top2026': return top2026;
       case 'top2025': return top2025;
       case 'top2024': return top2024;
       case 'anime': return anime;
       case 'animeMovies': return animeMovies;
       case 'kids': return kids;
       default: return exclusive.filter(m => m.sectionId === id);
    }
  };

  const getDiscoverUrl = (id) => {
    switch(id) {
      case 'horror': return '/discover?genre=27&type=movie';
      case 'romance': return '/discover?genre=10749&type=movie';
      case 'documentaries': return '/discover?genre=99&type=movie';
      case 'scifi': return '/discover?genre=878&type=movie';
      case 'anime': return '/discover?genre=16&type=tv';
      case 'animeMovies': return '/discover?genre=16&type=movie';
      case 'kids': return '/discover?genre=10751&type=movie';
      case 'asianDramas': return '/discover?genre=18&type=tv'; // Using Drama for Asian Dramas or similar
      case 'top2026': return '/discover?year=2026&type=movie';
      case 'top2025': return '/discover?year=2025&type=movie';
      case 'top2024': return '/discover?year=2024&type=movie';
      case 'trending': return '/discover?sort=popularity.desc';
      case 'topRated': return '/discover?sort=vote_average.desc';
      case 'upcoming': return '/discover?sort=primary_release_date.asc';
      default: return '/discover';
    }
  };

  if (loading) {
    return (
      <div className='home animate-fade-in'>
        <SkeletonHero />
        <div style={{ padding: '0 0 50px 0', marginTop: '-150px', position: 'relative', zIndex: 10 }}>
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </div>
    );
  }

  return (
    <div className='home animate-fade-in'>
      {isAnnouncementActive && announcementText && (
        <div style={{
          position: 'fixed',
          top: '90px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          width: '90%',
          maxWidth: '500px',
          background: 'rgba(15, 16, 20, 0.9)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(229, 9, 20, 0.5)',
          borderRadius: '12px',
          padding: '12px 20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
          animation: 'slideDownNav 0.5s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
            <span style={{ fontSize: '1.2rem' }}>📢</span>
            <p style={{ 
              margin: 0, 
              color: '#fff', 
              fontSize: '0.9rem', 
              fontWeight: '500', 
              textAlign: 'center',
              lineHeight: '1.4'
            }}>
              {announcementText}
            </p>
          </div>
        </div>
      )}
      <Hero movies={heroMovies} />
      <div style={{ padding: '0 0 50px 0', marginTop: '-150px', position: 'relative', zIndex: 10 }}>
        {sections
          .filter(section => section.visible)
          .map(section => {
            const rowData = getSectionData(section.id);
            if (section.id === 'history' && rowData.length === 0) return null;
            if (section.id === 'exclusive' && rowData.length === 0) return null;
            
            return (
              <div key={section.id}>
                {section.id === 'netflixOriginals' && <ExploreStrip />}
                <MovieRow 
                  title={section.label} 
                  movies={rowData} 
                  isTop10={section.id === 'trending'} 
                  discoverUrl={getDiscoverUrl(section.id)}
                />
              </div>
            );
          })
        }
        
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <button 
            onClick={() => navigate('/discover')}
            style={{
              padding: '16px 45px',
              backgroundColor: 'rgba(229, 9, 20, 0.9)',
              border: 'none',
              borderRadius: '30px',
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 8px 25px rgba(229, 9, 20, 0.4)',
              transition: 'transform 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <FaCompass size={20} /> Explorar Galería Completa
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
