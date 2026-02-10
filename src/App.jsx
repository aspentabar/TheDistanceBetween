import React, { useState, useEffect } from 'react';

const App = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = window.scrollY / scrollHeight;
      setScrollProgress(Math.min(progress, 1));
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Planet data with real relative diameters (km)
  const planets = [
    { name: 'Mercury', diameter: 4879, color: '#8C7853', intro: 0.1 },
    { name: 'Venus', diameter: 12104, color: '#FFC649', intro: 0.2 },
    { name: 'Mars', diameter: 6779, color: '#CD5C5C', intro: 0.3 },
    { name: 'Jupiter', diameter: 139820, color: '#DAA520', intro: 0.4 },
    { name: 'Saturn', diameter: 116460, color: '#F4A460', intro: 0.5 },
    { name: 'Uranus', diameter: 50724, color: '#4FD0E0', intro: 0.6 },
    { name: 'Neptune', diameter: 49244, color: '#4169E1', intro: 0.7 },
    { name: 'Pluto', diameter: 2376, color: '#DEB887', intro: 0.85 }
  ];

  // Calculate scale factor based on scroll
  const scaleFactor = Math.max(0.15, 1 - scrollProgress * 0.85);
  
  // Earth and Moon data
  const earthDiameter = 12742;
  const moonDiameter = 3474;
  const actualDistance = 384400; // km
  
  // Calculate visible planets based on scroll
  const visiblePlanets = planets.filter(p => scrollProgress >= p.intro);
  
  // Calculate total diameter of all visible planets
  const totalPlanetDiameter = visiblePlanets.reduce((sum, p) => sum + p.diameter, 0);
  const remainingDistance = actualDistance - totalPlanetDiameter;
  const percentFilled = (totalPlanetDiameter / actualDistance) * 100;

  return (
    <div className="relative bg-black text-white">
      {/* Fixed header with stats */}
      <div className="fixed top-0 left-0 right-0 bg-black bg-opacity-80 p-4 z-10 border-b border-gray-700">
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

      {/* Scrollable content area */}
      <div style={{ height: '500vh' }} className="relative">
        {/* Sticky visualization */}
        <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Earth */}
            <div 
              className="absolute left-20 flex flex-col items-center"
              style={{ transform: `scale(${scaleFactor})` }}
            >
              <div 
                className="rounded-full bg-blue-500 shadow-lg"
                style={{ 
                  width: `${earthDiameter / 100}px`, 
                  height: `${earthDiameter / 100}px`,
                  background: 'radial-gradient(circle at 30% 30%, #4A90E2, #1E3A8A)'
                }}
              />
              <div className="text-xs mt-2 text-center">
                <div className="font-bold">Earth</div>
                <div className="text-gray-400">{earthDiameter.toLocaleString()} km</div>
              </div>
            </div>

            {/* Planets in between */}
            <div 
              className="absolute flex items-center gap-4"
              style={{ 
                left: '50%',
                transform: `translateX(-50%) scale(${scaleFactor})`,
                transition: 'transform 0.3s ease-out'
              }}
            >
              {visiblePlanets.map((planet, idx) => {
                // Calculate how far this planet has progressed into view
                const planetProgress = Math.min(1, Math.max(0, (scrollProgress - planet.intro) / 0.05));
                const yOffset = -100 + (planetProgress * 100); // Start -100vh, end at 0
                
                return (
                  <div 
                    key={planet.name}
                    className="flex flex-col items-center"
                    style={{ 
                      transform: `translateY(${yOffset}vh)`,
                      transition: 'transform 0.3s ease-out',
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

            {/* Moon */}
            <div 
              className="absolute right-20 flex flex-col items-center"
              style={{ transform: `scale(${scaleFactor})` }}
            >
              <div 
                className="rounded-full bg-gray-300 shadow-lg"
                style={{ 
                  width: `${moonDiameter / 100}px`, 
                  height: `${moonDiameter / 100}px`,
                  background: 'radial-gradient(circle at 40% 30%, #E0E0E0, #757575)'
                }}
              />
              <div className="text-xs mt-2 text-center">
                <div className="font-bold">Moon</div>
                <div className="text-gray-400">{moonDiameter.toLocaleString()} km</div>
              </div>
            </div>

            {/* Connection line */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-700 -z-10" />
          </div>

          {/* Scroll prompt */}
          {scrollProgress < 0.05 && (
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-center animate-bounce">
              <div className="text-lg mb-2">Scroll down to explore</div>
              <div className="text-3xl">↓</div>
            </div>
          )}

          {/* Message overlay */}
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center bg-black bg-opacity-70 p-6 rounded-lg max-w-md">
            {scrollProgress < 0.1 && (
              <div>
                <p className="text-xl font-bold mb-2">The Moon seems close...</p>
                <p className="text-gray-300">But what if we tried to fit all the planets between Earth and the Moon?</p>
              </div>
            )}
            {scrollProgress >= 0.1 && scrollProgress < 0.85 && (
              <div>
                <p className="text-xl font-bold mb-2">Keep scrolling...</p>
                <p className="text-gray-300">Watch as the planets line up one by one!</p>
              </div>
            )}
            {scrollProgress >= 0.85 && (
              <div>
                <p className="text-xl font-bold mb-2">Mind = Blown! 🌍🪐🌕</p>
                <p className="text-gray-300">All 8 planets (plus Pluto) fit between Earth and the Moon with room to spare!</p>
                <p className="text-yellow-400 mt-2">The Moon is {actualDistance.toLocaleString()} km away.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;