import { useState, useEffect } from 'react';

const ThemeSwitcher = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [theme, setTheme] = useState('ivory'); // Default

    const themes = [
        { id: 'ivory', name: 'Ivory Meridian' },
        { id: 'midnight', name: 'Midnight Slate' },
        { id: 'imperial', name: 'Imperial Navy' },
        { id: 'granite', name: 'Granite Horizon' },
        { id: 'obsidian', name: 'Obsidian Crest' }
    ];

    useEffect(() => {
        document.body.setAttribute('data-theme', theme);
    }, [theme]);

    return (
        <div className="theme-fab">
            {isOpen && (
                <div className="theme-menu">
                    <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>SELECT THEME</h4>
                    {themes.map(t => (
                        <button
                            key={t.id}
                            className="theme-btn"
                            onClick={() => { setTheme(t.id); setIsOpen(false); }}
                            style={{ fontWeight: theme === t.id ? 'bold' : 'normal' }}
                        >
                            {theme === t.id ? '✓ ' : ''}{t.name}
                        </button>
                    ))}
                </div>
            )}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="btn-primary"
                style={{ borderRadius: '50%', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}
                title="Change Theme"
            >
                🎨
            </button>
        </div>
    );
};

export default ThemeSwitcher;
