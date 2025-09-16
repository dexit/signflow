import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Button, Input } from '../components/ui';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@docuseal.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const { login, isAuthenticated } = useContext(AppContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@docuseal.com' && password === 'password') {
      login();
      navigate('/dashboard');
    } else {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600"><path d="M12 22h6a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v5"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10.4 12.6a2 2 0 1 1-3.4-2.9l1.4 1.4a2 2 0 1 0 3.4 2.9Z"/><path d="M13.4 15.6a2 2 0 1 1-3.4-2.9l1.4 1.4a2 2 0 1 0 3.4 2.9Z"/><path d="M16.4 18.6a2 2 0 1 1-3.4-2.9l1.4 1.4a2 2 0 1 0 3.4 2.9Z"/><path d="M5.4 16.6a2 2 0 1 1-3.4-2.9l1.4 1.4a2 2 0 1 0 3.4 2.9Z"/></svg>
            <h2 className="text-center text-3xl font-bold text-slate-800">DocuSeal</h2>
        </div>
        <p className="mt-2 text-center text-sm text-slate-600">
            Sign in to your account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-md sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              id="email"
              label="Email address"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              id="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <p className="text-sm text-center text-slate-500">Use admin@docuseal.com / password</p>
            <div>
              <Button type="submit" className="w-full">
                Sign in
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;