// Demo admin and local auth provider compatibility export
export const DEMO_ADMIN = {
  email: 'admin@habesha.demo',
  password: 'Admin1234',
  name: 'Aklilu Tesfay',
};

export { AuthProvider as LocalAuthProvider, AuthProvider, useAuth } from './AuthContext';
export default DEMO_ADMIN;
