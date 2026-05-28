import './style.css';
import { createApp } from './app.js';

// Mount the app
document.addEventListener('DOMContentLoaded', () => {
  createApp(document.getElementById('app'));
});
