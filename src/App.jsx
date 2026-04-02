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
import whaleImage from './assets/whale.png';
import burjImage from './assets/burj.png';
import mountainImage from './assets/mountain.png';
import australiaImage from './assets/Australia.png';

const PlanetLabel = ({ name, diameter, scale, above, opacity = 1 }) => (
  <div
    className="absolute left-1/2 text-center whitespace-nowrap"
    style={{
      transform: `translateX(-50%) scale(${1 / scale})`,
      transformOrigin: above ? 'bottom center' : 'top center',
      opacity,
      transition: 'opacity 0.2s ease',
      zIndex: 10,
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
    { name: 'Venus',   diameter: 12104,  image: venusImage,   aboveLabel: true  },
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

  // Step 2 is the dedicated "scale reveal" step: Earth & Moon spread to full gap while zooming out.
  // Steps 3–9 are planet steps (planets rise up, no further zoom or spreading).
  // Step 10 is the final step.

  // Scale: stays comfortable (≈1) through step 1, then snaps to MIN_SCALE_FACTOR in step 2.
  const getTargetScale = (step) => {
    if (step <= 1) return Math.min(1, (window.innerHeight * 0.6) / earthPx);
    return MIN_SCALE_FACTOR;
  };

  // Row geometry (must be declared before fullGapPx)
  const totalPlanetWidthsPx = planets.reduce((sum, p) => sum + p.diameter / KM_PER_PX, 0);
  const totalRowWidthPx = earthPx + (planets.length + 1) * ROW_GAP_PX + totalPlanetWidthsPx + moonPx;
  const wrapperWidthPx = totalPlanetWidthsPx + planets.length * ROW_GAP_PX;
  const FILL_COUNTS = { planets: 7, earths: 30, moons: Math.floor(405500 / moonDiameter), whales: Math.floor(405500 * 1000 / 30), burj: Math.floor(405500 * 1000 / 828), everest: Math.floor(405500 / 8.849), australia: Math.floor(405500 / 4000) };
  const moonFillPx = wrapperWidthPx / FILL_COUNTS.moons;

  const smoothstep = x => x * x * (3 - 2 * x);
  const t = Math.min(scrollProgress * 2, 1);
  const scalePhase = smoothstep(t);
  const prevScale = getTargetScale(Math.max(0, currentStep - 1));
  const currScale = getTargetScale(currentStep);
  const scaleFactor = prevScale + (currScale - prevScale) * scalePhase;

  // In step 2, Moon spreads from INITIAL_GAP_PX to fullGapPx after zoom is done.
  // In steps 3+, all 7 planet divs fill the flex row, so moonMarginLeft = ROW_GAP_PX.
  const fullGapPx = totalPlanetWidthsPx + (planets.length + 1) * ROW_GAP_PX;
  const spreadToFullProgress = currentStep === 2
    ? smoothstep(t * t * t)
    : currentStep > 2 ? 1 : 0;
  const moonMarginLeft = currentStep > 2
    ? ROW_GAP_PX
    : INITIAL_GAP_PX + (fullGapPx - INITIAL_GAP_PX) * spreadToFullProgress;

  // Label opacity for each planet:
  // - Small planets (0-2): fade in when entering, fade out when the next small planet enters
  // - Large planets (3+): binary show/hide based on size threshold
  const currentRiseProgress = Math.min(1, scrollProgress / 0.85);
  const planetLabelOpacity = planets.map((planet, idx) => {
    if (idx >= 3) {
      return currentStep >= idx + 3 && (planet.diameter / KM_PER_PX) * scaleFactor >= 30 ? 1 : 0;
    }
    // Small planets (Mercury=0, Venus=1, Mars=2)
    const enteredAt = idx + 3;
    const nextEntersAt = idx + 4; // the next planet (which displaces this label) enters here
    if (currentStep < enteredAt) return 0;
    if (currentStep === nextEntersAt) return 1 - currentRiseProgress;   // fade out as next planet rises
    if (currentStep > nextEntersAt) return 0;                           // gone after next has settled
    return 1;                                                            // fully visible once entered
  });

  const titleOpacity = currentStep === 0 ? 1 - scrollProgress : 0;
  const contentOpacity = currentStep === 0 ? Math.max(0, (scrollProgress - 0.5) / 0.5) : 1;
  const earthMoonOffset = currentStep === 0 ? (1 - Math.max(0, (scrollProgress - 0.5) / 0.5)) * 100 : 0;

  return (
    <div className="relative bg-black text-white">
      {/* Stationary star background for entire experience */}
      <div className="fixed inset-0 z-0" style={{ transform: `scale(${Math.pow(scaleFactor, 0.2)})`, transformOrigin: 'center center' }}>
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
          <p className="text-base text-gray-400 leading-relaxed tracking-wider">
            The Moon is our closest neighbor in space, but how far away is it, really?
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
                {currentStep === planets.length + 3 ? (
                  // Final step: all planets with fill-option crossfade
                  <div
                    style={{
                      position: 'relative',
                      display: 'flex',
                      flexShrink: 0,
                      width: `${totalPlanetWidthsPx + planets.length * ROW_GAP_PX}px`,
                      height: `${Math.max(...planets.map(p => p.diameter / KM_PER_PX))}px`,
                    }}
                  >
                    {/* Planets layer */}
                    <div style={{ display: 'flex', alignItems: 'center', height: '100%', opacity: fillOption === 'planets' ? 1 : 0, transition: 'opacity 0.6s ease' }}>
                      {planets.map((planet) => {
                        const planetWidthPx = planet.diameter / KM_PER_PX;
                        return (
                          <div key={planet.name} className="relative flex-shrink-0" style={{ width: `${planetWidthPx}px`, height: `${planetWidthPx}px`, marginLeft: `${ROW_GAP_PX}px` }}>
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
                    {/* Earths layer */}
                    <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', opacity: fillOption === 'earths' ? 1 : 0, transition: 'opacity 0.6s ease', pointerEvents: 'none' }}>
                      {[...Array(30)].map((_, i) => (
                        <div key={i} style={{ width: `${earthPx}px`, height: `${earthPx}px`, marginLeft: i === 0 ? `${ROW_GAP_PX}px` : '1px', flexShrink: 0 }}>
                          <img src={earthImage} alt="" className="rounded-full w-full h-full" style={{ objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>
                    {/* Moons layer */}
                    <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', opacity: fillOption === 'moons' ? 1 : 0, transition: 'opacity 0.6s ease', pointerEvents: 'none' }}>
                      {[...Array(FILL_COUNTS.moons)].map((_, i) => (
                        <div key={i} style={{ width: `${moonFillPx}px`, height: `${moonFillPx}px`, flexShrink: 0 }}>
                          <img src={moonImage} alt="" className="rounded-full w-full h-full" style={{ objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>

                    {/* Whales layer */}
                    {(() => {
                      const whaleW = wrapperWidthPx / 30;
                      const whaleH = whaleW * 0.4;
                      const extraRows = 80;
                      return (
                        <>
                          {/* Centered single row with text above */}
                          <div style={{ position: 'absolute', left: `${ROW_GAP_PX}px`, top: '50%', transform: 'translateY(-50%)', opacity: fillOption === 'whales' ? 1 : 0, transition: 'opacity 0.6s ease', pointerEvents: 'none' }}>
                            <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: `${3 / scaleFactor}px`, textAlign: 'center', whiteSpace: 'nowrap' }}>
                              <div style={{ fontSize: `${Math.max(8, 13 / scaleFactor)}px`, fontWeight: 'bold', color: 'white' }}>
                                × {FILL_COUNTS.whales.toLocaleString()} blue whales
                              </div>
                              <div style={{ fontSize: `${Math.max(6, 10 / scaleFactor)}px`, color: '#9ca3af', marginTop: `${2 / scaleFactor}px` }}>
                                about 900× all the blue whales alive on Earth today
                              </div>
                            </div>
                            <div style={{ display: 'flex' }}>
                              {[...Array(30)].map((_, i) => (
                                <img key={i} src={whaleImage} alt="" style={{ width: `${whaleW}px`, height: `${whaleH}px`, objectFit: 'contain', flexShrink: 0 }} />
                              ))}
                            </div>
                          </div>
                          {/* Extra rows cascading downward off screen */}
                          <div style={{ position: 'absolute', left: `${ROW_GAP_PX}px`, top: '50%', marginTop: `${whaleH / 2}px`, opacity: fillOption === 'whales' ? 1 : 0, transition: 'opacity 0.6s ease', pointerEvents: 'none' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              {[...Array(extraRows)].map((_, row) => (
                                <div key={row} style={{ display: 'flex' }}>
                                  {[...Array(30)].map((_, i) => (
                                    <img key={i} src={whaleImage} alt="" style={{ width: `${whaleW}px`, height: `${whaleH}px`, objectFit: 'contain', flexShrink: 0 }} />
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      );
                    })()}

                    {/* Burj Khalifa layer */}
                    {(() => {
                      const burjW = wrapperWidthPx / 25;
                      const burjH = burjW * 0.35;
                      const extraRows = 80;
                      const BurjImg = ({ i }) => (
                        <div key={i} style={{ width: `${burjW}px`, height: `${burjH}px`, flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
                          <img src={burjImage} alt="" style={{ width: `${burjH}px`, height: `${burjW}px`, objectFit: 'contain', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(90deg)' }} />
                        </div>
                      );
                      return (
                        <>
                          {/* Centered single row with text above */}
                          <div style={{ position: 'absolute', left: `${ROW_GAP_PX}px`, top: '50%', transform: 'translateY(-50%)', opacity: fillOption === 'burj' ? 1 : 0, transition: 'opacity 0.6s ease', pointerEvents: 'none' }}>
                            <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: `${3 / scaleFactor}px`, textAlign: 'center', whiteSpace: 'nowrap' }}>
                              <div style={{ fontSize: `${Math.max(8, 13 / scaleFactor)}px`, fontWeight: 'bold', color: 'white' }}>
                                × {FILL_COUNTS.burj.toLocaleString()} Burj Khalifas
                              </div>
                              <div style={{ fontSize: `${Math.max(6, 10 / scaleFactor)}px`, color: '#9ca3af', marginTop: `${2 / scaleFactor}px` }}>
                                the tallest building in the world, standing at 828 m
                              </div>
                            </div>
                            <div style={{ display: 'flex' }}>
                              {[...Array(25)].map((_, i) => <BurjImg key={i} i={i} />)}
                            </div>
                          </div>
                          {/* Extra rows cascading downward off screen */}
                          <div style={{ position: 'absolute', left: `${ROW_GAP_PX}px`, top: '50%', marginTop: `${burjH / 2}px`, opacity: fillOption === 'burj' ? 1 : 0, transition: 'opacity 0.6s ease', pointerEvents: 'none' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              {[...Array(extraRows)].map((_, row) => (
                                <div key={row} style={{ display: 'flex' }}>
                                  {[...Array(25)].map((_, i) => <BurjImg key={i} i={i} />)}
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      );
                    })()}

                    {/* Australia layer */}
                    {(() => {
                      const perRow = 15;
                      const total = FILL_COUNTS.australia;
                      const australiaW = wrapperWidthPx / perRow;
                      const australiaH = australiaW * 0.9;
                      const rows = [];
                      for (let i = 0; i < total; i += perRow) {
                        rows.push([...Array(Math.min(perRow, total - i))].map((_, j) => i + j));
                      }
                      const AustraliaImg = ({ idx }) => (
                        <div key={idx} style={{ width: `${australiaW}px`, height: `${australiaH}px`, flexShrink: 0, overflow: 'hidden' }}>
                          <img src={australiaImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                        </div>
                      );
                      return (
                        <div style={{ position: 'absolute', left: `${ROW_GAP_PX}px`, top: '50%', marginTop: `${-australiaH / 2}px`, opacity: fillOption === 'australia' ? 1 : 0, transition: 'opacity 0.6s ease', pointerEvents: 'none' }}>
                          <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: `${3 / scaleFactor}px`, textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <div style={{ fontSize: `${Math.max(8, 13 / scaleFactor)}px`, fontWeight: 'bold', color: 'white' }}>
                              × {FILL_COUNTS.australia.toLocaleString()} Australias
                            </div>
                            <div style={{ fontSize: `${Math.max(6, 10 / scaleFactor)}px`, color: '#9ca3af', marginTop: `${2 / scaleFactor}px` }}>
                              the world's largest island, ~4,000 km wide
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {rows.map((rowItems, row) => (
                              <div key={row} style={{ display: 'flex', lineHeight: 0 }}>
                                {rowItems.map(idx => <AustraliaImg key={idx} idx={idx} />)}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Mount Everest layer */}
                    {(() => {
                      const everestW = wrapperWidthPx / 20;
                      const everestH = everestW * 0.65;
                      const totalRows = 31;
                      const EverestImg = ({ i }) => (
                        <div key={i} style={{ width: `${everestW}px`, height: `${everestH}px`, flexShrink: 0, overflow: 'hidden' }}>
                          <img src={mountainImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                        </div>
                      );
                      return (
                        <div style={{ position: 'absolute', left: `${ROW_GAP_PX}px`, top: '50%', marginTop: `${-everestH / 2}px`, opacity: fillOption === 'everest' ? 1 : 0, transition: 'opacity 0.6s ease', pointerEvents: 'none' }}>
                          <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: `${3 / scaleFactor}px`, textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <div style={{ fontSize: `${Math.max(8, 13 / scaleFactor)}px`, fontWeight: 'bold', color: 'white' }}>
                              × {FILL_COUNTS.everest.toLocaleString()} Mount Everests
                            </div>
                            <div style={{ fontSize: `${Math.max(6, 10 / scaleFactor)}px`, color: '#9ca3af', marginTop: `${2 / scaleFactor}px` }}>
                              the tallest mountain on Earth, standing at 8,849 m
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {[...Array(totalRows)].map((_, row) => (
                              <div key={row} style={{ display: 'flex', lineHeight: 0 }}>
                                {[...Array(20)].map((_, i) => <EverestImg key={i} i={i} />)}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : currentStep >= 3 ? (
                  // Planet steps 3–9: all 7 slots rendered (future ones invisible to hold gap width).
                  // No spread animation — the gap is already established from step 2.
                  // Each planet only rises up from below.
                  planets.map((planet, idx) => {
                    const enteredAtStep = idx + 3;
                    const isCurrentPlanet = currentStep === enteredAtStep;
                    const hasEntered = currentStep > enteredAtStep;
                    const riseProgress = isCurrentPlanet
                      ? Math.min(1, scrollProgress / 0.85)
                      : hasEntered ? 1 : 0;
                    const planetWidthPx = planet.diameter / KM_PER_PX;
                    const startYOffset = 50 / MIN_SCALE_FACTOR + 50 * planetWidthPx / window.innerHeight + 10;
                    const yOffset = isCurrentPlanet ? (1 - riseProgress) * startYOffset : 0;
                    const opacity = (isCurrentPlanet || hasEntered) ? 1 : 0;

                    return (
                      <div
                        key={planet.name}
                        className="relative flex-shrink-0"
                        style={{ width: `${planetWidthPx}px`, height: `${planetWidthPx}px`, marginLeft: `${ROW_GAP_PX}px`, overflow: 'visible' }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            width: `${planetWidthPx}px`,
                            height: `${planetWidthPx}px`,
                            transform: `translateY(${yOffset}vh)`,
                            opacity,
                          }}
                        >
                          <div className="rounded-full overflow-hidden bg-black w-full h-full">
                            <img src={planet.image} alt={planet.name} className="rounded-full w-full h-full" style={{ objectFit: 'cover' }} />
                          </div>
                          {opacity > 0 && planetLabelOpacity[idx] > 0 && (
                            <PlanetLabel name={planet.name} diameter={planet.diameter} scale={scaleFactor} above={planet.aboveLabel} opacity={planetLabelOpacity[idx]} />
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : null}

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



            {/* Step 2: measurement line — shows 405,500 km gap as Earth & Moon spread apart */}
            {currentStep === 2 && spreadToFullProgress >= 1 && (
              <div
                className="absolute text-center pointer-events-none"
                style={{
                  top: '8%',
                  left: `${window.innerWidth / 2 - scaleFactor * (totalRowWidthPx / 2 - earthPx / 2)}px`,
                  width: `${scaleFactor * (totalRowWidthPx - earthPx / 2 - moonPx / 2)}px`,
                  opacity: Math.min(1, (scrollProgress - 0.5) / 0.2) * Math.max(0, 1 - Math.max(0, (scrollProgress - 0.78) / 0.12)),
                  transition: 'opacity 0.3s ease',
                }}
              >
                <div className="text-xs text-gray-400 uppercase tracking-widest mb-3">
                  Earth → Moon at its farthest distance
                </div>
                <div className="flex items-center">
                  <div style={{ width: '2px', height: '20px', background: 'white' }} />
                  <div style={{ flex: 1, height: '2px', background: 'white' }} />
                  <div className="px-6 text-3xl font-bold text-white whitespace-nowrap">405,500 km</div>
                  <div style={{ flex: 1, height: '2px', background: 'white' }} />
                  <div style={{ width: '2px', height: '20px', background: 'white' }} />
                </div>
              </div>
            )}

            {/* Distance bar — final aha moment */}
            {currentStep === planets.length + 3 && scrollProgress > 0.4 && (
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
                  Earth → Moon at its largest distance
                </div>
                <div className="flex items-center">
                  <div style={{ width: '2px', height: '20px', background: 'white' }} />
                  <div style={{ flex: 1, height: '2px', background: 'white' }} />
                  <div className="px-6 text-base font-bold text-white whitespace-nowrap">
                    All {FILL_COUNTS[fillOption].toLocaleString()}{' '}
                    <select
                      value={fillOption}
                      onChange={e => setFillOption(e.target.value)}
                      className="bg-transparent border-b border-white text-white cursor-pointer outline-none font-bold text-base"
                    >
                      <option value="planets">planets</option>
                      <option value="earths">earths</option>
                      <option value="moons">moons</option>
                      <option value="australia">Australias</option>
                      <option value="everest">Mount Everests</option>
                      <option value="burj">Burj Khalifas</option>
                      <option value="whales">blue whales</option>
                    </select>
                    {' '}fit side by side in between the Earth and Moon.
                  </div>
                  <div style={{ flex: 1, height: '2px', background: 'white' }} />
                  <div style={{ width: '2px', height: '20px', background: 'white' }} />
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
                    <div className="text-sm tracking-wider text-white bg-black bg-opacity-80 p-4 rounded-lg border border-gray-700 max-w-sm">
                      Here are Earth and the Moon, shown at their true relative sizes.
                      <br /><br />
                      <span className="text-gray-400">Earth: 12,742 km wide</span><br />
                      <span className="text-gray-400">Moon: 3,474 km wide</span>
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
                    <div className="text-sm tracking-wider text-white bg-black bg-opacity-80 p-4 rounded-lg border border-gray-700 max-w-md">
                      But the gap between them here is <span className="font-bold">not</span> accurate.
                      <br /><br />
                      <span className="text-gray-400">Let's see what the real distance looks like.</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Step 2 text box — appears after gap is fully spread */}
            {currentStep === 2 && spreadToFullProgress >= 1 && scrollProgress > 0.6 && (
              <div
                className="absolute left-1/2 text-left"
                style={{
                  bottom: `${(scrollProgress - 0.6) * 380 - 20}%`,
                  transform: 'translateX(-50%)',
                  transition: 'bottom 0.1s linear',
                  opacity: Math.max(0, 1 - Math.max(0, (scrollProgress - 0.82) / 0.1)),
                }}
              >
                <div className="text-sm tracking-wider text-white bg-black bg-opacity-80 p-4 rounded-lg border border-gray-700 max-w-xl">
                  This gap is <span className="font-bold">405,500 km</span> wide, further than most people imagine.
                  <br /><br />
                  <span className="text-gray-400">So what could actually fit inside this space?</span>
                </div>
              </div>
            )}
          </div>

          {/* Introduction step - Step 1 */}
          <div className="step" style={{ height: '200vh' }} />

          {/* Scale reveal step - Step 2: Earth & Moon zoom out and spread to real distance */}
          <div className="step" style={{ height: '250vh' }} />

          {/* Planet steps - Steps 3–9 */}
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
