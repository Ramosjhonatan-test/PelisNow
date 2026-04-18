import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '../components/Hero';
import ExploreStrip from '../components/ExploreStrip';
import MovieRow from '../components/MovieRow';
import { fetchMovies, requests } from '../api/tmdb';
import { db } from '../firebase';
import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
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
  const [top2025, setTop2025] = useState([]);
  const [top2024, setTop2024] = useState([]);
  const [anime, setAnime] = useState([]);
  const [animeMovies, setAnimeMovies] = useState([]);
  const [kids, setKids] = useState([]);
  const [history, setHistory] = useState([]);
  const [sections, setSections] = useState([]); // Dynamic layout config
  const { user } = UserAuth();

  useEffect(() => {
    // Pre-check for optimization
    if (trending.length > 0) setLoading(false);

    const getData = async () => {
      try {
        const [
          trendingData, 
          originalsData, 
          horrorData, 
          romanceData, 
          docData, 
          topData, 
          upcomingData,
          marvelData,
          dcData,
          sciFiData,
          asianDramasData,
          top2025Data,
          top2024Data,
          animeData,
          animeMoviesData,
          kidsData
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
        setTop2025(top2025Data);
        setTop2024(top2024Data);
        setAnime(animeData);
        setAnimeMovies(animeMoviesData);
        setKids(kidsData);
      } catch (err) {
        console.error("TMDB Error:", err);
      }

      // Load Home Configuration (Admin controlled)
      const fallbackSections = [
        { id: 'history', label: 'Continuar Viendo', visible: true, order: 1 },
        { id: 'exclusive', label: 'Películas Seleccionadas', visible: true, order: 2 },
        { id: 'netflixOriginals', label: 'Destacados', visible: true, order: 3 },
        { id: 'trending', label: 'Tendencias', visible: true, order: 4 },
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
          setSections(configSnap.data().sections || []);
        } else {
          setSections(fallbackSections);
        }
      } catch (err) { 
        console.warn("Config Error:", err); 
        setSections(fallbackSections);
      }

      // Firestore Data (Exclusive)
      try {
        const querySnapshot = await getDocs(collection(db, 'exclusive_movies'));
        const exclusiveData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setExclusive(exclusiveData);
      } catch (err) {
        // Silent error for anonymous users if rules aren't public yet
      }

      // History Data
      try {
        if (user?.email) {
          const userSnap = await getDoc(doc(db, 'users', user.email));
          if (userSnap.exists()) {
             setHistory(userSnap.data().history?.slice().reverse() || []); // Most recent first
          }
        }
      } catch (err) { console.warn("Firestore History Error:", err); }
      
      setLoading(false);
    };
    getData();
  }, [user]);
  // The carousel will pick the first 5 automatically
  const heroMovies = netflixOriginals.length > 0 ? netflixOriginals : trending;

  // Map Section ID to its data
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
       case 'top2025': return top2025;
       case 'top2024': return top2024;
       case 'anime': return anime;
       case 'animeMovies': return animeMovies;
       case 'kids': return kids;
       default: 
         // Custom categories for exclusive movies
         return exclusive.filter(m => m.sectionId === id);
    }
  };

  if (loading) {
    return (
      <div className='home animate-fade-in'>
        <SkeletonHero />
        <div style={{ padding: '0 0 50px 0', marginTop: '-150px', position: 'relative', zIndex: 10 }}>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </div>
    );
  }

  return (
    <div className='home animate-fade-in'>
      <Hero movies={heroMovies} />
      <div style={{ padding: '0 0 50px 0', marginTop: '-150px', position: 'relative', zIndex: 10 }}>
        {sections
          .filter(section => section.visible)
          .map(section => {
            const rowData = getSectionData(section.id);
            // Only show history if not empty
            if (section.id === 'history' && rowData.length === 0) return null;
            // Only show exclusive if not empty
            if (section.id === 'exclusive' && rowData.length === 0) return null;
            
            return (
              <div key={section.id}>
                {section.id === 'netflixOriginals' && <ExploreStrip />}
                <MovieRow 
                  title={section.label} 
                  movies={rowData} 
                  isTop10={section.id === 'trending'} 
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
              fontFamily: 'var(--font-main)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 8px 25px rgba(229, 9, 20, 0.4)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
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
