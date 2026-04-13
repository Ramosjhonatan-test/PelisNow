import './SkeletonLoader.css';

export const SkeletonHero = () => (
  <div className="skeleton-hero">
    <div className="skeleton-content">
      <div className="skeleton-title glass-skeleton"></div>
      <div className="skeleton-text glass-skeleton"></div>
      <div className="skeleton-text glass-skeleton"></div>
      <div className="skeleton-text short glass-skeleton"></div>
      <div className="skeleton-buttons">
         <div className="skeleton-btn glass-skeleton"></div>
         <div className="skeleton-btn glass-skeleton"></div>
      </div>
    </div>
  </div>
);

export const SkeletonCard = () => (
  <div className="skeleton-card glass-skeleton"></div>
);

export const SkeletonRow = () => (
  <div className="skeleton-row">
    <div className="skeleton-row-title glass-skeleton"></div>
    <div className="skeleton-cards-container">
       {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
    </div>
  </div>
);
