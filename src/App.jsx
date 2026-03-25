import React, { useState, useEffect, useRef } from 'react';
import scrollama from 'scrollama';
import earthImage from './assets/earth.png';
import moonImage from './assets/moon.png';
import mercuryImage from './assets/mercury.png';
import venusImage from './assets/venus.png';
import marsImage from './assets/mars.png';
import jupiterImage from './assets/jupiter.png';
import saturnImage from './assets/saturn.png';
import uranusImage from './assets/uranus.png';
import neptuneImage from './assets/neptune.png';

const PlanetLabel = ({ name, diameter, scale, above }) => (
  <div
    className="absolute left-1/2 text-center whitespace-nowrap"
    style={{
      transform: `translateX(-50%) scale(${1 / scale})`,
      transformOrigin: above ? 'bottom center' : 'top center',
      ...(above
        ? { bottom: '100%', marginBottom: '8px' }
        : { top: '100%', marginTop: '8px' }),
    }}
  >
    <div className="font-bold text-sm">{name}</div>
    <div className="text-gray-400 text-xs">{diameter.toLocaleString()} km</div>
  </div>
);

const App = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollerRef = useRef(null);
  const justEnteredRef = useRef(false);

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
    { name: 'Mercury', diameter: 4879,   image: mercuryImage, aboveLabel: true  },
    { name: 'Venus',   diameter: 12104,  image: venusImage,   aboveLabel: false },
    { name: 'Mars',    diameter: 6779,   image: marsImage,    aboveLabel: true  },
    { name: 'Jupiter', diameter: 139820, image: jupiterImage, aboveLabel: false },
    { name: 'Saturn',  diameter: 116460, image: saturnImage,  aboveLabel: false },
    { name: 'Uranus',  diameter: 50724,  image: uranusImage,  aboveLabel: false },
    { name: 'Neptune', diameter: 49244,  image: neptuneImage, aboveLabel: false },
  ];

  // Earth and Moon data
  const earthDiameter = 12742;
  const moonDiameter = 3474;


  const KM_PER_PX = 65; // lower = larger everything, relative scale stays the same
  const ROW_GAP_PX = 8;
  const INITIAL_GAP_PX = 100; // wider Earth-Moon gap in step 1 for the dashed line
  const earthPx = earthDiameter / KM_PER_PX;
  const moonPx = moonDiameter / KM_PER_PX;

  // Dashed line geometry uses the larger initial gap (only shown in step 1)
  const dashEarthCX = earthPx / 2;
  const dashMoonCX = earthPx + INITIAL_GAP_PX + moonPx / 2;
  const dashDelta = dashMoonCX - dashEarthCX;

  useEffect(() => {
    const scroller = scrollama();

    scroller
      .setup({
        step: '.step',
        offset: 0.5,
        progress: true,
        debug: false
      })
      .onStepEnter((response) => {
        justEnteredRef.current = true;
        setCurrentStep(response.index);
        setScrollProgress(0);
      })
      .onStepProgress((response) => {
        if (justEnteredRef.current) {
          justEnteredRef.current = false;
          return;
        }
        setScrollProgress(response.progress);
      });

    const handleResize = () => { scroller.resize(); };
    window.addEventListener('resize', handleResize);

    return () => {
      scroller.destroy();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const visiblePlanets = currentStep > 1 ? planets.slice(0, currentStep - 1) : [];

  const totalSteps = planets.length + 1;

  // Compute the target scale for any given step (used for smooth interpolation)
  const getTargetScale = (step) => {
    const stepSc = Math.max(0.10, 1 - (step / totalSteps) * 0.85);
    const planetsAtStep = step > 1 ? planets.slice(0, step - 1) : [];
    const maxPx = planetsAtStep.length > 0
      ? Math.max(earthPx, ...planetsAtStep.map(p => p.diameter / KM_PER_PX))
      : earthPx;
    return Math.min(stepSc, (window.innerHeight * 0.75) / maxPx);
  };

  // Phase 1 (scrollProgress 0→0.5): scale transitions to new target
  // Phase 2 (scrollProgress 0.5→1): planet rises into position
  const scalePhase = Math.min(scrollProgress * 2, 1);
  const prevScale = getTargetScale(Math.max(0, currentStep - 1));
  const currScale = getTargetScale(currentStep);
  const scaleFactor = prevScale + (currScale - prevScale) * scalePhase;

  // Narrative shown at the bottom of the screen for each planet step
  const planetNarratives = [
    "Mercury, the smallest planet at 4,879 km wide, slips into the gap with ease.",
    "Venus — nearly Earth's twin at 12,104 km — joins the lineup.",
    "Mars, the Red Planet, adds its 6,779 km to the row.",
    "Jupiter, the solar system's giant at 139,820 km wide, needs serious room.",
    "Saturn, ringed and nearly as large, lines up beside Jupiter.",
    "Uranus, an ice giant at 50,724 km, continues to fill the space.",
    "Neptune, the farthest planet, completes the lineup. All 7 planets fit — side by side — in the gap between Earth and the Moon.",
  ];

  // Moon starts with a larger gap so the dashed line is visible in step 1.
  // As Mercury's spread phase runs (step 2, scrollProgress 0.5→0.75), the extra
  // gap closes so the planet steps are unaffected.
  const firstSpread = currentStep === 2
    ? Math.min(1, Math.max(0, (scrollProgress - 0.5) * 4))
    : currentStep > 2 ? 1 : 0;
  const moonMarginLeft = ROW_GAP_PX + (INITIAL_GAP_PX - ROW_GAP_PX) * (1 - firstSpread);

  const titleOpacity = currentStep === 0 ? 1 - scrollProgress : 0;
  const contentOpacity = currentStep === 0 ? Math.max(0, (scrollProgress - 0.5) / 0.5) : 1;
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

      {/* Fixed title screen that fades out */}
      <div
        className="fixed inset-0 flex items-center justify-center pointer-events-none z-40 transition-opacity duration-500"
        style={{ opacity: titleOpacity }}
      >
        <div className="text-center relative z-10 px-6">
          <h1 className="text-6xl font-bold mb-4 text-white whitespace-nowrap">The Distance Between</h1>
          <p className="text-lg text-gray-400 mb-4">by Aspen Tabar</p>
          <p className="text-base text-gray-500 leading-relaxed">
            The Moon is our nearest neighbor in space — but just how far away is it, really?
            Scroll to find out what fits in the gap.
          </p>
          <div className="mt-12 text-4xl text-gray-500 animate-bounce">
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
              {/* Unified lineup row: Earth | planets | Moon */}
              <div
                className="absolute flex items-center transition-opacity duration-500"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) scale(${scaleFactor})`,
                  opacity: contentOpacity
                }}
              >
                {/* Earth */}
                <div
                  className="relative flex-shrink-0"
                  style={{
                    width: `${earthPx}px`,
                    height: `${earthPx}px`,
                    transform: `translateY(${earthMoonOffset}vh)`,
                    transition: currentStep === 0 ? 'transform 1000ms ease' : 'none'
                  }}
                >
                  <img
                    src={earthImage}
                    alt="Earth"
                    className="rounded-full w-full h-full"
                    style={{ objectFit: 'cover' }}
                  />
                  <PlanetLabel name="Earth" diameter={earthDiameter} scale={scaleFactor} />
                </div>

                {/* Planets in between */}
                {visiblePlanets.map((planet, idx) => {
                  const isCurrentPlanet = idx === currentStep - 2;
                  // Sub-phase 2a (0.5→0.75): Earth/Moon spread apart
                  const spreadProgress = isCurrentPlanet
                    ? Math.min(1, Math.max(0, (scrollProgress - 0.5) * 4))
                    : 1;
                  // Sub-phase 2b (0.75→1.0): planet rises into position
                  const riseProgress = isCurrentPlanet
                    ? Math.min(1, Math.max(0, (scrollProgress - 0.75) * 4))
                    : 1;
                  const planetWidthPx = planet.diameter / KM_PER_PX;
                  // translateY(X vh) only moves X*currScale vh on screen when parent is scaled.
                  // Compute the vh needed so the planet's top edge starts at the viewport bottom.
                  const startYOffset = 50 / currScale + 50 * planetWidthPx / window.innerHeight + 10;
                  const yOffset = isCurrentPlanet ? (1 - riseProgress) * startYOffset : 0;

                  return (
                    // Outer div: reserves space in the flex row, grows from 0 to full width
                    // so Earth and Moon spread apart smoothly instead of snapping
                    <div
                      key={planet.name}
                      className="relative flex-shrink-0"
                      style={{
                        width: `${spreadProgress * planetWidthPx}px`,
                        height: `${planetWidthPx}px`,
                        marginLeft: `${spreadProgress * ROW_GAP_PX}px`,
                        overflow: 'visible',
                      }}
                    >
                      {/* Inner div: full-size visual, rises from below independently */}
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          width: `${planetWidthPx}px`,
                          height: `${planetWidthPx}px`,
                          transform: `translateY(${yOffset}vh)`,
                          transition: 'transform 200ms linear',
                        }}
                      >
                        <div className="rounded-full overflow-hidden bg-black w-full h-full">
                          <img
                            src={planet.image}
                            alt={planet.name}
                            className="rounded-full w-full h-full"
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                        {planetWidthPx * scaleFactor >= 30 && (
                          <PlanetLabel name={planet.name} diameter={planet.diameter} scale={scaleFactor} above={planet.aboveLabel} />
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Moon */}
                <div
                  className="relative flex-shrink-0"
                  style={{
                    width: `${moonPx}px`,
                    height: `${moonPx}px`,
                    marginLeft: `${moonMarginLeft}px`,
                    transform: `translateY(${earthMoonOffset}vh)`,
                    transition: currentStep === 0 ? 'transform 1000ms ease' : 'none'
                  }}
                >
                  <img
                    src={moonImage}
                    alt="Moon"
                    className="rounded-full w-full h-full"
                    style={{ objectFit: 'cover' }}
                  />
                  <PlanetLabel name="Moon" diameter={moonDiameter} scale={scaleFactor} />
                </div>
              </div>

              {/* Dashed line from Earth center to Moon center */}
              {currentStep === 1 && scrollProgress > 0.5 && (
                <svg
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: `${earthPx + INITIAL_GAP_PX + moonPx}px`,
                    height: '2px',
                    overflow: 'visible',
                    pointerEvents: 'none',
                    zIndex: -1,
                    transform: `translate(-50%, calc(-50% + ${earthMoonOffset}vh)) scale(${scaleFactor})`
                  }}
                >
                  <line
                    x1={dashEarthCX}
                    y1="1"
                    x2={dashEarthCX + dashDelta * Math.min((scrollProgress - 0.5) * 2, 1)}
                    y2="1"
                    stroke="white"
                    strokeWidth="2"
                    strokeDasharray="10 10"
                  />
                </svg>
              )}
            </div>

            {/* Scale indicator */}
            {currentStep >= 2 && (
              <div className="absolute bottom-8 left-8 text-white transition-opacity duration-500">
                <div className="text-xs text-gray-400 mb-1 uppercase tracking-widest">Scale</div>
                <div className="flex items-center">
                  <div style={{ width: '1px', height: '8px', background: 'white' }} />
                  <div style={{ width: '100px', height: '2px', background: 'white' }} />
                  <div style={{ width: '1px', height: '8px', background: 'white' }} />
                </div>
                <div className="text-xs mt-1 text-center" style={{ width: '102px' }}>
                  {Math.round(100 / scaleFactor * 100).toLocaleString()} km
                </div>
              </div>
            )}

            {/* Per-planet narrative panel */}
            {currentStep >= 2 && currentStep <= planets.length + 1 && (
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center pointer-events-none">
                <div className="text-sm text-white bg-black bg-opacity-80 px-5 py-3 rounded-lg border border-gray-700 max-w-md">
                  {planetNarratives[currentStep - 2]}
                </div>
              </div>
            )}

            {/* Info text that appears after Earth and Moon are positioned */}
            {currentStep === 1 && (
              <>
                {scrollProgress < 0.5 && (
                  <div
                    className="absolute left-1/2 transform -translate-x-1/2 text-center"
                    style={{
                      bottom: `${scrollProgress * 240 - 20}%`,
                      transition: 'bottom 0.1s linear'
                    }}
                  >
                    <div className="text-sm text-white bg-black bg-opacity-80 p-4 rounded-lg border border-gray-700 max-w-sm">
                      Here are Earth and the Moon, shown at their true relative sizes.
                      <br />
                      <span className="text-gray-400">Earth: 12,742 km wide &nbsp;·&nbsp; Moon: 3,474 km wide</span>
                    </div>
                  </div>
                )}

                {scrollProgress >= 0.5 && (
                  <div
                    className="absolute left-1/2 transform -translate-x-1/2 text-center"
                    style={{
                      bottom: `${(scrollProgress - 0.5) * 240 - 20}%`,
                      transition: 'bottom 0.1s linear'
                    }}
                  >
                    <div className="text-sm text-white bg-black bg-opacity-80 p-4 rounded-lg border border-gray-700 max-w-sm">
                      But the gap between them isn't shown to scale — yet.
                      <br />
                      At its farthest point, the Moon is <span className="text-white font-bold">405,500 km</span> away.
                      <br />
                      <span className="text-gray-400">Let's stretch the distance to show the real space.</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Introduction step - Step 1 */}
          <div className="step" style={{ height: '200vh' }} />

          {/* Planet steps */}
          {planets.map((planet) => (
            <div key={planet.name} className="step" style={{ height: '120vh' }} />
          ))}

          {/* Final step */}
          <div className="step flex items-center justify-center" style={{ height: '200vh' }}>
            {currentStep === planets.length + 2 && (
              <div className="text-center text-white max-w-lg px-6 pointer-events-none">
                <div className="text-2xl font-bold mb-4">Every planet. One gap.</div>
                <p className="text-gray-300 text-base leading-relaxed">
                  At its farthest point — called <span className="text-white font-semibold">apogee</span> — the Moon is about <span className="text-white font-semibold">405,500 km</span> from Earth.
                  That space is vast enough to hold all seven other planets in our solar system, lined up side by side.
                </p>
                <p className="text-gray-500 text-sm mt-4 leading-relaxed">
                  Even our nearest cosmic neighbor is separated from us by an almost unimaginable distance —
                  a reminder of just how much empty space fills our solar system.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
