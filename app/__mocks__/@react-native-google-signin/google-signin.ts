export const GoogleSignin = {
    configure: jest.fn(),
    getCurrentUser: jest.fn().mockReturnValue({ user: { email: 'coucou@coucou.be' }}),
    hasPlayServices: jest.fn().mockReturnValue(true),
    signIn: jest.fn(),
    signOut: jest.fn()
}

export const GoogleSigninButton = () => 'Mock'