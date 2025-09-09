import React, { useState, useRef } from 'react';

const WordChainGame = () => {
  const [startWord, setStartWord] = useState('START');
  const [targetWord, setTargetWord] = useState('END');
  const [wordChain, setWordChain] = useState(['START']);
  const [currentInput, setCurrentInput] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [showFullChain, setShowFullChain] = useState(false);
  const [invalidWord, setInvalidWord] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [playerName, setPlayerName] = useState('');

  const [leaderboard, setLeaderboard] = useState([
    { name: 'Alice', steps: 3, words: ['START', 'ARTSY', 'STYLE', 'END'] },
    { name: 'Bob', steps: 4, words: ['START', 'TARDY', 'YARDS', 'SANDY', 'END'] },
    { name: 'Charlie', steps: 5, words: ['START', 'TARTS', 'SMART', 'TRAM', 'RAMP', 'END'] },
    { name: 'Diana', steps: 6, words: ['START', 'ARTS', 'STAR', 'CART', 'CARD', 'CARE', 'END'] },
    { name: 'Eve', steps: 7, words: ['START', 'PARTS', 'TRAPS', 'STRAP', 'PASTA', 'PAST', 'FAST', 'END'] }
  ]);

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
      .modal-backdrop {
        backdrop-filter: blur(4px);
        background-color: rgba(0, 0, 0, 0.3);
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const findOverlap = (word1, word2) => {
    const maxOverlap = Math.min(word1.length, word2.length);
    for (let i = maxOverlap; i > 0; i--) {
      if (word1.slice(-i).toLowerCase() === word2.slice(0, i).toLowerCase()) {
        return i;
      }
    }
    return 0;
  };

  const buildContinuousWord = () => {
    if (wordChain.length === 1) return { word: wordChain[0], segments: [{ text: wordChain[0], isOverlap: false, wordIndex: 0 }] };
    
    let result = '';
    const segments = [];
    result = wordChain[0];
    segments.push({ text: wordChain[0], isOverlap: false, wordIndex: 0 });
    
    for (let i = 1; i < wordChain.length; i++) {
      const overlap = findOverlap(wordChain[i - 1], wordChain[i]);
      const newPart = wordChain[i].slice(overlap);
      
      if (overlap > 0) {
        if (segments.length > 0) {
          const lastSegment = segments[segments.length - 1];
          if (!lastSegment.isOverlap && lastSegment.text.length >= overlap) {
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
    
    setIsAnimating(true);
    setCurrentInput('');
    
    setTimeout(() => {
      const newChain = [...wordChain, newWord];
      setWordChain(newChain);
      
      if (newWord === targetWord) {
        setIsComplete(true);
        setTimeout(() => {
          setShowFullChain(true);
        }, 600);
        setTimeout(() => {
          setShowScoreboard(true);
        }, 1000);
      }
      
      setTimeout(() => setIsAnimating(false), 100);
    }, 200);
  };

  const resetGame = () => {
    setWordChain([startWord]);
    setCurrentInput('');
    setIsComplete(false);
    setShowFullChain(false);
    setInvalidWord(false);
    setShowScoreboard(false);
  };

  const handleLogin = () => {
    if (playerName.trim()) {
      setIsLoggedIn(true);
      const currentScore = {
        name: playerName,
        steps: wordChain.length - 1,
        words: [...wordChain]
      };
      const newLeaderboard = [...leaderboard, currentScore].sort((a, b) => a.steps - b.steps).slice(0, 10);
      setLeaderboard(newLeaderboard);
    }
  };

  const closeScoreboard = () => {
    setShowScoreboard(false);
  };

  const continuousWord = buildContinuousWord();

  return (
    <div className="min-h-screen bg-white font-['Helvetica_Neue',_sans-serif]">
      {/* ... full JSX layout unchanged ... */}
    </div>
  );
};

export default WordChainGame;
