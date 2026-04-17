import './ScoreCircle.css';

const ScoreCircle = ({ vote }) => {
  const percentage = Math.round(vote * 10);
  const radius = 20;
  const stroke = 3;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // TMDB colors
  const getColor = (val) => {
    if (val >= 70) return '#21d07a';
    if (val >= 40) return '#d2d531';
    return '#db2360';
  };

  const getTrackColor = (val) => {
    if (val >= 70) return '#204529';
    if (val >= 40) return '#423d0f';
    return '#571435';
  };

  return (
    <div className="score-circle-container">
      <svg height={radius * 2} width={radius * 2}>
        <circle
          stroke={getTrackColor(percentage)}
          strokeWidth={stroke + 1}
          fill="#081c22"
          r={normalizedRadius + 1}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={getColor(percentage)}
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="score-circle-progress"
        />
      </svg>
      <div className="score-text">
        {percentage}<span className="percent-symbol">%</span>
      </div>
    </div>
  );
};

export default ScoreCircle;
