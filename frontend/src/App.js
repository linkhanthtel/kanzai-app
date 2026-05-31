import React, { useState, useEffect } from 'react';
import LiveSignDetection from './components/LiveSignDetection';

const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'how', label: 'How this works' },
  { id: 'contact', label: 'Contact' },
];

const App = () => {
  const [page, setPage] = useState('home');
  const [activeTab, setActiveTab] = useState('live');
  const [signs, setSigns] = useState([]);
  const [selectedSign, setSelectedSign] = useState(null);

  useEffect(() => {
    fetchSigns();
  }, []);

  const fetchSigns = async () => {
    try {
      const response = await fetch('http://localhost:8000/signs');
      const data = await response.json();
      setSigns(data.available_signs);
    } catch (error) {
      console.error('Error fetching signs:', error);
    }
  };

  const fetchSignInfo = async (letter) => {
    try {
      const response = await fetch(`http://localhost:8000/sign/${letter}`);
      const data = await response.json();
      setSelectedSign(data);
    } catch (error) {
      console.error('Error fetching sign info:', error);
    }
  };

  return (
    <div className="app">
      <nav className="navbar" aria-label="Main navigation">
        <div className="navbar__inner">
          <span className="navbar__brand">Sign Language Recognition</span>
          <div className="navbar__links">
            {NAV_ITEMS.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`navlink ${page === item.id ? 'navlink--active' : ''}`}
                aria-current={page === item.id ? 'page' : undefined}
                onClick={() => setPage(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <header className="header">
        <div className="container">
          <h1 className="header__title">Sign Language Recognition</h1>
          <p className="header__subtitle">
            See and learn sign language in real time — simple enough for everyone.
          </p>
        </div>
      </header>

      <main className="main">
        <div className="container">
          {page === 'home' && (
            <>
              <nav className="tabs" aria-label="Sections">
                <button
                  type="button"
                  className={`tab ${activeTab === 'live' ? 'tab--active' : ''}`}
                  aria-pressed={activeTab === 'live'}
                  onClick={() => setActiveTab('live')}
                >
                  Live Detection
                </button>
                <button
                  type="button"
                  className={`tab ${activeTab === 'learn' ? 'tab--active' : ''}`}
                  aria-pressed={activeTab === 'learn'}
                  onClick={() => setActiveTab('learn')}
                >
                  Learn Signs
                </button>
              </nav>

              {activeTab === 'live' && <LiveSignDetection />}

              {activeTab === 'learn' && (
                <section className="card">
                  <h2 className="section-title">Learn the Alphabet</h2>
                  <p className="section-subtitle">
                    Tap any letter to see how to make the sign.
                  </p>

                  <div className="letter-grid">
                    {signs.map((sign) => (
                      <button
                        type="button"
                        key={sign}
                        className={`letter-btn ${
                          selectedSign?.letter === sign ? 'letter-btn--active' : ''
                        }`}
                        aria-pressed={selectedSign?.letter === sign}
                        onClick={() => fetchSignInfo(sign)}
                      >
                        {sign}
                      </button>
                    ))}
                  </div>

                  {selectedSign && (
                    <div className="detail-card">
                      <div className="detail-card__letter">{selectedSign.letter}</div>
                      <p className="detail-card__desc">{selectedSign.description}</p>
                      <div className="detail-card__meta">
                        Category: {selectedSign.category}
                      </div>
                    </div>
                  )}
                </section>
              )}
            </>
          )}

          {page === 'how' && (
            <section className="card">
              <h2 className="section-title">How This Works</h2>
              <p className="section-subtitle">
                Detecting signs takes just a few simple steps.
              </p>

              <div className="steps">
                <div className="step">
                  <div className="step__num">1</div>
                  <div>
                    <div className="step__title">Turn on your camera</div>
                    <p className="step__text">
                      Open the Home page and press "Start Detection". Your browser
                      will ask for permission to use the camera.
                    </p>
                  </div>
                </div>

                <div className="step">
                  <div className="step__num">2</div>
                  <div>
                    <div className="step__title">Show your hand sign</div>
                    <p className="step__text">
                      Hold your hand clearly in front of the camera in good lighting.
                      The app captures the image many times each second.
                    </p>
                  </div>
                </div>

                <div className="step">
                  <div className="step__num">3</div>
                  <div>
                    <div className="step__title">The computer reads the sign</div>
                    <p className="step__text">
                      Each frame is sent to our detection service, which finds your
                      hand and works out which letter you are showing.
                    </p>
                  </div>
                </div>

                <div className="step">
                  <div className="step__num">4</div>
                  <div>
                    <div className="step__title">See the result instantly</div>
                    <p className="step__text">
                      The recognised letter appears on screen with a confidence
                      score, so you always know how sure the result is.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {page === 'contact' && (
            <section className="card">
              <h2 className="section-title">Contact</h2>
              <p className="section-subtitle">
                Have a question or some feedback? We would love to hear from you.
              </p>

              <div className="contact-list">
                <div className="contact-item">
                  <div className="contact-item__label">Email</div>
                  <div className="contact-item__value">
                    <a href="mailto:hello@signlanguage.app">hello@signlanguage.app</a>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-item__label">Phone</div>
                  <div className="contact-item__value">+1 (555) 123-4567</div>
                </div>

                <div className="contact-item">
                  <div className="contact-item__label">Address</div>
                  <div className="contact-item__value">
                    123 Accessibility Way, Suite 100
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          Sign Language Recognition — made to be friendly and easy to use.
        </div>
      </footer>
    </div>
  );
};

export default App;
