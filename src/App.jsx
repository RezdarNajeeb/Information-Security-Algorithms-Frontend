import {useState} from 'react';

const API_BASE_URL = 'http://localhost:8000';

const TabButton = ({active, onClick, children}) => (
    <button
        className={`tab-button ${active ? 'active' : ''}`}
        onClick={onClick}
    >
        {children}
    </button>
);

const ResultDisplay = ({title, content}) => (
    <div className="result-container">
        <h3>{title}</h3>
        <pre className="result-content">{content}</pre>
    </div>
);

export default function App() {
    const [activeTab, setActiveTab] = useState('caesar');
    const [text, setText] = useState('');
    const [shift, setShift] = useState(3);
    const [key, setKey] = useState('');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);
    const [bruteForceResults, setBruteForceResults] = useState(null);
    const [error, setError] = useState('');

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
            if (!response.ok) {
                throw new Error('API request failed');
            }
            const result = await response.json();
            return result;
        } catch (error) {
            setError('Operation failed. Please try again.');
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
                {text, shift}
            );
            setResult(response[`${operation}ed_text`]);
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
                {text, key}
            );
            setResult(response[`${operation}ed_text`]);
        } catch (error) {
            console.error(`Mono ${operation} failed:`, error);
        }
    };

    const handleBruteForce = async () => {
        try {
            const response = await apiRequest('/caesar/brute_force', 'POST', {text, shift: 0});
            setBruteForceResults(response.possible_decryptions);
            setResult('');
        } catch (error) {
            console.error('Brute force failed:', error);
        }
    };

    const generateMonoKey = async () => {
        try {
            const response = await apiRequest('/mono/generate_key');
            setKey(response.key);
        } catch (error) {
            console.error('Key generation failed:', error);
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setResult('');
        setBruteForceResults(null);
        setError('');
    };

    return (
        <div className="app">
            <style>{`
        :root {
          --primary-color: #2563eb;
          --primary-hover: #1d4ed8;
          --background-color: #f8fafc;
          --surface-color: #ffffff;
          --border-color: #e2e8f0;
          --text-color: #1e293b;
          --error-color: #ef4444;
          --success-color: #22c55e;
          --radius: 8px;
          --transition: all 0.2s ease;
        }

        .app {
          max-width: 800px;
          margin: 0;
          margin-top: 10rem;
          padding: 2rem;
          background: var(--surface-color);
          border-radius: var(--radius);
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 100vh;
        }

        .title {
          font-size: 2rem;
          color: var(--text-color);
          margin-bottom: 2rem;
          text-align: center;
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
          color: var(--text-color);
          border-radius: var(--radius);
          transition: var(--transition);
        }

        .tab-button:hover {
          background: var(--background-color);
        }

        .tab-button.active {
          background: var(--primary-color);
          color: white;
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

        textarea, input {
          padding: 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          font-size: 1rem;
          transition: var(--transition);
        }

        textarea:focus, input:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
        }

        .key-section {
          display: flex;
          gap: 1rem;
          align-items: flex-end;
        }

        .flex-grow {
          flex-grow: 1;
        }

        .button-group {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: var(--radius);
          font-size: 1rem;
          cursor: pointer;
          transition: var(--transition);
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
          color: var(--text-color);
          margin: 1rem 0;
          font-style: italic;
        }

        .result-container {
          background: var(--background-color);
          padding: 1.5rem;
          border-radius: var(--radius);
          margin-top: 1.5rem;
        }

        .result-container h3 {
          margin: 0 0 1rem 0;
          color: var(--text-color);
        }

        .result-content {
          white-space: pre-wrap;
          word-break: break-word;
          font-family: monospace;
          background: var(--surface-color);
          padding: 1rem;
          border-radius: var(--radius);
          border: 1px solid var(--border-color);
        }

        .brute-force-results {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .brute-force-item {
          padding: 0.75rem;
          background: var(--surface-color);
          border-radius: var(--radius);
          border: 1px solid var(--border-color);
        }

        .error {
          background: #fee2e2;
          color: var(--error-color);
          padding: 1rem;
          border-radius: var(--radius);
          margin-bottom: 1rem;
        }

        @media (max-width: 640px) {
 
          .app {
            position: relative;
            transform: none;
            top: 0;
            left: 0;
            margin: 0;
            padding: 1rem;
            border-radius: 0;
          }

          .button-group {
            flex-direction: column;
          }

          .key-section {
            flex-direction: column;
          }
        }
      `}</style>

            <h1 className="title">Encryption App</h1>

            <div className="content">
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
                        Mono Cipher
                    </TabButton>
                </div>

                {error && <div className="error">{error}</div>}

                <div className="input-section">
                    <div className="input-group">
                        <label>Text</label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Enter text to encrypt/decrypt"
                            rows="4"
                        />
                    </div>

                    {activeTab === 'caesar' ? (
                        <div className="input-group">
                            <label>Shift</label>
                            <input
                                type="number"
                                value={shift}
                                onChange={(e) => setShift(parseInt(e.target.value) || 0)}
                                className="shift-input"
                                min="0"
                                max="25"
                            />
                        </div>
                    ) : (
                        <div className="key-section">
                            <div className="input-group flex-grow">
                                <label>Key</label>
                                <input
                                    type="text"
                                    value={key}
                                    onChange={(e) => setKey(e.target.value)}
                                    placeholder="Enter key or generate one"
                                />
                            </div>
                            <button
                                onClick={generateMonoKey}
                                disabled={loading}
                                className="secondary-button"
                            >
                                Generate Key
                            </button>
                        </div>
                    )}
                </div>

                <div className="button-group">
                    <button
                        onClick={() =>
                            activeTab === 'caesar'
                                ? handleCaesarOperation('encrypt')
                                : handleMonoOperation('encrypt')
                        }
                        disabled={loading || !text}
                        className="primary-button"
                    >
                        Encrypt
                    </button>
                    <button
                        onClick={() =>
                            activeTab === 'caesar'
                                ? handleCaesarOperation('decrypt')
                                : handleMonoOperation('decrypt')
                        }
                        disabled={loading || !text}
                        className="primary-button"
                    >
                        Decrypt
                    </button>
                    {activeTab === 'caesar' && (
                        <button
                            onClick={handleBruteForce}
                            disabled={loading || !text}
                            className="secondary-button"
                        >
                            Brute Force
                        </button>
                    )}
                </div>

                {loading && (
                    <div className="loading">Processing...</div>
                )}

                {result && (
                    <ResultDisplay title="Result:" content={result}/>
                )}

                {bruteForceResults && (
                    <div className="result-container">
                        <h3>Brute Force Results:</h3>
                        <div className="brute-force-results">
                            {Object.entries(bruteForceResults).map(([shift, text]) => (
                                <div key={shift} className="brute-force-item">
                                    <strong>Shift {shift}:</strong> {text}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}