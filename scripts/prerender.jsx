import { renderToString } from 'react-dom/server';
import App from '../src/App.jsx';
export const renderWelcome = () => renderToString(<App />);
