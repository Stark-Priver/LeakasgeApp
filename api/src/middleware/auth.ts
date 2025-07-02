import { Request, Response, NextFunction } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// These should be in your .env file for the API
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabase: SupabaseClient;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.error(
    'Supabase URL or Anon Key is missing. Ensure SUPABASE_URL and SUPABASE_ANON_KEY are in the .env file for the API.'
  );
  // Optionally, throw an error or handle this case as critical
  // For now, operations requiring supabase will fail if not configured
}

export interface AuthenticatedRequest extends Request {
  user?: any; // Define a more specific user type based on Supabase user object
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Authentication service not configured.' });
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) {
    return res.status(401).json({ error: 'No token provided.' }); // Unauthorized
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Token validation error:', error?.message);
      return res.status(403).json({ error: 'Token is not valid or expired.' }); // Forbidden
    }

    req.user = user; // Add user to request object
    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    console.error('Catch block error during token validation:', err);
    return res.status(403).json({ error: 'Token validation failed.' });
  }
};
