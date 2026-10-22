import { Link } from 'react-router-dom';
import { Camera, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-top">
          <div>
            <div className="footer-brand">
              <Camera size={18} color="#38bdf8" />
              <span>Pixora</span>
            </div>
            <p className="footer-tagline">
              Discover, curate, and share visually stunning photography from creators worldwide.
            </p>
          </div>
          <div className="footer-links">
            <Link to="/?category=Nature" className="footer-link">Nature</Link>
            <Link to="/?category=Architecture" className="footer-link">Architecture</Link>
            <Link to="/?category=Travel" className="footer-link">Travel</Link>
            <Link to="/?category=Portraits" className="footer-link">Portraits</Link>
            <Link to="/?category=Food" className="footer-link">Food</Link>
            <Link to="/?category=Technology" className="footer-link">Technology</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} Pixora Image Platform. Built with MERN &amp; Cloudinary.</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            Crafted for Creators with <Heart size={13} color="#f43f5e" fill="#f43f5e" />
          </span>
        </div>
      </div>
    </footer>
  );
}
