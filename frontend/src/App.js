import React, { useState, useEffect } from 'react';
import LiveSignDetection from './components/LiveSignDetection';
import Reveal from './components/Reveal';

const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'how', label: 'How this works' },
  { id: 'contact', label: 'Contact' },
];

const STEPS = [
  {
    title: 'Turn on your camera',
    text: 'Open the Home page and press "Start Detection". Your browser will ask for permission to use the camera.',
  },
  {
    title: 'Show your hand sign',
    text: 'Hold your hand clearly in front of the camera in good lighting. The app captures the image many times each second.',
  },
  {
    title: 'The computer reads the sign',
    text: 'Each frame is sent to our detection service, which finds your hand and works out which letter you are showing.',
  },
  {
    title: 'See the result instantly',
    text: 'The recognised letter appears on screen with a confidence score, so you always know how sure the result is.',
  },
];

const CONTACTS = [
  { label: 'Email', value: <a href="mailto:linkhanthtel@icloud.com">linkhanthtel@icloud.com</a> },
  { label: 'Phone', value: '+65 8762 5331' },
  { label: 'Address', value: 'Braddell' },
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
          <span className="navbar__brand">Kanzai App</span>
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

      {page === 'home' ? (
        <section className="hero">
          <span className="blob blob--circle blob--1" aria-hidden="true" />
          <span className="blob blob--2" aria-hidden="true" />
          <span className="blob blob--circle blob--3" aria-hidden="true" />

          <div className="hero__inner-text">
            <Reveal className="hero__accent" />
            <Reveal as="h1" className="hero__title" delay={80}>
              Understand hand signs <em>as they happen.</em>
            </Reveal>
            <Reveal as="p" className="hero__text" delay={160}>
              Point your camera at a hand and watch the letters appear instantly.
              Clear, friendly, and built for people of every age.
            </Reveal>
            <Reveal className="hero__actions" delay={240}>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => setActiveTab('live')}
              >
                Start Live Detection
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setActiveTab('learn')}
              >
                Learn the Alphabet
              </button>
            </Reveal>
          </div>
        </section>
      ) : (
        <header className="header">
          <div className="container">
            <h1 className="header__title">Kanzai App</h1>
            <p className="header__subtitle">
              See and learn sign language in real time — simple enough for everyone.
            </p>
          </div>
        </header>
      )}

      <main className="main">
        {page === 'home' && (
          <div className="home">
            <Reveal as="nav" className="tabs" delay={60}>
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
            </Reveal>

            {activeTab === 'live' && <LiveSignDetection />}

            {activeTab === 'learn' && (
              <Reveal as="section" className="card">
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
              </Reveal>
            )}
          </div>
        )}

        {page === 'how' && (
          <div className="container">
            <Reveal as="section" className="card">
              <h2 className="section-title">How This Works</h2>
              <p className="section-subtitle">
                Detecting signs takes just a few simple steps.
              </p>

              <div className="steps">
                {STEPS.map((step, index) => (
                  <Reveal className="step" key={step.title} delay={index * 90}>
                    <div className="step__num">{index + 1}</div>
                    <div>
                      <div className="step__title">{step.title}</div>
                      <p className="step__text">{step.text}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </Reveal>
          </div>
        )}

        {page === 'contact' && (
          <div className="container">
            <Reveal as="section" className="card">
              <h2 className="section-title">Contact</h2>
              <p className="section-subtitle">
                Have a question or some feedback? We would love to hear from you.
              </p>

              <div className="contact-list">
                {CONTACTS.map((item, index) => (
                  <Reveal className="contact-item" key={item.label} delay={index * 90}>
                    <div className="contact-item__label">{item.label}</div>
                    <div className="contact-item__value">{item.value}</div>
                  </Reveal>
                ))}
              </div>
            </Reveal>
          </div>
        )}
      </main>

      <footer className="footer">
        <div className="container">
          Kanzai App | 2026 All rights reserved
        </div>
      </footer>
    </div>
  );
};

export default App;
