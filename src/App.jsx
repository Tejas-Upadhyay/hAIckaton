import StormGuardApp from './components/StormGuardApp.jsx';
import * as services from './services/aiService.js';

export default function App() {
  return <StormGuardApp services={services} />;
}
