
const request = require('supertest');
const app = require('../app');
const bcrypt = require('bcrypt');

jest.mock('../models/users', () => {
  return {
    findOne: jest.fn()
  }
});

const User = require('../models/users');

describe('POST /users/signin (TDD, sans BDD)', () => {
  beforeEach(() => {
   
    jest.clearAllMocks();
  });

  it('doit retourner result:true, le token et le role BABYSITTER pour un bon login', async () => {
 
    const hash = bcrypt.hashSync('password123', 10);

    User.findOne.mockResolvedValue({
      email: 'babysitter@test.com',
      password: hash,
      token: 'mockedToken123',
      role: 'BABYSITTER'
    });

    const payload = { email: 'babysitter@test.com', password: 'password123' };
    const response = await request(app)
      .post('/users/signin')
      .send(payload)
      .expect(200);

    expect(response.body.result).toBe(true);
    expect(response.body.token).toBe('mockedToken123');
    expect(response.body.role).toBe('BABYSITTER');
  });

  it('retourne result:false si le password est mauvais', async () => {
   
    const hash = bcrypt.hashSync('autreMotDePasse', 10);

    User.findOne.mockResolvedValue({
      email: 'babysitter@test.com',
      password: hash,
      token: 'mockedToken123',
      role: 'BABYSITTER'
    });

    const payload = { email: 'babysitter@test.com', password: 'password123' };
    const response = await request(app)
      .post('/users/signin')
      .send(payload)
      .expect(200);

    expect(response.body.result).toBe(false);
    expect(response.body.error).toBe('Utilisateur introuvable ou mot de passe incorrect');
  });

  it('retourne result:false si user non trouvé', async () => {
    User.findOne.mockResolvedValue(null);

    const payload = { email: 'inconnu@test.com', password: 'nimportequoi' };
    const response = await request(app)
      .post('/users/signin')
      .send(payload)
      .expect(200);

    expect(response.body.result).toBe(false);
    expect(response.body.error).toBe('Utilisateur introuvable ou mot de passe incorrect');
  });
});
