import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient'; // Correct import path
import './LoginSignup.css'; // Import the CSS file for styles
import iitdelhiImage from '../../assests/iitdelhi.png';
import aiimsdelhiImage from '../../assests/aiimsdelhi.png';

const LoginSignup = ({ setIsAuthenticated }) => {
  console.log('tus');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();

    const response = await apiClient.obtainAuthTokenPair(username, password);
    console.log(response, 'tus');
    if (response.success) {
      const { access, refresh } = response.result.tokens;
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      setIsAuthenticated(true); // Set authentication state
      navigate('/');
      console.log('tus acess:' + access, 'refresh:' + refresh + 'sucess');
      console.log(response);
    } else {
      setError(response.error.user_friendly_message);
    }
  };

  return (
    // </div>
    <div className="login-container">
      {/* New heading and image */}
      <div className="header-container">
        <h1 className="neon-heading">CoE Data Portal</h1>
        <div className="logos">
          <img
            src={iitdelhiImage} // Replace with your image path
            alt="Logo"
            className="circular-image"
          />
          <img
            src={aiimsdelhiImage} // Replace with your image path
            alt="Logo"
            className="circular-image"
          />
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="login-form"
      >
        <h1 className="login-title">Login</h1>
        {error && <p className="login-error">{error}</p>}
        <div className="login-field">
          <label className="login-label">Username</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            className="login-input"
          />
        </div>
        <div className="login-field">
          <label className="login-label">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="login-input"
          />
        </div>
        <button
          type="submit"
          className="login-button"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default LoginSignup;
