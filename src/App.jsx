import { useState, useEffect } from 'react';

const API_BASE_URL = 'https://cool-georgeanna-isakoya-c6ce14a1.koyeb.app';

const TabButton = ({ active, onClick, children }) => (
  <button
    className={`tab-button ${active ? 'active' : ''}`}
    onClick={onClick}
  >
    {children}
  </button>
);

const ResultDisplay = ({ title, content, isBinary = false }) => (
  <div className="result-container">
    <h3>{title}</h3>
    <pre className={`result-content ${isBinary ? 'binary' : ''}`}>{content}</pre>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('caesar');
  const [text, setText] = useState('');
  const [shift, setShift] = useState(3);
  const [key, setKey] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bruteForceResults, setBruteForceResults] = useState(null);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const apiRequest = async (endpoint, method = 'GET', data = null) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'API request failed');
      }

      return result;
    } catch (error) {
      setError(error.message || 'Operation failed. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleCaesarOperation = async (operation) => {
    try {
      const response = await apiRequest(
        `/caesar/${operation}`,
        'POST',
        { text, shift }
      );
      setResult({ text: response[`${operation}ed_text`] });
      setBruteForceResults(null);
    } catch (error) {
      console.error(`Caesar ${operation} failed:`, error);
    }
  };

  const handleMonoOperation = async (operation) => {
    try {
      const response = await apiRequest(
        `/mono/${operation}`,
        'POST',
        { text, key }
      );
      setResult({ text: response[`${operation}ed_text`] });
    } catch (error) {
      console.error(`Mono ${operation} failed:`, error);
    }
  };

  const handleDESOperation = async (operation) => {
    try {
      const response = await apiRequest(
        `/des/${operation}`,
        'POST',
        { text, key: key || undefined }
      );

      if (operation === 'encrypt') {
        setResult({
          text: response.encrypted_text,
          binary: response.binary_ciphertext,
          key: response.key
        });
      } else {
        setResult({
          text: response.decrypted_text,
          binary: response.binary_plaintext
        });
      }
    } catch (error) {
      console.error(`DES ${operation} failed:`, error);
    }
  };

  const handleBruteForce = async () => {
    try {
      const response = await apiRequest('/caesar/brute_force', 'POST', { text, shift: 0 });
      setBruteForceResults(response.possible_decryptions);
      setResult(null);
    } catch (error) {
      console.error('Brute force failed:', error);
    }
  };

  const generateKey = async () => {
    try {
      const endpoint = activeTab === 'mono' ? '/mono/generate_key' : '/des/generate_key';
      const response = await apiRequest(endpoint);
      setKey(response.key);
    } catch (error) {
      console.error('Key generation failed:', error);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setResult(null);
    setBruteForceResults(null);
    setError('');
    setKey('');
  };

  const validateDESInput = () => {
    if (activeTab === 'des' && text.length !== 8) {
      setError('DES requires exactly 8 characters');
      return false;
    }
    if (activeTab === 'des' && key && key.length !== 64) {
      setError('DES key must be exactly 64 bits');
      return false;
    }
    return true;
  };

  const handleOperation = (operation) => {
    if (!validateDESInput()) return;

    switch (activeTab) {
      case 'caesar':
        handleCaesarOperation(operation);
        break;
      case 'mono':
        handleMonoOperation(operation);
        break;
      case 'des':
        handleDESOperation(operation);
        break;
    }
  };

  return (
    <div className="app">
      <div className="header">
        <h1 className="title">Information Security Lab</h1>
        <label className="theme-switch">
          <input
            type="checkbox"
            checked={theme === 'dark'}
            onChange={toggleTheme}
          />
          <span className="slider">
            <i className={`fas ${theme === 'light' ? 'fa-sun' : 'fa-moon'}`}></i>
          </span>
        </label>
      </div>

      <div className="main-card">
        <div className="tabs">
          <TabButton
            active={activeTab === 'caesar'}
            onClick={() => handleTabChange('caesar')}
          >
            Caesar Cipher
          </TabButton>
          <TabButton
            active={activeTab === 'mono'}
            onClick={() => handleTabChange('mono')}
          >
            Monoalphabetic
          </TabButton>
          <TabButton
            active={activeTab === 'des'}
            onClick={() => handleTabChange('des')}
          >
            DES Encryption
          </TabButton>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="input-section">
          <div className="input-group">
            <label>Text to Encrypt/Decrypt</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={activeTab === 'des' ? 'Enter exactly 8 characters' : 'Enter your text here...'}
            />
            {activeTab === 'des' && (
              <span className="input-help">
                DES requires exactly 8 characters. Current: {text.length} characters
              </span>
            )}
          </div>

          {activeTab === 'caesar' ? (
            <div className="input-group">
              <label>Shift Value</label>
              <input
                type="number"
                value={shift}
                onChange={(e) => setShift(parseInt(e.target.value) || 0)}
                min="0"
                max="25"
              />
              <span className="input-help">
                Enter a number between 0 and 25
              </span>
            </div>
          ) : (
            <div className="input-group">
              <label>Encryption Key</label>
              <div className="key-section">
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder={activeTab === 'des' ? 'Enter 64-bit key or generate one' : 'Enter key or generate one'}
                  className="flex-grow"
                />
                <button
                  onClick={generateKey}
                  disabled={loading}
                  className="secondary-button"
                >
                  <i className="fas fa-key"></i> Generate Key
                </button>
              </div>
              {activeTab === 'des' && (
                <span className="input-help">
                  DES key must be 64 bits (0s and 1s). Current: {key.length} bits
                </span>
              )}
            </div>
          )}
        </div>

        <div className="button-group">
          <button
            onClick={() => handleOperation('encrypt')}
            disabled={loading || !text}
            className="primary-button"
          >
            <i className="fas fa-lock"></i> Encrypt
          </button>
          <button
            onClick={() => handleOperation('decrypt')}
            disabled={loading || !text || (activeTab === 'des' && !key)}
            className="primary-button"
          >
            <i className="fas fa-lock-open"></i> Decrypt
          </button>
          {activeTab === 'caesar' && (
            <button
              onClick={handleBruteForce}
              disabled={loading || !text}
              className="secondary-button"
            >
              <i className="fas fa-search"></i> Brute Force
            </button>
          )}
        </div>

        {loading && (
          <div className="loading">Processing...</div>
        )}

        {result && (
          <div>
            <ResultDisplay
              title="Result:"
              content={result.text}
            />
            {result.binary && (
              <ResultDisplay
                title="Binary Representation:"
                content={result.binary}
                isBinary={true}
              />
            )}
            {result.key && activeTab === 'des' && !key && (
              <ResultDisplay
                title="Generated Key:"
                content={result.key}
                isBinary={true}
              />
            )}
          </div>
        )}

        {bruteForceResults && (
          <div className="result-container">
            <h3>Brute Force Results:</h3>
            <div className="brute-force-results">
              {Object.entries(bruteForceResults).slice(0, 26).map(([shift, text]) => (
                <div key={shift} className="brute-force-item">
                  <strong>Shift {shift}:</strong> {text}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="info-card">
          <h4>About {activeTab === 'caesar' ? 'Caesar Cipher' : activeTab === 'mono' ? 'Monoalphabetic Cipher' : 'DES Encryption'}</h4>
          <p>
            {activeTab === 'caesar' &&
              'Caesar cipher is a substitution cipher where each letter is shifted by a fixed number of positions in the alphabet. It\'s one of the simplest and most widely known encryption techniques.'}
            {activeTab === 'mono' &&
              'Monoalphabetic cipher uses a fixed substitution alphabet where each letter is mapped to another letter. Unlike Caesar cipher, the mapping is not based on a simple shift.'}
            {activeTab === 'des' &&
              'Data Encryption Standard (DES) is a symmetric-key algorithm that uses a 64-bit key to encrypt 64-bit blocks of data. It was widely used for secure communications but is now considered legacy due to its small key size.'}
          </p>
        </div>
      </div>

      <footer className="footer">
        <div className="team-section">
          <h3>Team Members</h3>
          <div className="team-grid">
            <div className="team-member">
              <i className="fas fa-user-graduate"></i>
              <span>Rezdar Najeeb</span>
            </div>
            <div className="team-member">
              <i className="fas fa-user-graduate"></i>
              <span>Hawkar Shakhawan</span>
            </div>
            <div className="team-member">
              <i className="fas fa-user-graduate"></i>
              <span>Karwan Yousif</span>
            </div>
            <div className="team-member">
              <i className="fas fa-user-graduate"></i>
              <span>Ayar Nasim</span>
            </div>
            <div className="team-member">
              <i className="fas fa-user-graduate"></i>
              <span>Muhammad Kamal</span>
            </div>
            <div className="team-member">
              <i className="fas fa-user-graduate"></i>
              <span>Muhammad Hoshyar</span>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 Cryptography Laboratory - Information Security Project</p>
        </div>
      </footer>

      <style jsx>{`
        :root {
          --primary-color: #2563eb;
          --primary-hover: #1d4ed8;
          --background-color: #f8fafc;
          --surface-color: #ffffff;
          --border-color: #e2e8f0;
          --text-color: #1e293b;
          --text-secondary: #64748b;
          --error-color: #ef4444;
          --error-bg: #fee2e2;
          --success-color: #22c55e;
          --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          --radius: 12px;
          --transition: all 0.2s ease;
        }

        [data-theme="dark"] {
          --primary-color: #3b82f6;
          --primary-hover: #60a5fa;
          --background-color: #0f172a;
          --surface-color: #1e293b;
          --border-color: #334155;
          --text-color: #f8fafc;
          --text-secondary: #94a3b8;
          --error-color: #f87171;
          --error-bg: #7f1d1d;
          --success-color: #4ade80;
          --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.3);
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          background: var(--background-color);
          color: var(--text-color);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          min-height: 100vh;
          transition: var(--transition);
        }

        .app {
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
        }

        .title {
          font-size: 2.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, var(--primary-color), #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .theme-switch {
          position: relative;
          display: inline-block;
          width: 60px;
          height: 34px;
        }

        .theme-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--surface-color);
          border: 2px solid var(--border-color);
          transition: var(--transition);
          border-radius: 34px;
          display: flex;
          align-items: center;
          padding: 0 6px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 24px;
          width: 24px;
          left: 4px;
          bottom: 3px;
          background-color: var(--primary-color);
          transition: var(--transition);
          border-radius: 50%;
        }

        .theme-switch input:checked + .slider:before {
          transform: translateX(26px);
        }

        .slider i {
          font-size: 16px;
          color: var(--text-secondary);
          position: absolute;
          transition: var(--transition);
        }

        .theme-switch input:not(:checked) + .slider i {
          left: 10px;
        }

        .theme-switch input:checked + .slider i {
          right: 10px;
        }

        .main-card {
          background: var(--surface-color);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          padding: 2rem;
          transition: var(--transition);
          flex: 1;
        }

        .tabs {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 1rem;
        }

        .tab-button {
          padding: 0.75rem 1.5rem;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
          color: var(--text-secondary);
          border-radius: var(--radius);
          transition: var(--transition);
          position: relative;
        }

        .tab-button:hover {
          background: var(--background-color);
          color: var(--text-color);
        }

        .tab-button.active {
          color: var(--primary-color);
        }

        .tab-button.active::after {
          content: '';
          position: absolute;
          bottom: -17px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--primary-color);
          border-radius: 2px;
        }

        .input-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .input-group label {
          font-weight: 500;
          color: var(--text-color);
        }

        .input-help {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        input {
          padding: 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          font-size: 1rem;
          font-family: inherit;
          background: var(--background-color);
          color: var(--text-color);
          transition: var(--transition);
        }

        input:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
        }

        .key-section {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .flex-grow {
          flex-grow: 1;
        }

        .button-group {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: var(--radius);
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .primary-button {
          background: var(--primary-color);
          color: white;
        }

        .primary-button:hover {
          background: var(--primary-hover);
        }

        .secondary-button {
          background: var(--background-color);
          color: var(--text-color);
          border: 1px solid var(--border-color);
        }

        .secondary-button:hover {
          background: var(--border-color);
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .loading {
          text-align: center;
          color: var(--text-secondary);
          margin: 1rem 0;
          font-style: italic;
        }

        .result-container {
          background: var(--background-color);
          padding: 1.5rem;
          border-radius: var(--radius);
          margin-top: 1rem;
          border: 1px solid var(--border-color);
        }

        .result-container h3 {
          margin: 0 0 1rem 0;
          color: var(--text-color);
          font-size: 1.1rem;
        }

        .result-content {
          color: var(--text-color);
          white-space: pre-wrap;
          word-break: break-word;
          font-family: 'Courier New', monospace;
          background: var(--surface-color);
          padding: 1rem;
          border-radius: calc(var(--radius) - 4px);
          border: 1px solid var(--border-color);
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .result-content.binary {
          font-family: monospace;
          font-size: 0.9rem;
          word-break: break-all;
        }

        .brute-force-results {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .brute-force-item {
          color: var(--text-color);
          padding: 0.75rem;
          background: var(--surface-color);
          border-radius: calc(var(--radius) - 4px);
          border: 1px solid var(--border-color);
          font-family: 'Courier New', monospace;
        }

        .error {
          background: var(--error-bg);
          color: var(--error-color);
          padding: 1rem;
          border-radius: var(--radius);
          margin-bottom: 1rem;
          border: 1px solid var(--error-color);
        }

        .info-card {
          background: var(--background-color);
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          padding: 1rem;
          margin-top: 2rem;
        }

        .info-card h4 {
          color: var(--text-color);
          margin-bottom: 0.5rem;
        }

        .info-card p {
          color: var(--text-secondary);
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .footer {
          margin-top: 4rem;
          background: var(--surface-color);
          border-top: 1px solid var(--border-color);
          padding: 2rem 0;
        }

        .team-section {
          text-align: center;
          margin-bottom: 2rem;
        }

        .team-section h3 {
          color: var(--text-color);
          margin-bottom: 1.5rem;
          font-size: 1.5rem;
        }

        .team-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          max-width: 900px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .team-member {
          background: var(--background-color);
          padding: 1rem;
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border: 1px solid var(--border-color);
          transition: var(--transition);
        }

        .team-member:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow);
        }

        .team-member i {
          font-size: 1.25rem;
          color: var(--primary-color);
        }

        .team-member span {
          color: var(--text-color);
          font-weight: 500;
        }

        .footer-bottom {
          text-align: center;
          color: var(--text-secondary);
          font-size: 0.9rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }

        @media (max-width: 640px) {
          .app {
            padding: 1rem;
          }

          .header {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .title {
            font-size: 1.75rem;
          }

          .main-card {
            padding: 1.5rem;
          }

          .tabs {
            flex-wrap: wrap;
          }

          .tab-button {
            flex: 1;
            min-width: 120px;
            text-align: center;
          }

          .button-group {
            flex-direction: column;
          }

          .key-section {
            flex-direction: column;
          }

          .input-group {
            width: 100%;
          }
          
          .key-section {
            flex-direction: column;
          }
          
          .key-section input,
          .key-section button {
            width: 100%;
          }

          .team-grid {
            grid-template-columns: 1fr;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .result-container {
          animation: fadeIn 0.3s ease;
        }
      `}</style>
    </div>
  );
}