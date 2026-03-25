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
  const [fillOption, setFillOption] = useState('planets');
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
  const MIN_SCALE_FACTOR = 10000 / 70000; // scale bar cap: 70,000 km per 100px
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
    const stepSc = Math.max(MIN_SCALE_FACTOR, 1 - (step / totalSteps) * 0.85);
    const planetsAtStep = step > 1 ? planets.slice(0, step - 1) : [];
    const maxPx = planetsAtStep.length > 0
      ? Math.max(earthPx, ...planetsAtStep.map(p => p.diameter / KM_PER_PX))
      : earthPx;
    return Math.max(MIN_SCALE_FACTOR, Math.min(stepSc, (window.innerHeight * 0.75) / maxPx));
  };

  // Phase 1 (scrollProgress 0→0.5): scale transitions to new target
  // Phase 2 (scrollProgress 0.5→1): planet rises into position
  const scalePhase = Math.min(scrollProgress * 2, 1);
  const prevScale = getTargetScale(Math.max(0, currentStep - 1));
  const currScale = getTargetScale(currentStep);
  const scaleFactor = prevScale + (currScale - prevScale) * scalePhase;

  // Moon starts with a larger gap so the dashed line is visible in step 1.
  // As Mercury's spread phase runs (step 2, scrollProgress 0.5→0.75), the extra
  // gap closes so the planet steps are unaffected.
  const firstSpread = currentStep === 2
    ? Math.min(1, Math.max(0, (scrollProgress - 0.5) * 4))
    : currentStep > 2 ? 1 : 0;
  const moonMarginLeft = ROW_GAP_PX + (INITIAL_GAP_PX - ROW_GAP_PX) * (1 - firstSpread);

  // Total row width (unscaled px) — used to align the final distance bar
  const totalPlanetWidthsPx = planets.reduce((sum, p) => sum + p.diameter / KM_PER_PX, 0);
  const totalRowWidthPx = earthPx + (planets.length + 1) * ROW_GAP_PX + totalPlanetWidthsPx + moonPx;

  // Fill option config: how many of each body fits in the 405,500 km gap
  const wrapperWidthPx = totalPlanetWidthsPx + planets.length * ROW_GAP_PX;
  const FILL_COUNTS = { planets: 7, earths: 30, moons: Math.floor(405500 / moonDiameter) };
  const moonFillPx = wrapperWidthPx / FILL_COUNTS.moons;

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
          {/* <p className="text-lg text-gray-400 mb-4">by Aspen Tabar</p>
          <br /> */}
          <p className="text-base text-gray-400 leading-relaxed">
            The Moon is our closest neighbor in space, but just how far away is it, really?
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
                {currentStep === planets.length + 2 ? (
                  // Final step: static planets with earths crossfade overlay
                  <div
                    style={{
                      position: 'relative',
                      display: 'flex',
                      flexShrink: 0,
                      width: `${totalPlanetWidthsPx + planets.length * ROW_GAP_PX}px`,
                      height: `${Math.max(...planets.map(p => p.diameter / KM_PER_PX))}px`,
                    }}
                  >
                    {/* Planets layer — fades out when earths selected */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        height: '100%',
                        opacity: fillOption === 'earths' ? 0 : 1,
                        transition: 'opacity 0.6s ease',
                      }}
                    >
                      {planets.map((planet) => {
                        const planetWidthPx = planet.diameter / KM_PER_PX;
                        return (
                          <div
                            key={planet.name}
                            className="relative flex-shrink-0"
                            style={{ width: `${planetWidthPx}px`, height: `${planetWidthPx}px`, marginLeft: `${ROW_GAP_PX}px` }}
                          >
                            <div className="rounded-full overflow-hidden bg-black w-full h-full">
                              <img src={planet.image} alt={planet.name} className="rounded-full w-full h-full" style={{ objectFit: 'cover' }} />
                            </div>
                            {planetWidthPx * scaleFactor >= 30 && (
                              <PlanetLabel name={planet.name} diameter={planet.diameter} scale={scaleFactor} above={planet.aboveLabel} />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Earths layer — fades in when earths selected */}
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        opacity: fillOption === 'earths' ? 1 : 0,
                        transition: 'opacity 0.6s ease',
                        pointerEvents: 'none',
                      }}
                    >
                      {[...Array(30)].map((_, i) => (
                        <div
                          key={i}
                          style={{
                            width: `${earthPx}px`,
                            height: `${earthPx}px`,
                            marginLeft: i === 0 ? `${ROW_GAP_PX}px` : '1px',
                            flexShrink: 0,
                          }}
                        >
                          <img src={earthImage} alt="" className="rounded-full w-full h-full" style={{ objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>

                    {/* Moons layer — fades in when moons selected */}
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        opacity: fillOption === 'moons' ? 1 : 0,
                        transition: 'opacity 0.6s ease',
                        pointerEvents: 'none',
                      }}
                    >
                      {[...Array(FILL_COUNTS.moons)].map((_, i) => (
                        <div
                          key={i}
                          style={{
                            width: `${moonFillPx}px`,
                            height: `${moonFillPx}px`,
                            flexShrink: 0,
                          }}
                        >
                          <img src={moonImage} alt="" className="rounded-full w-full h-full" style={{ objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  visiblePlanets.map((planet, idx) => {
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
                    const startYOffset = 50 / currScale + 50 * planetWidthPx / window.innerHeight + 10;
                    const yOffset = isCurrentPlanet ? (1 - riseProgress) * startYOffset : 0;

                    return (
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
                            <img src={planet.image} alt={planet.name} className="rounded-full w-full h-full" style={{ objectFit: 'cover' }} />
                          </div>
                          {planetWidthPx * scaleFactor >= 30 && (
                            <PlanetLabel name={planet.name} diameter={planet.diameter} scale={scaleFactor} above={planet.aboveLabel} />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

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
              {currentStep === 1 && scrollProgress > 0.3 && (
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
                    x2={dashEarthCX + dashDelta * Math.min(Math.max(0, (scrollProgress - 0.3) / 0.4), 1) * (1 - Math.min(Math.max(0, (scrollProgress - 0.75) / 0.25), 1))}
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
                  {Math.min(70000, Math.round(100 / scaleFactor * 100)).toLocaleString()} km
                </div>
              </div>
            )}


            {/* Distance bar — final aha moment */}
            {currentStep === planets.length + 2 && scrollProgress > 0.4 && (
              <div
                className="absolute text-center"
                style={{
                  top: '8%',
                  left: `${window.innerWidth / 2 - scaleFactor * (totalRowWidthPx / 2 - earthPx / 2)}px`,
                  width: `${scaleFactor * (totalRowWidthPx - earthPx / 2 - moonPx / 2)}px`,
                  opacity: Math.min(1, (scrollProgress - 0.4) / 0.3),
                  transition: 'opacity 0.3s ease',
                }}
              >
                <div className="text-xs text-gray-400 uppercase tracking-widest mb-3">
                  Earth → Moon distance at apogee
                </div>
                <div className="flex items-center">
                  <div style={{ width: '2px', height: '20px', background: 'white' }} />
                  <div style={{ flex: 1, height: '2px', background: 'white' }} />
                  <div className="px-6 text-3xl font-bold text-white whitespace-nowrap">405,500 km</div>
                  <div style={{ flex: 1, height: '2px', background: 'white' }} />
                  <div style={{ width: '2px', height: '20px', background: 'white' }} />
                </div>
                <div className="text-sm text-gray-400 mt-3">
                  All {FILL_COUNTS[fillOption]}{' '}
                  <select
                    value={fillOption}
                    onChange={e => setFillOption(e.target.value)}
                    className="bg-transparent border-b border-gray-400 text-gray-400 cursor-pointer outline-none"
                  >
                    <option value="planets">planets</option>
                    <option value="earths">earths</option>
                    <option value="moons">moons</option>
                  </select>
                  {' '}fit side by side in this gap.
                </div>
              </div>
            )}

            {/* Info text that appears after Earth and Moon are positioned */}
            {currentStep === 1 && (
              <>
                {scrollProgress < 0.5 && (
                  <div
                    className="absolute right-24 text-left"
                    style={{
                      bottom: `${scrollProgress * 240 - 20}%`,
                      transition: 'bottom 0.1s linear'
                    }}
                  >
                    <div className="text-sm text-white bg-black bg-opacity-80 p-4 rounded-lg border border-gray-700 max-w-sm">
                      Here are Earth and the Moon, shown at their true relative sizes.
                      <br /><br />
                      <span className="text-gray-400">Earth: 12,742 km wide &nbsp;·&nbsp; Moon: 3,474 km wide</span>
                    </div>
                  </div>
                )}

                {scrollProgress >= 0.5 && (
                  <div
                    className="absolute right-24 text-left"
                    style={{
                      bottom: `${(scrollProgress - 0.5) * 240 - 20}%`,
                      transition: 'bottom 0.1s linear'
                    }}
                  >
                    <div className="text-sm text-white bg-black bg-opacity-80 p-4 rounded-lg border border-gray-700 max-w-md">
                      But the gap between them is <span className="font-bold">not</span> accurate. 
                      <br /><br />
                      At its farthest point, the Moon is <span className="font-bold">405,500 km</span> away.
                      <br /><br />
                      <span className="text-gray-400">Let's stretch the distance to show the real scale!</span>
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
          <div className="step" style={{ height: '200vh' }} />
        </div>
      </div>
    </div>
  );
};

export default App;
