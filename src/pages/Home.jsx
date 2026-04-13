import { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import MovieRow from '../components/MovieRow';
import { fetchMovies, requests } from '../api/tmdb';
import { db } from '../firebase';
import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
import { UserAuth } from '../context/AuthContext';

import { SkeletonHero, SkeletonRow } from '../components/SkeletonLoader';

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [trending, setTrending] = useState([]);
  const [exclusive, setExclusive] = useState([]);
  const [netflixOriginals, setNetflixOriginals] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [horror, setHorror] = useState([]);
  const [romance, setRomance] = useState([]);
  const [documentaries, setDocumentaries] = useState([]);
  const [history, setHistory] = useState([]);
  const [sections, setSections] = useState([]); // Dynamic layout config
  const { user } = UserAuth();

  useEffect(() => {
    const getData = async () => {
      try {
        const [trendingData, originalsData, horrorData, romanceData, docData, topData, upcomingData] = await Promise.all([
          fetchMovies(requests.fetchTrending),
          fetchMovies(requests.fetchNetflixOriginals),
          fetchMovies(requests.fetchHorrorMovies),
          fetchMovies(requests.fetchRomanceMovies),
          fetchMovies(requests.fetchDocumentaries),
          fetchMovies(requests.fetchTopRated),
          fetchMovies(requests.fetchUpcoming)
        ]);

        setTrending(trendingData);
        setNetflixOriginals(originalsData);
        setHorror(horrorData);
        setRomance(romanceData);
        setDocumentaries(docData);
        setTopRated(topData);
        setUpcoming(upcomingData);
      } catch (err) {
        console.error("TMDB Error:", err);
      }

      // Load Home Configuration (Admin controlled)
      const fallbackSections = [
        { id: 'history', label: 'Continuar Viendo', visible: true, order: 1 },
        { id: 'exclusive', label: 'Películas Seleccionadas', visible: true, order: 2 },
        { id: 'netflixOriginals', label: 'Destacados', visible: true, order: 3 },
        { id: 'trending', label: 'Tendencias', visible: true, order: 4 },
        { id: 'horror', label: 'Terror', visible: true, order: 5 },
        { id: 'romance', label: 'Romance', visible: true, order: 6 },
        { id: 'documentaries', label: 'Documentales', visible: true, order: 7 },
        { id: 'topRated', label: 'Mejor Valoradas', visible: true, order: 8 },
        { id: 'upcoming', label: 'Próximos Estrenos', visible: true, order: 9 },
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

  const featuredMovie = netflixOriginals.length > 0 ? netflixOriginals[Math.floor(Math.random() * netflixOriginals.length)] : null;

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
      <Hero movie={featuredMovie} />
      <div style={{ padding: '0 0 50px 0', marginTop: '-150px', position: 'relative', zIndex: 10 }}>
        {sections
          .filter(section => section.visible)
          .map(section => {
            const rowData = getSectionData(section.id);
            // Only show history if not empty
            if (section.id === 'history' && rowData.length === 0) return null;
            // Only show exclusive if not empty
            if (section.id === 'exclusive' && rowData.length === 0) return null;
            
            return <MovieRow key={section.id} title={section.label} movies={rowData} />;
          })
        }
      </div>
    </div>
  );
};

export default Home;
