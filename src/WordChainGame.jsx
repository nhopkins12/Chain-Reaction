import React, { useState, useRef } from 'react';
import { generateClient } from 'aws-amplify/data';


const WordChainGame = () => {
  const [startWord, setStartWord] = useState(' ');
  const [targetWord, setTargetWord] = useState(' ');
  const [wordChain, setWordChain] = useState([' ']);
  const [currentInput, setCurrentInput] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [showFullChain, setShowFullChain] = useState(false);
  const [invalidWord, setInvalidWord] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);

  // Load most recent DailyPuzzle from Amplify Data
  React.useEffect(() => {
    const loadLatest = async () => {
      try {
        const client = generateClient();
        const { data, errors } = await client.models.DailyPuzzle.list();
        if (errors) {
          console.warn('DailyPuzzle list errors:', errors);
        }
        const items = Array.isArray(data) ? data : [];
        if (items.length === 0) return;

        const latest = items
          .slice()
          .sort((a, b) => {
            const ca = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
            const cb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
            if (cb !== ca) return cb - ca;
            const ua = a?.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const ub = b?.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            if (ub !== ua) return ub - ua;
            const ida = typeof a?.id === 'string' ? a.id : '';
            const idb = typeof b?.id === 'string' ? b.id : '';
            const dateRe = /^\d{4}-\d{2}-\d{2}/;
            if (dateRe.test(idb) && dateRe.test(ida)) return idb.localeCompare(ida);
            return 0;
          })[0];

        if (latest) {
          const s = (latest.startWord || '').toUpperCase();
          const t = (latest.targetWord || '').toUpperCase();
          if (s && t) {
            setStartWord(s);
            setTargetWord(t);
            setWordChain([s]);
          }
        }
      } catch (err) {
        console.warn('Failed to load latest DailyPuzzle:', err);
      }
    };
    loadLatest();
  }, []);

  // Add custom CSS for fadeIn animation
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .animate-fadeIn {
        animation: fadeIn 0.5s ease-out forwards;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Find overlap between two words
  const findOverlap = (word1, word2) => {
    const maxOverlap = Math.min(word1.length, word2.length);
    for (let i = maxOverlap; i > 0; i--) {
      if (word1.slice(-i).toLowerCase() === word2.slice(0, i).toLowerCase()) {
        return i;
      }
    }
    return 0;
  };

  // Build the continuous word from chain with proper replacement
  const buildContinuousWord = () => {
    if (wordChain.length === 1) return { word: wordChain[0], segments: [{ text: wordChain[0], isOverlap: false, wordIndex: 0 }] };
    
    let result = '';
    const segments = [];
    
    // Start with first word
    result = wordChain[0];
    segments.push({ text: wordChain[0], isOverlap: false, wordIndex: 0 });
    
    for (let i = 1; i < wordChain.length; i++) {
      const overlap = findOverlap(wordChain[i - 1], wordChain[i]);
      const newPart = wordChain[i].slice(overlap);
      
      if (overlap > 0) {
        // Mark the overlapping part in the result
        const overlapStart = result.length - overlap;
        // Update the last segment if it contains the overlap
        if (segments.length > 0) {
          const lastSegment = segments[segments.length - 1];
          if (!lastSegment.isOverlap && lastSegment.text.length >= overlap) {
            // Split the last segment
            const beforeOverlap = lastSegment.text.slice(0, -overlap);
            const overlapPart = lastSegment.text.slice(-overlap);
            
            if (beforeOverlap) {
              segments[segments.length - 1] = { text: beforeOverlap, isOverlap: false, wordIndex: lastSegment.wordIndex };
              segments.push({ text: overlapPart, isOverlap: true, wordIndex: i });
            } else {
              segments[segments.length - 1] = { text: overlapPart, isOverlap: true, wordIndex: i };
            }
          }
        }
      }
      
      if (newPart) {
        segments.push({ text: newPart, isOverlap: false, wordIndex: i });
      }
      
      result += newPart;
    }
    
    return { word: result, segments };
  };

  const handleAddWord = () => {
    if (!currentInput.trim()) return;
    
    const newWord = currentInput.toUpperCase();
    const lastWord = wordChain[wordChain.length - 1];
    const overlap = findOverlap(lastWord, newWord);
    
    if (overlap === 0) {
      setInvalidWord(true);
      setTimeout(() => setInvalidWord(false), 500);
      return;
    }
    
    // Start animation sequence
    setIsAnimating(true);
    setCurrentInput('');
    
    // First, push the current word left (pre-animation)
    setTimeout(() => {
      const newChain = [...wordChain, newWord];
      setWordChain(newChain);
      
      if (newWord === targetWord) {
        setIsComplete(true);
        setTimeout(() => setShowFullChain(true), 600);
      }
      
      // End animation
      setTimeout(() => setIsAnimating(false), 100);
    }, 200);
  };

  const resetGame = () => {
    setWordChain([startWord]);
    setCurrentInput('');
    setIsComplete(false);
    setShowFullChain(false);
    setInvalidWord(false);
  };

  const handleLogin = () => {
    if (playerName.trim()) {
      setIsLoggedIn(true);
      // Optionally push to leaderboard when backend model exists
      const currentScore = {
        name: playerName,
        steps: wordChain.length - 1,
        words: [...wordChain],
      };
      setLeaderboard((prev) => [currentScore, ...prev]);
    }
  };

  const closeScoreboard = () => setShowScoreboard(false);

  const continuousWord = buildContinuousWord();

  return (
    <div className="min-h-screen bg-white font-['Helvetica_Neue',_sans-serif]">
      <div className="max-w-4xl mx-auto px-6 py-12">
        
        {/* Header */}
        <header className="text-center mb-16">
          <h1 className="text-4xl font-bold text-black mb-4 tracking-tight">
            Word Chain
          </h1>
          <div className="text-lg text-gray-600">
            Connect <span className="font-semibold text-black">{startWord}</span> to{' '}
            <span className="font-semibold text-black">{targetWord}</span>
          </div>
        </header>

        {/* Game Board */}
        <div className="mb-12">
          <div className="relative min-h-24 overflow-hidden">
            <div className={`flex items-center transition-all duration-700 ease-out ${isComplete ? 'justify-center' : 'justify-center'}`}>
              
              {/* Current Chain - slides left as it grows, centers when complete */}
              <div 
                className="bg-white rounded-lg border-2 border-gray-300 px-6 py-4 shadow-sm transition-all duration-300 ease-out"
                style={{
                  transform: isComplete ? 'translateX(0px)' : 
                    isAnimating ? `translateX(${Math.max(0, (continuousWord.word.length - 4) * -10)}px)` :
                    `translateX(${Math.max(0, (continuousWord.word.length - 8) * -8)}px)`
                }}
              >
                <div className="text-2xl font-bold tracking-wide flex">
                  {continuousWord.segments.map((segment, index) => (
                    <span 
                      key={index}
                      className={`
                        transition-all duration-300
                        ${segment.isOverlap ? 'bg-green-500 text-white rounded-md px-1 mx-0.5' : 'text-black'}
                      `}
                    >
                      {segment.text}
                    </span>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              {!isComplete && (
                <div className="text-gray-400 text-2xl font-bold mx-8 flex-shrink-0">
                  →
                </div>
              )}

              {/* Target Word - always in same position during gameplay */}
              {!isComplete && (
                <div className="bg-blue-50 rounded-lg px-6 py-4 border border-blue-200 opacity-70 flex-shrink-0">
                  <div className="text-2xl font-bold text-blue-600 tracking-wide">
                    {targetWord}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Success State - appears below the solved puzzle */}
          {isComplete && (
            <div className="text-center mt-6">
              <div className="inline-block bg-green-50 rounded-lg px-6 py-3 border border-green-200 opacity-0 animate-fadeIn"
                   style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
                <div className="text-xl font-bold text-green-600 tracking-wide">
                  ✓ CONNECTED!
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Progress Chain */}
        {wordChain.length > 1 && (
          <div className="mb-8 text-center">
            <div className="text-sm text-gray-600 mb-2">Chain Progress:</div>
            <div className="flex justify-center items-center gap-2 flex-wrap">
              {wordChain.map((word, index) => (
                <React.Fragment key={index}>
                  <span className={`
                    px-3 py-1 rounded-md text-sm font-semibold
                    ${index === 0 ? 'bg-gray-100 text-gray-700' : 
                      index === wordChain.length - 1 && isComplete ? 'bg-green-100 text-green-700' :
                      'bg-blue-100 text-blue-700'}
                  `}>
                    {word}
                  </span>
                  {index < wordChain.length - 1 && (
                    <span className="text-gray-400 text-xs">→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Input Section */}
        {!isComplete && (
          <div className="text-center mb-12">
            <div className="inline-flex gap-3 items-center">
              <input
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleAddWord()}
                placeholder="Next word..."
                className={`
                  w-48 px-4 py-3 text-lg font-medium border-2 rounded-md text-center
                  focus:outline-none focus:border-black transition-all duration-200
                  ${invalidWord ? 'border-red-400 bg-red-50 animate-pulse' : 'border-gray-300 bg-white'}
                `}
                maxLength={12}
              />
              <button
                onClick={handleAddWord}
                className="px-6 py-3 bg-black text-white font-semibold rounded-md hover:bg-gray-800 transition-colors duration-200"
              >
                Add
              </button>
              <button onClick={ async () => {
              const client = generateClient();
              const { data, errors } = await client.queries.testFunction({});
            }
              }>Clicking the button will trigger the thing</button>
            </div>
            {invalidWord && (
              <div className="text-red-500 text-sm mt-2">
                Word must share letters with "{wordChain[wordChain.length - 1]}"
              </div>
            )}
          </div>
        )}

        {/* Success Message */}
        {isComplete && (
          <div className="text-center mb-12">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto">
              <div className="text-3xl font-bold text-green-800 mb-2">
                Perfect!
              </div>
              <div className="text-green-700 mb-4">
                Connected in {wordChain.length - 1} step{wordChain.length !== 2 ? 's' : ''}
              </div>
              <button
                onClick={resetGame}
                className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors"
              >
                New Puzzle
              </button>
            </div>
          </div>
        )}

        {/* Game Setup */}
        <div className="border-t border-gray-200 pt-8">
          

          {/* Instructions */}
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <div className="text-sm text-gray-600 leading-relaxed">
              <strong>How to play:</strong> Add words that share letters with the end of the current word. 
              Overlapping letters will be highlighted in green and merge the words together.
              <br />
              <span className="text-gray-500">
                Example: START → ARTSY → SYRINGE → GEARMEN → END
              </span>
            </div>
          </div>
        </div>

        {/* Scoreboard Modal */}
        {showScoreboard && (
          <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-blue-500 px-6 py-4 text-white">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">🏆 Scoreboard</h2>
                  <button 
                    onClick={closeScoreboard}
                    className="text-white hover:text-gray-200 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Your Score */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-800">Your Score</div>
                    <div className="text-3xl font-bold text-green-600">{wordChain.length - 1} steps</div>
                    <div className="text-sm text-green-700 mt-1">
                      {wordChain.join(' → ')}
                    </div>
                  </div>
                </div>

                {/* Login Section */}
                {!isLoggedIn ? (
                  <div className="mb-6">
                    <div className="text-center mb-4">
                      <div className="text-lg font-semibold text-gray-800 mb-2">Save Your Score!</div>
                      <div className="text-sm text-gray-600 mb-4">Enter your name to join the leaderboard</div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={playerName}
                          onChange={(e) => setPlayerName(e.target.value)}
                          placeholder="Your name"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                          maxLength={20}
                          onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                        />
                        <button
                          onClick={handleLogin}
                          className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition-colors"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center mb-6">
                    <div className="text-green-600 font-semibold">✓ Score saved as {playerName}!</div>
                  </div>
                )}

                {/* Leaderboard */}
                <div>
                  <div className="text-lg font-semibold text-gray-800 mb-3 text-center">Top Scores</div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {leaderboard.map((entry, index) => (
                      <div key={index} className={`
                        flex items-center justify-between p-3 rounded-lg border
                        ${entry.name === playerName && isLoggedIn ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}
                      `}>
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                            ${index === 0 ? 'bg-yellow-400 text-yellow-900' : 
                              index === 1 ? 'bg-gray-400 text-gray-900' :
                              index === 2 ? 'bg-orange-400 text-orange-900' :
                              'bg-gray-200 text-gray-700'}
                          `}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{entry.name}</div>
                            <div className="text-xs text-gray-500">{entry.words.join(' → ')}</div>
                          </div>
                        </div>
                        <div className="text-lg font-bold text-gray-700">
                          {entry.steps}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={resetGame}
                    className="flex-1 px-4 py-2 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600 transition-colors"
                  >
                    New Puzzle
                  </button>
                  <button
                    onClick={closeScoreboard}
                    className="flex-1 px-4 py-2 bg-gray-500 text-white font-semibold rounded-md hover:bg-gray-600 transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WordChainGame;
