import React, { useState, useEffect, useRef } from 'react';
import scrollama from 'scrollama';
import earthImage from './assets/earth.png';
import moonImage from './assets/moon.png';

const App = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollerRef = useRef(null);

  // Generate stars once and keep them constant
  const [stars] = useState(() => 
    [...Array(100)].map(() => ({
      size: Math.random() * 2 + 1,
      top: Math.random() * 100,
      left: Math.random() * 100,
      opacity: Math.random() * 0.5 + 0.3,
      animationDelay: Math.random() * 3,
      animationDuration: Math.random() * 2 + 2
    }))
  );

  // Planet data with real relative diameters (km)
  const planets = [
    { name: 'Mercury', diameter: 4879, color: '#8C7853', fact: 'Smallest planet, but has the most eccentric orbit' },
    { name: 'Venus', diameter: 12104, color: '#FFC649', fact: 'Hottest planet with surface temps over 450°C' },
    { name: 'Mars', diameter: 6779, color: '#CD5C5C', fact: 'Home to the largest volcano in our solar system' },
    { name: 'Jupiter', diameter: 139820, color: '#DAA520', fact: 'So massive it could fit all other planets inside' },
    { name: 'Saturn', diameter: 116460, color: '#F4A460', fact: 'Has 146 known moons - more than any other planet' },
    { name: 'Uranus', diameter: 50724, color: '#4FD0E0', fact: 'Rotates on its side at a 98° angle' },
    { name: 'Neptune', diameter: 49244, color: '#4169E1', fact: 'Has winds reaching 2,100 km/h - fastest in solar system' },
    { name: 'Pluto', diameter: 2376, color: '#DEB887', fact: 'Still our favorite dwarf planet ♥' }
  ];

  // Earth and Moon data
  const earthDiameter = 12742;
  const moonDiameter = 3474;
  const actualDistance = 384400; // km

  useEffect(() => {
    // Initialize Scrollama
    const scroller = scrollama();

    scroller
      .setup({
        step: '.step',
        offset: 0.5,
        progress: true,
        debug: false
      })
      .onStepEnter((response) => {
        setCurrentStep(response.index);
      })
      .onStepProgress((response) => {
        setScrollProgress(response.progress);
      });

    // Resize handler
    const handleResize = () => {
      scroller.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      scroller.destroy();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Calculate visible planets based on current step (step 0 is title, step 1+ are planets)
  const visiblePlanets = currentStep > 1 ? planets.slice(0, currentStep - 1) : [];
  
  // Calculate scale factor
  const totalSteps = planets.length + 1;
  const scaleFactor = Math.max(0.15, 1 - (currentStep / totalSteps) * 0.85);
  
  // Calculate total diameter of all visible planets
  const totalPlanetDiameter = visiblePlanets.reduce((sum, p) => sum + p.diameter, 0);
  const remainingDistance = actualDistance - totalPlanetDiameter;
  const percentFilled = (totalPlanetDiameter / actualDistance) * 100;

  // Calculate opacity for title fade out (step 0)
  const titleOpacity = currentStep === 0 ? 1 - scrollProgress : 0;
  
  // Calculate opacity for content fade in - starts fading in at 50% through title fade
  const contentOpacity = currentStep === 0 ? Math.max(0, (scrollProgress - 0.5) / 0.5) : 1;
  
  // Calculate vertical offset for Earth and Moon rising from bottom
  const earthMoonOffset = currentStep === 0 ? (1 - Math.max(0, (scrollProgress - 0.5) / 0.5)) * 100 : 0;

  return (
    <div className="relative bg-black text-white">
      {/* Stationary star background for entire experience */}
      <div className="fixed inset-0 z-0">
        {stars.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-twinkle"
            style={{
              width: star.size + 'px',
              height: star.size + 'px',
              top: star.top + '%',
              left: star.left + '%',
              opacity: star.opacity,
              animationDelay: star.animationDelay + 's',
              animationDuration: star.animationDuration + 's'
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: var(--star-opacity); }
          50% { opacity: 0.1; }
        }
        .animate-twinkle {
          --star-opacity: ${stars[0]?.opacity || 0.5};
          animation: twinkle ease-in-out infinite;
        }
      `}</style>

      {/* Fixed header with stats - only show after scrolling past title */}
      {false && currentStep > 0 && (
        <div 
          className="fixed top-0 left-0 right-0 bg-black bg-opacity-90 p-4 z-20 border-b border-gray-700 transition-opacity duration-500"
          style={{ opacity: contentOpacity }}
        >
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-2">How Far is the Moon?</h1>
            <div className="text-sm space-y-1">
              <div>Distance: {actualDistance.toLocaleString()} km</div>
              <div>Planets Added: {visiblePlanets.length} / {planets.length}</div>
              <div>Space Filled: {percentFilled.toFixed(1)}%</div>
              <div className="text-yellow-400">Remaining: {remainingDistance.toLocaleString()} km</div>
            </div>
          </div>
        </div>
      )}

      {/* Fixed title screen that fades out */}
      <div 
        className="fixed inset-0 flex items-center justify-center pointer-events-none z-40 transition-opacity duration-500"
        style={{ opacity: titleOpacity }}
      >
        <div className="text-center relative z-10">
          <h1 className="text-6xl font-bold mb-4 text-white">The Distance Between</h1>
          <p className="text-lg text-gray-400">by Aspen Tabar</p>
          <div className="mt-16 text-4xl text-gray-500 animate-bounce">
            ↓
          </div>
        </div>
      </div>

      {/* Fixed horizontal line that fades in */}
      <div 
        className="fixed top-1/2 left-0 right-0 h-px bg-gray-700 z-5 transition-opacity duration-1000"
        style={{ opacity: contentOpacity }}
      />

      {/* Scroll steps */}
      <div ref={scrollerRef} className="relative">
        {/* Title screen - Step 0 (invisible, just for scrolling) */}
        <div className="step h-screen" />

        {/* Visualization container */}
        <div className="relative">
          {/* Sticky visualization */}
          <div 
            className="sticky top-0 h-screen flex items-center justify-center overflow-hidden z-10 transition-opacity duration-500"
            style={{ opacity: contentOpacity }}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Earth */}
              <div 
                className="absolute left-1/3 flex flex-col items-center transition-all duration-1000"
                style={{ 
                  transform: `scale(${scaleFactor * 2}) translateY(${earthMoonOffset}vh)`,
                  opacity: contentOpacity,
                  top: '51%',
                  marginTop: `-${earthDiameter / 200}px`
                }}
              >
                  <img 
                    src={earthImage}
                    alt="Earth"
                    className="rounded-full shadow-lg"
                    style={{ 
                      width: `${earthDiameter / 100}px`, 
                      height: `${earthDiameter / 100}px`,
                      objectFit: 'cover'
                    }}
                  />
                  <div className="text-xs mt-2 text-center">
                    <div className="font-bold">Earth</div>
                    <div className="text-gray-400">{earthDiameter.toLocaleString()} km</div>
                  </div>
                </div>

              {/* Planets in between - COMMENTED OUT FOR NOW */}
              {false && (
              <div 
                className="absolute flex items-center gap-4 transition-transform duration-500"
                style={{ 
                  left: '50%',
                  transform: `translateX(-50%) scale(${scaleFactor})`
                }}
              >
                {visiblePlanets.map((planet, idx) => {
                  const isCurrentPlanet = idx === currentStep - 2;
                  const planetProgress = isCurrentPlanet ? scrollProgress : 1;
                  const yOffset = -100 + (planetProgress * 100);
                  
                  return (
                    <div 
                      key={planet.name}
                      className="flex flex-col items-center transition-all duration-500"
                      style={{ 
                        transform: `translateY(${yOffset}vh)`,
                        opacity: planetProgress
                      }}
                    >
                      <div 
                        className="rounded-full shadow-lg"
                        style={{ 
                          width: `${planet.diameter / 100}px`, 
                          height: `${planet.diameter / 100}px`,
                          backgroundColor: planet.color
                        }}
                      />
                      <div className="text-xs mt-2 text-center whitespace-nowrap">
                        <div className="font-bold">{planet.name}</div>
                        <div className="text-gray-400">{planet.diameter.toLocaleString()} km</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              )}

              {/* Moon */}
              <div 
                className="absolute right-1/3 flex flex-col items-center transition-all duration-1000"
                style={{ 
                  transform: `scale(${scaleFactor * 2}) translateY(${earthMoonOffset}vh)`,
                  opacity: contentOpacity,
                  top: '52%',
                  marginTop: `-${moonDiameter / 200}px`
                }}
              >
                  <img 
                    src={moonImage}
                    alt="Moon"
                    className="rounded-full shadow-lg"
                    style={{ 
                      width: `${moonDiameter / 100}px`, 
                      height: `${moonDiameter / 100}px`,
                      objectFit: 'cover'
                    }}
                  />
                  <div className="text-xs mt-2 text-center">
                    <div className="font-bold">Moon</div>
                    <div className="text-gray-400">{moonDiameter.toLocaleString()} km</div>
                  </div>
                </div>

              {/* Connection line - removed, now fixed outside */}

              {/* Dashed line that appears after second text box settles */}
              {currentStep === 1 && scrollProgress > 0.5 && (
                <div className="absolute top-1/2 left-1/3 -z-10" style={{ width: '33.33vw' }}>
                  <svg 
                    style={{
                      width: '100%',
                      height: '2px',
                      overflow: 'visible'
                    }}
                  >
                    <line
                      x1="0"
                      y1="0"
                      x2={`${Math.min((scrollProgress - 0.5) * 200, 100)}%`}
                      y2="0"
                      stroke="white"
                      strokeWidth="2"
                      strokeDasharray="10 10"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Current planet fact */}
            {currentStep > 1 && currentStep <= planets.length + 1 && (
              <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 text-center bg-black bg-opacity-80 p-6 rounded-lg max-w-lg border border-gray-700">
                <div className="text-2xl font-bold mb-2">{planets[currentStep - 2].name}</div>
                <div className="text-gray-300 italic">{planets[currentStep - 2].fact}</div>
              </div>
            )}

            {/* Info text that appears after Earth and Moon are positioned */}
            {currentStep === 1 && (
              <>
                {/* First text box - scrolls from bottom to top and exits */}
                {scrollProgress < 0.6 && (
                  <div 
                    className="absolute left-1/2 transform -translate-x-1/2 text-center"
                    style={{ 
                      bottom: `${scrollProgress * 200 - 20}%`,
                      transition: 'bottom 0.1s linear'
                    }}
                  >
                    <div className="text-sm font-bold text-white bg-black bg-opacity-80 p-4 rounded-lg border border-gray-700">
                      This is the Earth and this is the Moon to scale.
                    </div>
                  </div>
                )}

                {/* Second text box - appears after first exits, stops at 80% */}
                {scrollProgress >= 0.6 && (
                  <div 
                    className="absolute left-1/2 transform -translate-x-1/2 text-center"
                    style={{ 
                      bottom: scrollProgress < 0.75 ? `${(scrollProgress - 0.6) * 533.33}%` : '80%',
                      transition: 'bottom 0.1s linear'
                    }}
                  >
                    <div className="text-sm font-bold text-white bg-black bg-opacity-80 p-4 rounded-lg border border-gray-700">
                      But the actual distance between them is not quite right.
                    </div>
                  </div>
                )}

                {/* Third text box - appears only after second completely stops */}
                {scrollProgress >= 0.75 && (
                  <div 
                    className="absolute left-1/2 transform -translate-x-1/2 text-center"
                    style={{ 
                      bottom: `${Math.max(0, Math.min((scrollProgress - 0.75) * 60, 15))}%`,
                      transition: 'bottom 0.1s linear'
                    }}
                  >
                    <div className="text-sm font-bold text-white bg-black bg-opacity-80 p-4 rounded-lg border border-gray-700">
                      Let's stretch this to the real distance.
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Introduction step - Step 1 */}
          <div className="step" style={{ height: '200vh' }} />

          {/* Planet steps */}
          {planets.map((planet, idx) => (
            <div key={planet.name} className="step" style={{ height: '200vh' }} />
          ))}

          {/* Final step */}
          <div className="step flex items-center justify-center" style={{ height: '200vh' }}>
            {currentStep === planets.length + 2 && (
              <div className="text-center max-w-2xl p-8 bg-black bg-opacity-70 rounded-lg">
                <h2 className="text-4xl font-bold mb-4">Mind = Blown! 🌍🪐🌕</h2>
                <p className="text-xl text-gray-300 mb-4">
                  All 8 planets (plus Pluto) fit between Earth and the Moon with room to spare!
                </p>
                <p className="text-2xl text-yellow-400 font-bold">
                  The Moon is {actualDistance.toLocaleString()} km away
                </p>
                <button 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-colors"
                >
                  ↑ Experience Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;