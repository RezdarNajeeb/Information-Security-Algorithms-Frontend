import {useState, useEffect} from 'react';
import './App.css';

const API_BASE_URL = 'https://cool-georgeanna-isakoya-c6ce14a1.koyeb.app';

const TabButton = ({active, onClick, children}) => (
    <button
        className={`tab-button ${active ? 'active' : ''}`}
        onClick={onClick}
    >
        {children}
    </button>
);

const ResultDisplay = ({title, content, isBinary = false}) => (
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
                {text, shift}
            );
            setResult({text: response[`${operation}ed_text`]});
            setBruteForceResults(null);
        } catch (error) {
            console.error(`Caesar ${operation} failed:`, error);
        }
    };

    const handleMonoOperation = async (operation) => {
        if (!key) {
            setError('Please provide or generate a key for monoalphabetic cipher');
            return;
        }
        try {
            const response = await apiRequest(
                `/mono/${operation}`,
                'POST',
                {text, key}
            );
            setResult({text: response[`${operation}ed_text`]});
        } catch (error) {
            console.error(`Mono ${operation} failed:`, error);
        }
    };

    const handleDESOperation = async (operation) => {
        try {
            const response = await apiRequest(
                `/des/${operation}`,
                'POST',
                {text, key: key || undefined}
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
            const response = await apiRequest('/caesar/brute_force', 'POST', {text, shift: 0});
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
        if (activeTab === 'des') {
            if (
                text.length !== 8 &&
                !(text.length === 64 && /^[01]+$/.test(text))
            ) {
                setError('Input text must be exactly 8 characters or 64 binary bits.');
                return false;
            }
        }
        if (activeTab === 'des' && key && key.length !== 64) {
            setError('DES key must be exactly 64 bits.');
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
            <i className={`fas ${theme === 'light' ? 'fa-sun' : 'fa-moon'}`}
               style={{color: theme === 'light' ? '#FFD700' : '#4B0082'}}></i>
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
                            placeholder="Enter 8 characters or 64 binary bits"
                        />
                        {activeTab === 'des' && (
                            <span className="input-help">
                                DES requires exactly 8 characters or 64 binary bits. Current: {text.length} {text.length === 64 && /^[01]+$/.test(text) ? 'bits (valid)' : 'characters'}
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
                                    placeholder={activeTab === 'des' ? 'Enter 64-bit key or generate one' : 'Enter key or generate one (required)'}
                                    className="flex-grow"
                                />
                                <button
                                    onClick={generateKey}
                                    disabled={loading}
                                    className="secondary-button"
                                >
                                    <i className="fas fa-key" style={{color: 'var(--primary-color)'}}></i> Generate Key
                                </button>
                            </div>
                            {activeTab === 'des' && (
                                <span className="input-help">
                  DES key must be 64 bits (0s and 1s). Current: {key.length} bits
                </span>
                            )}
                            {activeTab === 'mono' && (
                                <span className="input-help">
                  A key is required for monoalphabetic cipher. Generate one or provide your own.
                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="button-group">
                    <button
                        onClick={() => handleOperation('encrypt')}
                        disabled={loading || !text || (activeTab === 'mono' && !key)}
                        className="primary-button"
                    >
                        <i className="fas fa-lock" style={{color: 'white'}}></i> Encrypt
                    </button>
                    <button
                        onClick={() => handleOperation('decrypt')}
                        disabled={loading || !text || ((activeTab === 'des' || activeTab === 'mono') && !key)}
                        className="primary-button"
                    >
                        <i className="fas fa-lock-open" style={{color: 'white'}}></i> Decrypt
                    </button>
                    {activeTab === 'caesar' && (
                        <button
                            onClick={handleBruteForce}
                            disabled={loading || !text}
                            className="secondary-button"
                        >
                            <i className="fas fa-search" style={{color: 'var(--text-color)'}}></i> Brute Force
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
                        {result.key && activeTab === 'des' && (
                            <ResultDisplay
                                title="Key Used for Encryption:"
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
        </div>
    );
}