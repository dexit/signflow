import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Button, Input, Card, CardContent } from '../components/ui';

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
    <div className="min-h-screen bg-slate-50">
      <header className="absolute top-0 left-0 right-0 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600"><path d="M12 22h6a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v5"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10.4 12.6a2 2 0 1 1-3.4-2.9l1.4 1.4a2 2 0 1 0 3.4 2.9Z"/><path d="M13.4 15.6a2 2 0 1 1-3.4-2.9l1.4 1.4a2 2 0 1 0 3.4 2.9Z"/><path d="M16.4 18.6a2 2 0 1 1-3.4-2.9l1.4 1.4a2 2 0 1 0 3.4 2.9Z"/><path d="M5.4 16.6a2 2 0 1 1-3.4-2.9l1.4 1.4a2 2 0 1 0 3.4 2.9Z"/></svg>
              <h2 className="text-2xl font-bold text-slate-800">DocuSeal</h2>
          </div>
        </div>
      </header>

      <main className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
              Create, Send, <span className="text-primary-600">Sign Documents</span> With Ease.
            </h1>
            <p className="mt-6 text-lg text-slate-600">
              Works Like Magic. Signing simple documents should be easy, and signing complex documents should be easy as well. Define workflows from draft to sign with our easy to use interface.
            </p>
             <p className="mt-4 text-lg text-slate-600">
              Getting a signature is just one link away. Share reusable templates for instant, on-demand signing.
            </p>
          </div>

          <div className="w-full max-w-md mx-auto">
            <Card className="shadow-2xl">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-center mb-2">Sign In</h3>
                <p className="text-center text-sm text-slate-500 mb-6">Welcome back!</p>
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
                  <p className="text-sm text-center text-slate-500 !mt-2">Use <code className="bg-slate-100 p-1 rounded">admin@docuseal.com</code> / <code className="bg-slate-100 p-1 rounded">password</code></p>
                  <div>
                    <Button type="submit" className="w-full text-base py-3">
                      Sign in
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;