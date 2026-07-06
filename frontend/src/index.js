import ReactDOM from 'react-dom/client';

// Runit v2: лёгкие глобальные стили вместо легаси bootstrap-сборки
// (application.scss остаётся для справки — см. #816).
import './v2/global.css';
import app from './application.tsx';

const run = async () => {
  const root = ReactDOM.createRoot(document.getElementById('main'));
  const dom = await app();
  root.render(dom);
};

run();
