import React, { useState, useRef, useEffect } from 'react';

import { birdData } from './BirdData.jsx';

// im lazy so use it like this
/*
    i combined rare and very rare, seems redundant

    rarity: "very common",
    rarity: "common",
    rarity: "uncommon",
    rarity: "rare",
    rarity: "migrants",

*/

export default function BirdFlashcards() {
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedRarities, setSelectedRarities] = useState([]);
  const [allowRepeats, setAllowRepeats] = useState(false);
  const [gameMode, setGameMode] = useState('audio'); // 'audio' or 'picture'
  const [availableBirds, setAvailableBirds] = useState([]);
  const [usedBirds, setUsedBirds] = useState([]);
  const [currentBirdIndex, setCurrentBirdIndex] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [filteredBirds, setFilteredBirds] = useState([]);
  const [isCorrect, setIsCorrect] = useState(false);
  const audioRef = useRef(null);

  const currentBird = availableBirds[currentBirdIndex];
  const rarityOptions = ["very common", "common", "uncommon", "rare", "migrants"];

  const startGame = () => {
    if (selectedRarities.length === 0) return;
    
    //trying to use all birds for autocomplete, makes it harder
    const filtered = birdData.filter(bird => selectedRarities.includes(bird.rarity));
    setAvailableBirds(filtered);
    setUsedBirds([]);
    setGameComplete(false);
    const randomIndex = Math.floor(Math.random() * filtered.length);
    setCurrentBirdIndex(randomIndex);
    setGameStarted(true);
    setScore(0);
    setTotalAttempts(0);
  };

  const backToStart = () => {
      // Stop and reset audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      setGameStarted(false);
      setGameComplete(false);
      setGuess('');
      setFeedback('');
      setIsPlaying(false);
      setShowAutocomplete(false);
      setFilteredBirds([]);
      setIsCorrect(false);
      setGameMode('audio');
      setUsedBirds([]);
  };
    

  const toggleRarity = (rarity) => {
    setSelectedRarities(prev => 
      prev.includes(rarity) 
        ? prev.filter(r => r !== rarity)
        : [...prev, rarity]
    );
  };

  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
  
      // Reset audio state first
      setIsPlaying(false);
      audio.pause();
      audio.currentTime = 0;
      
      // Load new audio source
      audio.load();
      
      const onLoadStart = () => console.log('Audio load started');
      const onLoadedData = () => console.log('Audio data loaded');
      const onCanPlay = () => console.log('Audio can play');
      const onError = (e) => {
        console.error('Audio error event:', e);
        console.log('Audio error code:', audio.error?.code);
        console.log('Audio error message:', audio.error?.message);
      };
      
      audio.addEventListener('loadstart', onLoadStart);
      audio.addEventListener('loadeddata', onLoadedData);
      audio.addEventListener('canplay', onCanPlay);
      audio.addEventListener('error', onError);
      
      return () => {
        audio.removeEventListener('loadstart', onLoadStart);
        audio.removeEventListener('loadeddata', onLoadedData);
        audio.removeEventListener('canplay', onCanPlay);
        audio.removeEventListener('error', onError);
        audio.pause();
        audio.currentTime = 0;
      };
    }
  }, [currentBirdIndex]);

  const playAudio = () => {
      if (audioRef.current && currentBird?.audioUrl) {
        const audio = audioRef.current;
        
        if (isPlaying) {
          audio.pause();
          setIsPlaying(false);
        } else {
          console.log('Attempting to play:', currentBird.audioUrl);
          
          // Ensure we're starting from a clean state
          audio.currentTime = 0;
          setIsPlaying(true); // Move this BEFORE play()
          
          audio.play().catch(e => {
            console.error('Audio play failed:', e);
            setIsPlaying(false);
          });
        }
      }
    };

  const handleAudioEnd = () => {
    setIsPlaying(false);
  };

  const checkAnswer = () => {
    const userGuess = guess.toLowerCase().trim();
    const correctAnswer = currentBird.name.toLowerCase();
    
    setTotalAttempts(prev => prev + 1);
    
    if (userGuess === correctAnswer) {
      setScore(prev => prev + 1);
      setFeedback('Correct! 🎉');
      setIsCorrect(true);
    } else {
      setFeedback(`You guessed: "${guess}". The correct answer is: ${currentBird.name}`);
      setIsCorrect(false);
    }
  };

  const nextBird = () => {
      // Set state first to prevent new play attempts
      setIsPlaying(false);
      
      // Then stop audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    
      if (!allowRepeats) {
        const currentBird = availableBirds[currentBirdIndex];
        const newUsedBirds = [...usedBirds, currentBird.id];
        setUsedBirds(newUsedBirds);
        
        if (newUsedBirds.length >= availableBirds.length) {
          setGameComplete(true);
          return;
        }
        
        const unusedBirds = availableBirds.filter(bird => !newUsedBirds.includes(bird.id));
        const randomUnusedIndex = Math.floor(Math.random() * unusedBirds.length);
        const nextBird = unusedBirds[randomUnusedIndex];
        const nextIndex = availableBirds.findIndex(bird => bird.id === nextBird.id);
        setCurrentBirdIndex(nextIndex);
      } else {
        let nextIndex;
        do {
          nextIndex = Math.floor(Math.random() * availableBirds.length);
        } while (nextIndex === currentBirdIndex && availableBirds.length > 1);
        setCurrentBirdIndex(nextIndex);
      }
      
      setGuess('');
      setFeedback('');
      setShowAutocomplete(false);
      setFilteredBirds([]);
      setIsCorrect(false);
    };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && guess.trim() && !feedback) {
      checkAnswer();
    } else if (e.key === 'ArrowDown' && filteredBirds.length > 0) {
      e.preventDefault();
      // Focus first suggestion
      const firstSuggestion = document.querySelector('.autocomplete-item');
      if (firstSuggestion) firstSuggestion.focus();
    } else if (e.key === 'Escape') {
      setShowAutocomplete(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setGuess(value);
    
    if (value.trim().length > 0) {
      const filtered = birdData.filter(bird => 
        bird.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredBirds(filtered);
      setShowAutocomplete(filtered.length > 0);
    } else {
      setShowAutocomplete(false);
      setFilteredBirds([]);
    }
  };

  const selectBird = (birdName) => {
    setGuess(birdName);
    setShowAutocomplete(false);
    setFilteredBirds([]);
  };

  const handleIDontKnow = () => {
      // Stop audio immediately
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      
      setTotalAttempts(prev => prev + 1);
      setFeedback(`The answer is: ${currentBird.name}`);
      setIsCorrect(false);
      
    };
    

  return (
    <div className="bird-quiz-app">
      {!gameStarted ? (
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">🐦 Hello!</h1>
            <p className="text-gray-600">A flash card style game to familiarize yourself with <br></br>our local birds ❤️</p>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Game Mode:</h2>
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setGameMode('audio')}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  gameMode === 'audio'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">Listen</div>
                <div className="text-sm opacity-75">Identify by calls</div>
              </button>
              <button
                onClick={() => setGameMode('picture')}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  gameMode === 'picture'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">Watch</div>
                <div className="text-sm opacity-75">Visual identification</div>
              </button>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Select Rarity:</h2>
            <div className="grid grid-cols-2 gap-3">
              {rarityOptions.map(rarity => {
                const birdCount = birdData.filter(bird => bird.rarity === rarity).length;
                return (
                  <button
                    key={rarity}
                    onClick={() => toggleRarity(rarity)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedRarities.includes(rarity)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium capitalize">{rarity}</div>
                    <div className="text-sm opacity-75">{birdCount} birds</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Repeat Mode:</h2>
            <div className="flex gap-3">
              <button
                onClick={() => setAllowRepeats(false)}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  !allowRepeats
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">Normal</div>
                <div className="text-sm opacity-75">No repeats</div>
              </button>
              <button
                onClick={() => setAllowRepeats(true)}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  allowRepeats
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">Infinite</div>
                <div className="text-sm opacity-75">Birds can repeat</div>
              </button>
            </div>
          </div>

          <button
            onClick={startGame}
            disabled={selectedRarities.length === 0}
            className="w-full bg-green-800 hover:bg-green-900 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-lg font-medium text-lg transition-colors"
          >
            {selectedRarities.length === 0 ? 'Select at least one difficulty' : 'Start Game'}
          </button>
        </div>
      ) : gameComplete ? (
          
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-green-600 mb-4">🎉 Complete!</h1>
            <p className="text-xl text-gray-700 mb-2">Congratulations!</p>
            <p className="text-gray-600">
              You've identified all bird {gameMode === 'audio' ? 'calls' : 'images'} with {selectedRarities.join(', ')} species.
            </p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-green-800 mb-2">Final Score</h2>
            <p className="text-3xl font-bold text-green-600">{score}/{totalAttempts}</p>
            <p className="text-green-700 mt-2">
              {Math.round((score / totalAttempts) * 100)}% accuracy
            </p>
          </div>
          
          <button
            onClick={backToStart}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-lg font-medium text-lg transition-colors"
          >
            Play Again
          </button>
        </div>
      ) : (
        // Game Screen
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Who's that Bird</h1>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Score: {score}/{totalAttempts}</span>
              <span>
                {allowRepeats 
                  ? `` 
                  : `${usedBirds.length + 1}/${availableBirds.length}`
                }
              </span>
            </div>
          </div>

          {/* Bird Image and Audio */}
          <div className="bg-gray-50 rounded-lg mb-6 overflow-hidden">
            {/* 3:2 Aspect Ratio Image - Show based on game mode */}
            <div className="aspect-[3/2] bg-gray-200">
              {(gameMode === 'picture' || feedback) ? (
                <img 
                  src={currentBird?.pictureUrl} 
                  alt={currentBird?.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                  <span className="text-4xl">🐦</span>
                </div>
              )}
              <div className="w-full h-full bg-gray-200 items-center justify-center text-gray-500 hidden">
                <span>🐦 Bird Image</span>
              </div>
            </div>
            
            {/* Audio Controls - Only show in audio mode */}
            {gameMode === 'audio' && (
              <div className="p-4 text-center">
                <p className="text-gray-600 text-sm mb-3">Listen to the bird call</p>
                
                <audio
                  ref={audioRef}
                  onEnded={handleAudioEnd}
                  preload="metadata"
                >
                  <source src={currentBird?.audioUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
                
                <button
                  onClick={playAudio}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full flex items-center gap-2 mx-auto transition-colors"
                >
                  <span className="text-lg">{isPlaying ? '⏸️' : '▶️'}</span>
                  {isPlaying ? 'Pause' : 'Play Call'}
                </button>
              </div>
            )}

            {/* Picture mode instructions */}
            {gameMode === 'picture' && (
              <div className="p-4 text-center">
                <p className="text-gray-600 text-sm">Identify the bird from the image</p>
              </div>
            )}
          </div>

          {/* Guess Input */}
          {!feedback && (
            <div className="mb-6 relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {gameMode === 'audio' ? 'What bird is this?' : 'What bird is in this picture?'}
              </label>
              <input
                type="text"
                id="guess-input"
                value={guess}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                onFocus={() => {
                  if (guess.trim() && filteredBirds.length > 0) {
                    setShowAutocomplete(true);
                  }
                }}
                onBlur={(e) => {
                  setTimeout(() => {
                    if (!e.relatedTarget?.classList.contains('autocomplete-item')) {
                      setShowAutocomplete(false);
                    }
                  }, 150);
                }}
                placeholder="Enter bird name..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoComplete="off"
              />
              
              {/* Autocomplete Dropdown */}
              {showAutocomplete && filteredBirds.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredBirds.map((bird, index) => (
                    <button
                      key={bird.id}
                      className="autocomplete-item w-full px-4 py-2 text-left hover:bg-blue-50 focus:bg-blue-100 focus:outline-none border-none bg-transparent"
                      onClick={() => selectBird(bird.name)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          selectBird(bird.name);
                        }
                      }}
                      tabIndex={0}
                    >
                      <span className="font-medium">{bird.name}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        {bird.hints[0]}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              
              <button
                onClick={checkAnswer}
                disabled={!guess.trim()}
                className="w-full mt-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Submit Guess
              </button>
            </div>
          )}

          {/* Feedback */}
          {feedback && (
            <div className={`mb-6 p-4 rounded-lg text-center ${
              feedback.includes('Correct') 
                ? 'bg-green-100 text-green-800' 
                : 'bg-orange-100 text-orange-800'
            }`}>
              <p className="font-medium">{feedback}</p>
              <div className="mt-3 pt-3 border-t border-opacity-30 border-current">
                <h3 className="font-semibold text-lg">{currentBird?.name}</h3>
                <p className="text-sm mt-1 opacity-80 capitalize">{currentBird?.rarity}</p>
                <div className="mt-2 text-sm">
                  <p className="font-medium">Scientific Name:</p>
                  <p>{currentBird?.hints[0]}</p>
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-3">
            {isCorrect ? (
              <button
                onClick={nextBird}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium transition-colors"
              >
                Next Bird
              </button>
            ) : !feedback ? (
              <button
                onClick={handleIDontKnow}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg font-medium transition-colors"
              >
                I Don't Know
              </button>
            ) : (
              <button
                onClick={nextBird}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium transition-colors"
              >
                Next Bird
              </button>
            )}
            <button
              onClick={backToStart}
              className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
            >
              <span className="text-lg">←</span>
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-6 text-xs text-gray-500 text-center">
              <p>
              All photo credits to © Francis Yap.
              All audio taken from xeno-canto under one of several Creative Commons licenses.
              </p>
          
              
          </div>
        </div>
      )}
    </div>
  );
}