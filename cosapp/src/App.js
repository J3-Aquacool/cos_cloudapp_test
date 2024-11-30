
import './App.css';

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import LoginPage from './logincomponent/LoginPage'
import SurveryForm from './uicomponent/surveyform';
import ResultsPage from './resultcomponent/ResultPage'
import SummaryPage from './summarycomponent/SummaryPage'
import LogoutPage from './logoutcomponent/logoutpage';

function App() {
  return (
    <Router>
    <div className="App">
  
    
      <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/surveyform" element={<SurveryForm />} />
      <Route path="/results" element={<ResultsPage />} />
      <Route path="/summary" element={<SummaryPage />} />
      <Route path="/logout" element={<LogoutPage />} />
      
    </Routes>
    
      </div>
  
      </Router>
    );
}

export default App;
