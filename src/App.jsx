import './App.css'
import LoginPage from './pages/LoginPage'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <div>
        <nav>
          <Link to="/login">Go to Login</Link>
        </nav>
        
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App