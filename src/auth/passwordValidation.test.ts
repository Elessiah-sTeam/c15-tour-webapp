import { describe, it, expect } from 'vitest';
import { validatePassword } from './passwordValidation';

describe('validatePassword', () => {
    it('accepte un mot de passe valide', () => {
        expect(validatePassword('Password1')).toBeNull();
        expect(validatePassword('Abcdefg1')).toBeNull();
        expect(validatePassword('SuperSecure99')).toBeNull();
    });

    it('rejette un mot de passe trop court', () => {
        expect(validatePassword('Short1')).toMatch(/8 caractères/);
        expect(validatePassword('Ab1')).toMatch(/8 caractères/);
    });

    it('rejette un mot de passe sans majuscule', () => {
        expect(validatePassword('password1')).toMatch(/majuscule/);
        expect(validatePassword('abcdefg1')).toMatch(/majuscule/);
    });

    it('rejette un mot de passe sans chiffre', () => {
        expect(validatePassword('Password')).toMatch(/chiffre/);
        expect(validatePassword('Abcdefgh')).toMatch(/chiffre/);
    });

    it('vérifie la longueur avant les autres règles', () => {
        expect(validatePassword('Ab1')).toMatch(/8 caractères/);
    });
});
