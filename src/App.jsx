import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import useMemories from './hooks/useMemories';

function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { memories, loading: memoriesLoading, error, addMemory, updateMemory, deleteMemory } = useMemories(user);

  if (error) {
    console.error("Critical error in App:", error);
    return (
      <div className="app-container" style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Gajni Memory</h1>
        <div className="error-state">
          <p>There was an error loading the application:</p>
          <p style={{ color: 'red', fontWeight: 'bold' }}>{error.message || error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '10px',
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  const recognition = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      return recognitionInstance;
    }
    return null;
  }, []);

  const titleRef = useRef(null);
  const descriptionRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState('en-US');
  const [voices, setVoices] = useState([]);
  const [audioLevel, setAudioLevel] = useState(0);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  useEffect(() => {
    if (!recognition) return;

    const onResult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      if (descriptionRef.current) {
        descriptionRef.current.value = descriptionRef.current.value + (descriptionRef.current.value ? ' ' : '') + transcript;
      }
      setIsListening(false);
    };

    const onError = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    const onEnd = () => {
      setIsListening(false);
    };

    recognition.onresult = onResult;
    recognition.onerror = onError;
    recognition.onend = onEnd;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
    };
  }, [recognition]);

  useEffect(() => {
    let interval;
    if (isListening) {
      interval = setInterval(() => {
        setAudioLevel(Math.random() * 10 + 5);
      }, 200);
    } else {
      setAudioLevel(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isListening]);

  const handleListen = () => {
    if (!recognition) {
      alert("Sorry, your browser does not support voice recognition.");
      return;
    }
    recognition.lang = language;
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const handleAddMemory = async (e) => {
    e.preventDefault();

    const titleValue = titleRef.current?.value || '';
    const descriptionValue = descriptionRef.current?.value || '';

    if (titleValue.trim() === '' || descriptionValue.trim() === '') {
      alert("Please enter both title and description!");
      return;
    }

    const memoryData = {
      title: titleValue.trim(),
      description: descriptionValue.trim(),
      timestamp: Date.now(),
      completed: false,
    };

    await addMemory(memoryData);
    if (titleRef.current) titleRef.current.value = '';
    if (descriptionRef.current) descriptionRef.current.value = '';
  };

  const handleDeleteMemory = async (idToDelete) => {
    await deleteMemory(idToDelete);
  };

  const toggleMemoryCompletion = async (idToToggle) => {
    const memoryToToggle = memories.find(memory => memory.id === idToToggle);
    if (memoryToToggle) {
      await updateMemory(idToToggle, { completed: !memoryToToggle.completed });
    }
  };

  const handleSpeak = (memoryToSpeak) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const textToSpeak = `${memoryToSpeak.title}. ${memoryToSpeak.description}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const selectedVoice = voices.find(voice => voice.lang.startsWith(language));

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      } else {
        console.warn(`No voice found for language: ${language}. Using default.`);
      }

      window.speechSynthesis.speak(utterance);
    } else {
      alert("Sorry, your browser does not support text-to-speech.");
    }
  };

  if (authLoading) {
    return (
      <div className="app-container">
        <h1>Gajni Memory</h1>
        <div className="loading-state">
          <p>Loading authentication...</p>
        </div>
      </div>
    );
  }

  const filteredMemories = memories.filter(memory =>
    (memory.title && memory.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (memory.description && memory.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const VoiceVisualization = () => (
    <div className="voice-visualization">
      {Array.from({ length: 9 }).map((_, index) => (
        <div
          key={index}
          className="voice-bar"
          style={{
            height: isListening ? `${Math.max(10, audioLevel + Math.random() * 10)}px` : '10px',
            opacity: isListening ? 0.7 + Math.random() * 0.3 : 0.3
          }}
        />
      ))}
    </div>
  );

  const Dashboard = ({ signOut, userName }) => {
    if (memoriesLoading) {
      return (
        <div className="loading-state">
          <p>Loading memories...</p>
        </div>
      );
    }

    return (
      <>
        <div className="form-container">
          <form onSubmit={handleAddMemory}>
            <div className="language-selector">
              <label htmlFor="language">Voice Language: </label>
              <select id="language" value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="en-US">English</option>
                <option value="ur-PK">Urdu</option>
              </select>
            </div>

            <div className="input-container">
              <input
                type="text"
                ref={titleRef}
                placeholder="Memory Title"
                maxLength={100}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              <textarea
                ref={descriptionRef}
                placeholder="Describe your memory..."
                rows={4}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={handleListen}
                className={`mic-btn ${isListening ? 'listening' : ''}`}
                title={isListening ? "Stop listening" : "Start listening"}
              >
                {isListening ? '🔴' : '🎤'}
              </button>
            </div>

            {isListening && <VoiceVisualization />}

            <button type="submit">Add Memory</button>
          </form>
        </div>

        <div className="search-container">
          <input
            type="text"
            placeholder="Search your memories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
          />
        </div>

        <ul className="memory-list">
          {filteredMemories.length > 0 ? (
            filteredMemories.map(memory => (
              <li
                key={memory.id}
                className={`memory-item ${memory.completed ? 'completed' : ''}`}
              >
                <div className="memory-content">
                  <input
                    type="checkbox"
                    checked={memory.completed || false}
                    onChange={() => toggleMemoryCompletion(memory.id)}
                    className="completion-checkbox"
                  />
                  <div>
                    <h3>{memory.title}</h3>
                    <p>{memory.description}</p>
                  </div>
                </div>
                <div className="memory-item-footer">
                  <span className="timestamp">
                    {new Date(memory.timestamp).toLocaleString()}
                  </span>
                  <div className="footer-buttons">
                    <button
                      onClick={() => handleSpeak(memory)}
                      className="speak-btn"
                      title="Listen to this memory"
                    >
                      🔊 Speak
                    </button>
                    <button
                      onClick={() => handleDeleteMemory(memory.id)}
                      className="delete-btn"
                      title="Delete this memory"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <div className="no-memories">
              {searchTerm ? (
                <p className="no-results">No memories found for "{searchTerm}"</p>
              ) : (
                <p className="empty-state">No memories yet. Add your first memory above!</p>
              )}
            </div>
          )}
        </ul>

        <footer className="app-footer" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          marginTop: '30px',
          padding: '20px',
          borderTop: '2px solid rgba(106, 130, 251, 0.3)'
        }}>
          <button onClick={signOut} className="logout-btn">Logout</button>
          <p style={{ 
            margin: 0, 
            color: '#00f7ff',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            Created by: WA.SIDDIQUI ®
          </p>
        </footer>
      </>
    );
  };

  if (user) {
    const userName = (user.user_metadata?.name ||
      user.user_metadata?.full_name ||
      user.email?.split('@')[0] ||
      'User').split(' ')[0];

    return (
      <div className="app-container">
        <header className="app-header">
          <div className="header-content" style={{ textAlign: 'center' }}>
            <h1 className="app-title" style={{
              fontSize: '2.8rem',
              background: 'linear-gradient(135deg, #00f7ff 0%, #ff00c8 50%, #6a82fb 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold',
              letterSpacing: '3px',
              margin: '20px 0 10px 0',
              textShadow: '0 0 30px rgba(0, 247, 255, 0.3)',
              animation: 'glow 2s ease-in-out infinite alternate'
            }}>
              Gajni 🧠 Memory
            </h1>
            <div style={{
              fontSize: '1.2rem',
              color: '#e0e0ff',
              marginTop: '10px',
              marginBottom: '20px'
            }}>
              Welcome, {userName}! 👋
            </div>
          </div>
        </header>
        <Dashboard signOut={signOut} userName={userName} />
      </div>
    );
  }

  return <Login />;
}

export default App;
