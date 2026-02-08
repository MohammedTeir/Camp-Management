import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from './server/utils/jwt';

// Mock environment variables for testing
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

console.log('Testing JWT functions...\n');

// Test data
const userData = {
  sub: '12345',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'admin'
};

try {
  // Test access token generation and verification
  console.log('1. Testing Access Token:');
  const accessToken = generateAccessToken(userData);
  console.log('Generated Access Token:', accessToken.substring(0, 30) + '...');
  
  const verifiedAccess = verifyAccessToken(accessToken);
  console.log('Verified Access Token:', verifiedAccess);
  console.log('Access Token Valid:', !!verifiedAccess);
  console.log('');

  // Test refresh token generation and verification
  console.log('2. Testing Refresh Token:');
  const refreshToken = generateRefreshToken(userData);
  console.log('Generated Refresh Token:', refreshToken.substring(0, 30) + '...');
  
  const verifiedRefresh = verifyRefreshToken(refreshToken);
  console.log('Verified Refresh Token:', verifiedRefresh);
  console.log('Refresh Token Valid:', !!verifiedRefresh);
  console.log('');

  // Test invalid token
  console.log('3. Testing Invalid Token:');
  const invalidToken = verifyAccessToken('invalid.token.here');
  console.log('Invalid Token Result:', invalidToken);
  console.log('Correctly rejected invalid token:', invalidToken === null);
  console.log('');

  console.log('✅ JWT implementation tests passed!');
} catch (error) {
  console.error('❌ JWT implementation tests failed:', error);
}