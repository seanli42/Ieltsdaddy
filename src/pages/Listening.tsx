import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Listening.css';
import { listeningMaterials, books, tests, parts, type ListeningMaterial } from '../data/listeningMaterials';

function Listening() {
  const [selectedBook, setSelectedBook] = useState('All');
  const [selectedTest, setSelectedTest] = useState('All');
  const [selectedPart, setSelectedPart] = useState('All');
  const navigate = useNavigate();

  const filteredMaterials = listeningMaterials.filter(m => {
    const bookMatch = selectedBook === 'All' || m.book === selectedBook;
    const testMatch = selectedTest === 'All' || m.test === selectedTest;
    const partMatch = selectedPart === 'All' || m.part === selectedPart;
    return bookMatch && testMatch && partMatch;
  });

  const handlePlay = (material: ListeningMaterial) => {
    navigate(`/player?audio=${encodeURIComponent(material.audioUrl)}&title=${encodeURIComponent(material.title)}&category=听力`);
  };

  const getPartColor = (part: string) => {
    switch (part) {
      case 'Part 1': return '#4CAF50';
      case 'Part 2': return '#2196F3';
      case 'Part 3': return '#FF9800';
      case 'Part 4': return '#9C27B0';
      default: return '#999';
    }
  };

  return (
    <div className="writing-page">
      {/* Header */}
      <div className="writing-header">
        <h1 className="writing-title">🎧 听力训练</h1>
        <p className="writing-subtitle">雅思听力真题音频 · 共 {listeningMaterials.length} 篇</p>
      </div>

      {/* Filters */}
      <div className="category-filter">
        <select 
          className="filter-select"
          value={selectedBook}
          onChange={(e) => setSelectedBook(e.target.value)}
        >
          {books.map(book => (
            <option key={book} value={book}>{book === 'All' ? '全部书籍' : book}</option>
          ))}
        </select>
        <select 
          className="filter-select"
          value={selectedTest}
          onChange={(e) => setSelectedTest(e.target.value)}
        >
          {tests.map(test => (
            <option key={test} value={test}>{test === 'All' ? '全部测试' : test}</option>
          ))}
        </select>
        <select 
          className="filter-select"
          value={selectedPart}
          onChange={(e) => setSelectedPart(e.target.value)}
        >
          {parts.map(part => (
            <option key={part} value={part}>{part === 'All' ? '全部部分' : part}</option>
          ))}
        </select>
      </div>

      {/* Audio List */}
      <div className="writing-list">
        {filteredMaterials.map((material, index) => (
          <div
            key={material.id}
            className="writing-item"
            onClick={() => handlePlay(material)}
          >
            <div className="writing-item-number">{index + 1}</div>
            <div className="writing-item-play">▶️</div>
            <div className="writing-item-info">
              <h3 className="writing-item-title">{material.title}</h3>
              <div className="writing-item-meta">
                <span className="writing-item-category">{material.book}</span>
                <span 
                  className="writing-item-difficulty"
                  style={{ background: getPartColor(material.part) }}
                >
                  {material.test} · {material.part}
                </span>
                <span className="writing-item-duration">⏱️ {material.duration}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Listening;
