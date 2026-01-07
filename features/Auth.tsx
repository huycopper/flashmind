import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabaseService } from '../services/supabaseService';
import { Button, Input, AlertBanner } from '../components/UI';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await supabaseService.login(email, password);
      login(user);

      // Fetch warnings separately (non-blocking)
      const warnings = await supabaseService.getWarnings(user.id);
      navigate('/dashboard', { state: { warnings } });
    } catch (err: any) {
      let message = err.message || 'Login failed';
      if (message === 'Invalid login credentials') {
        message = 'Incorrect password. Please try again.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-surface p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Log In to FlashMind</h2>
      {error && <AlertBanner type="error" message={error} />}
      <form onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <Button type="submit" className="w-full" isLoading={loading}>
          Log In
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-textSecondary">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary hover:underline">Sign up</Link>
      </p>
    </div>
  );
};

export const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { user, requireEmailConfirmation } = await supabaseService.register(email, displayName, password);

      if (requireEmailConfirmation) {
        setSuccessMessage('Registration successful! Please check your email to confirm your account.');
        setLoading(false);
        return;
      }

      login(user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      if (!successMessage) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-surface p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>
      {error && <AlertBanner type="error" message={error} />}
      {successMessage && <AlertBanner type="success" message={successMessage} />}

      {!successMessage && (
        <form onSubmit={handleSubmit}>
          <Input
            label="Display Name"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            required
            maxLength={40}
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="At least 6 characters"
          />
          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            error={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : undefined}
          />
          <Button type="submit" className="w-full" isLoading={loading}>
            Sign Up
          </Button>
        </form>
      )}
      <p className="mt-4 text-center text-sm text-textSecondary">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:underline">Log in</Link>
      </p>
    </div>
  );
};
